const express = require('express');
const router = express.Router();
const assignOrdersController = require('../controllers/assignOrdersController');

// Crear una nueva asignación de orden
router.post('/', assignOrdersController.addAssignOrder);
// Obtener todas las asignaciones de orden
router.get('/', assignOrdersController.getAssignOrders);
// Obtener asignaciones de orden por ID de repartidor
router.get('/courier/:courier_id', assignOrdersController.getAssignOrderByCourierId);
// Obtener asignaciones de orden por ID de orden
router.get('/order/:order_id', assignOrdersController.getAssignOrderByOrderId);
// Actualizar el repartidor asignado a una orden
router.put('/:order_id', assignOrdersController.updateAssignOrderCourier);
// Eliminar una asignación de orden
router.delete('/:order_id', assignOrdersController.deleteAssignOrder);


module.exports = router;