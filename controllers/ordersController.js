const OrdersService = require("../services/ordersService");
const { ValidationError, NotFoundError } = require("../errors/customErrors");

const addOrder = async (req, res) => {
  try {
    const order = await OrdersService.addOrder(req.body);
    res.status(201).json({
      message: "Orden creada exitosamente",
      order,
    });
  } catch (err) {
    console.error("Error al crear la orden:", err.message);
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }
    if (err instanceof NotFoundError) {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: "Error al crear la orden" });
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
    console.error("Error al actualizar el total de la orden:", err.message);
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }
    if (err instanceof NotFoundError) {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: "Error al actualizar el total de la orden" });
  }
};

const getOrders = async (req, res) => {
  try {
    const { limit, offset } = req.query;
    const orders = await OrdersService.getAllOrders(limit, offset);
    res.json(orders);
  } catch (err) {
    console.error("Error al obtener las órdenes:", err.message);
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: "Error al obtener las órdenes" });
  }
};

const getOrderById = async (req, res) => {
  const { id } = req.params;
  try {
    const order = await OrdersService.getOrderById(id);
    res.json(order);
  } catch (err) {
    console.error("Error al obtener la orden:", err.message);
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }
    if (err instanceof NotFoundError) {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: "Error al obtener la orden" });
  }
};

const getOrderByCustomerId = async (req, res) => {
  const { customer_id } = req.params;
  try {
    const orders = await OrdersService.getOrdersByCustomerId(customer_id);
    res.json(orders);
  } catch (err) {
    console.error("Error al obtener las órdenes del cliente:", err.message);
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: "Error al obtener las órdenes del cliente" });
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
    console.error("Error al eliminar la orden:", err.message);
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }
    if (err instanceof NotFoundError) {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: "Error al eliminar la orden" });
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
    console.error("Error al actualizar la orden:", err.message);
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }
    if (err instanceof NotFoundError) {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: "Error al actualizar la orden" });
  }
};

const updateStatusOrder = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const updatedOrder = await OrdersService.updateStatusOrder(id, status);
    res.json({
      message: "Estado de la orden actualizado exitosamente",
      order: updatedOrder,
    });
  } catch (err) {
    console.error("Error al actualizar el estado de la orden:", err.message);
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }
    if (err instanceof NotFoundError) {
      return res.status(404).json({ error: err.message });
    }
    res
      .status(500)
      .json({ error: "Error al actualizar el estado de la orden" });
  }
};

const countOrdersForDay = async (req, res) => {
  try {
    const count = await OrdersService.countOrdersForDay();
    res.json({
      message: "Órdenes contadas exitosamente",
      count,
      date: new Date().toISOString().split("T")[0], // Opcional pero útil
    });
  } catch (err) {
    console.error("Error al contar las órdenes del día:", err.message);
    res.status(500).json({ error: "Error al contar las órdenes del día" });
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
};
