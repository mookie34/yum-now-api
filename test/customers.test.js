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
})