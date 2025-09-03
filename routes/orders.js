const express = require('express');
const router = express.Router();
const controllers = require('../controllers/ordersController');

// Crear una orden
router.post('/', controllers.addOrder);
// Listar órdenes
router.get('/', controllers.getOrders);

module.exports = router;