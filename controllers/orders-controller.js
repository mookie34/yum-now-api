const OrdersService = require("../services/orders-service");
const { ValidationError, NotFoundError } = require("../errors/custom-errors");

const addOrder = async (req, res) => {
  try {
    const order = await OrdersService.addOrder(req.body);
    res.status(201).json({
      message: "Orden creada exitosamente",
      order,
    });
  } catch (err) {
    console.error("Error creating order:", err.message);
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }
    if (err instanceof NotFoundError) {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const updateTotalOrder = async (req, res) => {
  const { id } = req.params;
  try {
    const updatedOrder = await OrdersService.updateTotalOrder(id);
    res.json({
      message: "Total de la orden actualizado exitosamente",
      order: updatedOrder,
    });
  } catch (err) {
    console.error("Error updating order total:", err.message);
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }
    if (err instanceof NotFoundError) {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const getOrders = async (req, res) => {
  try {
    const { limit, offset } = req.query;
    const orders = await OrdersService.getAllOrders(limit, offset);
    res.json(orders);
  } catch (err) {
    console.error("Error fetching orders:", err.message);
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const getOrderById = async (req, res) => {
  const { id } = req.params;
  try {
    const order = await OrdersService.getOrderById(id);
    res.json(order);
  } catch (err) {
    console.error("Error fetching order by ID:", err.message);
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }
    if (err instanceof NotFoundError) {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const getOrderByCustomerId = async (req, res) => {
  const { customer_id } = req.params;
  try {
    const orders = await OrdersService.getOrdersByCustomerId(customer_id);
    res.json(orders);
  } catch (err) {
    console.error("Error fetching orders by customer:", err.message);
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const deleteOrder = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedOrder = await OrdersService.deleteOrderById(id);
    res.json({
      message: "Orden eliminada exitosamente",
      order: deletedOrder,
    });
  } catch (err) {
    console.error("Error deleting order:", err.message);
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }
    if (err instanceof NotFoundError) {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const updateOrderPartial = async (req, res) => {
  const { id } = req.params;
  const orderData = req.body;
  try {
    const updatedOrder = await OrdersService.updateOrderPartial(id, orderData);
    res.json({
      message: "Orden actualizada exitosamente",
      order: updatedOrder,
    });
  } catch (err) {
    console.error("Error partially updating order:", err.message);
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }
    if (err instanceof NotFoundError) {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const updateStatusOrder = async (req, res) => {
  const { id } = req.params;
  const { status_id } = req.body;

  try {
    const updatedOrder = await OrdersService.updateStatusOrder(id, status_id);
    res.json({
      message: "Estado de la orden actualizado exitosamente",
      order: updatedOrder,
    });
  } catch (err) {
    console.error("Error updating order status:", err.message);
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }
    if (err instanceof NotFoundError) {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const countOrdersForDay = async (req, res) => {
  try {
    const count = await OrdersService.countOrdersForDay();
    res.json({
      message: "Órdenes contadas exitosamente",
      count,
      date: new Date().toISOString().split("T")[0],
    });
  } catch (err) {
    console.error("Error counting orders for today:", err.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const getOrdersByStatus = async (req, res) => {
  const { status_id } = req.params;
  const { limit, offset } = req.query;
  try {
    const orders = await OrdersService.getOrdersByStatus(
      status_id,
      limit,
      offset
    );
    res.json(orders);
  } catch (err) {
    console.error("Error fetching orders by status:", err.message);
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

module.exports = {
  addOrder,
  getOrders,
  getOrderByCustomerId,
  getOrderById,
  deleteOrder,
  updateOrderPartial,
  updateStatusOrder,
  updateTotalOrder,
  countOrdersForDay,
  getOrdersByStatus,
};
