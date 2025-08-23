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
             message: 'Mensajero creado exitosamente',
             courier: result.rows[0]
         });
     } catch (err) {
         console.error(err.message);
         res.status(500).json({ error: 'Error al guardar el mensajero en la base de datos' });
     }
 };

 const getCouriers = async (req, res) => {
     try {
         const result = await pool.query('SELECT * FROM couriers ORDER BY id ASC');
         res.json(result.rows);
     } catch (err) {
         console.error(err.message);
         res.status(500).json({ error: 'Error al obtener los mensajeros' });
     }
 };

 const deleteCourier = async (req, res) => {
     const { id } = req.params;
     try {
         const result = await pool.query('DELETE FROM couriers WHERE id = $1 RETURNING *', [id]);

         if (result.rows.length === 0) {
             return res.status(404).json({ error: 'Mensajero no encontrado' });
         }

         res.json({ message: 'Mensajero eliminado exitosamente', courier: result.rows[0] });
     } catch (err) {
         console.error(err.message);
         res.status(500).json({ error: 'Error al eliminar el mensajero' });
     }
 };

 module.exports = { addCourier, getCouriers, deleteCourier };


