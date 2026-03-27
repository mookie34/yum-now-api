const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth-controller');

// Admin login - returns JWT token
router.post('/login', authController.login);

module.exports = router;
