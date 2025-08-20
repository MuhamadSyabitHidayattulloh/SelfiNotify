require('dotenv').config();

module.exports = {
    port: process.env.PORT || 3000,
    jwtSecret: process.env.JWT_SECRET || 'default_secret_key',
    dbPath: process.env.DB_PATH || './database/selfinotify.db',
    corsOrigin: process.env.CORS_ORIGIN || '*'
};

