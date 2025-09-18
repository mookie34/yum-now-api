const pool = require('../db');

const addOrderItem = async (req, res) => {
    const { order_id, product_id, quantity, price } = req.body;

    if (!order_id || !product_id || !quantity || !price) {
        return res.status(400).json({ error: 'Faltan datos: order_id, product_id, quantity o price' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4) RETURNING *',
            [order_id, product_id, quantity, price]
        );

        res.status(201).json({
            message: 'Item de orden creado exitosamente',
            orderItem: result.rows[0]
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Error al guardar el item de orden en la base de datos' });
    }
}

module.exports = {addOrderItem};