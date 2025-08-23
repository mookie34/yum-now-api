const express = require('express');
const router = express.Router();
const courierController = require('../controllers/couriersController');

// Crear un mensajero
router.post('/', courierController.addCourier);
// Listar mensajeros
router.get('/', courierController.getCouriers);
// Eliminar un mensajero
router.delete('/:id', courierController.deleteCourier);
// Actualizar un mensajero
router.put('/:id', courierController.updateCourier);
// Actualizar un mensajero parcialmente
router.patch('/:id', courierController.updateCourierPartial);
// Listar mensajeros por filtro
router.get('/filter', courierController.getCourierForFilter);
// Listar mensajeros disponibles
router.get('/available', courierController.getCouriesAvailable);
module.exports = router;
