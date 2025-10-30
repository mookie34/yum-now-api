const ordersRepository = require('../repositories/ordersRepository');
const customerRepository = require('../repositories/customerRepository');
const addressRepository = require('../repositories/addressesRepository');
const { ValidationError, NotFoundError, DuplicateError } = require('../errors/customErrors');

class OrdersService {
  validateOrderData(orderData, isPartial = false, isCreate = false) {
    const errors = [];
    const { customer_id, address_id, payment_method, status, total } =
      orderData;

    // Validar customer_id (REQUERIDO, entero positivo)
    if (!isPartial || customer_id !== undefined) {
      if (!customer_id || isNaN(customer_id) || parseInt(customer_id) <= 0) {
        errors.push("customer_id inválido");
      }
    }

    // Validar total (REQUERIDO, número positivo)
    if (!isCreate && (!isPartial || total !== undefined)) {
      if (total === undefined || isNaN(total) || parseFloat(total) < 0) {
        errors.push("total inválido");
      }
    }

    // Validar address_id (REQUERIDO, entero positivo)
    if (!isPartial || address_id !== undefined) {
      if (!address_id || isNaN(address_id) || parseInt(address_id) <= 0) {
        errors.push("address_id inválido");
      }
    }

    // Validar payment_method (REQUERIDO, uno de los valores permitidos)
    const validPaymentMethods = ["credit_card", "debit_card", "paypal", "cash"];
    if (!isPartial || payment_method !== undefined) {
      if (!payment_method || !validPaymentMethods.includes(payment_method)) {
        errors.push(
          `payment_method inválido (debe ser uno de: ${validPaymentMethods.join(
            ", "
          )})`
        );
      }
    }

    // Validar status (REQUERIDO, uno de los valores permitidos)
    const validStatuses = [
      "pending",
      "processing",
      "shipped",
      "delivered",
      "canceled",
    ];
    if (!isPartial || status !== undefined) {
      if (!status || !validStatuses.includes(status)) {
        errors.push(
          `status inválido (debe ser uno de: ${validStatuses.join(", ")})`
        );
      }
    }

    if (errors.length > 0) {
      throw new ValidationError(errors.join(", "));
    }
  }

  validateId(id) {
    if (!id || isNaN(id) || parseInt(id) <= 0) {
      throw new ValidationError("ID inválido");
    }
  }

  async addOrder(orderData) {
    this.validateOrderData(orderData, false, true);

    const customer = await customerRepository.getById(orderData.customer_id);
    if (!customer) {
      throw new NotFoundError("Cliente no encontrado");
    }

    const address = await addressRepository.getById(orderData.address_id);
    if (!address) {
      throw new NotFoundError("Dirección no encontrada");
    }

    return await ordersRepository.create(orderData);
  }

  async updateTotalOrder(id) {
    this.validateId(id);
    const existingOrder = await ordersRepository.getById(id);
    if (!existingOrder) {
      throw new NotFoundError("Orden no encontrada");
    }
    return await ordersRepository.calculateAndUpdateTotal(id);
  }

  async getAllOrders(limit = 100, offset = 0) {
    limit = parseInt(limit);
    offset = parseInt(offset);

    if (isNaN(limit) || limit <= 0) {
      throw new ValidationError("El límite debe ser un número positivo");
    }
    if (isNaN(offset) || offset < 0) {
      throw new ValidationError("El offset debe ser un número no negativo");
    }

    const orders = await ordersRepository.getAll(limit, offset);
    return orders;
  }

  async getOrderById(id) {
    this.validateId(id);
    const order = await ordersRepository.getById(id);
    if (!order) {
      throw new NotFoundError("Orden no encontrada");
    }
    return order;
  }

  async getOrdersByCustomerId(customer_id) {
    this.validateId(customer_id);
    const orders = await ordersRepository.getByCustomerId(customer_id);
    return orders;
  }

  async deleteOrderById(id) {
    this.validateId(id);
    const order = await ordersRepository.getById(id);
    if (!order) {
      throw new NotFoundError("Orden no encontrada");
    }
    return await ordersRepository.delete(id);
  }

  async updateOrderPartial(id, orderData) {
    this.validateId(id);
    this.validateOrderData(orderData, true);
    const existingOrder = await ordersRepository.getById(id);
    if (!existingOrder) {
      throw new NotFoundError("Orden no encontrada");
    }
    return await ordersRepository.updatePartial(id, orderData);
  }

  async updateStatusOrder(id, status) {
    this.validateId(id);
    const validStatuses = [
      "pending",
      "processing",
      "shipped",
      "delivered",
      "canceled",
    ];
    if (!status || !validStatuses.includes(status)) {
      throw new ValidationError(
        `Status inválido. Debe ser: ${validStatuses.join(", ")}`
      );
    }
    const existingOrder = await ordersRepository.getById(id);
    if (!existingOrder) {
      throw new NotFoundError("Orden no encontrada");
    }
    return await ordersRepository.updateStatus(id, status);
  }

  async countOrdersForDay() {
    return await ordersRepository.countForDay();
  }
}

module.exports = new OrdersService();