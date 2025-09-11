const { FLBasePath } = require('../federated/constants.js');
const { asyncHandler } = require('../utils').asyncHandler;
const trainConfigUtil = require('../utils').trainConfig;
const fileSystem = require('../utils').fileSystem;
const FLJobInfo = require('../models').fl_jobinfo;
const dockerUtil = require('../utils').docker;
const cryptoUtil = require('../utils').crypto;
const JobInfo = require('../models').jobinfo;
const vault = require('../utils').vault;
const tarStream = require("tar-stream");
const { Readable } = require("stream");
const path = require('path');
const tar = require("tar");
const fs = require('fs');
const { getStationName } = require('./station.js');

const getResultSymmetricKeyName = (jobId) => {
    const symmetricKeyName = jobId + "_results";
    return symmetricKeyName;
}

//Returns the job from DB
const getJobAbstract = (dbModel, jobId, userId) => 
{
    return new Promise(async (resolve, reject) => {
        //Get Job from DB
        try{
            let job = await dbModel.findOne({
                where: {
                    userid: userId,
                    jobid: jobId, 
                    currentstate: 'finished'
                },
                order: [
                    ['createdAt', 'DESC']
                ]
            }); 
            if(job === null)
            {
                return reject("Could not find finished job with id: " + jobId + " for user " + userId);
            }
            resolve(job);
        } catch(error)
        {
            console.log(error);
            return reject(error);
        }
    }); 
}

/**
 * Returns the incremental job object
 * @param {*} jobId 
 * @param {*} userId 
 * @returns 
 */
const getJob = (jobId, userId) => 
{
    return getJobAbstract(JobInfo, jobId, userId);
}

/**
 * Returns the federated Job object
 * @param {*} jobId 
 * @param {*} userId 
 * @returns 
 */
const getFLJob = (jobId, userId) => 
{
    return getJobAbstract(FLJobInfo, jobId, userId);
}

//Extracts train_config and file.enc from image, returns trainconfig object
const extractFromImage = (container, tempDir) => 
{
    return new Promise(async (resolve, reject) => 
    {
        //Two files needed: 
        //- traing_config json containing a encrypted symmetric key
        //- file.enc an encrypted tar archive containing all the changes
        const trainConfigFilePathInContainer = trainConfigUtil.getTrainConfigFilePathInContainer();
        const encryptedTarArchiveFilePathInContainer = fileSystem.getEncryptedTarArchiveFilePathInContainer();

        let trainConfig;
        try {

            //get tared train config, then untar
            let trainConfigArchive = await dockerUtil.extractFileAsArchive(container, trainConfigFilePathInContainer);
            trainConfig = await trainConfigUtil.unTarTrainConfigJson(trainConfigArchive);
        } catch(err)
        {
            return reject(err);
        }

        //Extract encrypted archive
        try{
           
            let encryptedArchive = await dockerUtil.extractFileAsArchive(container, encryptedTarArchiveFilePathInContainer); 
            await new Promise(fulfill => {
                encryptedArchive.pipe(
                    tar.extract({
                        cwd: tempDir,
                        sync: true,
                    })
                ).on("finish", fulfill)
            });            
            
        } catch(err)
        {
           return reject(err);
        }
        return resolve(trainConfig);
    }); 
}

//Main Method, extracts information from the container for the job and stores it at a temp path
const storeEncryptedArchiveToTempPath = (jobId, userId) =>
{
    return new Promise(async (resolve, reject) => {

        let tempDir = fileSystem.getTempDirPath(jobId);
        const encryptedTarArchiveFileName = fileSystem.getEncryptedTarArchiveFileName();
        const encryptedTarArchivePath = path.join(tempDir, encryptedTarArchiveFileName); 

        //Get the job object
        let job; 
        try
        {
            job = await getJob(jobId, userId);
        } catch(error)
        {
            console.log(error); 
            return reject(error);
        }        
        if(fs.existsSync(encryptedTarArchivePath)) 
        {
            //No need to reextract, files have been already extracted
            //Return path to encrypted archive
            console.log("Extracted archive exists, will not extract again");
            return resolve(encryptedTarArchivePath);
        } else
        {
            console.log("Extracting from job");
            tempDir = fileSystem.getTempDir(jobId, true);
        }
        let tempContainer; 
        try{
            
            //Nothing has been extracted yet, extract infos from image
            tempContainer = await dockerUtil.createContainer(job.trainstoragelocation + ":" + job.currentstation);
            let trainConfig = await extractFromImage(tempContainer, tempDir);
    
            //Get symmetric key for decryption
            if(!trainConfig.hasOwnProperty(trainConfigUtil.train_config_constant["symmetric_key"]) || trainConfig[trainConfigUtil.train_config_constant["symmetric_key"]] === "")
            {
                let err = "Symmetric Key not found in config. Cannot decrypt";
                return reject(err);
            }
    
            //Decrypt symmetric key
            const encryptedSymmetricKey = trainConfig[trainConfigUtil.train_config_constant["symmetric_key"]];
            const decryptedSymmetricKey = await trainConfigUtil.decryptSymmetricKey(encryptedSymmetricKey, jobId);
    
            // restore symmetric key to vault (so that we can use vault for the decryption)
            // Restore here means we add an existing keys as a new named key in vault
            const symmetricKeyName = getResultSymmetricKeyName(jobId)
            const symmetricKeyBackup = cryptoUtil.trainConfig.getVaultSymmetricKeyBackupModel(symmetricKeyName, decryptedSymmetricKey, null, { isBase64: true });
            const client = await vault.getVaultInstance();
            await client.write(`transit/restore/${symmetricKeyName}`, {
                backup: symmetricKeyBackup,
                name: symmetricKeyName,
                // force the restore to proceed even if a key by this name already exists.
                force: true
            });
    
            //Return the archive path as a result
            console.log("extraction succcessfull");
            return resolve(path.join(tempDir, encryptedTarArchiveFileName));
        } catch(err) {
            console.log("Error while extracting");
            return reject(err);
        } finally{
            //Remove the temp container
            if(tempContainer)
            {
                tempContainer.remove().catch((err) => { reject(err);});
            }
        }
    });
}

