const couriersRepository = require("../repositories/couriers-repository");
const { ValidationError, NotFoundError } = require("../errors/custom-errors");
const { parsePagination } = require("../utils/sanitize");

class CouriersService {
  validateName(name, isPartial) {
    const errors = [];
    if (!isPartial || name !== undefined) {
      if (!name || name.trim() === "") {
        errors.push("El nombre es obligatorio");
      }
    }
    if (name && name.length > 100) {
      errors.push("El nombre no puede exceder los 100 caracteres");
    }
    return errors;
  }

  validatePhone(phone, isPartial) {
    const errors = [];
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
    return errors;
  }

  validateVehicle(vehicle, isPartial) {
    const errors = [];
    if (!isPartial || vehicle !== undefined) {
      if (!vehicle || vehicle.trim() === "") {
        errors.push("El vehículo es obligatorio");
      }
    }
    if (vehicle && vehicle.length > 50) {
      errors.push("El vehículo no puede exceder los 50 caracteres");
    }
    return errors;
  }

  requiresLicensePlate(vehicle) {
    return vehicle === "Carro" || vehicle === "Moto";
  }

  validateLicensePlate(license_plate, isPartial, vehicle) {
    const errors = [];
    if (this.requiresLicensePlate(vehicle)) {
      if (!isPartial || license_plate !== undefined) {
        if (!license_plate || license_plate.trim() === "") {
          errors.push("La placa es obligatoria para Carro y Moto");
        }
      }
    }
    if (license_plate && license_plate.length > 20) {
      errors.push("La placa no puede exceder los 20 caracteres");
    }
    return errors;
  }

  validateCourierData(courierData, isPartial = false) {
    const { name, phone, vehicle, license_plate, available } = courierData;

    const errors = [
      ...this.validateName(name, isPartial),
      ...this.validatePhone(phone, isPartial),
      ...this.validateVehicle(vehicle, isPartial),
      ...this.validateLicensePlate(license_plate, isPartial, vehicle),
    ];

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

  async getAllCouriers(limit, offset) {
    const pagination = parsePagination(limit, offset);
    return await couriersRepository.getAll(pagination.limit, pagination.offset);
  }

  async getAvailableCouriers() {
    const couriers = await couriersRepository.getAvailable();
    if (couriers.length === 0) {
      throw new NotFoundError("No hay Domiciliarios disponibles");
    }
    return couriers;
  }

  async countAvailableCouriers() {
    return await couriersRepository.countAvailable();
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
