const db = require('../db'); // Importa tu db de conexión a la base de datos

const addProduct = async (req, res) => {
    const { name, description, price } = req.body;

    if (!name || !price) {
        return res.status(400).json({ error: 'Faltan datos: nombre o precio' });
    }

    try {
        const result = await db.query(
            'INSERT INTO YuNowDataBase.products (name, description, price) VALUES ($1, $2, $3) RETURNING *',
            [name, description, price]
        );

        res.status(201).json({
            message: 'Producto creado exitosamente',
            product: result.rows[0]
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Error al guardar el producto en la base de datos' });
    }
};

const getProducts = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM YuNowDataBase.products ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Error al obtener los productos' });
    }
};

const getProductForFilter = async (req, res) => {
    try {
        const { name, min_price, max_price } = req.query;
        const params = [];
        let query = 'SELECT * FROM YuNowDataBase.products WHERE 1=1';

        if (name) {
            params.push(`%${name}%`); // agrega los %
            query += ` AND name ILIKE $${params.length}`;
        }
        if (min_price) {
            params.push(min_price);
            query += ` AND price >= $${params.length}`;
        }
        if (max_price) {
            params.push(max_price);
            query += ` AND price <= $${params.length}`;
        }

        const result = await db.query(query, params);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No se encontraron productos con los filtros proporcionados' });
        }

        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Error al obtener los productos con filtros' });
    }
}

const getProductById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('SELECT * FROM YuNowDataBase.products WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Error al obtener el producto' });
    }
}

const deleteProduct = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('DELETE FROM YuNowDataBase.products WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        res.json({ message: 'Producto eliminado exitosamente', product: result.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Error al eliminar el producto' });
    }
};

const updateProduct = async (req, res) => {
    const { id } = req.params;
    const { name, description, price } = req.body;

    if (!name || !price) {
        return res.status(400).json({ error: 'Faltan datos: nombre o precio' });
    }

    try {
        const result = await db.query(
            'UPDATE YuNowDataBase.products SET name = $1, description = $2, price = $3 WHERE id = $4 RETURNING *',
            [name, description, price, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        res.json({
            message: 'Producto actualizado exitosamente',
            product: result.rows[0]
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Error al actualizar el producto en la base de datos' });
    }
};

const updateProductPartial = async (req, res) => {
    const { id } = req.params;
    const { name, description, price } = req.body;

    try {
        const fields = [];
        const values = [];
        let query = 'UPDATE YuNowDataBase.products SET ';
        let count = 1;

        if (name) {
            fields.push(`name = $${count}`);
            values.push(name);
            count++;
        }
        if (description) {
            fields.push(`description = $${count}`);
            values.push(description);
            count++;
        }
        if (price) {
            fields.push(`price = $${count}`);
            values.push(price);
            count++;
        }

        if (fields.length === 0) {
            return res.status(400).json({ error: 'No se proporcionaron campos para actualizar' });
        }

        query += fields.join(', ') + ` WHERE id = $${count} RETURNING *`;
        values.push(id);

        const result = await db.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        res.json({
            message: 'Producto actualizado exitosamente',
            product: result.rows[0]
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Error al actualizar el producto en la base de datos.' });
    }
};

module.exports = {addProduct, getProducts,getProductById, getProductForFilter, deleteProduct, updateProduct, updateProductPartial};