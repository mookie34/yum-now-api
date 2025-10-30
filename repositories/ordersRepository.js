const db = require("../db");

class OrdersRepository {
  constructor() {
    this.tableName = "YuNowDataBase.orders";
  }

  async create(ordersData) {
    const {
      customer_id,
      address_id,
      total = 0,
      payment_method,
      status,
    } = ordersData;
    const query = `
      INSERT INTO ${this.tableName} (customer_id, address_id, total, payment_method, status) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING *
    `;
    const result = await db.query(query, [
      customer_id,
      address_id,
      total,
      payment_method,
      status,
    ]);
    return result.rows[0];
  }

  async getAll(limit = 100, offset = 0) {
    const query = `
      SELECT * FROM ${this.tableName} 
      ORDER BY id ASC 
      LIMIT $1 OFFSET $2
    `;
    const result = await db.query(query, [limit, offset]);
    return result.rows;
  }

  async getById(id) {
    const query = `
      SELECT * FROM ${this.tableName} 
      WHERE id = $1
    `;
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  async getByCustomerId(customer_id) {
    const query = `
      SELECT * FROM ${this.tableName} 
      WHERE customer_id = $1
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

  async updatePartial(id, ordersData) {
    const allowedFields = [
      "customer_id",
      "address_id",
      "total",
      "payment_method",
      "status",
    ];
    const fields = [];
    const values = [];
    let index = 1;

    for (const [key, value] of Object.entries(ordersData)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = $${index}`); // ✅ CORREGIDO: Agregado paréntesis
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

  async updateStatus(id, status) {
    const query = `
      UPDATE ${this.tableName} 
      SET status = $1 
      WHERE id = $2 
      RETURNING *
    `;
    const result = await db.query(query, [status, id]);
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
        FROM YuNowDataBase.order_items 
        WHERE order_id = $1
      )
      WHERE id = $1
      RETURNING *
    `;
    const result = await db.query(query, [orderId]);
    return result.rows[0] || null;
  }
}

module.exports = new OrdersRepository();
