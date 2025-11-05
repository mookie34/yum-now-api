const express = require("express");
const router = express.Router();
const controllers = require("../controllers/ordersController");

router.get("/count", controllers.countOrdersForDay);
router.get("/customer/:customer_id", controllers.getOrderByCustomerId);
router.get("/status/:status_id", controllers.getOrdersByStatus); // ← NUEVA (opcional)
router.get("/", controllers.getOrders);
router.post("/", controllers.addOrder);
router.get("/:id", controllers.getOrderById);
router.put("/:id/total", controllers.updateTotalOrder);
router.patch("/:id/status", controllers.updateStatusOrder);
router.patch("/:id", controllers.updateOrderPartial);
router.delete("/:id", controllers.deleteOrder);

module.exports = router;
