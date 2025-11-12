const db = require("../db");

class CouriersRepository {
  constructor() {
    this.tableName = "YuNowDataBase.couriers";
  }

  async create(courierData) {
    const { name, phone, vehicle, license_plate, available } = courierData;
    const result = await db.query(
      `INSERT INTO ${this.tableName} (name, phone, vehicle, available, license_plate) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, phone, vehicle, available, license_plate]
    );
    return result.rows[0];
  }

  async getAll(limit = 100, offset = 0) {

    const query = `SELECT * FROM ${this.tableName} ORDER BY id ASC LIMIT $1 OFFSET $2`;
    const result = await db.query(query, [limit, offset]);
    return result.rows;
  }


  async getAvailable() {
    const result = await db.query(
      `SELECT * FROM ${this.tableName} WHERE available = true ORDER BY id ASC`
    );
    return result.rows;
  }

  async getForFilter(filters) {
    const { name, phone, license_plate } = filters;
    const params = [];
    let query = `SELECT * FROM ${this.tableName} WHERE 1=1`;

    if (name) {
      params.push(`%${name}%`);
      query += ` AND name ILIKE $${params.length}`;
    }
    if (phone) {
      params.push(`%${phone}%`);
      query += ` AND phone ILIKE $${params.length}`;
    }
    if (license_plate) {
      params.push(`%${license_plate}%`);
      query += ` AND license_plate ILIKE $${params.length}`;
    }

    const result = await db.query(query, params);
    return result.rows;
  }

  async delete(id) {
    const result = await db.query(
      `DELETE FROM ${this.tableName} WHERE id = $1 RETURNING *`,
      [id]
    );
    return result.rows[0];
  }

  async update(id, courierData) {
    const { name, phone, vehicle, license_plate, available } = courierData;
    const result = await db.query(
      `UPDATE ${this.tableName} SET name = $1, phone = $2, vehicle = $3, license_plate = $4, available = $5 WHERE id = $6 RETURNING *`,
      [name, phone, vehicle, license_plate, available, id]
    );
    return result.rows[0];
  }

  async updateCourierPartial(id, courierData) {
    const { name, phone, vehicle, license_plate, available } = courierData;
    const fields = [];
    const values = [];
    let counter = 1;

    if (name) {
      fields.push(`name=$${counter++}`);
      values.push(name);
    }
    if (phone) {
      fields.push(`phone=$${counter++}`);
      values.push(phone);
    }
    if (vehicle) {
      fields.push(`vehicle=$${counter++}`);
      values.push(vehicle);
    }
    if (license_plate) {
      fields.push(`license_plate=$${counter++}`);
      values.push(license_plate);
    }
    if (available !== undefined) {
      fields.push(`available=$${counter++}`);
      values.push(available);
    }

    if (fields.length === 0) {
      return null;
    }

    values.push(id);
    const query = `UPDATE ${this.tableName} SET ${fields.join(
      ", "
    )} WHERE id=$${counter} RETURNING *`;
    const result = await db.query(query, values);
    return result.rows[0];
  }
}

module.exports = new CouriersRepository();