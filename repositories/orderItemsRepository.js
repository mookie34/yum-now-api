const db = require("../db");

class OrderItemsRepository {
  constructor() {
    this.tableName = "yunowdatabase.order_items";
  }

  async create(orderItemData) {
    const { order_id, product_id, quantity, price } = orderItemData;
    const query = `
      INSERT INTO ${this.tableName} (order_id, product_id, quantity, price) 
      VALUES ($1, $2, $3, $4)
        RETURNING *
    `;
    const result = await db.query(query, [
      order_id,
      product_id,
      quantity,
      price,
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

  async getByOrderId(order_id) {
    const query = `
      SELECT * FROM ${this.tableName} 
      WHERE order_id = $1
    `;
    const result = await db.query(query, [order_id]);
    return result.rows;
  }

  async deleteByOrderId(order_id) {
    const query = `
      DELETE FROM ${this.tableName} 
      WHERE order_id = $1
        RETURNING *
    `;
    const result = await db.query(query, [order_id]);
    return result.rows;
  }

  async deleteByOrderIdAndProductId(order_id, product_id) {
    const query = `
      DELETE FROM ${this.tableName} 
      WHERE order_id = $1 AND product_id = $2
        RETURNING *
    `;
    const result = await db.query(query, [order_id, product_id]);
    return result.rows;
  }

  async updateQuantityOrPrice(order_id, product_id, quantity, price) {
    let query = `UPDATE ${this.tableName} SET `;
    const values = [];
    let index = 1;

    if (quantity !== undefined) {
      query += `quantity = $${index++}, `;
      values.push(quantity);
    }
    if (price !== undefined) {
      query += `price = $${index++}, `;
      values.push(price);
    }

    query = query.slice(0, -2);
    query += ` WHERE order_id = $${index++} AND product_id = $${index++} RETURNING *`;
    values.push(order_id, product_id);

    const result = await db.query(query, values);
    return result.rows[0];
  }
}

module.exports = new OrderItemsRepository();
