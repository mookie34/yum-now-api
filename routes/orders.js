const express = require("express");
const router = express.Router();
const controllers = require("../controllers/orders-controller");
const authenticate = require("../middleware/authenticate");

// Public - used by WhatsApp bot to create and read orders
router.post("/", controllers.addOrder);
router.get("/customer/:customer_id", controllers.getOrderByCustomerId);

// Admin only - order management and dashboard
router.get("/count", authenticate, controllers.countOrdersForDay);
router.get("/status/:status_id", authenticate, controllers.getOrdersByStatus);
router.get("/", authenticate, controllers.getOrders);

// Dynamic param route must come after specific routes
router.get("/:id", controllers.getOrderById);
router.put("/:id/total", authenticate, controllers.updateTotalOrder);
router.patch("/:id/status", authenticate, controllers.updateStatusOrder);
router.patch("/:id", authenticate, controllers.updateOrderPartial);
router.delete("/:id", authenticate, controllers.deleteOrder);

module.exports = router;
