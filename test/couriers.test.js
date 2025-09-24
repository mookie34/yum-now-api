jest.mock('../db', () => ({
    query: jest.fn()
}));

const pool = require('../db');
const request = require('supertest');
const app = require('../app');

describe('POST /api/couriers (mock)',()=>{
    it('Debe crear un Domiciliario válido (mock)', async()=>{
        pool.query.mockResolvedValueOnce({
            rows: [{id:1,name:'Juan Pérez',phone:'1234567890',vehicle:'Bicicleta',license_plate:'ABC123',available:true}]
        });
        const res = await request(app)
        .post('/api/couriers')
        .send({name:'Juan Pérez',phone:'1234567890',vehicle:'Bicicleta',license_plate:'ABC123',available:true});

        expect(res.status).toBe(201);
        expect(res.body.message).toBe('Domiciliario creado exitosamente');
        expect(res.body.courier.name).toBe('Juan Pérez');
    });

    it('Debe manejar error al crear un Domiciliario (mock)', async()=>{
        pool.query.mockRejectedValueOnce(new Error('DB error'));
        const res = await request(app)
        .post('/api/couriers')
        .send({name:'Juan Pérez',phone:'1234567890',vehicle:'Bicicleta',license_plate:'ABC123',available:true});
        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Error al guardar el domiciliario en la base de datos');
    });

    it('Debe manejar error al faltar un campo en la creación (mock)', async()=>{
        const res = await request(app)
        .post('/api/couriers')
        .send({phone:'1234567890',vehicle:'Bicicleta',license_plate:'ABC123',available:true});
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Faltan datos: nombre, teléfono, vehículo o placa');
    });

    it('Debe obtener todos los Domiciliarios (mock)', async()=>{
        pool.query.mockResolvedValueOnce({
            rows: [ {id:1,name:'Juan Pérez',phone:'1234567890',vehicle:'Bicicleta',license_plate:'ABC123',available:true},
                    {id:2,name:'María Gómez',phone:'0987654321',vehicle:'Moto',license_plate:'XYZ789',available:false}]
        });

        const res = await request(app).get('/api/couriers');
        expect(res.status).toBe(200);
        expect(res.body.length).toBe(2);
        expect(res.body[0].name).toBe('Juan Pérez');
    });

    it('Debe manejar error al obtener los Domiciliarios (mock)', async()=>{
        pool.query.mockRejectedValueOnce(new Error('DB error'));
        const res = await request(app).get('/api/couriers');
        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Error al obtener los Domiciliarios');
    });

    it('Debe obtener Domiciliarios disponibles (mock)', async()=>{
        pool.query.mockResolvedValueOnce({
            rows: [ {id:1,name:'Juan Pérez',phone:'1234567890',vehicle:'Bicicleta',license_plate:'ABC123',available:true} ]
        });
        const res = await request(app).get('/api/couriers/available');
        expect(res.status).toBe(200);
        expect(res.body.length).toBe(1);
        expect(res.body[0].available).toBe(true);
        expect(res.body[0].name).toBe('Juan Pérez');
    });

    it('Debe manejar caso sin Domiciliarios disponibles (mock)', async()=>{
        pool.query.mockResolvedValueOnce({ rows: [] });
        const res = await request(app).get('/api/couriers/available');
        expect(res.status).toBe(404);
        expect(res.body.error).toBe('No hay Domiciliarios disponibles');
    });

    it('Debe manejar error al obtener Domiciliarios disponibles (mock)', async()=>{
        pool.query.mockRejectedValueOnce(new Error('DB error'));
        const res = await request(app).get('/api/couriers/available');
        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Error al obtener los Domiciliarios disponibles');
    });

    it('Debe filtrar Domiciliarios por nombre (mock)', async()=>{
        pool.query.mockResolvedValueOnce({
            rows: [ {id:1,name:'Juan Pérez',phone:'1234567890',vehicle:'Bicicleta',license_plate:'ABC123',available:true} ]
        });
        const res = await request(app).get('/api/couriers/filter').query({name:'Juan'});
        expect(res.status).toBe(200);
        expect(res.body.length).toBe(1);
        expect(res.body[0].name).toBe('Juan Pérez');
    });

    it('Debe filtrar Domiciliarios por teléfono (mock)', async()=>{
        pool.query.mockResolvedValueOnce({
            rows: [ {id:2,name:'María Gómez',phone:'0987654321',vehicle:'Moto',license_plate:'XYZ789',available:false} ]
        });
        const res = await request(app).get('/api/couriers/filter').query({phone:'0987'});
        expect(res.status).toBe(200);
        expect(res.body.length).toBe(1);
        expect(res.body[0].phone).toBe('0987654321');
    });

    it('Debe filtrar Domiciliarios por placa (mock)', async()=>{
        pool.query.mockResolvedValueOnce({
            rows: [ {id:2,name:'María Gómez',phone:'0987654321',vehicle:'Moto',license_plate:'XYZ789',available:false} ]
        });
        const res = await request(app).get('/api/couriers/filter').query({license_plate:'XYZ'});
        expect(res.status).toBe(200);
        expect(res.body.length).toBe(1);
        expect(res.body[0].license_plate).toBe('XYZ789');
    });

    it('Debe manejar error al filtrar Domiciliarios (mock)', async()=>{
        pool.query.mockRejectedValueOnce(new Error('DB error'));
        const res = await request(app).get('/api/couriers/filter').query({name:'Juan'});
        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Error al obtener los Domiciliarios por filtro');
    });

    it('Debe retornar lista vacía si no hay Domiciliarios que coincidan con el filtro (mock)', async()=>{
        pool.query.mockResolvedValueOnce({ rows: [] });
        const res = await request(app).get('/api/couriers/filter').query({name:'NoExiste'});
        expect(res.status).toBe(200);
        expect(res.body.length).toBe(0);
    });

    it('Debe eliminar un Domiciliario existente (mock)', async()=>{
        pool.query.mockResolvedValueOnce({
            rows: [ {id:1,name:'Juan Pérez',phone:'1234567890',vehicle:'Bicicleta',license_plate:'ABC123',available:true} ]
        });
        const res = await request(app).delete('/api/couriers/1');
        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Domiciliario eliminado exitosamente');
        expect(res.body.courier.id).toBe(1);
    });

    it('Debe manejar intento de eliminar Domiciliario inexistente (mock)', async()=>{
        pool.query.mockResolvedValueOnce({ rows: [] });
        const res = await request(app).delete('/api/couriers/999');
        expect(res.status).toBe(404);
        expect(res.body.error).toBe('Domiciliario no encontrado');
    });

    it('Debe manejar error al eliminar un Domiciliario (mock)', async()=>{
        pool.query.mockRejectedValueOnce(new Error('DB error'));
        const res = await request(app).delete('/api/couriers/1');
        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Error al eliminar el Domiciliario');
    });

    it('Debe actualizar un Domiciliario existente (mock)', async () => {
        pool.query.mockResolvedValueOnce({
            rows: [{id: 1,name: 'Juan Pérez',phone: '1112223333',vehicle: 'Moto',          license_plate: 'NEW123',  available: false}]});

        const res = await request(app)
            .put('/api/couriers/1')
            .send({name: 'Juan Pérez',phone: '1112223333',vehicle: 'Moto',license_plate: 'NEW123',available: false});

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Domiciliario actualizado exitosamente');
        expect(res.body.courier.phone).toBe('1112223333');
        expect(res.body.courier.vehicle).toBe('Moto');
        expect(res.body.courier.license_plate).toBe('NEW123');
        expect(res.body.courier.available).toBe(false);
    });

it('Debe manejar intento de actualizar Domiciliario inexistente (mock)', async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        const res = await request(app)
            .put('/api/couriers/999')
            .send({name: 'No Existe',phone: '0000000000',vehicle: 'Ninguno',license_plate: 'NONE',available: false});
        expect(res.status).toBe(404);
        expect(res.body.error).toBe('Domiciliario no encontrado');
    });

    it('Debe manejar error al actualizar un Domiciliario (mock)', async () => {
        pool.query.mockRejectedValueOnce(new Error('DB error'));
        const res = await request(app)
            .put('/api/couriers/1')
            .send({name: 'Juan Pérez',phone: '1112223333',vehicle: 'Moto',license_plate: 'NEW123',available: false});
        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Error al actualizar el Domiciliario');
    });

    it('Debe actualizar parcialmente un Domiciliario existente (mock)', async () => {
        pool.query.mockResolvedValueOnce({
            rows: [{id: 1,name: 'Juan Pérez',phone: '1112223333',vehicle: 'Bicicleta',license_plate: 'ABC123',available: false}]});
        const res = await request(app)
            .patch('/api/couriers/1')
            .send({phone: '1112223333', available: false});
        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Domiciliario actualizado exitosamente');
        expect(res.body.courier.phone).toBe('1112223333');
        expect(res.body.courier.available).toBe(false);
    });

    it('Debe manejar intento de actualizar parcialmente Domiciliario inexistente (mock)', async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });
        const res = await request(app)
            .patch('/api/couriers/999')
            .send({phone: '0000000000'});
        expect(res.status).toBe(404);
        expect(res.body.error).toBe('Domiciliario no encontrado');
    });

    it('Debe manejar error al actualizar parcialmente un Domiciliario (mock)', async () => {
        pool.query.mockRejectedValueOnce(new Error('DB error'));
        const res = await request(app)
            .patch('/api/couriers/1')
            .send({phone: '1112223333'});
        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Error al actualizar el Domiciliario');
    });

});