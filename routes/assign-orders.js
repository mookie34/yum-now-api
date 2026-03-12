const express = require('express');
const router = express.Router();
const assignOrdersController = require('../controllers/assign-orders-controller');

// Create a new order assignment
router.post('/', assignOrdersController.addAssignOrder);
// Get all order assignments
router.get('/', assignOrdersController.getAssignOrders);
// Get order assignments by courier ID
router.get('/courier/:courier_id', assignOrdersController.getAssignOrderByCourierId);
// Get order assignment by order ID
router.get('/order/:order_id', assignOrdersController.getAssignOrderByOrderId);
// Update the courier assigned to an order
router.put('/:order_id', assignOrdersController.updateAssignOrderCourier);
// Delete an order assignment
router.delete('/:order_id', assignOrdersController.deleteAssignOrder);


module.exports = router;
