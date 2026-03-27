const express = require('express');
const router = express.Router();
const addressesController = require('../controllers/addresses-controller');
const authenticate = require('../middleware/authenticate');

// Public - bot needs to read and create addresses
router.post('/', addressesController.addAddress);
router.get('/primary/:customer_id', addressesController.getPrimaryAddressByCustomerId);
router.get('/customer/:customer_id', addressesController.getAddressesByCustomerId);
router.get('/:id', addressesController.getAddressById);

// Admin only - address management
router.get('/', authenticate, addressesController.getAddresses);
router.patch('/:id', authenticate, addressesController.updateAddressPartial);
router.put('/:id', authenticate, addressesController.updateAddress);
router.delete('/:id', authenticate, addressesController.deleteAddress);
module.exports = router;
