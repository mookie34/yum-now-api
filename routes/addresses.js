const express = require('express');
const router = express.Router();
const addressesController = require('../controllers/addresses-controller');

// Create an address
router.post('/', addressesController.addAddress);
// List all addresses
router.get('/', addressesController.getAddresses);
// Get primary address by customer ID
router.get('/primary/:customer_id', addressesController.getPrimaryAddressByCustomerId);
// Get addresses by customer ID
router.get('/customer/:customer_id', addressesController.getAddressesByCustomerId);
// Get address by ID
router.get('/:id', addressesController.getAddressById);
// Partially update an address
router.patch('/:id', addressesController.updateAddressPartial);
// Update an address
router.put('/:id', addressesController.updateAddress);
// Delete an address
router.delete('/:id', addressesController.deleteAddress);
module.exports = router;
