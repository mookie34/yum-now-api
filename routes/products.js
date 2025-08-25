const express = require('express');
const router = express.Router();
const productsController = require('../controllers/productsController');

// Crear un producto
router.post('/', productsController.addProduct);

module.exports = router;
