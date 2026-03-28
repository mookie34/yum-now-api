const assignOrdersService = require("../services/assign-orders-service");
const {
  ValidationError,
  NotFoundError,
  DuplicateError,
} = require("../errors/custom-errors");

const addAssignOrder = async (req, res) => {
  try {
    const assignment = await assignOrdersService.createAssignment(req.body);
    res.status(201).json({
      message: "Orden asignada exitosamente.",
      assignOrder: assignment,
    });
  } catch (err) {
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }
    if (err instanceof NotFoundError) {
      return res.status(404).json({ error: err.message });
    }
    if (err instanceof DuplicateError) {
      return res.status(409).json({ error: err.message });
    }
    console.error("Error assigning order to courier:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

const getAssignOrders = async (req, res) => {
  try {
    const assignments = await assignOrdersService.getAllAssignments(req.query.limit, req.query.offset);
    res.status(200).json(assignments);
  } catch (err) {
    if (err instanceof NotFoundError) {
      return res.status(404).json({ error: err.message });
    }
    console.error("Error fetching order assignments:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}


const getAssignOrderByCourierId = async (req, res) => {
  try {
    const { courier_id } = req.params;
    const assignments = await assignOrdersService.getAssignmentsByCourierId(
      courier_id
    );
    res.status(200).json(assignments);
  } catch (err) {
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }
    if (err instanceof NotFoundError) {
      return res.status(404).json({ error: err.message });
    }
    console.error("Error fetching assignments by courier ID:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

const getAssignOrderByOrderId = async (req, res) => {
  try {
    const { order_id } = req.params;
    const assignment = await assignOrdersService.getAssignmentByOrderId(
      order_id
    );
    res.status(200).json(assignment);
  } catch (err) {
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }
    if (err instanceof NotFoundError) {
      return res.status(404).json({ error: err.message });
    }
    console.error("Error fetching assignment by order ID:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

const updateAssignOrderCourier = async (req, res) => {
  try {
    const { order_id } = req.params;
    const { courier_id } = req.body;
    const updatedAssignment = await assignOrdersService.updateAssignmentCourier(
      order_id,
      courier_id
    );
    res.status(200).json({
      message: "Asignación de orden actualizada exitosamente.",
      assignOrder: updatedAssignment,
    });
  } catch (err) {
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }
    if (err instanceof NotFoundError) {
      return res.status(404).json({ error: err.message });
    }
    console.error("Error updating order assignment:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

const deleteAssignOrder = async (req, res) => {
  try {
    const { order_id } = req.params;
    const deletedAssignment = await assignOrdersService.deleteAssignment(
      order_id
    );
    res.status(200).json({
      message: "Asignación de orden eliminada exitosamente",
      assignOrder: deletedAssignment,
    });
  } catch (err) {
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }
    if (err instanceof NotFoundError) {
      return res.status(404).json({ error: err.message });
    }
    console.error("Error deleting order assignment:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

module.exports = {
  addAssignOrder,
  getAssignOrders,
  getAssignOrderByCourierId,
  getAssignOrderByOrderId,
  updateAssignOrderCourier,
  deleteAssignOrder,
};
