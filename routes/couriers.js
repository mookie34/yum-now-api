const express = require('express');
const router = express.Router();
const courierController = require('../controllers/couriersController');

// Crear un mensajero
router.post('/', courierController.addCourier);
// Listar mensajeros
router.get('/', courierController.getCouriers);
module.exports = router;