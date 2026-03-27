const ordersRepository = require("../repositories/orders-repository");
const customerRepository = require("../repositories/customer-repository");
const addressRepository = require("../repositories/addresses-repository");
const { ValidationError, NotFoundError } = require("../errors/custom-errors");
const { sanitizeForErrorMessage, parsePagination } = require("../utils/sanitize");

class OrdersService {
  validateCustomerId(customer_id) {
    if (!customer_id || isNaN(customer_id) || parseInt(customer_id) <= 0) {
      throw new ValidationError("customer_id inválido");
    }
  }

  validateAddressId(address_id) {
    if (!address_id || isNaN(address_id) || parseInt(address_id) <= 0) {
      throw new ValidationError("address_id inválido");
    }
  }

  async resolveCustomer(customer_id) {
    const customer = await customerRepository.getById(customer_id);
    if (!customer) {
      throw new NotFoundError("Cliente no encontrado");
    }
    return customer;
  }

  async resolveAddress(address_id) {
    const address = await addressRepository.getById(address_id);
    if (!address) {
      throw new NotFoundError("Dirección no encontrada");
    }
    return address;
  }

  validateAddressBelongsToCustomer(address, customer_id) {
    if (parseInt(address.customer_id) !== parseInt(customer_id)) {
      throw new ValidationError(
        "La dirección no pertenece al cliente especificado"
      );
    }
  }

  validateTotal(total) {
    if (total !== undefined && (isNaN(total) || parseFloat(total) < 0)) {
      return "El total no puede ser negativo";
    }
    return null;
  }

  async validatePaymentMethod(payment_method_id) {
    if (!payment_method_id || isNaN(payment_method_id)) {
      return "payment_method_id inválido";
    }
    const exists = await ordersRepository.paymentMethodExists(payment_method_id);
    if (!exists) return "Método de pago no válido o inactivo";
    return null;
  }

  async validateStatusId(status_id) {
    if (!status_id || isNaN(status_id)) {
      return "status_id inválido";
    }
    const exists = await ordersRepository.orderStatusExists(status_id);
    if (!exists) return "Estado del pedido no válido";
    return null;
  }

  async validateCustomerAndAddress(orderData, isPartial) {
    const { customer_id, address_id } = orderData;
    let customer = null;
    let address = null;

    if (!isPartial || customer_id !== undefined) {
      this.validateCustomerId(customer_id);
      customer = await this.resolveCustomer(customer_id);
    }
    if (!isPartial || address_id !== undefined) {
      this.validateAddressId(address_id);
      address = await this.resolveAddress(address_id);
    }
    if (customer && address) {
      this.validateAddressBelongsToCustomer(address, customer_id);
    }
  }

  async collectFieldErrors(orderData, isPartial, isCreate) {
    const errors = [];
    const { payment_method_id, status_id, total } = orderData;

    if (!isCreate && (!isPartial || total !== undefined)) {
      const totalError = this.validateTotal(total);
      if (totalError) errors.push(totalError);
    }
    if (!isPartial || payment_method_id !== undefined) {
      const pmError = await this.validatePaymentMethod(payment_method_id);
      if (pmError) errors.push(pmError);
    }
    if (!isPartial || status_id !== undefined) {
      const statusError = await this.validateStatusId(status_id);
      if (statusError) errors.push(statusError);
    }
    return errors;
  }

  async validateOrderData(orderData, isPartial = false, isCreate = false) {
    await this.validateCustomerAndAddress(orderData, isPartial);
    const errors = await this.collectFieldErrors(orderData, isPartial, isCreate);

    if (errors.length > 0) {
      throw new ValidationError(errors.join(", "));
    }
  }

  /**
   * Validates that an ID is valid
   */
  validateId(id) {
    if (!id || isNaN(id) || parseInt(id) <= 0) {
      throw new ValidationError("ID inválido");
    }
  }

  async addOrder(orderData) {
    await this.validateOrderData(orderData, false, true);
    const { total, ...dataWithoutTotal } = orderData;

    const newOrder = await ordersRepository.create({
      ...dataWithoutTotal,
      total: 0,
    });

    return newOrder;
  }

  /**
   * Recalculates and updates the order total from order_items
   */
  async updateTotalOrder(id) {
    this.validateId(id);
    const existingOrder = await ordersRepository.getById(id);
    if (!existingOrder) throw new NotFoundError("Orden no encontrada");

    return await ordersRepository.calculateAndUpdateTotal(id);
  }

  /**
   * Gets all orders with pagination
   */
  async getAllOrders(limit, offset) {
    const pagination = parsePagination(limit, offset);
    return await ordersRepository.getAll(pagination.limit, pagination.offset);
  }

  /**
   * Gets an order by ID
   */
  async getOrderById(id) {
    this.validateId(id);
    const order = await ordersRepository.getById(id);
    if (!order) throw new NotFoundError("Orden no encontrada");
    return order;
  }

  /**
   * Gets all orders for a customer
   */
  async getOrdersByCustomerId(customer_id) {
    this.validateId(customer_id);
    return await ordersRepository.getByCustomerId(customer_id);
  }

  /**
   * Deletes an order by ID
   */
  async deleteOrderById(id) {
    this.validateId(id);
    const order = await ordersRepository.getById(id);
    if (!order) throw new NotFoundError("Orden no encontrada");
    return await ordersRepository.delete(id);
  }

  async updateOrderPartial(id, orderData) {
    this.validateId(id);

    const allowedFields = ["status_id"];
    const receivedFields = Object.keys(orderData);
    const invalidFields = receivedFields.filter(
      (field) => !allowedFields.includes(field)
    );

    if (invalidFields.length > 0) {
      const sanitizedFields = invalidFields.map(sanitizeForErrorMessage);
      throw new ValidationError(
        `Solo se puede actualizar el estado de la orden. Campos no permitidos: ${sanitizedFields.join(
          ", "
        )}. Use updateStatusOrder() en su lugar.`
      );
    }

    if (receivedFields.length === 0) {
      throw new ValidationError("No se proporcionaron campos para actualizar");
    }

    await this.validateOrderData(orderData, true);
    const existingOrder = await ordersRepository.getById(id);
    if (!existingOrder) throw new NotFoundError("Orden no encontrada");

    return await ordersRepository.updatePartial(id, orderData);
  }

  /**
   * Updates the status of an order
   */
  async updateStatusOrder(id, status_id) {
    this.validateId(id);

    if (!status_id || isNaN(status_id)) {
      throw new ValidationError("status_id inválido");
    }

    const statusExists = await ordersRepository.orderStatusExists(status_id);
    if (!statusExists) {
      throw new ValidationError("Estado del pedido no válido");
    }

    const existingOrder = await ordersRepository.getById(id);
    if (!existingOrder) throw new NotFoundError("Orden no encontrada");

    return await ordersRepository.updateStatus(id, status_id);
  }

  /**
   * Counts orders for the current day
   */
  async countOrdersForDay() {
    return await ordersRepository.countForDay();
  }

  async getOrdersByStatus(status_id, limit, offset) {
    this.validateId(status_id);

    const pagination = parsePagination(limit, offset);

    const statusExists = await ordersRepository.orderStatusExists(status_id);
    if (!statusExists) {
      throw new ValidationError("Estado del pedido no válido");
    }

    return await ordersRepository.getByStatus(status_id, pagination.limit, pagination.offset);
  }
}

module.exports = new OrdersService();
