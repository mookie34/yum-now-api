const db = require("../db");
class OrdersRepository {
  async create(ordersData) {
    const { customer_id, address_id, payment_method, status } = ordersData;
    const result = await db.query(
      "INSERT INTO YuNowDataBase.orders (customer_id, address_id, total, payment_method, status) VALUES ($1, $2, 0, $3, $4) RETURNING *",
      [customer_id, address_id, payment_method, status || "pending"]
    );
    return result.rows[0];
  };

  async getAll(limit) {
    const result = await db.query(
      "SELECT id,customer_id,address_id,total,payment_method,status,created_at FROM YuNowDataBase.orders ORDER BY id ASC LIMIT $1",
      [limit]
    );
    return result.rows;
  };
}

module.exports = new OrdersRepository();
