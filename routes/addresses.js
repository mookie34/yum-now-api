const express = require('express');
const router = express.Router();
const addressesController = require('../controllers/addressesController');

// Crear una dirección
router.post('/', addressesController.addAddress);
// Listar direcciones
router.get('/', addressesController.getAddresses);

module.exports = router;


