var mongoFilePath = (process.env.NODE_ENV === 'production') ? 'd:/home/site/db/mongoDBFiles' : '/Users/kgividen/Data/Novell/sss/mongoDBFiles';

module.exports = {
    serverPort: 3000,
    //mongoUri: 'mongodb://localhost:27017/sss',
    mongoFilePath: mongoFilePath,
    cookieMaxAge: 30 * 24 * 3600 * 1000
};