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

    it('Debe actualizar un cliente (mock)', async()=>{
        pool.query.mockResolvedValueOnce({
            rows: [{id:1,name:'actualizado',email:'pruebas@gg.com',phone:'0987654321'}]
        });

        const res = await request(app)
        .put('/api/customers/1')
        .send({name:'actualizado',email:'pruebas@gg.com',phone:'0987654321'});

        expect(res.status).toBe(200);
        expect(res.body.mensaje).toBe('Cliente actualizado exitosamente');
        expect(res.body.cliente.name).toBe('actualizado');
    });

    it('Debe fallar si no encuentra cliente para actualizar (mock)', async()=>{
        pool.query.mockResolvedValueOnce({ rows: [] });

        const res = await request(app)
        .put('/api/customers/999')
        .send({name:'noexiste',email:'',phone:'232223'});

        expect(res.status).toBe(404);
        expect(res.body.error).toBe('Cliente no encontrado');
    });

    it('Debe actualizar cliente parcialmente (mock)', async()=>{
         pool.query.mockResolvedValueOnce({
            rows: [{id:1,phone:'0987654321'}]
        });

        const res = await request(app)
        .patch('/api/customers/1')
        .send({phone:'0987654321'});
        expect(res.status).toBe(200);
        expect(res.body.mensaje).toBe('Cliente actualizado exitosamente');
        expect(res.body.cliente.phone).toBe('0987654321');
    });

     it('Debe fallar si no encuentra cliente para actualizar parcialmente (mock)', async()=>{
        pool.query.mockResolvedValueOnce({ rows: [] });

        const res = await request(app)
        .patch('/api/customers/1')
        .send({name:'noexiste',email:'',phone:'232223'});

        expect(res.status).toBe(404);
        expect(res.body.error).toBe('Cliente no encontrado');
    });

    it('Debe fallar si no hay campos para actualizar parcialmente (mock)', async()=>{
        const res = await request(app)
        .patch('/api/customers/1')
        .send({});   
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('No se proporcionaron campos para actualizar');   
    });

    it('Debe eliminar un cliente (mock)', async()=>{
        pool.query.mockResolvedValueOnce({ rows: [{id:1}] });

        const res = await request(app)
        .delete('/api/customers/1');
        expect(res.status).toBe(200);
        expect(res.body.mensaje).toBe('Cliente eliminado exitosamente');
    });

    it('Debe fallar si no encuentra cliente para eliminar (mock)', async()=>{
        pool.query.mockResolvedValueOnce({ rows: [] });

        const res = await request(app)
        .delete('/api/customers/999');
        expect(res.status).toBe(404);
        expect(res.body.error).toBe('Cliente no encontrado');
    });

    it('Debe fallar si hay error al eliminar cliente (mock)', async()=>{
        pool.query.mockRejectedValueOnce(new Error('DB error'));

        const res = await request(app)
        .delete('/api/customers/1');
        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Error al eliminar un cliente');
    });
        
});
