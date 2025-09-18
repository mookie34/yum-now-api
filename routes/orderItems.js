const express = require('express');
const router = express.Router();
const orderItemsController = require('../controllers/orderItemsController');

// Crear un item de orden
router.post('/', orderItemsController.addOrderItem);
// Obtener todos los items de orden
router.get('/', orderItemsController.getAllOrderItems);
// Obtener items de orden por ID de orden
router.get('/orderItems/:orderId', orderItemsController.getOrderItemByOrderId);

module.exports = router;