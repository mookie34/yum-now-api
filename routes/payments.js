const express = require("express");
const router = express.Router();
const controllers = require("../controllers/payments-controller");
const authenticate = require("../middleware/authenticate");

// Public - used by WhatsApp bot to create payments and update receipts
router.post("/", controllers.createPayment);
router.patch("/order/:order_id/receipt", controllers.updateReceiptImage);

// Admin only - payment management and verification
router.get("/status/:status", authenticate, controllers.getPaymentsByStatus);
router.get("/", authenticate, controllers.getAllPayments);
router.get("/order/:order_id", authenticate, controllers.getPaymentByOrderId);
router.patch("/order/:order_id/verify", authenticate, controllers.verifyPayment);
router.patch("/order/:order_id/amount", authenticate, controllers.updateAmountReported);

module.exports = router;
