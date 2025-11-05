const ordersRepository = require("../repositories/ordersRepository");
const customerRepository = require("../repositories/customerRepository");
const addressRepository = require("../repositories/addressesRepository");
const db = require("../db");
const { ValidationError, NotFoundError } = require("../errors/customErrors");

class OrdersService {
  async validateOrderData(orderData, isPartial = false, isCreate = false) {
    const errors = [];
    const { customer_id, address_id, payment_method_id, status_id, total } =
      orderData;

    let customer = null;
    let address = null;

    // Validar customer_id
    if (!isPartial || customer_id !== undefined) {
      if (!customer_id || isNaN(customer_id) || parseInt(customer_id) <= 0) {
        throw new ValidationError("customer_id inválido");
      }

      customer = await customerRepository.getById(customer_id);
      if (!customer) {
        throw new ValidationError("Cliente no encontrado");
      }
    }

    // Validar address_id
    if (!isPartial || address_id !== undefined) {
      if (!address_id || isNaN(address_id) || parseInt(address_id) <= 0) {
        throw new ValidationError("address_id inválido");
      }

      address = await addressRepository.getById(address_id);
      if (!address) {
        throw new ValidationError("Dirección no encontrada");
      }
    }

    if (
      customer &&
      address &&
      parseInt(address.customer_id) !== parseInt(customer_id)
    ) {
      throw new ValidationError(
        "La dirección no pertenece al cliente especificado"
      );
    }

    // Validar total (solo en actualizaciones, no en create)
    // ✅ En create el total siempre es 0 y se calcula después
    if (!isCreate && (!isPartial || total !== undefined)) {
      if (total !== undefined && (isNaN(total) || parseFloat(total) < 0)) {
        errors.push("El total no puede ser negativo");
      }
    }

    // Validar payment_method_id
    if (!isPartial || payment_method_id !== undefined) {
      if (!payment_method_id || isNaN(payment_method_id)) {
        errors.push("payment_method_id inválido");
      } else {
        const result = await db.query(
          "SELECT id FROM yunowdatabase.payment_methods WHERE id = $1 AND is_active = true",
          [payment_method_id]
        );
        if (result.rows.length === 0) {
          errors.push("Método de pago no válido o inactivo");
        }
      }
    }

    // Validar status_id
    if (!isPartial || status_id !== undefined) {
      if (!status_id || isNaN(status_id)) {
        errors.push("status_id inválido");
      } else {
        const result = await db.query(
          "SELECT id FROM yunowdatabase.order_statuses WHERE id = $1",
          [status_id]
        );
        if (result.rows.length === 0) {
          errors.push("Estado del pedido no válido");
        }
      }
    }

    if (errors.length > 0) {
      throw new ValidationError(errors.join(", "));
    }
  }

  /**
   * Valida que un ID sea válido
   */
  validateId(id) {
    if (!id || isNaN(id) || parseInt(id) <= 0) {
      throw new ValidationError("ID inválido");
    }
  }

  async addOrder(orderData) {
    await this.validateOrderData(orderData, false, true);

    // 🎯 Ignorar el total enviado por el usuario
    const { total, ...dataWithoutTotal } = orderData;

    // Crear la orden con total = 0 (se calculará después con order_items)
    const newOrder = await ordersRepository.create({
      ...dataWithoutTotal,
      total: 0,
    });

    return newOrder;
  }

  /**
   * Recalcula y actualiza el total de una orden desde order_items
   */
  async updateTotalOrder(id) {
    this.validateId(id);
    const existingOrder = await ordersRepository.getById(id);
    if (!existingOrder) throw new NotFoundError("Orden no encontrada");

    return await ordersRepository.calculateAndUpdateTotal(id);
  }

  /**
   * Obtiene todas las órdenes con paginación
   */
  async getAllOrders(limit = 100, offset = 0) {
    limit = parseInt(limit);
    offset = parseInt(offset);

    if (isNaN(limit) || limit <= 0) {
      throw new ValidationError("El límite debe ser un número positivo");
    }
    if (isNaN(offset) || offset < 0) {
      throw new ValidationError("El offset debe ser un número no negativo");
    }

    return await ordersRepository.getAll(limit, offset);
  }

  /**
   * Obtiene una orden por ID
   */
  async getOrderById(id) {
    this.validateId(id);
    const order = await ordersRepository.getById(id);
    if (!order) throw new NotFoundError("Orden no encontrada");
    return order;
  }

  /**
   * Obtiene todas las órdenes de un cliente
   */
  async getOrdersByCustomerId(customer_id) {
    this.validateId(customer_id);
    return await ordersRepository.getByCustomerId(customer_id);
  }

  /**
   * Elimina una orden por ID
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
      throw new ValidationError(
        `Solo se puede actualizar el estado de la orden. Campos no permitidos: ${invalidFields.join(
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
   * Actualiza el estado de una orden
   */
  async updateStatusOrder(id, status_id) {
    this.validateId(id);

    if (!status_id || isNaN(status_id)) {
      throw new ValidationError("status_id inválido");
    }

    const validStatus = await db.query(
      "SELECT id FROM yunowdatabase.order_statuses WHERE id = $1",
      [status_id]
    );
    if (validStatus.rows.length === 0) {
      throw new ValidationError("Estado del pedido no válido");
    }

    const existingOrder = await ordersRepository.getById(id);
    if (!existingOrder) throw new NotFoundError("Orden no encontrada");

    return await ordersRepository.updateStatus(id, status_id);
  }

  /**
   * Cuenta las órdenes del día actual
   */
  async countOrdersForDay() {
    return await ordersRepository.countForDay();
  }

  async getOrdersByStatus(status_id, limit = 100, offset = 0) {
    this.validateId(status_id);

    limit = parseInt(limit);
    offset = parseInt(offset);

    if (isNaN(limit) || limit <= 0) {
      throw new ValidationError("El límite debe ser un número positivo");
    }
    if (isNaN(offset) || offset < 0) {
      throw new ValidationError("El offset debe ser un número no negativo");
    }

    // Validar que el estado exista
    const validStatus = await db.query(
      "SELECT id FROM yunowdatabase.order_statuses WHERE id = $1",
      [status_id]
    );
    if (validStatus.rows.length === 0) {
      throw new ValidationError("Estado del pedido no válido");
    }

    return await ordersRepository.getByStatus(status_id, limit, offset);
  }
}

module.exports = new OrdersService();
