const express = require('express');
const router = express.Router();
const orderItemsController = require('../controllers/orderItemsController');

// Crear un item de orden
router.post('/', orderItemsController.addOrderItem);
// Obtener todos los items de orden
router.get('/', orderItemsController.getAllOrderItems);
// Obtener items de orden por ID de orden
router.get('/order/:orderId', orderItemsController.getOrderItemByOrderId);
// Eliminar todos items de orden por ID de orden
router.delete('/order/:orderId', orderItemsController.deleteAllItemsInOrder);
// Eliminar un item de orden por ID de orden y ID de producto
router.delete('/order/:orderId/product/:productId', orderItemsController.deleteItemInOrderByIdProduct);
// Actualizar cantidad o precio en un item de orden
router.patch('/order/:orderId/product/:productId', orderItemsController.updateQuantityOrPriceInOrderItem);

module.exports = router;