const pool = require('../db');

const createCustomerPreference = async (req, res) => {
    const { customer_id, preference_key, preference_value } = req.body;
    try {
        if (!customer_id || !preference_key || !preference_value) {
            return res.status(500).json({ message: 'Debe proporcionar customer_id, preference_key y preference_value' });
        }

        const customerCheck = await pool.query('SELECT * FROM customers WHERE id = $1', [customer_id]);
        if (customerCheck.rows.length === 0) {
            return res.status(404).json({ message: 'No existe un cliente con el customer_id proporcionado' });
        }

        const result = await pool.query(
            'INSERT INTO customer_preferences (customer_id, preference_key, preference_value) VALUES ($1, $2, $3) RETURNING *',
            [customer_id, preference_key, preference_value]
        );
        res.status(201).json({ message: 'Preferencia creada exitosamente', preferencia: result.rows[0] });
    } catch (error) {
        console.error('Error creando preferencia de cliente:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

const getCustomerPreferences = async (req, res) => {
    const { customer_id } = req.params;
    try {
        const customerCheck = await pool.query('SELECT * FROM customers WHERE id = $1', [customer_id]);
        if (customerCheck.rows.length === 0) {
            return res.status(404).json({ message: 'No existe un cliente con el customer_id proporcionado' });
        }

        const result = await pool.query('SELECT * FROM customer_preferences WHERE customer_id = $1', [customer_id]);
        if (result.rows.length === 0) {
            return res.status(200).json({ message: 'No se encontraron preferencias para este cliente.',  data: [] });
        }

        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error obteniendo preferencias de cliente:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

const getCustomerEspecificPreference = async (req, res) => {
    const { customer_id, preference_key } = req.params;
    try {
        const customerCheck = await pool.query('SELECT * FROM customers WHERE id = $1', [customer_id]);
        if (customerCheck.rows.length === 0) {
            return res.status(404).json({ message: 'No existe un cliente con el customer_id proporcionado' });
        }

        const result = await pool.query(
            'SELECT * FROM customer_preferences WHERE customer_id = $1 AND preference_key = $2',
            [customer_id, preference_key]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'No se encontró la preferencia especificada para este cliente.' });
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error obteniendo preferencia específica de cliente:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

const updateCustomerPreference = async (req, res) => {
    const { customer_id, preference_key, preference_value } = req.body;
    try {
        if (!customer_id || !preference_key || !preference_value) {
            return res.status(500).json({ message: 'Debe proporcionar customer_id, preference_key y preference_value' });
        }

        const customerCheck = await pool.query('SELECT * FROM customers WHERE id = $1', [customer_id]);
        if (customerCheck.rows.length === 0) {
            return res.status(404).json({ message: 'No existe un cliente con el customer_id proporcionado' });
        }

        const preferenceCheck = await pool.query(
            'SELECT * FROM customer_preferences WHERE customer_id = $1 AND preference_key = $2',
            [customer_id, preference_key]
        );
        if (preferenceCheck.rows.length === 0) {
            return res.status(404).json({ message: 'No se encontró la preferencia especificada para este cliente.' });
        }

        const result = await pool.query(
            'UPDATE customer_preferences SET preference_value = $1 WHERE customer_id = $2 AND preference_key = $3 RETURNING *',
            [preference_value, customer_id, preference_key]
        );
        res.status(200).json({ message: 'Preferencia actualizada exitosamente.', preferencia: result.rows[0] });
    } catch (error) {
        console.error('Error actualizando preferencia de cliente:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

const deleteCustomerPreference = async (req, res) => {
    const { customer_id, preference_key } = req.params;
    try {
        const customerCheck = await pool.query('SELECT * FROM customers WHERE id = $1', [customer_id]);
        if (customerCheck.rows.length === 0) {
            return res.status(404).json({ message: 'No existe un cliente con el customer_id proporcionado' });
        }

        const preferenceCheck = await pool.query(
            'SELECT * FROM customer_preferences WHERE customer_id = $1 AND preference_key = $2',
            [customer_id, preference_key]
        );
        if (preferenceCheck.rows.length === 0) {
            return res.status(404).json({ message: 'No se encontró la preferencia especificada para este cliente.' });
        }

        await pool.query(
            'DELETE FROM customer_preferences WHERE customer_id = $1 AND preference_key = $2',
            [customer_id, preference_key]
        );
        res.status(200).json({ message: 'Preferencia eliminada exitosamente.' });
    } catch (error) {
        console.error('Error eliminando preferencia de cliente:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
}

const deleteAllCustomerPreferences = async (req,res) => {
    const { customer_id } = req.params;
    try {
        const customerCheck = await pool.query('SELECT * FROM customers WHERE id = $1', [customer_id]);
        if (customerCheck.rows.length === 0) {
            return res.status(404).json({ message: 'No existe un cliente con el customer_id proporcionado' });
        }

        const preferencesCheck = await pool.query(
            'SELECT * FROM customer_preferences WHERE customer_id = $1',
            [customer_id]
        );
        if (preferencesCheck.rows.length === 0) {
            return res.status(404).json({ message: 'No se encontraron preferencias para este cliente.' });
        }

        await pool.query(
            'DELETE FROM customer_preferences WHERE customer_id = $1',
            [customer_id]
        );
        res.status(200).json({ message: 'Todas las preferencias del cliente fueron eliminadas exitosamente.' });
    } catch (error) {
        console.error('Error eliminando todas las preferencias de cliente:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
}

module.exports = { createCustomerPreference, getCustomerPreferences, getCustomerEspecificPreference, updateCustomerPreference, deleteCustomerPreference, deleteAllCustomerPreferences };