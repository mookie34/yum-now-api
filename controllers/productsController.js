const pool = require('../db'); // Importa tu pool de conexión a la base de datos

const addProduct = async (req, res) => {
    const { name, description, price } = req.body;

    if (!name || !price) {
        return res.status(400).json({ error: 'Faltan datos: nombre o precio' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO products (name, description, price) VALUES ($1, $2, $3) RETURNING *',
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

module.exports = {addProduct };