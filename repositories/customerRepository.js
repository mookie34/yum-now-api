const db = require('../db');
class CustomerRepository {
    async create(customerData) {
        const { name, email, phone } = customerData;
        const result = await db.query(
              'INSERT INTO YuNowDataBase.customers (name, phone, email) VALUES ($1, $2, $3) RETURNING *',
              [name, phone, email]
            );
        return result.rows[0];
    };

    async getAll(limit) {
        const result = await db.query(
            'SELECT id, name, phone, email, created_at FROM YuNowDataBase.customers ORDER BY created_at DESC LIMIT $1',
            [limit]
        );
        return result.rows;
    };

    async getByPhone(phone) {
        const result = await db.query(
              'SELECT id, name, phone, email, created_at FROM YuNowDataBase.customers WHERE phone  like $1',
              [phone]
            );

        return result.rows[0];
    };

    async getById(id) {
        const result = await db.query(
              'SELECT id, name, phone, email, created_at FROM YuNowDataBase.customers WHERE id = $1',
              [id]
            );

        return result.rows[0];
    };

    async update(id, customerData) {
        const { name, email, phone } = customerData;
        const emailValue = email && email !== '' 
          ? email
          : null;

        const result = await db.query(
          'UPDATE YuNowDataBase.customers SET name = $1, phone = $2, email = $3 WHERE id = $4 RETURNING *',
          [name, phone, emailValue,id]
        );
        return result.rows[0];
    };

    async updatePartial(id, customerData) {
        const fields = [];
        const values = [];
        let index = 1;
        for (const [key, value] of Object.entries(customerData)) {
            fields.push(`${key} = $${index}`);
            values.push(value);
            index++;
        }
        values.push(id);

        const result = await db.query(
          `UPDATE YuNowDataBase.customers SET ${fields.join(', ')} WHERE id = $${index} RETURNING *`,
          values
        );
        return result.rows[0];
    };

    async deleteById(id) {
        const result = await db.query(
            'DELETE FROM YuNowDataBase.customers WHERE id = $1 RETURNING *', 
            [id]
        );
        return result.rows[0];
    }
}

module.exports = new CustomerRepository();