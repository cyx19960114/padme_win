const { getAgentOptions } = require('../dind-certs-client');
const Docker = require('dockerode');
var tar = require('tar-stream');
var stream = require('stream');

const getInstance = () => {

    const options = getAgentOptions();

    const docker = new Docker({
        protocol: 'https',
        host: process.env.DOCKER_HOST,
        port: process.env.DOCKER_PORT,
        ca: options.ca, 
        cert: options.cert,
        key: options.key
    });

    return docker;

}

const docker = getInstance();


/**
 * Creates a Container from the given image 
 * @param {*} image 
 * @param {*} name 
 * @returns A Promise that resolves in the corresponding container object
 */
const createContainerFromImage = (image, name, env, binding, shmSize) => 
{
    return new Promise(async (resolve, reject) => {      

        let bindings = [];
        if (binding)
        {
            bindings.push(binding);    
        }

        //Create container
        let container = await docker.createContainer({
            Image: image, 
            name: name,
            Env: env, 
            HostConfig: {
                Binds: bindings,
                ShmSize: shmSize
            }
        }).catch(err => reject(err));
        resolve(container);
    }); 
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
            var tarStream = tar.pack();
            tarStream.entry({ name: pathToEnsure, type: 'directory' });
            tarStream.finalize(); 

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
                    // remove last folder in FLDataPath as Prefix from all files
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
        return await container.remove({ force: true, v: true });
    }
    return Promise.resolve();
}

/**
 * Removes an image with the given name
 * @param {*} imageName The name of the image that should be removed
 * @returns a successful promise if removal worked and a rejected promise when the image did not exist
 */
const removeImage = async (imageName) => {
    let image = await docker.getImage(imageName);
    if (image) {
       return await image.remove();
    } else
    {
        return Promise.reject();    
    }
}

const ensureContainerWithNameDoesNotExist = async (name) =>
{
    let container = docker.getContainer(name); 

    try {
        await container.remove({ force: true });
    // eslint-disable-next-line no-empty
    } catch { }

    return Promise.resolve();
}

module.exports = {
    createContainerFromImage,
    ensurePathExistsInContainer,
    writeContainerLogsToLogger,
    removeImage,
    extractArchive,
    removeContainer,
    ensureContainerWithNameDoesNotExist,
    instance : docker,
};