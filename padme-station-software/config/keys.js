
// Information of database (MongoDB)
module.exports = {
    mongoURI:'mongodb://'+process.env.MONGO_USER+':'+process.env.MONGO_PASSWORD+'@'+process.env.MONGO_HOST+':'+process.env.MONGO_PORT+'/'+process.env.MONGO_DB+'?authSource='+(process.env.MONGO_AUTH_SOURCE || 'admin'),
};