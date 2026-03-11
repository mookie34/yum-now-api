const assignOrdersRepository = require("../repositories/assignOrdersRepository");
const {
  ValidationError,
  NotFoundError,
  DuplicateError,
  BusinessRuleError,
} = require("../errors/customErrors");

class AssignOrdersService {
  /**
   * Validate numeric ID
   * @param {*} id - ID to validate
   * @param {string} fieldName - Field name for error message
   * @throws {ValidationError} If the ID is not valid
   */
  validateId(id, fieldName = "ID") {
    if (!id || isNaN(id) || parseInt(id) <= 0) {
      throw new ValidationError(`${fieldName} inválido`);
    }
  }

  /**
   * Validate assignment data
   * @param {Object} assignData - Assignment data
   * @param {number} assignData.order_id - Order ID
   * @param {number} assignData.courier_id - Courier ID
   * @throws {ValidationError} If the data is not valid
   */
  async validateAssignData(assignData) {
    const errors = [];
    const { order_id, courier_id } = assignData;

    // Validate order_id
    if (!order_id) {
      errors.push("order_id es requerido");
    } else if (isNaN(order_id) || parseInt(order_id) <= 0) {
      errors.push("order_id debe ser un número positivo");
    }

    // Validate courier_id
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
   * Create a new order-to-courier assignment
   * @param {Object} assignData - Assignment data
   * @returns {Object} Created assignment
   * @throws {ValidationError} If the data is not valid
   * @throws {NotFoundError} If the order or courier does not exist
   * @throws {DuplicateError} If the order is already assigned
   */
  async createAssignment(assignData) {
    // Validate input data
    await this.validateAssignData(assignData);

    const { order_id, courier_id } = assignData;

    // Verify the order exists
    const orderExists = await assignOrdersRepository.checkOrderExists(order_id);
    if (!orderExists) {
      throw new NotFoundError("No existe la orden");
    }

    // Verify the courier exists
    const courierExists = await assignOrdersRepository.checkCourierExists(
      courier_id
    );
    if (!courierExists) {
      throw new NotFoundError("Repartidor no encontrado");
    }

    // Verify the order is not already assigned
    const existingAssignment =
      await assignOrdersRepository.checkExistingAssignment(order_id);
    if (existingAssignment) {
      throw new DuplicateError("La orden ya ha sido asignada a un repartidor");
    }

    // Create the assignment
    return await assignOrdersRepository.create({ order_id, courier_id });
  }

  /**
   * Get all assignments
   * @returns {Array} List of assignments
   * @throws {NotFoundError} If no assignments exist
   */
  async getAllAssignments() {
    const assignments = await assignOrdersRepository.getAll();

    if (assignments.length === 0) {
      throw new NotFoundError("No hay asignaciones de órdenes disponibles");
    }

    return assignments;
  }

  /**
   * Get assignments by courier ID
   * @param {number} courier_id - Courier ID
   * @returns {Array} List of courier assignments
   * @throws {ValidationError} If the ID is not valid
   * @throws {NotFoundError} If the courier does not exist or has no assignments
   */
  async getAssignmentsByCourierId(courier_id) {
    // Validate ID
    this.validateId(courier_id, "ID de repartidor");

    // Verify the courier exists
    const courierExists = await assignOrdersRepository.checkCourierExists(
      courier_id
    );
    if (!courierExists) {
      throw new NotFoundError("Repartidor no encontrado");
    }

    // Get assignments
    const assignments = await assignOrdersRepository.getByCourierId(courier_id);

    if (assignments.length === 0) {
      throw new NotFoundError("No existe asignación para este repartidor");
    }

    return assignments;
  }

  /**
   * Get assignment by order ID
   * @param {number} order_id - Order ID
   * @returns {Object} Order assignment
   * @throws {ValidationError} If the ID is not valid
   * @throws {NotFoundError} If the order does not exist or has no assignment
   */
  async getAssignmentByOrderId(order_id) {
    // Validate ID
    this.validateId(order_id, "ID de orden");

    // Verify the order exists
    const orderExists = await assignOrdersRepository.checkOrderExists(order_id);
    if (!orderExists) {
      throw new NotFoundError("No existe la orden");
    }

    // Get assignment
    const assignment = await assignOrdersRepository.getByOrderId(order_id);

    if (!assignment) {
      throw new NotFoundError("No existe asignación para esta orden");
    }

    return assignment;
  }

  /**
   * Update the courier assigned to an order
   * @param {number} order_id - Order ID
   * @param {number} courier_id - New courier ID
   * @returns {Object} Updated assignment
   * @throws {ValidationError} If the IDs are not valid
   * @throws {NotFoundError} If the order, courier, or assignment does not exist
   */
  async updateAssignmentCourier(order_id, courier_id) {
    // Validate IDs
    this.validateId(order_id, "ID de orden");
    this.validateId(courier_id, "ID de repartidor");

    // Verify the order exists
    const orderExists = await assignOrdersRepository.checkOrderExists(order_id);
    if (!orderExists) {
      throw new NotFoundError("No existe la orden");
    }

    // Verify the new courier exists
    const courierExists = await assignOrdersRepository.checkCourierExists(
      courier_id
    );
    if (!courierExists) {
      throw new NotFoundError("Repartidor no encontrado");
    }

    // Update assignment
    const updatedAssignment =
      await assignOrdersRepository.updateCourierByOrderId(order_id, courier_id);

    if (!updatedAssignment) {
      throw new NotFoundError("No existe asignación para esta orden");
    }

    return updatedAssignment;
  }

  /**
   * Delete an order assignment
   * @param {number} order_id - Order ID
   * @returns {Object} Deleted assignment
   * @throws {ValidationError} If the ID is not valid
   * @throws {NotFoundError} If the order or assignment does not exist
   */
  async deleteAssignment(order_id) {
    // Validate ID
    this.validateId(order_id, "ID de orden");

    // Verify the order exists
    const orderExists = await assignOrdersRepository.checkOrderExists(order_id);
    if (!orderExists) {
      throw new NotFoundError("No existe la orden");
    }

    // Delete assignment
    const deletedAssignment = await assignOrdersRepository.deleteByOrderId(
      order_id
    );

    if (!deletedAssignment) {
      throw new NotFoundError("Asignamiento no encontrado");
    }

    return deletedAssignment;
  }

  /**
   * Get count of active assignments for a courier
   * @param {number} courier_id - Courier ID
   * @returns {number} Number of active assignments
   * @throws {ValidationError} If the ID is not valid
   */
  async getActiveCourierAssignments(courier_id) {
    this.validateId(courier_id, "ID de repartidor");
    return await assignOrdersRepository.countActiveByCourier(courier_id);
  }
}

module.exports = new AssignOrdersService();
