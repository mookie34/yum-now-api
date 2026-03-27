const db = require("../db");

class PaymentsRepository {
  constructor() {
    this.tableName = "yunowdatabase.payments";
  }

  async create(paymentData) {
    const {
      order_id,
      receipt_image_url = null,
      amount_reported = null,
      cash_given = null,
      change_due = null,
    } = paymentData;

    const query = `
      INSERT INTO ${this.tableName}
      (order_id, receipt_image_url, amount_reported, cash_given, change_due)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const result = await db.query(query, [
      order_id,
      receipt_image_url,
      amount_reported,
      cash_given,
      change_due,
    ]);

    return result.rows[0];
  }

  async getByOrderId(orderId) {
    const query = `
      SELECT
        p.*,
        o.total AS order_total,
        pm.display_name AS payment_method,
        pm.name AS payment_method_code
      FROM ${this.tableName} p
      JOIN yunowdatabase.orders o ON p.order_id = o.id
      JOIN yunowdatabase.payment_methods pm ON o.payment_method_id = pm.id
      WHERE p.order_id = $1
    `;
    const result = await db.query(query, [orderId]);
    return result.rows[0] || null;
  }

  async getByStatus(status, limit = 100, offset = 0) {
    const query = `
      SELECT
        p.*,
        o.total AS order_total,
        c.name AS customer_name,
        pm.display_name AS payment_method
      FROM ${this.tableName} p
      JOIN yunowdatabase.orders o ON p.order_id = o.id
      JOIN yunowdatabase.customers c ON o.customer_id = c.id
      JOIN yunowdatabase.payment_methods pm ON o.payment_method_id = pm.id
      WHERE p.status = $1
      ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await db.query(query, [status, limit, offset]);
    return result.rows;
  }

  async getAll(limit = 100, offset = 0) {
    const query = `
      SELECT
        p.*,
        o.total AS order_total,
        c.name AS customer_name,
        pm.display_name AS payment_method
      FROM ${this.tableName} p
      JOIN yunowdatabase.orders o ON p.order_id = o.id
      JOIN yunowdatabase.customers c ON o.customer_id = c.id
      JOIN yunowdatabase.payment_methods pm ON o.payment_method_id = pm.id
      ORDER BY p.created_at DESC
      LIMIT $1 OFFSET $2
    `;
    const result = await db.query(query, [limit, offset]);
    return result.rows;
  }

  async verify(orderId, verifyData) {
    const { verified_by, status, admin_notes = null } = verifyData;

    const query = `
      UPDATE ${this.tableName}
      SET status = $1, verified_by = $2, admin_notes = $3, verified_at = NOW()
      WHERE order_id = $4
      RETURNING *
    `;
    const result = await db.query(query, [
      status,
      verified_by,
      admin_notes,
      orderId,
    ]);
    return result.rows[0] || null;
  }

  async updateReceiptImage(orderId, receiptImageUrl) {
    const query = `
      UPDATE ${this.tableName}
      SET receipt_image_url = $1
      WHERE order_id = $2
      RETURNING *
    `;
    const result = await db.query(query, [receiptImageUrl, orderId]);
    return result.rows[0] || null;
  }

  async updateAmountReported(orderId, amountReported) {
    const query = `
      UPDATE ${this.tableName}
      SET amount_reported = $1
      WHERE order_id = $2
      RETURNING *
    `;
    const result = await db.query(query, [amountReported, orderId]);
    return result.rows[0] || null;
  }

  async checkOrderExists(orderId) {
    const result = await db.query(
      "SELECT id FROM yunowdatabase.orders WHERE id = $1",
      [orderId]
    );
    return result.rows.length > 0;
  }

  async getOrderWithPaymentMethod(orderId) {
    const query = `
      SELECT
        o.id, o.total, o.payment_method_id,
        pm.name AS payment_method_code
      FROM yunowdatabase.orders o
      JOIN yunowdatabase.payment_methods pm ON o.payment_method_id = pm.id
      WHERE o.id = $1
    `;
    const result = await db.query(query, [orderId]);
    return result.rows[0] || null;
  }
}

module.exports = new PaymentsRepository();
