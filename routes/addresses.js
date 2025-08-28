const express = require('express');
const router = express.Router();
const addressesController = require('../controllers/addressesController');

// Crear una dirección
router.post('/', addressesController.addAddress);
// Listar direcciones
router.get('/', addressesController.getAddresses);
// Obtener direcciones por ID de cliente
router.get('/:customer_id', addressesController.getAddressByCustomerId);
// Eliminar una dirección
router.delete('/:id', addressesController.deleteAddress);
// Actualizar una dirección partialmente
router.patch('/:id', addressesController.updateAddressPartial);

module.exports = router;


