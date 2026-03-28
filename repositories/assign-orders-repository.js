const db = require("../db");

const BASE_ASSIGNMENT_QUERY = `
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
  FROM YuNowDataBase.assignment_order ao
  INNER JOIN YuNowDataBase.couriers c ON ao.courier_id = c.id
  INNER JOIN YuNowDataBase.orders o ON ao.order_id = o.id
  LEFT JOIN YuNowDataBase.order_statuses os ON o.status_id = os.id
  LEFT JOIN YuNowDataBase.payment_methods pm ON o.payment_method_id = pm.id
  LEFT JOIN YuNowDataBase.customers cust ON o.customer_id = cust.id
  LEFT JOIN YuNowDataBase.addresses addr ON o.address_id = addr.id
`;

class AssignOrdersRepository {
  constructor() {
    this.tableName = "YuNowDataBase.assignment_order";
    this.ordersTable = "YuNowDataBase.orders";
    this.couriersTable = "YuNowDataBase.couriers";
  }

  /**
   * Creates a new order-to-courier assignment
   * @param {Object} assignData - Assignment data
   * @param {number} assignData.order_id - Order ID
   * @param {number} assignData.courier_id - Courier ID
   * @returns {Object} Created assignment
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
   * Gets all assignments with full details
   * @returns {Array} List of assignments with courier and order data
   */
  async getAll(limit = 100, offset = 0) {
    const query = `${BASE_ASSIGNMENT_QUERY} ORDER BY ao.assigned_at DESC LIMIT $1 OFFSET $2`;
    const result = await db.query(query, [limit, offset]);
    return result.rows;
  }

  /**
   * Gets assignments by courier ID
   * @param {number} courier_id - Courier ID
   * @returns {Array} List of courier assignments
   */
  async getByCourierId(courier_id) {
    const query = `${BASE_ASSIGNMENT_QUERY} WHERE ao.courier_id = $1 ORDER BY ao.assigned_at DESC`;
    const result = await db.query(query, [courier_id]);
    return result.rows;
  }

  /**
   * Gets assignment by order ID
   * @param {number} order_id - Order ID
   * @returns {Object|null} Found assignment or null
   */
  async getByOrderId(order_id) {
    const query = `${BASE_ASSIGNMENT_QUERY} WHERE ao.order_id = $1 ORDER BY ao.assigned_at DESC`;
    const result = await db.query(query, [order_id]);
    return result.rows[0] || null;
  }

  /**
   * Checks if an order is already assigned
   * @param {number} order_id - Order ID
   * @returns {Object|null} Existing assignment or null
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
   * Checks if an order exists
   * @param {number} order_id - Order ID
   * @returns {Object|null} Found order or null
   */
  async checkOrderExists(order_id) {
    const query = `SELECT * FROM ${this.ordersTable} WHERE id = $1`;
    const result = await db.query(query, [order_id]);
    return result.rows[0] || null;
  }

  /**
   * Checks if a courier exists
   * @param {number} courier_id - Courier ID
   * @returns {Object|null} Found courier or null
   */
  async checkCourierExists(courier_id) {
    const query = `SELECT * FROM ${this.couriersTable} WHERE id = $1`;
    const result = await db.query(query, [courier_id]);
    return result.rows[0] || null;
  }

  /**
   * Updates the courier assigned to an order
   * @param {number} order_id - Order ID
   * @param {number} courier_id - New courier ID
   * @returns {Object|null} Updated assignment or null
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
   * Deletes assignment by order ID
   * @param {number} order_id - Order ID
   * @returns {Object|null} Deleted assignment or null
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
   * Counts active assignments for a courier
   * @param {number} courier_id - Courier ID
   * @returns {number} Number of active assignments
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
