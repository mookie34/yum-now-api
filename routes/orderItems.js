const express = require('express');
const router = express.Router();
const orderItemsController = require('../controllers/orderItemsController');

// Crear un item de orden
router.post('/', orderItemsController.addOrderItem);

module.exports = router;