const decryptTarArchive = (jobId, encryptedTarArchiveFilePath) => 
{
    return new Promise(async (resolve, reject) => {

        //Decrypt tar archive, return as file stream
        const ciphertext = fs.readFileSync(encryptedTarArchiveFilePath, "utf8");
        let decryptionResult; 
        try {
            //Use the named vault key restored beforehand for decryption
            const client = await vault.getVaultInstance();
            decryptionResult = await client.write(`transit/decrypt/${getResultSymmetricKeyName(jobId)}`, { ciphertext: ciphertext });
        } catch(err)
        {
            console.log(err); 
            return reject(err);
        }        
        const plaintextEncoded = decryptionResult.data.plaintext;

        // base64 decode - a tar archive file
        return resolve(Buffer.from(plaintextEncoded, 'base64'));
    });
}

//Creates tree from the tar changes array
//Credit: https://stackoverflow.com/a/57344801/5589776
const createDataTree = dataset => {
    let result = [];
    let level = {result};
    
    dataset.forEach(path => {
      path.split('/').reduce((r, name, i, a) => {
        if(!r[name]) {
          r[name] = {result: []};
          r.result.push({name, path: a.slice(0,i+1).join('/'), children: r[name].result })
        }
        
        return r[name];
      }, level)
    });
    return result;
};

// Add station name (if found) in addition to station id in result tree
const addStationNameToResultTree = resultTree => {
    return resultTree.map(item => {
        if (item.name === 'global_storage') {
            item.children = item.children?.map(child => { 
                const stationName = getStationName(child['name']);
                let name = child['name'];
                if (stationName) {
                    name = `${name} (${stationName})`;
                }
                return { ...child, 'name': name } 
            })
        }
        return item;
    });
}

//Extracts the file at the given path from the archive
const extractFileFromArchive = (archiveStream, filePath) =>
{
    return new Promise(async (resolve, reject) => {
        try{
            let extractContents = tarStream.extract();
            var data = [];
            extractContents.on('entry', function (header, stream, next) {
        
                //Read file content
                stream.on('data', function(chunk) {
                if (header.name == filePath)
                    data.push(chunk);
                });
                
                //Get next element
                stream.on('end', function() {
                    next();
                });
        
            }).on('finish', function () {
                resolve(data);
            });
            archiveStream.pipe(extractContents);
        } catch(err)
        {
            reject(err);
        }
    });   
}

/**
 * Returns a list of the files contained in the provided archive
 * @param {*} archiveStream stream for the archive
 * @param {*} callback callback function, is called with a list of strings
 */
const getFileListFromArchive = (archiveStream, callback) => 
{
    let changes = [];

    let extractListOfContents = tarStream.extract();
    extractListOfContents.on('entry', function (header, stream, next) {

        // header is the tar header
        // stream is the content body (might be an empty stream)
        // call next when you are done with this entry

        // clear stream - just file name is enough
        if (header.type == "file") {
            changes.push(header.name);
        }

        stream.on('end', function () {
            next(); // ready for next entry
        })

        stream.resume(); // just auto drain the stream

    }).on('finish', function () {
        callback(changes);
    });

    archiveStream.pipe(extractListOfContents);
}

/**
 * Handles the download of the whole archive or specific files
 * @param {*} req 
 * @param {*} res 
 * @param {*} archiveStream 
 * @returns 
 */
