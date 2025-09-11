const { createModel } = require('mongoose-gridfs');
const mongoose = require('mongoose');

/**
 * @returns A new handler to access the gridFS
 */
const getGridHandler = () => 
{
  return createModel({ connection: mongoose.connection });  
}

/**
 * Stores the contents of the provided readStream as a file in the GridFS and returns 
 * the id of the resultung file
 * @param {*} readStream stream that can be read and should be stored in the gridFs
 */
const storeInGridFs = async (filename, readStream) => 
{
  return new Promise((resolve, reject) => {
    //Store the stream in gridFs
    getGridHandler().write({filename: filename}, readStream, (error, file) => {
      if (error)
      {
        reject(error); 
        return;
      }
      resolve(file._id);  
    });
  });
}

/**
 * @param {string} id id of the file that should be read
 * @returns a readable stream of the contents in the gridFs with the specific id
 */
const readFromGridFs = async (id) => 
{
  let file = await getGridHandler().findById(id);
  return file.read();
}

/**
 * Removes the item with the specified id from the grid FS
 * @param {string} id id of the file that should be removed
 * @returns without error when the removal was successful
 */
const removeFromGridFs = async(id) =>
{
  //Find corresponding file
  let file = await getGridHandler().findById(id);
  if (file)
  {
    return new Promise((resolve, reject) =>{
      //Unlink from GridFS
      file.unlink((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }
  //File does not exist -> already deleted
  return Promise.resolve();
}

/**
 * Same as removeFromGridFs but the provided id is checked first (if defined value)
 * @param {*} id id of the file that should be removed
 * @returns without error when the removal was successful
 */
const removeFromGridFsIfDefiend = async(id) =>
{
  if (id)
  {
    return await removeFromGridFs(id);  
  }
  return Promise.resolve();
}

module.exports = {
  storeInGridFs, 
  readFromGridFs, 
  removeFromGridFs, 
  removeFromGridFsIfDefiend
};