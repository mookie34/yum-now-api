const express = require("express");
const router = express.Router();
const customerPreferencesController = require("../controllers/customer-preferences-controller");
const authenticate = require("../middleware/authenticate");

// Public - bot creates and reads customer preferences
router.post("/", customerPreferencesController.createCustomerPreference);
router.get("/:customer_id", customerPreferencesController.getCustomerPreferences);
router.get("/customer/:customer_id/preference_key/:preference_key", customerPreferencesController.getCustomerSpecificPreference);

// Admin only - preference management
router.put("/customer/:customer_id/preference_key/:preference_key", authenticate, customerPreferencesController.updateCustomerPreference);
router.delete("/customer/:customer_id/preference_key/:preference_key", authenticate, customerPreferencesController.deleteCustomerPreference);
router.delete("/customer/:customer_id", authenticate, customerPreferencesController.deleteAllCustomerPreferences);

module.exports = router;
