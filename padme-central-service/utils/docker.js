const Docker = require('dockerode');
var tar = require('tar-stream'); 
var stream = require('stream');
const path = require('path');
const _ = require('lodash');
const os = require('os');
const fs = require('fs');

const dind_client_certs_path = '/usr/src/app/dind-certs-client/certs';

const getInstance = () => {
    // Check if we should use TLS or not based on environment variables
    const dockerHost = process.env.DOCKER_HOST || 'tcp://dind:2375';
    const useTLS = process.env.DOCKER_TLS_VERIFY !== '';
    
    let dockerConfig;
    
    if (useTLS) {
        // Use TLS with certificates
        dockerConfig = {
            protocol: 'https',
            host: 'dind',
            port: 2376,
            ca: fs.readFileSync(path.join(dind_client_certs_path, 'ca.pem')),
            cert: fs.readFileSync(path.join(dind_client_certs_path, 'cert.pem')),
            key: fs.readFileSync(path.join(dind_client_certs_path, 'key.pem'))
        };
    } else {
        // Use plain HTTP without TLS
        dockerConfig = {
            protocol: 'http',
            host: 'dind',
            port: 2375
        };
    }

    const docker = new Docker(dockerConfig);
    return docker;
}
const docker = getInstance();

const getHarborAuthConfig = () => {

    const auth = {
        username: process.env.HARBOR_ADMIN_USER,
        password: process.env.HARBOR_ADMIN_CLI_SECRET
    };

    // console.log(auth);
    return auth;

}

const pullImageWithAuth = (image) => {

    return new Promise((resolve, reject) => {
        docker.pull(image, { 'authconfig': getHarborAuthConfig() }, (err, stream) => {

            if (err) {
                console.error("Docker pull failed for:" + image + "error:" + err);
                reject(err);
                return;
            }

            docker.modem.followProgress(stream, onFinished);

            function onFinished(err, output) {

                if (err) {
                    console.error("Docker pull failed for:" + image + "error:" + err);
                    reject(err);
                }
                else {
                    resolve(output);
                }
            }
        });
    });
}

const pushImageWithAuth = (image, options) => {

    if (!options)
        options = {}
    options['authconfig'] = getHarborAuthConfig();
    return new Promise((accept, reject) =>
    {
        image.push(options, (err, res) => 
        {
            if(err){
                reject(err); 
                return;
            }
            //Read the stream, unfortunately even tough dockerode had no error the push can still fail...
            //And we have to investigate the result for errors
            let body = '';
            res.on('data', (chunk) => {
                body += chunk;
            });
            res.on('end', () => {
                let lines = body.split(/\r?\n/);
                //Try to find if a error happened in the execution
                let error = _.find(lines, (line) => line.includes("errorDetail"));
                if(error)
                {
                    error = JSON.parse(error); 
                    reject(error.errorDetail.message);
                    return;
                }
                accept();
            });
        });
    })
}

const getImageLabel = (image) => {

    return new Promise(async (resolve, reject) => {

        try {
            let dockerImage = await docker.getImage(image);
            let inspectResult = await dockerImage.inspect();
            let labels = inspectResult.Config.Labels;
            resolve(labels);
        } catch (error) {
            console.log("getImageLabel error");
            reject(error);
        }

    });

}

//extracts file from the given containers file system as a tar archive
const extractFileAsArchive = (container, filename) =>
{
    return new Promise(async (resolve, reject) => {

        // it throws an exception if file does not exist
        await container.infoArchive(
            {
                'path': filename
            }
        ).catch(err => reject(err));

        // download the file if exists - it returns tar archive
        let getArchiveResult = await container.getArchive(
            {
                'path': filename
            }
        ).catch(err => reject(err));
        resolve(getArchiveResult);
    });
}

//Creates a container from the given image
const createContainer = (image) => 
{
    return new Promise(async (resolve, reject) => {

        //First, pull image
        await pullImageWithAuth(image).catch(err => reject(err)); 
        
        //Create container
        //HostConfig is needed for name resolution to work properly
        let createTempContainerResult = await docker.createContainer({
            Image: image
        }).catch(err => reject(err));

        resolve(createTempContainerResult);
    }); 
}

/**
 * Creates a Container from the given image 
 * @param {*} image 
 * @param {*} name 
 * @returns A Promise that resolves in the corresponding container object
 */
 const createContainerWithEnv = (image, name, env) => 
 {
     return new Promise(async (resolve, reject) => {
        //First, pull image
        await pullImageWithAuth(image).catch(err => reject(err)); 
         
        //Create container
        //HostConfig is needed for name resolution to work properly
        var container = await docker.createContainer({
            Image: image, 
            name: name,
            Env: env
        }).catch(err => reject(err));
        resolve(container);
     }); 
 }

/**
 * Checks whether the given path exists in the container and otherwise creates it
 * @param {*} container the container were the path should be ensured
 * @param {*} pathToEnsure the path to ensure
 * @returns a Promise
 */
const ensurePathExistsInContainer = (container, pathToEnsure) => 
{
    //here error means the path does not exist
    return container.infoArchive({ path: pathToEnsure })
        .catch(_ => {
            console.log(`Path ${pathToEnsure} does not exists in container, creating...`);

            //Create Archive with path that should be ensured
            var tarStream = createTarStreamWithFolder(pathToEnsure);

            //Put the archive containing the folder into the root
            return container.putArchive(tarStream, { path: '/' })
                .then(_ => 
                {
                    console.log("...successfully created path");
                    return Promise.resolve();
                })
        });
}

