const db = require("../db");

class OrdersRepository {
  constructor() {
    this.tableName = "yunowdatabase.orders";
  }

  async create(orderData) {
    const {
      customer_id,
      address_id,
      total = 0, // Siempre inicia en 0, se calcula después
      payment_method_id,
      status_id = 1, // Por defecto "CREATED"
    } = orderData;

    const query = `
      INSERT INTO ${this.tableName} 
      (customer_id, address_id, total, payment_method_id, status_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const result = await db.query(query, [
      customer_id,
      address_id,
      total,
      payment_method_id,
      status_id,
    ]);

    return result.rows[0];
  }

  async getAll(limit = 100, offset = 0) {
    const query = `
      SELECT 
        o.id,
        o.total,
        o.created_at,
        c.id AS customer_id,
        c.name AS customer_name,
        c.email AS customer_email,
        a.id AS address_id,
        a.address_text AS delivery_address,
        a.label AS address_label,
        pm.id AS payment_method_id,
        pm.display_name AS payment_method,
        s.id AS status_id,
        s.display_name AS status,
        s.name AS status_code
      FROM ${this.tableName} o
      JOIN yunowdatabase.customers c ON o.customer_id = c.id
      JOIN yunowdatabase.addresses a ON o.address_id = a.id
      JOIN yunowdatabase.payment_methods pm ON o.payment_method_id = pm.id
      JOIN yunowdatabase.order_statuses s ON o.status_id = s.id
      ORDER BY o.created_at DESC
      LIMIT $1 OFFSET $2
    `;
    const result = await db.query(query, [limit, offset]);
    return result.rows;
  }

  async getById(id) {
    const query = `
      SELECT 
        o.*,
        c.name AS customer_name,
        c.email AS customer_email,
        c.phone AS customer_phone,
        a.address_text AS delivery_address,
        a.label AS address_label,
        a.reference AS address_reference,
        a.latitude,
        a.longitude,
        pm.display_name AS payment_method,
        pm.name AS payment_method_code,
        s.display_name AS status,
        s.name AS status_code
      FROM ${this.tableName} o
      JOIN yunowdatabase.customers c ON o.customer_id = c.id
      JOIN yunowdatabase.addresses a ON o.address_id = a.id
      JOIN yunowdatabase.payment_methods pm ON o.payment_method_id = pm.id
      JOIN yunowdatabase.order_statuses s ON o.status_id = s.id
      WHERE o.id = $1
    `;
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  async getByCustomerId(customer_id) {
    const query = `
      SELECT 
        o.*,
        a.address_text AS delivery_address,
        a.label AS address_label,
        pm.display_name AS payment_method,
        s.display_name AS status,
        s.name AS status_code
      FROM ${this.tableName} o
      JOIN yunowdatabase.addresses a ON o.address_id = a.id
      JOIN yunowdatabase.payment_methods pm ON o.payment_method_id = pm.id
      JOIN yunowdatabase.order_statuses s ON o.status_id = s.id
      WHERE o.customer_id = $1
      ORDER BY o.created_at DESC
    `;
    const result = await db.query(query, [customer_id]);
    return result.rows;
  }

  async delete(id) {
    const query = `
      DELETE FROM ${this.tableName}
      WHERE id = $1
      RETURNING *
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  async updatePartial(id, orderData) {

    const allowedFields = ["status_id"];

    const fields = [];
    const values = [];
    let index = 1;

    for (const [key, value] of Object.entries(orderData)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = $${index}`);
        values.push(value);
        index++;
      }
    }

    if (fields.length === 0) {
      throw new Error("No hay campos válidos para actualizar");
    }

    values.push(id);
    const query = `
      UPDATE ${this.tableName}
      SET ${fields.join(", ")}
      WHERE id = $${index}
      RETURNING *
    `;
    const result = await db.query(query, values);
    return result.rows[0] || null;
  }

  async updateStatus(id, status_id) {
    const query = `
      UPDATE ${this.tableName}
      SET status_id = $1
      WHERE id = $2
      RETURNING *
    `;
    const result = await db.query(query, [status_id, id]);
    return result.rows[0] || null;
  }

  async countForDay() {
    const query = `
      SELECT COUNT(*) AS order_count
      FROM ${this.tableName}
      WHERE DATE(created_at) = CURRENT_DATE
    `;
    const result = await db.query(query);
    return parseInt(result.rows[0].order_count, 10);
  }

  async calculateAndUpdateTotal(orderId) {
    const query = `
      UPDATE ${this.tableName}
      SET total = (
        SELECT COALESCE(SUM(price * quantity), 0)
        FROM yunowdatabase.order_items
        WHERE order_id = $1
      )
      WHERE id = $1
      RETURNING *
    `;
    const result = await db.query(query, [orderId]);
    return result.rows[0] || null;
  }

  async count() {
    const query = `
      SELECT COUNT(*) AS total
      FROM ${this.tableName}
    `;
    const result = await db.query(query);
    return parseInt(result.rows[0].total, 10);
  }

  
  async getByStatus(status_id, limit = 100, offset = 0) {
    const query = `
      SELECT 
        o.id,
        o.total,
        o.created_at,
        c.name AS customer_name,
        a.address_text AS delivery_address,
        pm.display_name AS payment_method,
        s.display_name AS status
      FROM ${this.tableName} o
      JOIN yunowdatabase.customers c ON o.customer_id = c.id
      JOIN yunowdatabase.addresses a ON o.address_id = a.id
      JOIN yunowdatabase.payment_methods pm ON o.payment_method_id = pm.id
      JOIN yunowdatabase.order_statuses s ON o.status_id = s.id
      WHERE o.status_id = $1
      ORDER BY o.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await db.query(query, [status_id, limit, offset]);
    return result.rows;
  }
}

module.exports = new OrdersRepository();
