const express = require("express");
const router = express.Router();
const controllers = require("../controllers/ordersController");

router.get("/count", controllers.countOrdersForDay);
router.get("/customer/:customer_id", controllers.getOrderByCustomerId);
router.get("/:id", controllers.getOrderById);
router.post("/", controllers.addOrder);
router.get("/", controllers.getOrders);
router.delete("/:id", controllers.deleteOrder);
router.patch("/:id", controllers.updateOrderPartial);
router.patch("/:id/status", controllers.updateStatusOrder);
router.patch("/:id/total", controllers.updateTotalOrder);

module.exports = router;
