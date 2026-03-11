const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');

// Create a customer
router.post('/', customerController.addCustomer);

// List customers
router.get('/', customerController.getCustomers);

// Get customer by phone
router.get('/phone/:phone', customerController.getCustomerByPhone);

// Get customer by ID
router.get('/:id', customerController.getCustomerById);

// Update a customer
router.put('/:id', customerController.updateCustomer);

// Partially update a customer
router.patch('/:id', customerController.updateCustomerPartial);

// Delete a customer
router.delete('/:id', customerController.deleteCustomer);

module.exports = router;
