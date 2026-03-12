const express = require('express');
const router = express.Router();
const ordersItemsController = require('../controllers/order-items-controller');

// Create an order item
router.post('/', ordersItemsController.addOrderItem);
// Get all order items
router.get('/', ordersItemsController.getAllOrderItems);
// Get order items by order ID
router.get('/order/:orderId', ordersItemsController.getOrderItemByOrderId);
// Delete all order items by order ID
router.delete('/order/:orderId', ordersItemsController.deleteAllItemsInOrder);
// Delete an order item by order ID and product ID
router.delete('/order/:orderId/product/:productId', ordersItemsController.deleteItemInOrderByIdProduct);
// Update quantity or price in an order item
router.patch('/order/:orderId/product/:productId', ordersItemsController.updateQuantityOrPriceInOrderItem);

module.exports = router;
