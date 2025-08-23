const express = require('express');
const router = express.Router();
const courierController = require('../controllers/couriersController');

// Crear un mensajero
router.post('/', courierController.addCourier);
// Listar mensajeros
router.get('/', courierController.getCouriers);
// Eliminar un mensajero
router.delete('/:id', courierController.deleteCourier);
module.exports = router;