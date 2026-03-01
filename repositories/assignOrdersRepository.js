const db = require("../db");

class AssignOrdersRepository {
  constructor() {
    this.tableName = "YuNowDataBase.assignment_order";
    this.ordersTable = "YuNowDataBase.orders";
    this.couriersTable = "YuNowDataBase.couriers";
  }

  /**
   * Crear una nueva asignación de orden a un courier
   * @param {Object} assignData - Datos de la asignación
   * @param {number} assignData.order_id - ID de la orden
   * @param {number} assignData.courier_id - ID del courier
   * @returns {Object} Asignación creada
   */
  async create(assignData) {
    const { order_id, courier_id } = assignData;
    const query = `
      INSERT INTO ${this.tableName} (order_id, courier_id)
      VALUES ($1, $2)
      RETURNING *
    `;
    const result = await db.query(query, [order_id, courier_id]);
    return result.rows[0];
  }

  /**
   * Obtener todas las asignaciones con información completa
   * @returns {Array} Lista de asignaciones con datos de courier y orden
   */
  async getAll() {
    const query = `
      SELECT
        ao.id AS assignment_id,
        ao.assigned_at,
        c.id AS courier_id,
        c.name AS courier_name,
        c.phone AS courier_phone,
        c.license_plate AS courier_license_plate,
        c.vehicle AS courier_vehicle,
        o.id AS order_id,
        o.total,
        o.status_id,
        os.display_name AS status,
        pm.display_name AS payment_method,
        cust.name AS customer_name,
        cust.phone AS customer_phone,
        addr.address_text AS delivery_address
      FROM ${this.tableName} ao
      INNER JOIN ${this.couriersTable} c ON ao.courier_id = c.id
      INNER JOIN ${this.ordersTable} o ON ao.order_id = o.id
      LEFT JOIN YuNowDataBase.order_statuses os ON o.status_id = os.id
      LEFT JOIN YuNowDataBase.payment_methods pm ON o.payment_method_id = pm.id
      LEFT JOIN YuNowDataBase.customers cust ON o.customer_id = cust.id
      LEFT JOIN YuNowDataBase.addresses addr ON o.address_id = addr.id
      ORDER BY ao.assigned_at DESC
    `;
    const result = await db.query(query);
    return result.rows;
  }

  /**
   * Obtener asignaciones por ID de courier
   * @param {number} courier_id - ID del courier
   * @returns {Array} Lista de asignaciones del courier
   */
  async getByCourierId(courier_id) {
    const query = `
      SELECT
        ao.id AS assignment_id,
        ao.assigned_at,
        c.id AS courier_id,
        c.name AS courier_name,
        c.phone AS courier_phone,
        c.license_plate AS courier_license_plate,
        c.vehicle AS courier_vehicle,
        o.id AS order_id,
        o.total,
        o.status_id,
        os.display_name AS status,
        pm.display_name AS payment_method,
        cust.name AS customer_name,
        cust.phone AS customer_phone,
        addr.address_text AS delivery_address
      FROM ${this.tableName} ao
      INNER JOIN ${this.couriersTable} c ON ao.courier_id = c.id
      INNER JOIN ${this.ordersTable} o ON ao.order_id = o.id
      LEFT JOIN YuNowDataBase.order_statuses os ON o.status_id = os.id
      LEFT JOIN YuNowDataBase.payment_methods pm ON o.payment_method_id = pm.id
      LEFT JOIN YuNowDataBase.customers cust ON o.customer_id = cust.id
      LEFT JOIN YuNowDataBase.addresses addr ON o.address_id = addr.id
      WHERE ao.courier_id = $1
      ORDER BY ao.assigned_at DESC
    `;
    const result = await db.query(query, [courier_id]);
    return result.rows;
  }

