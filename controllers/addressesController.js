const pool = require('../db');

const addAddress = async (req, res) => {
    const { customer_id,  label, address_text, reference, latitude, longitude,is_primary } = req.body;
    if (!customer_id || !label || !address_text) {
        return res.status(400).json({ error: 'Faltan datos: customer_id, label o address_text' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO YuNowDataBase.addresses (customer_id,label, address_text, reference,latitude,longitude,is_primary) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [customer_id, label, address_text, reference, latitude, longitude,is_primary]
        );

        res.status(201).json({
            message: 'Dirección creada exitosamente',
            address: result.rows[0]
        });
    } catch (err) {
        console.error(err.message || err);
        if (err.code === '23505') { // PostgreSQL unique_violation
            return res.status(400).json({ 
                error: 'Ya existe una dirección primaria para este cliente. Solo puede haber una.' 
            });
        }
        res.status(500).json({ error: 'Error al guardar la dirección en la base de datos' });
    }

};

const getAddresses = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM YuNowDataBase.addresses ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Error al obtener las direcciones' });
    }
};

const getAddressByCustomerId = async (req, res) => {
    const { customer_id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM YuNowDataBase.addresses WHERE customer_id = $1', [customer_id]);

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
        const result = await pool.query('DELETE FROM YuNowDataBase.addresses WHERE id = $1 RETURNING *', [id]);

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
    const { label, address_text, reference, latitude, longitude, is_primary } = req.body;

    // Si se va a establecer como primaria, desmarcar la primaria anterior
    if (is_primary) {
        try {
            await pool.query(
                `UPDATE YuNowDataBase.addresses
                 SET is_primary = FALSE
                 WHERE customer_id = (
                     SELECT customer_id FROM YuNowDataBase.addresses WHERE id = $1
                 )
                 AND is_primary = TRUE`,
                [id]
            );
        } catch (err) {
            console.error('Error al desmarcar la dirección primaria anterior:', err.message);
            return res.status(500).json({ error: 'Error al actualizar la dirección primaria' });
        }
    }

    // Construir la consulta dinámicamente
    let query = 'UPDATE YuNowDataBase.addresses SET ';
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
    if (is_primary !== undefined) {
        query += `is_primary = $${paramIndex}, `;
        params.push(is_primary);
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
        console.error('Error al actualizar dirección:', err.message);

        // Captura extra de unique_violation por si algo falla
        if (err.code === '23505') {
            return res.status(400).json({
                error: 'Ya existe una dirección primaria para este cliente. Solo puede haber una.'
            });
        }

        res.status(500).json({ error: 'Error al actualizar la dirección' });
    }
};

const getPrimaryAddressByCustomerId = async (req, res) => {
    const { customer_id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM YuNowDataBase.addresses WHERE customer_id = $1 AND is_primary = TRUE', [customer_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No se encontró una dirección primaria para este cliente.' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Error al obtener la dirección primaria del cliente' });
    }
}


module.exports = {addAddress, getAddresses, getAddressByCustomerId, deleteAddress, updateAddressPartial, getPrimaryAddressByCustomerId};