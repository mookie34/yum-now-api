jest.mock('../db', () => ({
    query: jest.fn()
}));

const pool = require('../db');
const request = require('supertest');
const app = require('../app');

describe('POST /api/addresses (mock)',()=>{
    it('Debe crear una dirección válida (mock)', async()=>{
        pool.query.mockResolvedValueOnce({
            rows: [{id:1,customer_id:1,label:'Casa',address_text:'Calle Falsa 123',reference:'Cerca del parque',latitude:40.7128,longitude:-74.0060,is_primary:true}]
        });
        
        const res = await request(app)
        .post('/api/addresses')
        .send({customer_id:1,label:'Casa',address_text:'Calle Falsa 123',reference:'Cerca del parque',latitude:40.7128,longitude:-74.0060,is_primary:true});

        expect(res.status).toBe(201);
        expect(res.body.message).toBe('Dirección creada exitosamente');
        expect(res.body.address.label).toBe('Casa');
    });

    it('Debe fallar si falta algún dato (mock)', async()=>{
        const res = await request(app)
        .post('/api/addresses')
        .send({customer_id:1,label:'Casa'});

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Faltan datos: customer_id, label o address_text');
    });

    it('Debe fallar si ya existe una dirección primaria para el cliente (mock)', async()=>{
        pool.query.mockRejectedValueOnce({
            code: '23505',
            message: 'duplicate key value violates unique constraint' // <-- agregado
        });
    
        const res = await request(app)
        .post('/api/addresses')
        .send({
            customer_id: 1,
            label: 'Casa',
            address_text: 'Calle Falsa 123',
            reference: 'Cerca del parque',
            latitude: 40.7128,
            longitude: -74.0060,
            is_primary: true
        });
    
        expect(res.status).toBe(400);
        expect(res.body.error).toBe(
            'Ya existe una dirección primaria para este cliente. Solo puede haber una.'
        );
    });    

    it('Debe manejar errores de base de datos (mock)', async()=>{
        pool.query.mockRejectedValueOnce(new Error('DB error'));

        const res = await request(app)
        .post('/api/addresses')
        .send({customer_id:1,label:'Casa',address_text:'Calle Falsa 123',reference:'Cerca del parque',latitude:40.7128,longitude:-74.0060,is_primary:true});

        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Error al guardar la dirección en la base de datos');
    });

    it('Debe traer todas las direcciones (mock)', async()=>{
        pool.query.mockResolvedValueOnce({
            rows: [
                {id:1,customer_id:1,label:'Casa',address_text:'Calle Falsa 123',reference:'Cerca del parque',latitude:40.7128,longitude:-74.0060,is_primary:true},
                {id:2,customer_id:2,label:'Trabajo',address_text:'Avenida Siempre Viva 742',reference:'Frente al banco',latitude:34.0522,longitude:-118.2437,is_primary:false}
            ]
        });

        const res = await request(app)
        .get('/api/addresses');

        expect(res.status).toBe(200);
        expect(res.body.length).toBe(2);
    });

    it('Debe manejar errores al traer direcciones (mock)', async()=>{
        pool.query.mockRejectedValueOnce(new Error('DB error'));

        const res = await request(app)
        .get('/api/addresses');

        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Error al obtener las direcciones');
    });

    it('Debe traer direcciones por customer_id (mock)', async()=>{
        pool.query.mockResolvedValueOnce({
            rows: [
                {id:1,customer_id:1,label:'Casa',address_text:'Calle Falsa 123',reference:'Cerca del parque',latitude:40.7128,longitude:-74.0060,is_primary:true}
            ]
        });

        const res = await request(app)
        .get('/api/addresses/1');

        expect(res.status).toBe(200);
        expect(res.body.length).toBe(1);
        expect(res.body[0].customer_id).toBe(1);
    });

    it('Debe manejar no encontrar direcciones por customer_id (mock)', async()=>{
        pool.query.mockResolvedValueOnce({ rows: [] });

        const res = await request(app)
        .get('/api/addresses/999');

        expect(res.status).toBe(404);
        expect(res.body.error).toBe('No se encontraron direcciones asociadas al cliente.');
    });

    it('Debe manejar errores al traer direcciones por customer_id (mock)', async()=>{
        pool.query.mockRejectedValueOnce(new Error('DB error'));

        const res = await request(app)
        .get('/api/addresses/1');

        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Error al obtener las direcciones del cliente');
    });

    it('Debe eliminar una dirección (mock)', async()=>{
        pool.query.mockResolvedValueOnce({
            rows: [{id:1,customer_id:1,label:'Casa',address_text:'Calle Falsa 123',reference:'Cerca del parque',latitude:40.7128,longitude:-74.0060,is_primary:true}]
        });

        const res = await request(app)
        .delete('/api/addresses/1');

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Dirección eliminada exitosamente');
        expect(res.body.address.id).toBe(1);
    });

    it('Debe manejar no encontrar dirección al eliminar (mock)', async()=>{
        pool.query.mockResolvedValueOnce({ rows: [] });

        const res = await request(app)
        .delete('/api/addresses/999');

        expect(res.status).toBe(404);
        expect(res.body.error).toBe('Dirección no encontrada');
    });

    it('Debe manejar errores al eliminar dirección (mock)', async()=>{
        pool.query.mockRejectedValueOnce(new Error('DB error'));

        const res = await request(app)
        .delete('/api/addresses/1');

        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Error al eliminar la dirección');
    });

    it('Debe actualizar parcialmente una dirección (mock)', async()=>{
        pool.query
        .mockResolvedValueOnce({}) // Para desmarcar primaria anterior
        .mockResolvedValueOnce({
            rows: [{id:1,customer_id:1,label:'Casa Actualizada',address_text:'Calle Falsa 123',reference:'Cerca del parque',latitude:40.7128,longitude:-74.0060,is_primary:true}]
        });

        const res = await request(app)
        .patch('/api/addresses/1')
        .send({label:'Casa Actualizada',is_primary:true});

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Dirección actualizada exitosamente');
        expect(res.body.address.label).toBe('Casa Actualizada');
    });

    it('Debe manejar no encontrar dirección al actualizar (mock)', async()=>{
        pool.query.mockResolvedValueOnce({ rows: [] });

        const res = await request(app)
        .patch('/api/addresses/999')
        .send({label:'Casa Actualizada'});

        expect(res.status).toBe(404);
        expect(res.body.error).toBe('Dirección no encontrada');
    });

    it('Debe manejar errores al actualizar dirección (mock)', async()=>{
        pool.query.mockRejectedValueOnce(new Error('DB error'));

        const res = await request(app)
        .patch('/api/addresses/1')
        .send({label:'Casa Actualizada'});

        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Error al actualizar la dirección');
    });

    it('Debe manejar errores al desmarcar primaria anterior (mock)', async()=>{
        pool.query.mockRejectedValueOnce(new Error('DB error'));

        const res = await request(app)
        .patch('/api/addresses/1')
        .send({is_primary:true});

        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Error al actualizar la dirección primaria');
    });

    it('Debe manejar el caso cuando ya existe una dirección primaria al actualizar (mock)', async()=>{
        pool.query
        .mockResolvedValueOnce({}) // Para desmarcar primaria anterior
        .mockRejectedValueOnce({
            code: '23505',
            message: 'duplicate key value violates unique constraint' // <-- agregado
        });

        const res = await request(app)
        .patch('/api/addresses/1')
        .send({is_primary:true});

        expect(res.status).toBe(400);
        expect(res.body.error).toBe(
            'Ya existe una dirección primaria para este cliente. Solo puede haber una.'
        );
    });

    it('Debe manejar el caso cuando debe traer la dirección primaria por customer_id (mock)', async()=>{
        pool.query.mockResolvedValueOnce({
            rows: [{id:1,customer_id:1,label:'Casa',address_text:'Calle Falsa 123',reference:'Cerca del parque',latitude:40.7128,longitude:-74.0060,is_primary:true}]
        });

        const res = await request(app)
        .get('/api/addresses/primary/1');

        expect(res.status).toBe(200);
        expect(res.body.customer_id).toBe(1);
        expect(res.body.is_primary).toBe(true);
    });

    it('Debe manejar no encontrar dirección primaria por customer_id (mock)', async()=>{
        pool.query.mockResolvedValueOnce({ rows: [] });

        const res = await request(app)
        .get('/api/addresses/primary/999');

        expect(res.status).toBe(404);
        expect(res.body.error).toBe('No se encontró una dirección primaria para este cliente.');
    });

    it('Debe manejar errores al traer dirección primaria por customer_id (mock)', async()=>{
        pool.query.mockRejectedValueOnce(new Error('DB error'));

        const res = await request(app)
        .get('/api/addresses/primary/1');

        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Error al obtener la dirección primaria del cliente');
    });
});