  /**
   * Obtener asignación por ID de orden
   * @param {number} order_id - ID de la orden
   * @returns {Object|null} Asignación encontrada o null
   */
  async getByOrderId(order_id) {
    const query = `
      SELECT
        ao.id AS assignment_id,
        ao.assigned_at,
        c.id AS courier_id,
        c.name AS courier_name,
        c.phone AS courier_phone,
        c.license_plate AS courier_license_plate,
        c.vehicle AS courier_vehicle,
        o.id AS order_id,
        o.total,
        o.status_id,
        os.display_name AS status,
        pm.display_name AS payment_method,
        cust.name AS customer_name,
        cust.phone AS customer_phone,
        addr.address_text AS delivery_address
      FROM ${this.tableName} ao
      INNER JOIN ${this.couriersTable} c ON ao.courier_id = c.id
      INNER JOIN ${this.ordersTable} o ON ao.order_id = o.id
      LEFT JOIN YuNowDataBase.order_statuses os ON o.status_id = os.id
      LEFT JOIN YuNowDataBase.payment_methods pm ON o.payment_method_id = pm.id
      LEFT JOIN YuNowDataBase.customers cust ON o.customer_id = cust.id
      LEFT JOIN YuNowDataBase.addresses addr ON o.address_id = addr.id
      WHERE ao.order_id = $1
      ORDER BY ao.assigned_at DESC
    `;
    const result = await db.query(query, [order_id]);
    return result.rows[0] || null;
  }

  /**
   * Verificar si una orden ya está asignada
   * @param {number} order_id - ID de la orden
   * @returns {Object|null} Asignación existente o null
   */
  async checkExistingAssignment(order_id) {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE order_id = $1
    `;
    const result = await db.query(query, [order_id]);
    return result.rows[0] || null;
  }

  /**
   * Verificar si existe una orden
   * @param {number} order_id - ID de la orden
   * @returns {Object|null} Orden encontrada o null
   */
  async checkOrderExists(order_id) {
    const query = `SELECT * FROM ${this.ordersTable} WHERE id = $1`;
    const result = await db.query(query, [order_id]);
    return result.rows[0] || null;
  }

  /**
   * Verificar si existe un courier
   * @param {number} courier_id - ID del courier
   * @returns {Object|null} Courier encontrado o null
   */
  async checkCourierExists(courier_id) {
    const query = `SELECT * FROM ${this.couriersTable} WHERE id = $1`;
    const result = await db.query(query, [courier_id]);
    return result.rows[0] || null;
  }

  /**
   * Actualizar el courier asignado a una orden
   * @param {number} order_id - ID de la orden
   * @param {number} courier_id - Nuevo ID del courier
   * @returns {Object|null} Asignación actualizada o null
   */
  async updateCourierByOrderId(order_id, courier_id) {
    const query = `
      UPDATE ${this.tableName}
      SET courier_id = $1
      WHERE order_id = $2
      RETURNING *
    `;
    const result = await db.query(query, [courier_id, order_id]);
    return result.rows[0] || null;
  }

  /**
   * Eliminar asignación por ID de orden
   * @param {number} order_id - ID de la orden
   * @returns {Object|null} Asignación eliminada o null
   */
  async deleteByOrderId(order_id) {
    const query = `
      DELETE FROM ${this.tableName}
      WHERE order_id = $1
      RETURNING *
    `;
    const result = await db.query(query, [order_id]);
    return result.rows[0] || null;
  }

  /**
   * Contar asignaciones activas de un courier
   * @param {number} courier_id - ID del courier
   * @returns {number} Cantidad de asignaciones activas
   */
  async countActiveByCourier(courier_id) {
    const query = `
      SELECT COUNT(*) as count
      FROM ${this.tableName} ao
      INNER JOIN ${this.ordersTable} o ON ao.order_id = o.id
      WHERE ao.courier_id = $1
      AND o.status_id NOT IN (
        SELECT id FROM YuNowDataBase.order_statuses
        WHERE name IN ('DELIVERED', 'CANCELLED')
      )
    `;
    const result = await db.query(query, [courier_id]);
    return parseInt(result.rows[0].count, 10);
  }
}

module.exports = new AssignOrdersRepository();
