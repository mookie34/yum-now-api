const pool = require('../db'); 

 const addCourier = async (req, res) => {
 const { name, phone, vehicle, license_plate, available } = req.body;

     if (!name || !phone || !vehicle || !license_plate) {
         return res.status(400).json({ error: 'Faltan datos: nombre, teléfono, vehículo o placa' });
     }

     try {
         const result = await pool.query(
             'INSERT INTO couriers (name, phone, vehicle, available, license_plate) VALUES ($1, $2, $3, $4, $5) RETURNING *',
             [name, phone, vehicle, available, license_plate]
         );

         res.status(201).json({
             message: 'Domiciliario creado exitosamente',
             courier: result.rows[0]
         });
     } catch (err) {
         console.error(err.message);
         res.status(500).json({ error: 'Error al guardar el Domiciliario en la base de datos' });
     }
 };

 const getCouriers = async (req, res) => {
     try {
         const result = await pool.query('SELECT * FROM couriers ORDER BY id ASC');
         res.json(result.rows);
     } catch (err) {
         console.error(err.message);
         res.status(500).json({ error: 'Error al obtener los Domiciliarios' });
     }
 };

 const getCouriesAvailable = async (req, res) => {
        try {
            const result = await pool.query('SELECT * FROM couriers WHERE available = true ORDER BY id ASC');
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'No hay Domiciliarios disponibles' });
            }
            res.json(result.rows);
        } catch (err) {
            console.error(err.message);
            res.status(500).json({ error: 'Error al obtener los Domiciliarios disponibles' });
        }
 }

 const getCourierForFilter = async (req, res) => {
        try {
            const { name,phone,license_plate } = req.query;
            const params = []; 
            let query = 'SELECT * FROM couriers WHERE 1=1';
            if (name) {
                params.push(`%${name}%`); // agrega los %
                query += ` AND name ILIKE $${params.length}`;
            }
            if (phone) {
            params.push(`%${phone}%`);
                query += ` AND phone ILIKE $${params.length}`;
            }
            if (license_plate) {
                params.push(`%${license_plate}%`);
                query += ` AND license_plate ILIKE $${params.length}`;
            }

            const result = await pool.query(query, params);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Domiciliarios no encontrados' });
            }
            res.json(result.rows);

        } catch (err) {
            console.error(err.message);
            res.status(500).json({ error: 'Error al obtener el Domiciliario' });
        }
 }

 const deleteCourier = async (req, res) => {
     const { id } = req.params;
     try {
         const result = await pool.query('DELETE FROM couriers WHERE id = $1 RETURNING *', [id]);

         if (result.rows.length === 0) {
             return res.status(404).json({ error: 'Domiciliario no encontrado' });
         }

         res.json({ message: 'Domiciliario eliminado exitosamente', courier: result.rows[0] });
     } catch (err) {
         console.error(err.message);
         res.status(500).json({ error: 'Error al eliminar el Domiciliario' });
     }
 };

 const updateCourier = async (req, res) => {
        const { id } = req.params;
        const { name, phone, vehicle, license_plate, available } = req.body;
    
        try {
            const result = await pool.query(
                'UPDATE couriers SET name = $1, phone = $2, vehicle = $3, license_plate = $4, available = $5 WHERE id = $6 RETURNING *',
                [name, phone, vehicle, license_plate, available, id]
            );
    
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Domiciliario no encontrado' });
            }
    
            res.json({
                message: 'Domiciliario actualizado exitosamente',
                courier: result.rows[0]
            });
        } catch (err) {
            console.error(err.message);
            res.status(500).json({ error: 'Error al actualizar el Domiciliario' });
        }
 }

 const updateCourierPartial = async (req, res) => {
     const { id } = req.params;
     const { name, phone, vehicle, license_plate, available } = req.body;

     try {
        const fields = [];
        const values = [];
        let counter = 1;

        if (name) {
            fields.push(`name=$${counter++}`);
            values.push(name);
        }
        if (phone) {
            fields.push(`phone=$${counter++}`);
            values.push(phone);
        }
        if (vehicle) {
            fields.push(`vehicle=$${counter++}`);
            values.push(vehicle);
        }
        if (license_plate) {
            fields.push(`license_plate=$${counter++}`);
            values.push(license_plate);
        }
        if (available !== undefined) {
            fields.push(`available=$${counter++}`);
            values.push(available);
        }
        if (fields.length === 0) {
            return res.status(400).json({ error: 'No se proporcionaron campos para actualizar' });
        }

        values.push(id);

        const query = `UPDATE couriers SET ${fields.join(', ')} WHERE id=$${counter} RETURNING *`;
        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }

        res.status(200).json({
            mensaje: 'Domiciliario actualizado exitosamente',
            cliente: result.rows[0]
        });

     } catch (err) {
         console.error(err.message);
         res.status(500).json({ error: 'Error al actualizar el Domiciliario' });
     }
 }; 

 module.exports = { addCourier, getCouriers, deleteCourier, updateCourier, updateCourierPartial, getCourierForFilter, getCouriesAvailable };


