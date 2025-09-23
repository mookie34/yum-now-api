jest.mock('../db', () => ({
    query: jest.fn()
}));

const pool = require('../db');
const request = require('supertest');
const app = require('../app'); 

describe('POST /api/customers (mock)',()=>{
    it('Debe crear un cliente válido (mock)', async()=>{
        pool.query.mockResolvedValueOnce({
            rows: [{id:1,name:'prueba',email:'juan@example.com',phone:'1234567890'}]
        });
        
        const res = await request(app)
        .post('/api/customers')
        .send({name:'prueba',email:'juan@example.com',phone:'1234567890'});

        expect(res.status).toBe(201);
        expect(res.body.mensaje).toBe('Cliente creado exitosamente');
        expect(res.body.cliente.name).toBe('prueba');
    });

    it('Debe fallar si falta algún dato (mock)', async()=>{
        const res = await request(app)
        .post('/api/customers')
        .send({name:'prueba'});

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Faltan datos: nombre, email o teléfono');
    });

    it('Debe consultar clientes (mock)', async()=>{
        pool.query.mockResolvedValueOnce({
            rows: [{id:1,name:'prueba',email:'juan@example.com',phone:'1234567890'}]
        });

        const res = await request(app)
        .get('/api/customers');

        expect(res.status).toBe(200);
        expect(res.body[0].name).toBe('prueba');
    });

    it('Debe fallar en la consulta de clientes (mock)', async()=>{
        pool.query.mockRejectedValueOnce(new Error('DB error'));

        const res = await request(app).get('/api/customers');
        
        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Error al obtener los clientes');
    });

    it('Debe consultar cliente por telefono (mock)', async()=>{
         pool.query.mockResolvedValueOnce({
            rows: [{id:1,name:'prueba',email:'juan@example.com',phone:'1234567890'}]
        });

        const res = await request(app)
        .get('/api/customers/phone/1234567890');

        expect(res.status).toBe(200);
        expect(res.body.name).toBe('prueba');
        expect(res.body.phone).toBe('1234567890');
    });

    it('Debe fallar si no encuentra cliente por telefono (mock)', async()=>{
        pool.query.mockResolvedValueOnce({ rows: [] });

        const res = await request(app)
        .get('/api/customers/phone/0000000000');

        expect(res.status).toBe(404);
        expect(res.body.error).toBe('Cliente no encontrado');
    });
        
});
