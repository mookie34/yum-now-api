const pool = require('../db'); // tu conexión a PostgreSQL

const addCustomer = async (req,res)=>{
    const {name,email,phone}=req.body;

    if (!name || !email || !phone) {
        return res.status(400).json({ error: 'Faltan datos: nombre, email o teléfono' });
    }

    try{
        const result= await pool.query(
            'INSERT INTO YuNowDataBase.customers (name, email, phone) VALUES ($1, $2, $3) RETURNING *',
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

const getCustomers = async (req,res) => {
    try {
        const result = await pool.query('SELECT * FROM YuNowDataBase.customers ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Error al obtener los clientes' });
    }
};

const getCustomerForPhone = async (req,res) => {
    const {phone} = req.params;
    try {
        const result = await pool.query('SELECT * FROM YuNowDataBase.customers WHERE phone = $1', [phone.trim()]);

        if (result.rows.length ===0) {
            return res.status(404).json({ error: 'Cliente no encontrado' });     
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Error al obtener los clientes' });
    }
};

const updateCustomer = async(req,res) => {
    const {id} = req.params;
    const {name,email,phone}=req.body;
    try {
         const result = await pool.query(
            'UPDATE YuNowDataBase.customers SET name=$1, email=$2, phone=$3 WHERE id=$4 RETURNING *',
            [name, email, phone,id]
         );

         if (result.rows.length ===0) {
            return res.status(404).json({ error: 'Cliente no encontrado' });     
        }

        res.status(200).json({
            mensaje: 'Cliente actualizado exitosamente',
            cliente: result.rows[0]
        });


    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Error al actualizar un cliente' });
    }  
};

const updateCustomerPartial = async (req, res) => {
    const { id } = req.params;
    const { name, email, phone } = req.body;

    try {
        const fields = [];
        const values = [];
        let counter = 1;

        if (name) {
            fields.push(`name=$${counter++}`);
            values.push(name);
        }
        if (email) {
            fields.push(`email=$${counter++}`);
            values.push(email);
        }
        if (phone) {
            fields.push(`phone=$${counter++}`);
            values.push(phone);
        }

        if (fields.length === 0) {
            return res.status(400).json({ error: 'No se proporcionaron campos para actualizar' });
        }

        values.push(id);

        const query = `UPDATE YuNowDataBase.customers SET ${fields.join(', ')} WHERE id=$${counter} RETURNING *`;
        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }

        res.status(200).json({
            mensaje: 'Cliente actualizado exitosamente',
            cliente: result.rows[0]
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Error al actualizar un cliente' });
    }
};

const deleteCustomer = async(req,res) => {
    const { id } = req.params;
    try{
        const result= await pool.query(
            'DELETE FROM YuNowDataBase.customers WHERE id=$1 RETURNING *',
            [id]
        );

        if (result.rows.length ===0) {
            return res.status(404).json({ error: 'Cliente no encontrado' });     
        }

        res.status(200).json({
            mensaje: 'Cliente eliminado exitosamente',
            cliente: result.rows[0]
        });
    } catch (err){
        console.error(err.message);
        res.status(500).json({ error: 'Error al eliminar un cliente' });
    }
};

module.exports = { addCustomer, getCustomers,deleteCustomer,updateCustomer, updateCustomerPartial,getCustomerForPhone };