const handleFileDownload = async (req, res, jobId, userId, archiveStream) =>
{

    //Check if whole archive or single path should be downloaded    
    if (typeof req.query.path !== 'undefined' && !(req.query.path  === ""))
    {
        console.log("Downloading file " + req.query.path + " for " + jobId + " and user " + userId);

        let fileData = await extractFileFromArchive(archiveStream, req.query.path); 
        if(fileData === undefined || fileData.length == 0)
        {
            console.log("Could not find requested file " + req.query.path);
            res.status(404).send("File not found");
            return;
        }

        console.log("File " + req.query.path + " successfully extracted");
        //Write file as response
        res.writeHead(200, {
            "Content-Type": "application/octet-stream",
            "Content-Disposition": "attachment; filename=" + req.query.path.split('/').pop()
        });

        Readable.from(fileData).pipe(res);

    } else{
        //Write whole archive as response
        res.writeHead(200, {
            "Content-Type": "application/octet-stream",
            "Content-Disposition": "attachment; filename=result" + jobId + ".tar"
        });

        archiveStream.pipe(res);
    }
}

const getErrorView = (error) => 
{
    //Only return the vault sealed errors
    if (error.message === "Vault is sealed") return error;

    return {}
}

module.exports = {

    //Returns the contents of the jobresult as json
    view : asyncHandler(async (req, res) => {

        const jobId = req.params.id;
        const userId = req.kauth.grant.access_token.content.preferred_username;

        console.log("Fetching job results for " + jobId + " and user " + userId);
        let encryptedTarArchiveFilePath; 
        try
        {
            encryptedTarArchiveFilePath = await storeEncryptedArchiveToTempPath(jobId, userId); 
        } catch(err)
        {
            console.log("View: Error whole extracting archive for job " + jobId);
            console.log(err); 
            res.status(400).send(getErrorView(err));
            return; 
        }
       
        let plaintext; 

        try {
            
            //Decrypt Archive
            plaintext = await decryptTarArchive(jobId, encryptedTarArchiveFilePath); 

        } catch (err)
        {
            console.log("View: error while decrypting archive for job " + jobId);
            console.log(err); 
            res.status(400).send(getErrorView(err));
            return;
        }

        //Get the json representation
        getFileListFromArchive(Readable.from(plaintext), (changes) => 
        {
            res.status(200).send(JSON.stringify(createDataTree(changes)));
        });
    }),

    /**
     * Returns the contents of the FL job results as json
     */
    viewFL: asyncHandler(async (req, res) => {

        const jobId = req.params.id;
        const userId = req.kauth.grant.access_token.content.preferred_username;

        console.log("Fetching FL job results for " + jobId + " and user " + userId);

        try {
            //Get the job and extract the archive
            let job = await getFLJob(jobId, userId);
            console.log(`Extracting from image ${job.resultstoragelocation}`);
            let archiveStream = await dockerUtil.extractArchiveFromImage(job.resultstoragelocation, FLBasePath);
            console.log(`Got stream from image ${job.resultstoragelocation}`);

            //Get the json representation
            getFileListFromArchive(archiveStream, (changes) => 
            {
                console.log(`Successfully traversed archive to json from image ${job.resultstoragelocation}`);
                res.status(200).send(JSON.stringify(addStationNameToResultTree(createDataTree(changes))));
            });
        }
        catch (err)
        {
            console.log("Error while extracting archive for FL job " + jobId);
            console.log(err); 
            res.status(400).send(getErrorView(err));
            return;
        }
    }),

    //Provides a stream to download the .tar archive
    download : asyncHandler(async (req, res) => {

        const jobId = req.params.id;
        const userId = req.kauth.grant.access_token.content.preferred_username;

        console.log("Downloading jobresults for job " + jobId + " and user " + userId);
        let encryptedTarArchiveFilePath; 
        try
        {
            encryptedTarArchiveFilePath = await storeEncryptedArchiveToTempPath(jobId, userId); 
        } catch(err)
        {
            console.log("Download: Error while extracting archive for job " + jobId);
            console.log(err); 
            res.status(400).send(getErrorView(err));
            return; 
        }
       
        try {
            
            //Decrypt Archive
            let plaintext = await decryptTarArchive(jobId, encryptedTarArchiveFilePath); 
            //Handle download request
            await handleFileDownload(req, res, jobId, userId, Readable.from(plaintext));
        } catch (err)
        {
            console.log("Download: error while decrypting/extracting archive for job " + jobId)
            console.log(err); 
            res.status(400).send(getErrorView(err));
        }
    }),

    /**
     * Allows the download of the results from a FL job
     */
     downloadFL: asyncHandler(async (req, res) => {

        const jobId = req.params.id;
        const userId = req.kauth.grant.access_token.content.preferred_username;

        console.log("Fetching FL job results for " + jobId + " and user " + userId);

        try {
            //Get the job and extract the archive
            let job = await getFLJob(jobId, userId);
            let archiveStream = await dockerUtil.extractArchiveFromImage(job.resultstoragelocation, FLBasePath);
            console.log(`Got stream from image ${job.resultstoragelocation}`);

            //Handle download request
            await handleFileDownload(req, res, jobId, userId, archiveStream);   
        }
        catch (err)
        {
            console.log("Error while downloading results of FL job " + jobId);
            console.log(err); 
            res.status(400).send(getErrorView(err));
            return;
        }
    }),

}