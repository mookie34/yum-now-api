const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');

// Crear un cliente
router.post('/', customerController.addCustomer);

// Listar clientes (opcional)
router.get('/', customerController.getCustomers);

module.exports = router;
