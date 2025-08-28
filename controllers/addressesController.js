const pool = require('../db');

const addAddress = async (req, res) => {
    const { customer_id,  label, address_text, reference, latitude, longitude } = req.body;
    if (!customer_id || !label || !address_text) {
        return res.status(400).json({ error: 'Faltan datos: customer_id, label o address_text' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO addresses (customer_id,label, address_text, reference,latitude,longitude) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [customer_id, label, address_text, reference, latitude, longitude]
        );

        res.status(201).json({
            message: 'Dirección creada exitosamente',
            address: result.rows[0]
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Error al guardar la dirección en la base de datos' });
    }

};

const getAddresses = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM addresses ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Error al obtener las direcciones' });
    }
};

const getAddressByCustomerId = async (req, res) => {
    const { customer_id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM addresses WHERE customer_id = $1', [customer_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No se encontraron direcciones asociadas al cliente.' });
        }

        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Error al obtener las direcciones del cliente' });
    }
}

const deleteAddress = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM addresses WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Dirección no encontrada' });
        }

        res.json({ message: 'Dirección eliminada exitosamente', address: result.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Error al eliminar la dirección' });
    }
};

const updateAddressPartial = async (req, res) => {
    const { id } = req.params;
    const {  label, address_text, reference, latitude, longitude } = req.body;

    // Construir la consulta dinámicamente
    let query = 'UPDATE addresses SET ';
    const params = [];
    let paramIndex = 1;

    if (label) {
        query += `label = $${paramIndex}, `;
        params.push(label);
        paramIndex++;
    }
    if (address_text) {
        query += `address_text = $${paramIndex}, `;
        params.push(address_text);
        paramIndex++;
    }
    if (reference) {
        query += `reference = $${paramIndex}, `;
        params.push(reference);
        paramIndex++;
    }
    if (latitude) {
        query += `latitude = $${paramIndex}, `;
        params.push(latitude);
        paramIndex++;
    }
    if (longitude) {
        query += `longitude = $${paramIndex}, `;
        params.push(longitude);
        paramIndex++;
    }

    // Remover la última coma y espacio
    query = query.slice(0, -2);

    query += ` WHERE id = $${paramIndex} RETURNING *`;
    params.push(id);

    try {
        const result = await pool.query(query, params);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Dirección no encontrada' });
        }

        res.json({
            message: 'Dirección actualizada exitosamente',
            address: result.rows[0]
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Error al actualizar la dirección' });
    }
}

module.exports = {addAddress, getAddresses, getAddressByCustomerId, deleteAddress, updateAddressPartial};