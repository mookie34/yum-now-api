const paymentsService = require("../services/payments-service");
const {
  ValidationError,
  NotFoundError,
  DuplicateError,
} = require("../errors/custom-errors");

const createPayment = async (req, res) => {
  try {
    const payment = await paymentsService.createPayment(req.body);
    res.status(201).json({
      message: "Pago registrado exitosamente",
      payment,
    });
  } catch (err) {
    console.error("Error creating payment:", err.message);
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }
    if (err instanceof NotFoundError) {
      return res.status(404).json({ error: err.message });
    }
    if (err instanceof DuplicateError) {
      return res.status(409).json({ error: err.message });
    }
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const getAllPayments = async (req, res) => {
  try {
    const { limit, offset } = req.query;
    const payments = await paymentsService.getAllPayments(limit, offset);
    res.json(payments);
  } catch (err) {
    console.error("Error fetching payments:", err.message);
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const getPaymentsByStatus = async (req, res) => {
  const { status } = req.params;
  const { limit, offset } = req.query;
  try {
    const payments = await paymentsService.getPaymentsByStatus(
      status,
      limit,
      offset
    );
    res.json(payments);
  } catch (err) {
    console.error("Error fetching payments by status:", err.message);
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const getPaymentByOrderId = async (req, res) => {
  const { order_id } = req.params;
  try {
    const payment = await paymentsService.getPaymentByOrderId(order_id);
    res.json(payment);
  } catch (err) {
    console.error("Error fetching payment by order ID:", err.message);
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }
    if (err instanceof NotFoundError) {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const verifyPayment = async (req, res) => {
  const { order_id } = req.params;
  try {
    const payment = await paymentsService.verifyPayment(order_id, req.body);
    res.json({
      message: "Pago verificado exitosamente",
      payment,
    });
  } catch (err) {
    console.error("Error verifying payment:", err.message);
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }
    if (err instanceof NotFoundError) {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const updateReceiptImage = async (req, res) => {
  const { order_id } = req.params;
  const { receipt_image_url } = req.body;
  try {
    const payment = await paymentsService.updateReceiptImage(
      order_id,
      receipt_image_url
    );
    res.json({
      message: "Comprobante actualizado exitosamente",
      payment,
    });
  } catch (err) {
    console.error("Error updating receipt image:", err.message);
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }
    if (err instanceof NotFoundError) {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const updateAmountReported = async (req, res) => {
  const { order_id } = req.params;
  const { amount_reported } = req.body;
  try {
    const payment = await paymentsService.updateAmountReported(
      order_id,
      amount_reported
    );
    res.json({
      message: "Monto reportado actualizado exitosamente",
      payment,
    });
  } catch (err) {
    console.error("Error updating amount reported:", err.message);
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }
    if (err instanceof NotFoundError) {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

module.exports = {
  createPayment,
  getAllPayments,
  getPaymentsByStatus,
  getPaymentByOrderId,
  verifyPayment,
  updateReceiptImage,
  updateAmountReported,
};
