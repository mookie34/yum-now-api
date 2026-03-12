const express = require("express");
const router = express.Router();
const courierController = require("../controllers/couriers-controller");

// List couriers by filter
router.get("/filter", courierController.getCouriersByFilter);
// List available couriers
router.get("/available", courierController.getCouriersAvailable);
// Create a courier
router.post("/", courierController.addCourier);
// List all couriers (with optional pagination)
router.get("/", courierController.getCouriers);

// Get a courier by ID
router.get("/:id", courierController.getCourierById);
// Fully update a courier
router.put("/:id", courierController.updateCourier);
// Partially update a courier
router.patch("/:id", courierController.updateCourierPartial);
// Delete a courier
router.delete("/:id", courierController.deleteCourier);

module.exports = router;
