const express = require("express");
const router = express.Router();
const courierController = require("../controllers/couriers-controller");
const authenticate = require("../middleware/authenticate");

// Public - courier app reads
router.get("/filter", courierController.getCouriersByFilter);
router.get("/available/count", courierController.getAvailableCouriersCount);
router.get("/available", courierController.getCouriersAvailable);
router.get("/", courierController.getCouriers);
router.get("/:id", courierController.getCourierById);

// Admin only - courier management
router.post("/", authenticate, courierController.addCourier);
router.put("/:id", authenticate, courierController.updateCourier);
router.patch("/:id", authenticate, courierController.updateCourierPartial);
router.delete("/:id", authenticate, courierController.deleteCourier);

module.exports = router;
