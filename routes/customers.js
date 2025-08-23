const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');

// Crear un cliente
router.post('/', customerController.addCustomer);

// Listar clientes (opcional)
router.get('/', customerController.getCustomers);

// Actualizar un cliente
router.put('/:id', customerController.updateCustomer);

// Actualizar un cliente parcialmente
router.patch('/:id', customerController.updateCustomerPartial);

// Eliminar un cliente
router.delete('/:id', customerController.deleteCustomer);

module.exports = router;
