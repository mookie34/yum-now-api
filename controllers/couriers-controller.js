const couriersService = require("../services/couriers-service");
const { ValidationError, NotFoundError } = require("../errors/custom-errors");

const addCourier = async (req, res) => {
  try {
    const courier = await couriersService.addCourier(req.body);
    res.status(201).json({
      message: "Domiciliario creado exitosamente",
      courier,
    });
  } catch (err) {
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }
    console.error("Error creating courier:", err.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const getCouriers = async (req, res) => {
  try {
    const { limit, offset } = req.query;
    const couriers = await couriersService.getAllCouriers(limit, offset);
    res.json(couriers);
  } catch (err) {
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }
    console.error("Error fetching couriers:", err.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const getCouriersAvailable = async (req, res) => {
  try {
    const couriers = await couriersService.getAvailableCouriers();
    res.json(couriers);
  } catch (err) {
    if (err instanceof NotFoundError) {
      return res.status(404).json({ error: err.message });
    }
    console.error("Error fetching available couriers:", err.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const getAvailableCouriersCount = async (req, res) => {
  try {
    const count = await couriersService.countAvailableCouriers();
    res.json({ count });
  } catch (err) {
    console.error("Error counting available couriers:", err.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const getCouriersByFilter = async (req, res) => {
  try {
    const { name, phone, license_plate } = req.query;
    const filters = { name, phone, license_plate };

    const couriers = await couriersService.getCouriersByFilter(filters);
    res.status(200).json(couriers);
  } catch (err) {
    if (err instanceof NotFoundError) {
      return res.status(404).json({ error: err.message });
    }
    console.error("Error fetching couriers by filter:", err.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const getCourierById = async (req, res) => {
  try {
    const { id } = req.params;
    const courier = await couriersService.getCourierById(id);
    res.json(courier);
  } catch (err) {
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }
    if (err instanceof NotFoundError) {
      return res.status(404).json({ error: err.message });
    }
    console.error("Error fetching courier by ID:", err.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const deleteCourier = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await couriersService.deleteCourier(id);
    res.json({
      message: "Domiciliario eliminado exitosamente",
      courier: deleted,
    });
  } catch (err) {
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }
    if (err instanceof NotFoundError) {
      return res.status(404).json({ error: err.message });
    }
    console.error("Error deleting courier:", err.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const updateCourier = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedCourier = await couriersService.updateCourier(id, req.body);
    res.json({
      message: "Domiciliario actualizado exitosamente",
      courier: updatedCourier,
    });
  } catch (err) {
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }
    if (err instanceof NotFoundError) {
      return res.status(404).json({ error: err.message });
    }
    console.error("Error updating courier:", err.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const updateCourierPartial = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedCourier = await couriersService.updateCourierPartial(
      id,
      req.body
    );
    res.status(200).json({
      message: "Domiciliario actualizado exitosamente",
      courier: updatedCourier,
    });
  } catch (err) {
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }
    if (err instanceof NotFoundError) {
      return res.status(404).json({ error: err.message });
    }
    console.error("Error partially updating courier:", err.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

module.exports = {
  addCourier,
  getCouriers,
  getCouriersAvailable,
  getAvailableCouriersCount,
  getCouriersByFilter,
  getCourierById,
  deleteCourier,
  updateCourier,
  updateCourierPartial,
};
