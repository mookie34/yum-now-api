const couriersService = require("../services/couriersService");
const { ValidationError, NotFoundError } = require("../errors/customErrors");

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
    console.error(err.message);
    res
      .status(500)
      .json({ error: "Error al guardar el domiciliario en la base de datos" });
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
    console.error(err.message);
    res.status(500).json({ error: "Error al obtener los Domiciliarios" });
  }
};

const getCouriersAvailable = async (req, res) => {
  try {
    const couriers = await couriersService.getAvailableCouriers();
    if (couriers.length === 0) {
      return res
        .status(404)
        .json({ error: "No hay Domiciliarios disponibles" });
    }
    res.json(couriers);
  } catch (err) {
    console.error(err.message);
    res
      .status(500)
      .json({ error: "Error al obtener los Domiciliarios disponibles" });
  }
};

const getCourierForFilter = async (req, res) => {
  try {
    const { name, phone, license_plate } = req.query;
    const filters = { name, phone, license_plate };

    const couriers = await couriersService.getCouriersByFilter(filters);

    if (couriers.length === 0) {
      return res
        .status(404)
        .json({ message: "No se encontraron domiciliarios con esos filtros" });
    }

    res.status(200).json(couriers);
  } catch (err) {
    console.error(err.message);
    res
      .status(500)
      .json({ error: "Error al obtener los Domiciliarios por filtro" });
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
    console.error(err.message);
    res.status(500).json({ error: "Error al obtener el Domiciliario" });
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
    console.error(err.message);
    res.status(500).json({ error: "Error al eliminar el Domiciliario" });
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
    console.error(err.message);
    res.status(500).json({ error: "Error al actualizar el Domiciliario" });
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
    console.error(err.message);
    res.status(500).json({ error: "Error al actualizar el Domiciliario" });
  }
};

module.exports = {
  addCourier,
  getCouriers,
  getCouriersAvailable,
  getCourierForFilter,
  getCourierById,
  deleteCourier,
  updateCourier,
  updateCourierPartial,
};
