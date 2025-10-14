const express = require('express');
const router = express.Router();
const controllers = require('../controllers/ordersController');

// Crear una orden
router.post('/', controllers.addOrder);
// Listar órdenes
router.get('/', controllers.getOrders);
// Obtener una orden por ID
router.get('/:id', controllers.getOrderById);
// Obtener órdenes por ID de cliente
router.get('/customer/:customer_id', controllers.getOrderByCustomerId);
// Eliminar una orden
router.delete('/:id', controllers.deleteOrder);
// Actualizar una orden
router.patch('/:id', controllers.updateOrderPartial);
//Actualizar estado de la orden
router.patch('/:id/status', controllers.updateStatusOrder);
// Actualizar el total de la orden
router.patch('/:id/total', controllers.updateTotalOrder);
//Obtener ordenes del dia
router.get('/count', controllers.countOrdersForDay);

module.exports = router;