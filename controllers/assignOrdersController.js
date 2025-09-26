const pool = require('../db');

const addAssignOrder = async (req, res) => {
    const { order_id, courier_id } = req.body;
    try {

        if (!order_id || !courier_id) {
            return res.status(400).json({ error: 'order_id y courier_id son requeridos.' });
        }

        const existOrder = await pool.query('SELECT * FROM YuNowDataBase.orders WHERE id = $1', [order_id]);
        if (existOrder.rows.length === 0) {
            return res.status(404).json({ error: 'No existe la orden.' });
        }
        const existCourier = await pool.query('SELECT * FROM YuNowDataBase.couriers WHERE id = $1', [courier_id]);
        if (existCourier.rows.length === 0) {
            return res.status(404).json({ error: 'Repartidor no encontrado.' });
        }
        const existAssignment = await pool.query('SELECT * FROM YuNowDataBase.assignment_order WHERE order_id = $1', [order_id]);
        if (existAssignment.rows.length > 0) {
            return res.status(400).json({ error: 'La orden ya ha sido asignada a un repartidor.' });
        }

        const result = await pool.query(
            'INSERT INTO YuNowDataBase.assignment_order (order_id, courier_id) VALUES ($1, $2) RETURNING *',
            [order_id, courier_id]
        );

        res.status(201).json({
            mensaje: 'Orden asignada exitosamente.',
            assignOrder: result.rows[0]
        });
    } catch (error) {
        console.error('Error asignando una orden a un repatidor:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

const getAssignOrders = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                ao.id AS assignment_id,
                ao.assigned_at,
                c.name AS courier_name,
                c.phone AS courier_phone,
                c.license_plate AS courier_license_plate,
                o.id AS order_id,
                o.total,
                o.payment_method,
                o.status
            FROM YuNowDataBase.assignment_order ao
            INNER JOIN YuNowDataBase.couriers c ON ao.courier_id = c.id
            INNER JOIN YuNowDataBase.orders o ON ao.order_id = o.id
            ORDER BY ao.assigned_at DESC
        `);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No hay asignaciones de órdenes disponibles.' });
        }

        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error obteniendo las asignaciones de orden:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}


const getAssignOrderByCourierId = async (req, res) => {
    const { courier_id } = req.params;
    try {
        const existCourier = await pool.query('SELECT * FROM YuNowDataBase.couriers WHERE id = $1', [courier_id]);
        if (existCourier.rows.length === 0) {
            return res.status(404).json({ error: 'Repartidor no encontrado.' });
        }

        const result = await pool.query(`
        SELECT 
            ao.id AS assignment_id,
            ao.assigned_at,
            c.name AS courier_name,
            c.phone AS courier_phone,
            c.license_plate AS courier_license_plate,
            o.id AS order_id,
            o.total,
            o.payment_method,
            o.status
        FROM YuNowDataBase.assignment_order ao
        INNER JOIN YuNowDataBase.couriers c ON ao.courier_id = c.id
        INNER JOIN YuNowDataBase.orders o ON ao.order_id = o.id
        WHERE ao.courier_id = $1
        ORDER BY ao.assigned_at DESC
    `,[courier_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No existe asignacion para este repartidor' });
        }

        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error obteniendo las asignaciones de orden por ID de repartidor:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

const getAssignOrderByOrderId = async (req, res) => {
    const { order_id } = req.params;
    try {
        const existOrder = await pool.query('SELECT * FROM YuNowDataBase.orders WHERE id = $1', [order_id]);
        if (existOrder.rows.length === 0) {
            return res.status(404).json({ error: 'No existe la orden.' });
        }
        const result = await pool.query(`
        SELECT 
            ao.id AS assignment_id,
            ao.assigned_at,
            c.name AS courier_name,
            c.phone AS courier_phone,
            c.license_plate AS courier_license_plate,
            o.id AS order_id,
            o.total,
            o.payment_method,
            o.status
        FROM YuNowDataBase.assignment_order ao
        INNER JOIN YuNowDataBase.couriers c ON ao.courier_id = c.id
        INNER JOIN YuNowDataBase.orders o ON ao.order_id = o.id
        WHERE ao.order_id = $1
        ORDER BY ao.assigned_at DESC
    `,[order_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No existe asignación para esta orden' });
        }

        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error obteniendo las asignaciones de orden por ID de orden:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

const updateAssignOrderCourier = async (req, res) => {
    const { order_id } = req.params;
    const { courier_id } = req.body;
    try {
        const existOrder = await pool.query('SELECT * FROM YuNowDataBase.orders WHERE id = $1', [order_id]);
        if (existOrder.rows.length === 0) {
            return res.status(404).json({ error: 'No existe la orden.' });
        }
        const existCourier = await pool.query('SELECT * FROM YuNowDataBase.couriers WHERE id = $1', [courier_id]);
        if (existCourier.rows.length === 0) {
            return res.status(404).json({ error: 'Repartidor no encontrado.' });
        }
        const result = await pool.query(
            'UPDATE YuNowDataBase.assignment_order SET courier_id = $1 WHERE order_id = $2 RETURNING *',
            [courier_id, order_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No existe asignación para esta orden' });
        }

        res.status(200).json({
            mensaje: 'Asignación de orden actualizada exitosamente.',
            assignOrder: result.rows[0]
        });
    } catch (error) {
        console.error('Error actualizando la asignación de orden:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

const deleteAssignOrder = async (req, res) => {
    const { order_id } = req.params;
    try {
        const existOrder = await pool.query('SELECT * FROM YuNowDataBase.orders WHERE id = $1', [order_id]);
        if (existOrder.rows.length === 0) {
            return res.status(404).json({ error: 'No existe la orden.' });
        }
        
        const result = await pool.query(
            'DELETE FROM YuNowDataBase.assignment_order WHERE order_id = $1 RETURNING *',
            [order_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Asignamiento no encontrado.' });
        }

        res.status(200).json({
            mensaje: 'Asignación de orden eliminada exitosamente',
            assignOrder: result.rows[0]
        });
    } catch (error) {
        console.error('Error eliminando la asignación de orden:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = {addAssignOrder, getAssignOrders, getAssignOrderByCourierId, getAssignOrderByOrderId,updateAssignOrderCourier,deleteAssignOrder};
