const express = require('express');
const router = express.Router();
const ordersItemsController = require('../controllers/order-items-controller');
const authenticate = require('../middleware/authenticate');

// Public - bot creates and reads order items
router.post('/', ordersItemsController.addOrderItem);
router.get('/order/:orderId', ordersItemsController.getOrderItemByOrderId);

// Admin only - order item management
router.get('/', authenticate, ordersItemsController.getAllOrderItems);
router.delete('/order/:orderId', authenticate, ordersItemsController.deleteAllItemsInOrder);
router.delete('/order/:orderId/product/:productId', authenticate, ordersItemsController.deleteItemInOrderByIdProduct);
router.patch('/order/:orderId/product/:productId', authenticate, ordersItemsController.updateQuantityOrPriceInOrderItem);

module.exports = router;
