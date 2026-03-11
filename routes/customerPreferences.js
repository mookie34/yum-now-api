const express = require("express");
const router = express.Router();
const customerPreferencesController = require("../controllers/customerPreferencesController");

// Create a new customer preference
router.post("/", customerPreferencesController.createCustomerPreference);
// Get all preferences for a customer
router.get("/:customer_id", customerPreferencesController.getCustomerPreferences);
// Get a specific preference for a customer
router.get("/customer/:customer_id/preference_key/:preference_key", customerPreferencesController.getCustomerSpecificPreference);
// Update a customer preference
router.put("/customer/:customer_id/preference_key/:preference_key", customerPreferencesController.updateCustomerPreference);
// Delete a customer preference
router.delete("/customer/:customer_id/preference_key/:preference_key", customerPreferencesController.deleteCustomerPreference);
// Delete all preferences for a customer
router.delete("/customer/:customer_id", customerPreferencesController.deleteAllCustomerPreferences);

module.exports = router;
