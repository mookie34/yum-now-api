const db = require('../db');
class ProductRepository{
    constructor() {
        this.tableName = 'YuNowDataBase.products';
    }

    async create(productData){
        const { name, description, price, is_active = false } = productData;
        
        const query = `
            INSERT INTO ${this.tableName} (name, description, price, is_active) 
            VALUES ($1, $2, $3, $4) 
            RETURNING *
        `;

        const result = await db.query(query, [name, description, price, is_active]);
        return result.rows[0];
    };

    async getAll(limit=100, offset = 0){
                const query = `
            SELECT * FROM ${this.tableName} 
            ORDER BY id ASC 
            LIMIT $1 OFFSET $2
        `;

        const result = await db.query(query, [limit, offset]);
        return result.rows;
    };

    async findByName(name) {
        const query = `
            SELECT * FROM ${this.tableName} 
            WHERE LOWER(name) = LOWER($1)
        `;
        const result = await db.query(query, [name]);
        return result.rows[0] || null;
    }

    async findByFilters(filters) {
        const { name, min_price, max_price, is_active } = filters;
        const params = [];
        let query = `SELECT * FROM ${this.tableName} WHERE 1=1`;

        if (name) {
            params.push(`%${name}%`);
            query += ` AND name ILIKE $${params.length}`;
        }
        
        if (min_price !== undefined) {
            params.push(min_price);
            query += ` AND price >= $${params.length}`;
        }
        
        if (max_price !== undefined) {
            params.push(max_price);
            query += ` AND price <= $${params.length}`;
        }

        if (is_active !== undefined) {
            params.push(is_active);
            query += ` AND is_active = $${params.length}`;
        }

        query += ' ORDER BY id ASC';
        
        const result = await db.query(query, params);
        return result.rows;
    }

    async getById(id){
        const query = `SELECT * FROM ${this.tableName} WHERE id = $1`;
        const result = await db.query(query, [id]);
        return result.rows[0] || null;
    };

    async softDelete(id) {
        const query = `
            UPDATE ${this.tableName} 
            SET is_active = false 
            WHERE id = $1 
            RETURNING *
        `;
        const result = await db.query(query, [id]);
        return result.rows[0] || null;
    };

    async hardDelete(id) {
        const query = `DELETE FROM ${this.tableName} WHERE id = $1 RETURNING *`;
        const result = await db.query(query, [id]);
        return result.rows[0] || null;
    };

    async update(id,productData){
        const { name, description, price, is_active } = productData;
        const query = `
            UPDATE ${this.tableName} 
            SET name = $1, description = $2, price = $3 , is_active = $4
            WHERE id = $5
            RETURNING *
        `;

        const result = await db.query(query, [name, description, price,is_active, id]);
        return result.rows[0] || null;
    };


     async updatePartial(id, updates) {
        const fields = [];
        const values = [];
        let paramCount = 1;

        // Construir query dinámicamente
        if (updates.name !== undefined) {
            fields.push(`name = $${paramCount}`);
            values.push(updates.name);
            paramCount++;
        }
        
        if (updates.description !== undefined) {
            fields.push(`description = $${paramCount}`);
            values.push(updates.description);
            paramCount++;
        }
        
        if (updates.price !== undefined) {
            fields.push(`price = $${paramCount}`);
            values.push(updates.price);
            paramCount++;
        }

        if (updates.is_active !== undefined) {
            fields.push(`is_active = $${paramCount}`);
            values.push(updates.is_active);
            paramCount++;
        }

        if (fields.length === 0) {
            return null;
        }

        const query = `
            UPDATE ${this.tableName} 
            SET ${fields.join(', ')} 
            WHERE id = $${paramCount} 
            RETURNING *
        `;
        
        values.push(id);
        
        const result = await db.query(query, values);
        return result.rows[0] || null;
    };

    async exists(id) {
        const query = `SELECT EXISTS(SELECT 1 FROM ${this.tableName} WHERE id = $1)`;
        const result = await db.query(query, [id]);
        return result.rows[0].exists;
    };

    async count() {
        const query = `SELECT COUNT(*) FROM ${this.tableName}`;
        const result = await db.query(query);
        return parseInt(result.rows[0].count);
    };
}

module.exports = new ProductRepository();