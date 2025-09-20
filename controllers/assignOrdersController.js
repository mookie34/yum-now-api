const pool = require('../db');

const addAssignOrder = async (req, res) => {
    const { order_id, courier_id } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO assignment_order (order_id, courier_id) VALUES ($1, $2) RETURNING *',
            [order_id, courier_id]
        );

        res.status(201).json({
            mensaje: 'orden asignada exitosamente',
            cliente: result.rows[0]
        });
    } catch (error) {
        console.error('Error asignando una orden a un repatidor:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

const getAssignOrders = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM assignment_order');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error obteniendo las asignaciones de orden:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

const getAssignOrderByCourierId = async (req, res) => {
    const { courier_id } = req.params;
    try {
        const result = await pool.query(
            'SELECT * FROM assignment_order WHERE courier_id = $1',
            [courier_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No assignments found for this courier' });
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
        const result = await pool.query(
            'SELECT * FROM assignment_order WHERE order_id = $1',
            [order_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No assignments found for this order' });
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
        const result = await pool.query(
            'UPDATE assignment_order SET courier_id = $1 WHERE order_id = $2 RETURNING *',
            [courier_id, order_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Assignment not found' });
        }

        res.status(200).json({
            mensaje: 'Asignación de orden actualizada exitosamente',
            assignment: result.rows[0]
        });
    } catch (error) {
        console.error('Error actualizando la asignación de orden:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

const deleteAssignOrder = async (req, res) => {
    const { order_id } = req.params;
    try {
        const result = await pool.query(
            'DELETE FROM assignment_order WHERE order_id = $1 RETURNING *',
            [order_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Assignment not found' });
        }

        res.status(200).json({
            mensaje: 'Asignación de orden eliminada exitosamente',
            assignment: result.rows[0]
        });
    } catch (error) {
        console.error('Error eliminando la asignación de orden:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = {addAssignOrder, getAssignOrders, getAssignOrderByCourierId, getAssignOrderByOrderId,updateAssignOrderCourier,deleteAssignOrder};
