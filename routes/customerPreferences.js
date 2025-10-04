const express = require('express');
const router = express.Router();
const customerPreferencesController = require('../controllers/customerPreferencesController');

//Agrerar una nueva preferencia de cliente
router.post('/', customerPreferencesController.createCustomerPreference);
//Obtener todas las preferencias de un cliente
router.get('/:customer_id', customerPreferencesController.getCustomerPreferences);
//Obtener una preferencia especifica de un cliente
router.get('/customer/:customer_id/preference_key/:preference_key', customerPreferencesController.getCustomerEspecificPreference);
//Actualizar una preferencia de cliente
router.put('/customer/:customer_id/preference_key/:preference_key', customerPreferencesController.updateCustomerPreference);
//Eliminar una preferencia de cliente
router.delete('/customer/:customer_id/preference_key/:preference_key', customerPreferencesController.deleteCustomerPreference);
//Eliminar todas las preferencias de un cliente
router.delete('/customer/:customer_id', customerPreferencesController.deleteAllCustomerPreferences);


module.exports = router;