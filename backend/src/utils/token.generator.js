const crypto = require('crypto');

/**
 * Generate unique token for application
 * @returns {string} Unique token string
 */
function generateAppToken() {
    // Generate random bytes and convert to hex
    const randomBytes = crypto.randomBytes(32);
    const timestamp = Date.now().toString(36);
    const randomString = randomBytes.toString('hex');
    
    // Combine timestamp and random string for uniqueness
    return `app_${timestamp}_${randomString}`;
}

/**
 * Generate shorter token for testing purposes
 * @returns {string} Short token string
 */
function generateShortToken() {
    const randomBytes = crypto.randomBytes(8);
    return `test_${randomBytes.toString('hex')}`;
}

module.exports = {
    generateAppToken,
    generateShortToken
};

