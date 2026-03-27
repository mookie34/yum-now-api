const express = require('express');
const router = express.Router();
const assignOrdersController = require('../controllers/assign-orders-controller');
const authenticate = require('../middleware/authenticate');

// Public - courier app reads its own assignments
router.get('/courier/:courier_id', assignOrdersController.getAssignOrderByCourierId);
router.get('/order/:order_id', assignOrdersController.getAssignOrderByOrderId);

// Admin only - assignment management
router.get('/', authenticate, assignOrdersController.getAssignOrders);
router.post('/', authenticate, assignOrdersController.addAssignOrder);
router.put('/:order_id', authenticate, assignOrdersController.updateAssignOrderCourier);
router.delete('/:order_id', authenticate, assignOrdersController.deleteAssignOrder);


module.exports = router;
