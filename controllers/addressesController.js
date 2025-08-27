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



module.exports = {addAddress, getAddresses };