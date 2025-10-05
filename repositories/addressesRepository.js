const db = require('../db');
class AddressesRepository {
  async create(addressData) {
    const { customer_id,  label, address_text, reference, latitude, longitude,is_primary } = addressData;
    const result = await db.query(
        'INSERT INTO YuNowDataBase.addresses (customer_id,label, address_text, reference,latitude,longitude,is_primary) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [customer_id, label, address_text, reference, latitude, longitude,is_primary]
    );
    return result.rows[0];
  };

    async getAll(limit) {
        const result = await db.query('SELECT * FROM YuNowDataBase.addresses ORDER BY id ASC LIMIT $1', [limit]);
        return result.rows;
    };

    async getByCustomerId(customer_id) {
        const result = await db.query('SELECT * FROM YuNowDataBase.addresses WHERE customer_id = $1', [customer_id]);
        return result.rows;
    };

    async getPrimaryByCustomerId(customer_id) {
        const result = await db.query('SELECT * FROM YuNowDataBase.addresses WHERE customer_id = $1 AND is_primary = TRUE', [customer_id]);
        return result.rows[0] || null;
    };

    async getById(id) {
        const result = await db.query('SELECT * FROM YuNowDataBase.addresses WHERE id = $1', [id]);
        return result.rows[0] || null;
    }

    async deleteById(id) {
        const result = await db.query('DELETE FROM YuNowDataBase.addresses WHERE id = $1 RETURNING *', [id]);
        return result.rows[0] || null;
    };

    async isPrimaryAddress(id) {
        const result = await db.query('SELECT is_primary FROM YuNowDataBase.addresses WHERE id = $1', [id]);
        return result.rows[0] ? result.rows[0].is_primary : null;
    };

    async unsetPrimaryAddresses(customer_id) {
        await db.query('UPDATE YuNowDataBase.addresses SET is_primary = FALSE WHERE customer_id = $1 AND is_primary = TRUE', [customer_id]);
    };

    async updatePartial(id, addressData) {
        const fields = [];
        const values = [];
        let index = 1;
        for (const [key, value] of Object.entries(addressData)) {
            fields.push(`${key} = $${index}`);
            values.push(value);
            index++;
        }
        values.push(id);
        const result = await db.query(
            `UPDATE YuNowDataBase.addresses SET ${fields.join(', ')} WHERE id = $${index} RETURNING *`,
            values
        );
        return result.rows[0] || null;
    }
}

module.exports = new AddressesRepository();