const couriersRepository = require("../repositories/couriersRepository");
const { ValidationError, NotFoundError } = require("../errors/customErrors");

class CouriersService {
  validateCourierData(courierData, isPartial = false) {
    const errors = [];
    const { name, phone, vehicle, license_plate, available } = courierData;

    // Validate name
    if (!isPartial || name !== undefined) {
      if (!name || name.trim() === "") {
        errors.push("El nombre es obligatorio");
      }
    }

    if (name && name.length > 100) {
      errors.push("El nombre no puede exceder los 100 caracteres");
    }

    // Validate phone
    if (!isPartial || phone !== undefined) {
      if (!phone || phone.trim() === "") {
        errors.push("El teléfono es obligatorio");
      }
    }

    if (phone && !/^\+?[\d\s\-()]+$/.test(phone.trim())) {
      errors.push("El teléfono contiene caracteres inválidos");
    }

    if (phone && phone.length > 20) {
      errors.push("El teléfono no puede exceder los 20 caracteres");
    }

    // Validate vehicle
    if (!isPartial || vehicle !== undefined) {
      if (!vehicle || vehicle.trim() === "") {
        errors.push("El vehículo es obligatorio");
      }
    }

    if (vehicle && vehicle.length > 50) {
      errors.push("El vehículo no puede exceder los 50 caracteres");
    }

    // Validate license_plate
    if (!isPartial || license_plate !== undefined) {
      if (!license_plate || license_plate.trim() === "") {
        errors.push("La placa es obligatoria");
      }
    }
    if (license_plate && license_plate.length > 20) {
      errors.push("La placa no puede exceder los 20 caracteres");
    }

    // Validate available
    if (available !== undefined && typeof available !== "boolean") {
      errors.push("available debe ser un valor booleano");
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
    const data = { ...courierData, available: courierData.available ?? true };
    this.validateCourierData(data, false);
    return await couriersRepository.create(data);
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

  async getAvailableCouriers() {
    const couriers = await couriersRepository.getAvailable();
    if (couriers.length === 0) {
      throw new NotFoundError("No hay Domiciliarios disponibles");
    }
    return couriers;
  }

  async getCouriersByFilter(filters) {
    const couriers = await couriersRepository.getForFilter(filters);
    if (couriers.length === 0) {
      throw new NotFoundError("No se encontraron domiciliarios con esos filtros");
    }
    return couriers;
  }

  async getCourierById(id) {
    this.validateId(id);
    const courier = await couriersRepository.getById(id);
    if (!courier) {
      throw new NotFoundError("Domiciliario no encontrado");
    }
    return courier;
  }

  async updateCourier(id, courierData) {
    this.validateId(id);
    this.validateCourierData(courierData, false);
    const updatedCourier = await couriersRepository.update(id, courierData);
    if (!updatedCourier) {
      throw new NotFoundError("Domiciliario no encontrado");
    }
    return updatedCourier;
  }

  async updateCourierPartial(id, courierData) {
    this.validateId(id);
    this.validateCourierData(courierData, true);
    const updatedCourier = await couriersRepository.updatePartial(
      id,
      courierData
    );
    if (!updatedCourier) {
      throw new NotFoundError("Domiciliario no encontrado");
    }
    return updatedCourier;
  }

  async deleteCourier(id) {
    this.validateId(id);
    const deleted = await couriersRepository.delete(id);
    if (!deleted) {
      throw new NotFoundError("Domiciliario no encontrado");
    }
    return deleted;
  }
}

module.exports = new CouriersService();
