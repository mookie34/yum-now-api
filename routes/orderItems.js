const express = require('express');
const router = express.Router();
const ordersItemsController = require('../controllers/orderItemsController');

// Crear un item de orden
router.post('/', ordersItemsController.addOrderItem);
// Obtener todos los items de orden
router.get('/', ordersItemsController.getAllOrderItems);
// Obtener items de orden por ID de orden
router.get('/order/:orderId', ordersItemsController.getOrderItemByOrderId);
// Eliminar todos items de orden por ID de orden
router.delete('/order/:orderId', ordersItemsController.deleteAllItemsInOrder);
// Eliminar un item de orden por ID de orden y ID de producto
router.delete('/order/:orderId/product/:productId', ordersItemsController.deleteItemInOrderByIdProduct);
// Actualizar cantidad o precio en un item de orden
router.patch('/order/:orderId/product/:productId', ordersItemsController.updateQuantityOrPriceInOrderItem);

module.exports = router;