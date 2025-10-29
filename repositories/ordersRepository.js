const db = require("../db");
class OrdersRepository {

  constructor() {
    this.tableName = "YuNowDataBase.orders";
  }

  async create(ordersData) {
    const { customer_id, address_id, total = 0, payment_method, status } = ordersData;

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
  };

  async getAll(limit=100, offset = 0) {
    const query = `
            SELECT * FROM ${this.tableName} 
            ORDER BY id ASC 
            LIMIT $1 OFFSET $2
        `;
    const result = await db.query(query, [limit, offset]);
    return result.rows;
  };

  async getById(id) {
    const query = `
            SELECT * FROM ${this.tableName} 
            WHERE id = $1
        `;
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  };

  async getByCustomerId(customer_id) {
    const query = `
            SELECT * FROM ${this.tableName} 
            WHERE customer_id = $1
        `;
    const result = await db.query(query, [customer_id]);
    return result.rows;
  };

  async delete(id) {
    const query = `
            DELETE FROM ${this.tableName} 
            WHERE id = $1
            RETURNING *
        `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  };

  async updatePartial(id, ordersData) {
    const fields = [];
    const values = [];
    let index = 1;
    for (const [key, value] of Object.entries(ordersData)) {
      fields.push(`${key} = $${index}`);
      values.push(value);
      index++;
    }
    values.push(id);

    const query = `
            UPDATE ${this.tableName} 
            SET ${fields.join(', ')} 
            WHERE id = $${index} 
            RETURNING *
        `;
    const result = await db.query(query, values);
    return result.rows[0] || null;
  };

  async updateStatus(id, status) {
    const query = `
            UPDATE ${this.tableName} 
            SET status = $1 
            WHERE id = $2 
            RETURNING *
        `;
    const result = await db.query(query, [status, id]);
    return result.rows[0] || null;
  };

  async countForDay() {
    const query = `
            SELECT COUNT(*) AS order_count 
            FROM ${this.tableName} 
            WHERE DATE(created_at) = CURRENT_DATE
        `;
    const result = await db.query(query);
    return parseInt(result.rows[0].order_count, 10);
  };

  async updateTotal(id, total) {
    const query = `
            UPDATE ${this.tableName} 
            SET total = $1 
            WHERE id = $2 
            RETURNING *
        `;
    const result = await db.query(query, [total, id]);
    return result.rows[0] || null;
  };
}

module.exports = new OrdersRepository();
