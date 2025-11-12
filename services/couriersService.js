const couriersRepository = require("../repositories/couriersRepository");
const { ValidationError, NotFoundError } = require("../errors/customErrors");

class CouriersService {
  async validateCourierData(courierData, isPartial = false) {
    const errors = [];
    const { name, phone, vehicle, license_plate, available } = courierData;

    // Validar name
    if (!isPartial || name !== undefined) {
      if (!name || name.trim() === "") {
        errors.push("El nombre es obligatorio");
      }
    }

    // Validar phone
    if (!isPartial || phone !== undefined) {
      if (!phone || phone.trim() === "") {
        errors.push("El teléfono es obligatorio");
      }
    }
    // Validar vehicle
    if (!isPartial || vehicle !== undefined) {
      if (!vehicle || vehicle.trim() === "") {
        errors.push("El vehículo es obligatorio");
      }
    }
    // Validar license_plate
    if (!isPartial || license_plate !== undefined) {
      if (!license_plate || license_plate.trim() === "") {
        errors.push("La placa es obligatoria");
      }
    }

    // Validar available
    if (!isPartial || available !== undefined) {
      if (available !== undefined && typeof available !== "boolean") {
        errors.push("available debe ser un valor booleano");
      }
    }
    if (errors.length > 0) {
      throw new ValidationError(errors.join(", "));
    }
  }

  validateId(id) {
    if (!id || isNaN(id) || parseInt(id) <= 0) {
      throw new ValidationError("ID de domiciliario inválido");
    }
  }

  async addCourier(courierData) {
    await this.validateCourierData(courierData, false);
    return await couriersRepository.add(courierData);
  }

  async getAllCouriers(limit = 100, offset = 0) {
    limit = parseInt(limit);
    offset = parseInt(offset);

    if (isNaN(limit) || limit <= 0) {
      throw new ValidationError("El límite debe ser un número positivo");
    }
    if (isNaN(offset) || offset < 0) {
      throw new ValidationError("El offset debe ser un número no negativo");
    }

    return await couriersRepository.getAll(limit, offset);
  }
}

module.exports = new CouriersService();
