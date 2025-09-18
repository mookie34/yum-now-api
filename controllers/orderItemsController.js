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

const getAllOrderItems = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM order_items');
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Error al obtener los items de orden desde la base de datos' });
    }
}

const getOrderItemByOrderId = async (req, res) => {
    const { orderId } = req.params;

    try {
        const result = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [orderId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No se encontraron items de orden para el ID de orden proporcionado' });
        }
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Error al obtener los items de orden desde la base de datos' });
    }
}

module.exports = {addOrderItem, getAllOrderItems, getOrderItemByOrderId};