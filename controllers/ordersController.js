const db = require('../db');

const addOrder = async (req, res) => {
    const { customer_id, address_id, payment_method, status } = req.body;

    if (!customer_id || !address_id || !payment_method) {
        return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }

    try {

        const customerResult = await db.query('SELECT id FROM YuNowDataBase.customers WHERE id = $1', [customer_id]);
        if (customerResult.rows.length === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }

        const addressResult = await db.query('SELECT id FROM YuNowDataBase.addresses WHERE id = $1', [address_id]);
        if (addressResult.rows.length === 0) {
            return res.status(404).json({ error: 'Dirección no encontrada' });
        }

        const result = await db.query(
            'INSERT INTO YuNowDataBase.orders (customer_id, address_id, total, payment_method, status) VALUES ($1, $2, 0, $3, $4) RETURNING *',
            [customer_id, address_id, payment_method, status || 'pending']
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

const updateTotalOrder = async (req,res) =>{
    const { id } = req.params;
    try {
        const totalResult = await db.query(
            `UPDATE YuNowDataBase.orders 
             SET total = (SELECT COALESCE(SUM(price * quantity), 0) FROM YuNowDataBase.order_items WHERE order_id = $1)
             WHERE id = $1
             RETURNING *`,
            [id]
        );

        if (totalResult.rows.length === 0) {
            return res.status(404).json({ error: 'Orden no encontrada' });
        }

        res.json({
            message: 'Total de la orden actualizado exitosamente',
            order: totalResult.rows[0]
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Error al actualizar el total de la orden en la base de datos' });
    }
}

const getOrders = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM YuNowDataBase.orders');
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Error al obtener las órdenes' });
    }
};

const getOrderById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('SELECT * FROM YuNowDataBase.orders WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Orden no encontrada' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Error al obtener la orden' });
    }
}

const getOrderByCustomerId = async (req, res) => {
    const { customer_id } = req.params;
    try {
        const result = await db.query('SELECT * FROM YuNowDataBase.orders WHERE customer_id = $1', [customer_id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Órdenes no encontradas para este cliente' });
        }
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Error al obtener las órdenes del cliente' });
    }
}

const deleteOrder = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('DELETE FROM YuNowDataBase.orders WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Orden no encontrada' });
        }
        res.json({ message: 'Orden eliminada exitosamente', order: result.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Error al eliminar la orden' });
    }
};

const updateOrderPartial = async (req, res) => {
    const { id } = req.params;
    const { customer_id, address_id, total, payment_method, status } = req.body;

    try {
        const existingOrder = await db.query('SELECT * FROM YuNowDataBase.orders WHERE id = $1', [id]);
        if (existingOrder.rows.length === 0) {
            return res.status(404).json({ error: 'Orden no encontrada' });
        }

        const updatedOrder = {
            customer_id: customer_id || existingOrder.rows[0].customer_id,
            address_id: address_id || existingOrder.rows[0].address_id,
            total: total || existingOrder.rows[0].total,
            payment_method: payment_method || existingOrder.rows[0].payment_method,
            status: status || existingOrder.rows[0].status
        };
        const result = await db.query(
            'UPDATE YuNowDataBase.orders SET customer_id = $1, address_id = $2, total = $3, payment_method = $4, status = $5 WHERE id = $6 RETURNING *',
            [updatedOrder.customer_id, updatedOrder.address_id, updatedOrder.total, updatedOrder.payment_method, updatedOrder.status, id]
        );

        res.json({
            message: 'Orden actualizada exitosamente',
            order: result.rows[0]
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Error al actualizar la orden en la base de datos' });
    }
};

const updateStatusOrder = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({ error: 'Falta el estado de la orden' });
    }

    try {
        const existingOrder = await db.query('SELECT * FROM YuNowDataBase.orders WHERE id = $1', [id]);
        if (existingOrder.rows.length === 0) {
            return res.status(404).json({ error: 'Orden no encontrada' });
        }

        const result = await db.query(
            'UPDATE YuNowDataBase.orders SET status = $1 WHERE id = $2 RETURNING *',
            [status, id]
        );

        res.json({
            message: 'Estado de la orden actualizado exitosamente',
            order: result.rows[0]
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Error al actualizar el estado de la orden en la base de datos' });
    }
}

module.exports = {addOrder, getOrders, getOrderByCustomerId, getOrderById, deleteOrder, updateOrderPartial,updateStatusOrder, updateTotalOrder};