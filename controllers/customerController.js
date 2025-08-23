const pool = require('../db'); // tu conexión a PostgreSQL

const addCustomer = async (req,res)=>{
    const {name,email,phone}=req.body;

    if (!name || !email || !phone) {
        return res.status(400).json({ error: 'Faltan datos: nombre, email o teléfono' });
    }

    try{
        const result= await pool.query(
            'INSERT INTO customers (name, email, phone) VALUES ($1, $2, $3) RETURNING *',
            [name, email, phone]
        );

        res.status(201).json({
            mensaje: 'Cliente creado exitosamente',
            cliente: result.rows[0]
        });
    }catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Error al guardar el cliente en la base de datos' });
    }
};

const getCustomers = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM customers ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Error al obtener los clientes' });
    }
};

module.exports = { addCustomer, getCustomers };