var Minio = require('minio')

var minioClient = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT,
    port: Number(process.env.MINIO_PORT),
    useSSL: JSON.parse(process.env.MINIO_USE_SSL), //Parse to boolean
    accessKey: process.env.MINIO_ADMIN_USER,
    secretKey:  process.env.MINIO_ADMIN_PASSWORD
});

/**
 * Removes a bucket with the given name
 * @param {*} name 
 * @return whether deleting the bucket was successfully
 */
const removeBucket = async (name) =>
{
    try {
        //First, delete all objects, then the bucket itself 
        //(minio has no method to force bucket removal via the API)
        let success = true;
        var objects = []
        var stream = minioClient.listObjects(name,'')
        stream.on('data', function (obj) { objects.push(obj.name) })
        stream.on('error', function () { success = false; });
        stream.on("end", async function () { 
            //Remove objects and then the bucket
            await minioClient.removeObjects(name, objects);
            await minioClient.removeBucket(name);
        })
        
        return success;
    } catch (err)
    {
        console.log(err);
        return false;
    }
}

/**
 * Creates a bucket if it does not already exist
 * @param {string} name The name of the bucket
 * @return whether the bucket could be ensured (e.g. something might go wrong during creation of a not existing bucket)
 */
const ensureBucket = async (name) => 
{
    try {
        var exists = await minioClient.bucketExists(name);
        if (exists) {
            return true;
        } else {
            await minioClient.makeBucket(name);
            return true;
        }
    } catch (err) {
        console.log(err);
        return false;
    }
}

/**
 * Returns the FileStream for the requested object at the requested bucket
 * @param {string} bucketName Name of the bucket
 * @param {string} objectName Name of the object
 * @return A FileStream on success, undefined on error and null if the file could not be found
 */
const getObject = async (bucketName, objectName) =>
{
    try {
        return await minioClient.getObject(bucketName, objectName);   
    } catch (err)
    {
        if (err.code == "NoSuchKey")
        {
            console.log(`Could not find key ${objectName} in bucket ${bucketName}`);
            return null;
        } else
        {
            console.log(err);
            return undefined;
        }
    }
}

/**
 * Puts the provided stream into the bucket with the given name
 * @param {string} bucketName 
 * @param {string} objectName 
 * @param {Readable Stream} stream 
 * @returns whether the object could be put
 */
const putObject = async (bucketName, objectName, stream) =>
{
    try {
        await minioClient.putObject(bucketName, objectName, stream);
        return true;
    } catch (err)
    {
        console.log(err);
        return false;
    }
}

/**
 * @param {string} bucketName 
 * @param {string} objectName 
 * @returns true when the object exists and otherwise (including error cases) false
 */
const objectExists = async (bucketName, objectName) =>
{
    var object = await getObject(bucketName, objectName);
    if (object === null || object === undefined) {
        return false;
    } else {
        return true; 
    }
}

module.exports = {
    ensureBucket,
    removeBucket,
    getObject, 
    putObject, 
    objectExists
}