const express = require('express');
const router = express.Router();
const addressesController = require('../controllers/addressesController');

// Crear una dirección
router.post('/', addressesController.addAddress);
// Listar todas las direcciones
router.get('/', addressesController.getAddresses);
// Obtener dirección primaria por ID de cliente
router.get('/primary/:customer_id', addressesController.getPrimaryAddressByCustomerId);
// Obtener direcciones por ID de cliente
router.get('/customer/:customer_id', addressesController.getAddressesByCustomerId);
// Obtener direcciones por ID
router.get('/:id', addressesController.getAddressById);
//actualizar una dirección parcialmente
router.patch('/:id', addressesController.updateAddressPartial);
// Actualizar una dirección
router.put('/:id', addressesController.updateAddress);
// Eliminar una dirección
router.delete('/:id', addressesController.deleteAddress);
module.exports = router;


