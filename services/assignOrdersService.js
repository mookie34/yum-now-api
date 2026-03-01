const assignOrdersRepository = require("../repositories/assignOrdersRepository");
const {
  ValidationError,
  NotFoundError,
  DuplicateError,
  BusinessRuleError,
} = require("../errors/customErrors");

class AssignOrdersService {
  /**
   * Validar ID numérico
   * @param {*} id - ID a validar
   * @param {string} fieldName - Nombre del campo para mensaje de error
   * @throws {ValidationError} Si el ID no es válido
   */
  validateId(id, fieldName = "ID") {
    if (!id || isNaN(id) || parseInt(id) <= 0) {
      throw new ValidationError(`${fieldName} inválido`);
    }
  }

  /**
   * Validar datos de asignación
   * @param {Object} assignData - Datos de la asignación
   * @param {number} assignData.order_id - ID de la orden
   * @param {number} assignData.courier_id - ID del courier
   * @throws {ValidationError} Si los datos no son válidos
   */
  async validateAssignData(assignData) {
    const errors = [];
    const { order_id, courier_id } = assignData;

    // Validar order_id
    if (!order_id) {
      errors.push("order_id es requerido");
    } else if (isNaN(order_id) || parseInt(order_id) <= 0) {
      errors.push("order_id debe ser un número positivo");
    }

    // Validar courier_id
    if (!courier_id) {
      errors.push("courier_id es requerido");
    } else if (isNaN(courier_id) || parseInt(courier_id) <= 0) {
      errors.push("courier_id debe ser un número positivo");
    }

    if (errors.length > 0) {
      throw new ValidationError(errors.join(", "));
    }
  }

  /**
   * Crear una nueva asignación de orden a courier
   * @param {Object} assignData - Datos de la asignación
   * @returns {Object} Asignación creada
   * @throws {ValidationError} Si los datos no son válidos
   * @throws {NotFoundError} Si la orden o courier no existen
   * @throws {DuplicateError} Si la orden ya está asignada
   */
  async createAssignment(assignData) {
    // Validar datos de entrada
    await this.validateAssignData(assignData);

    const { order_id, courier_id } = assignData;

    // Verificar que la orden existe
    const orderExists = await assignOrdersRepository.checkOrderExists(order_id);
    if (!orderExists) {
      throw new NotFoundError("No existe la orden");
    }

    // Verificar que el courier existe
    const courierExists = await assignOrdersRepository.checkCourierExists(
      courier_id
    );
    if (!courierExists) {
      throw new NotFoundError("Repartidor no encontrado");
    }

    // Verificar que la orden no esté ya asignada
    const existingAssignment =
      await assignOrdersRepository.checkExistingAssignment(order_id);
    if (existingAssignment) {
      throw new DuplicateError("La orden ya ha sido asignada a un repartidor");
    }

    // Crear la asignación
    return await assignOrdersRepository.create({ order_id, courier_id });
  }

  /**
   * Obtener todas las asignaciones
   * @returns {Array} Lista de asignaciones
   * @throws {NotFoundError} Si no hay asignaciones
   */
  async getAllAssignments() {
    const assignments = await assignOrdersRepository.getAll();

    if (assignments.length === 0) {
      throw new NotFoundError("No hay asignaciones de órdenes disponibles");
    }

    return assignments;
  }

  /**
   * Obtener asignaciones por ID de courier
   * @param {number} courier_id - ID del courier
   * @returns {Array} Lista de asignaciones del courier
   * @throws {ValidationError} Si el ID no es válido
   * @throws {NotFoundError} Si el courier no existe o no tiene asignaciones
   */
  async getAssignmentsByCourierId(courier_id) {
    // Validar ID
    this.validateId(courier_id, "ID de repartidor");

    // Verificar que el courier existe
    const courierExists = await assignOrdersRepository.checkCourierExists(
      courier_id
    );
    if (!courierExists) {
      throw new NotFoundError("Repartidor no encontrado");
    }

    // Obtener asignaciones
    const assignments = await assignOrdersRepository.getByCourierId(courier_id);

    if (assignments.length === 0) {
      throw new NotFoundError("No existe asignación para este repartidor");
    }

    return assignments;
  }

  /**
   * Obtener asignación por ID de orden
   * @param {number} order_id - ID de la orden
   * @returns {Object} Asignación de la orden
   * @throws {ValidationError} Si el ID no es válido
   * @throws {NotFoundError} Si la orden no existe o no tiene asignación
   */
  async getAssignmentByOrderId(order_id) {
    // Validar ID
    this.validateId(order_id, "ID de orden");

    // Verificar que la orden existe
    const orderExists = await assignOrdersRepository.checkOrderExists(order_id);
    if (!orderExists) {
      throw new NotFoundError("No existe la orden");
    }

    // Obtener asignación
    const assignment = await assignOrdersRepository.getByOrderId(order_id);

    if (!assignment) {
      throw new NotFoundError("No existe asignación para esta orden");
    }

    return assignment;
  }

  /**
   * Actualizar el courier asignado a una orden
   * @param {number} order_id - ID de la orden
   * @param {number} courier_id - Nuevo ID del courier
   * @returns {Object} Asignación actualizada
   * @throws {ValidationError} Si los IDs no son válidos
   * @throws {NotFoundError} Si la orden, courier o asignación no existen
   */
  async updateAssignmentCourier(order_id, courier_id) {
    // Validar IDs
    this.validateId(order_id, "ID de orden");
    this.validateId(courier_id, "ID de repartidor");

    // Verificar que la orden existe
    const orderExists = await assignOrdersRepository.checkOrderExists(order_id);
    if (!orderExists) {
      throw new NotFoundError("No existe la orden");
    }

    // Verificar que el nuevo courier existe
    const courierExists = await assignOrdersRepository.checkCourierExists(
      courier_id
    );
    if (!courierExists) {
      throw new NotFoundError("Repartidor no encontrado");
    }

    // Actualizar asignación
    const updatedAssignment =
      await assignOrdersRepository.updateCourierByOrderId(order_id, courier_id);

    if (!updatedAssignment) {
      throw new NotFoundError("No existe asignación para esta orden");
    }

    return updatedAssignment;
  }

  /**
   * Eliminar asignación de una orden
   * @param {number} order_id - ID de la orden
   * @returns {Object} Asignación eliminada
   * @throws {ValidationError} Si el ID no es válido
   * @throws {NotFoundError} Si la orden o asignación no existen
   */
  async deleteAssignment(order_id) {
    // Validar ID
    this.validateId(order_id, "ID de orden");

    // Verificar que la orden existe
    const orderExists = await assignOrdersRepository.checkOrderExists(order_id);
    if (!orderExists) {
      throw new NotFoundError("No existe la orden");
    }

    // Eliminar asignación
    const deletedAssignment = await assignOrdersRepository.deleteByOrderId(
      order_id
    );

    if (!deletedAssignment) {
      throw new NotFoundError("Asignamiento no encontrado");
    }

    return deletedAssignment;
  }

  /**
   * Obtener cantidad de asignaciones activas de un courier
   * @param {number} courier_id - ID del courier
   * @returns {number} Cantidad de asignaciones activas
   * @throws {ValidationError} Si el ID no es válido
   */
  async getActiveCourierAssignments(courier_id) {
    this.validateId(courier_id, "ID de repartidor");
    return await assignOrdersRepository.countActiveByCourier(courier_id);
  }
}

module.exports = new AssignOrdersService();
