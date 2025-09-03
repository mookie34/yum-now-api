const pool = require('../db');

const addOrder = async (req, res) => {
    const { customer_id, address_id, total, payment_method, status } = req.body;

    if (!customer_id || !address_id || !total || !payment_method) {
        return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO orders (customer_id, address_id, total, payment_method, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [customer_id, address_id, total, payment_method, status || 'pending']
        );

        res.status(201).json({
            message: 'Orden creada exitosamente',
            order: result.rows[0]
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Error al guardar la orden en la base de datos' });
    }
};

const getOrders = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM orders');
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Error al obtener las órdenes' });
    }
};

module.exports = {addOrder, getOrders};