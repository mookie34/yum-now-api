const db = require("../db");

class CustomerPreferencesRepository {
  constructor() {
    this.tableName = "yunowdatabase.customer_preferences";
    this.customersTable = "yunowdatabase.customers";
  }

  async findCustomerById(customerId) {
    const result = await db.query(
      `SELECT id FROM ${this.customersTable} WHERE id = $1`,
      [customerId]
    );
    return result.rows[0] || null;
  }

  async create(preferenceData) {
    const { customer_id, preference_key, preference_value } = preferenceData;
    const result = await db.query(
      `INSERT INTO ${this.tableName} (customer_id, preference_key, preference_value) VALUES ($1, $2, $3) RETURNING *`,
      [customer_id, preference_key, preference_value]
    );
    return result.rows[0];
  }

  async findByCustomerId(customerId) {
    const result = await db.query(
      `SELECT * FROM ${this.tableName} WHERE customer_id = $1 ORDER BY id ASC`,
      [customerId]
    );
    return result.rows;
  }

  async findByCustomerIdAndKey(customerId, preferenceKey) {
    const result = await db.query(
      `SELECT * FROM ${this.tableName} WHERE customer_id = $1 AND preference_key = $2`,
      [customerId, preferenceKey]
    );
    return result.rows[0] || null;
  }

  async updateByCustomerIdAndKey(customerId, preferenceKey, preferenceValue) {
    const result = await db.query(
      `UPDATE ${this.tableName} SET preference_value = $1, updated_at = now() WHERE customer_id = $2 AND preference_key = $3 RETURNING *`,
      [preferenceValue, customerId, preferenceKey]
    );
    return result.rows[0] || null;
  }

  async deleteByCustomerIdAndKey(customerId, preferenceKey) {
    const result = await db.query(
      `DELETE FROM ${this.tableName} WHERE customer_id = $1 AND preference_key = $2 RETURNING *`,
      [customerId, preferenceKey]
    );
    return result.rows[0] || null;
  }

  async deleteAllByCustomerId(customerId) {
    const result = await db.query(
      `DELETE FROM ${this.tableName} WHERE customer_id = $1 RETURNING *`,
      [customerId]
    );
    return result.rows;
  }
}

module.exports = new CustomerPreferencesRepository();
