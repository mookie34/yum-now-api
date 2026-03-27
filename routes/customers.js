const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customer-controller');
const authenticate = require('../middleware/authenticate');

// Public - used by WhatsApp bot
router.post('/', customerController.addCustomer);
router.get('/phone/:phone', customerController.getCustomerByPhone);
router.get('/:id', customerController.getCustomerById);

// Admin only - customer management
router.get('/', authenticate, customerController.getCustomers);
router.put('/:id', authenticate, customerController.updateCustomer);
router.patch('/:id', authenticate, customerController.updateCustomerPartial);
router.delete('/:id', authenticate, customerController.deleteCustomer);

module.exports = router;
