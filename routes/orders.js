const express = require('express');
const router = express.Router();
const controllers = require('../controllers/ordersController');

// Crear una orden
router.post('/', controllers.addOrder);
// Listar órdenes
router.get('/', controllers.getOrders);
// Obtener una orden por ID
router.get('/:id', controllers.getOrderById);

module.exports = router;