/**
 * Creates an tar archive that only contains the path to the provided folder
 * @param {*} folder The folder that should be contained in the archive
 * @returns a stream with the respective tar archive
 */
const createTarStreamWithFolder = (folder) =>
{
    var tarStream = tar.pack();
    tarStream.entry({ name: folder, type: 'directory' });
    tarStream.finalize(); 
    return tarStream;
}

/**
 * Creates an tar archive that only contains the path to the provided folder
 * @param {*} folder The folder that should be contained in the archive
 * @returns a stream with the respective tar archive
 */
 const createTarStreamWithEmptyFile = (file) =>
 {
    var tarStream = tar.pack();
    tarStream.entry({ name: file }, '');
    tarStream.finalize(); 
    return tarStream;
 }

/**
 * Clears the contents of the provided folder
 * @param {*} container Container in which the folder should be cleared
 * @param {*} pathToFolder path that should be cleared in the container
 */
const clearFolderContents = (container, pathToFolder) => 
{
    //General idea: Overwrite folder with empty file, then overwrite file with empty folder
    console.log(`Removing contents of path ${pathToFolder}`)

    //Create Archive with empty file
    var fileStream = createTarStreamWithEmptyFile(pathToFolder);

    //Put the archive containing the empty file into the container
    return container.putArchive(fileStream, { path: '/' })
        .then(_ => {
            console.log(`Replaced folder with empty file, overwriting file....`);

            //Create Archive with path that should be cleared
            var folderStream = createTarStreamWithFolder(pathToFolder);

            return container.putArchive(folderStream, { path: '/' })
            .then(_ => {
                console.log(`File overwritten, folder ${pathToFolder} successfully cleared`);
                return Promise.resolve();
            });
        }).catch((err) => 
        {
            console.log(err);
        })
}

/**
 * Extracts the provided Path from the given image as a tar stream
 * @param {string} image the image to extract from
 * @param {string} extractPath the path to extract from the image
 * @returns a tar stream
 */
const extractArchiveFromImage = async (image, extractPath) => {
    let container = null;
    try {
        
        container = await createContainer(image);
        return await extractArchive(container, extractPath);
    } finally {
        await removeContainer(container);
    }
}

/**
 * Extracts the archive at the provided path from the given container
 * @param {*} container 
 * @param {*} path 
 * @returns a Promise
 */
 const extractArchive = async (container, extractPath) => 
 {
     return container.getArchive({ path: extractPath })
         .then(archiveStream => {
             try {
                 //Problem: the last folder in extractPath is a prefix for all files
                 // => Remove this prefix
                 var extract = tar.extract();
                 var pack = tar.pack();
 
                 extract.on('entry', function (header, stream, next) {
                     // remove last folder in FLModelPath as Prefix from all files
                     var split = header.name.split("/");
                     header.name = split.slice(1, split.length).join("/");
 
                     if (header.name != "")
                     {
                         // write the new entry to the pack stream
                         stream.pipe(pack.entry(header, next));
                     } else
                     {
                         //Auto drain stream
                         stream.on('end', function() {
                             next() // ready for next entry
                         })
                         stream.resume();
                     }
                 });
                 
                 extract.on('finish', function () {
                     // all entries done - lets finalize it
                     pack.finalize();
                 });
 
                 // pipe the old tarball to the extractor
                 archiveStream.pipe(extract);
 
                 //Return new tar stream
                 return Promise.resolve(pack);
             } catch (err)
             {
                 return Promise.reject(err);
             }
         });
 }

/**
 * Removes the given container and kills it if it is still running
 * @param {*} container 
 */
const removeContainer = async (container) => 
{
    if (container != null)
    {
        return container.remove({ force: true }, function (err, data) {
            if (err)
            {
                console.log("Could not remove container");    
            }
          });
    }
    return Promise.resolve();
}

/**
 * Pulls the given image, retags it and then pushed the retaged image
 * @param {string} sourceImage The name of the image that should be retagged
 * @param {string} targetImage The target name of the new image
 * @param {string} tag the tag of the source and target
 */
const retagAndPushImage = async(sourceImage, targetImage) => 
{
    await pullImageWithAuth(sourceImage);
    let image = docker.getImage(sourceImage);
    await image.tag({ name: sourceImage, repo: targetImage });
    let newImage = docker.getImage(targetImage);
    await pushImageWithAuth(newImage);
}

/**
 * Prints the containers log files to the console
 * @param {*} container Container object e.g. from the createContainerFromImage method
 * @param {function} logger Function taht acceppts a string that should be logged
 */
const writeContainerLogsToLogger = (container, logger) =>
{
    //Code from: https://github.com/apocas/dockerode/blob/master/examples/logs.js
    //create a single stream for stdin and stdout
    var logStream = new stream.PassThrough();

    logStream.on('data', function (chunk) {
        //Remove tailing newlines and spaces
        var content = chunk.toString('utf8'); 
        logger(content.trim());
    });

    container.logs({ follow: true, stdout: true, stderr: true }, function(err, stream) {
        if (err) {
            logger("ERR:" + err.message);
            return;
        }
            
        container.modem.demuxStream(stream, logStream, logStream);
        stream.on('end', function(){
            logStream.end('##### Container stopped #####');
            stream.destroy();
        });
    });
}

module.exports = {
    pullImageWithAuth,
    pushImageWithAuth,
    getImageLabel,
    createContainer,
    extractFileAsArchive,
    createContainerWithEnv, 
    ensurePathExistsInContainer,
    clearFolderContents,
    extractArchive,
    extractArchiveFromImage,
    writeContainerLogsToLogger,
    removeContainer,
    retagAndPushImage,
    instance : docker,
};