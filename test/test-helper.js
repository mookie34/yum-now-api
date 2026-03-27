const jwt = require('jsonwebtoken');

const TEST_JWT_SECRET = 'test-secret-key';

function generateTestToken() {
    return jwt.sign({ username: 'admin' }, process.env.JWT_SECRET || TEST_JWT_SECRET, { expiresIn: '1h' });
}

function authHeader() {
    return `Bearer ${generateTestToken()}`;
}

module.exports = { generateTestToken, authHeader, TEST_JWT_SECRET };
