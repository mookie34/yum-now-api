jest.mock('../db', () => ({
  query: jest.fn(),
}));

const db = require('../db');
const request = require('supertest');
const app = require('../app'); 
const pool = require('../db');

describe('POST /api/orders (mock)', () => {
    it('Deberia crear una nueva orden con exito', async () => {
        pool.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] })
        .mockResolvedValueOnce({ rows: [{ id: 1 }] })
        .mockResolvedValueOnce({ rows: [{customer_id:1,address_id:1,payment_method:'Credit card',status:'Pending'}]
        });
        
        const res = await request(app)
            .post('/api/orders')
            .send({
                customer_id: 1,
                address_id: 1,
                total: 0,
                payment_method: 'Credit card',
                status: 'Pending'
            });
        expect(res.status).toEqual(201);
        expect(res.body.order).toHaveProperty('customer_id', 1);
        expect(res.body.order).toHaveProperty('address_id', 1);
        expect(res.body.order).toHaveProperty('payment_method', 'Credit card');
        expect(res.body.order).toHaveProperty('status', 'Pending');
    });

    it('Deberia devolver error cuando no existe el usuario', async () => {
        pool.query
        .mockResolvedValueOnce({ rows: [] });
        const res = await request(app)
            .post('/api/orders')
            .send({
                customer_id: 999,
                address_id: 1,  
                payment_method: 'Credit card',
                status: 'Pending'
            });
        expect(res.status).toEqual(404);
        expect(res.body).toHaveProperty('error', 'Cliente no encontrado');
    });

    it('Deberia devolver error cuando no existe la direccion', async () => {
        pool.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] })
        .mockResolvedValueOnce({ rows: [] });
        const res = await request(app)
            .post('/api/orders')    
            .send({
                customer_id: 1,
                address_id: 999,
                payment_method: 'Credit card',
                status: 'Pending'
            });
        expect(res.status).toEqual(404);
        expect(res.body).toHaveProperty('error', 'Dirección no encontrada');
    });

    it('Deberia devolver error cuando faltan datos obligatorios', async () => {
        const res = await request(app)
            .post('/api/orders')
            .send({
                address_id: 1,
                payment_method: 'Credit card',
                status: 'Pending'
            });
        expect(res.status).toEqual(400);
        expect(res.body).toHaveProperty('error', 'Faltan datos obligatorios');
    });

    it('Deberia manejar error de base de datos', async () => {
        pool.query.mockRejectedValueOnce(new Error('DB error'));
        const res = await request(app)  
            .post('/api/orders')
            .send({
                customer_id: 1,
                address_id: 1,
                payment_method: 'Credit card',
                status: 'Pending'
            });
        expect(res.status).toEqual(500);
        expect(res.body).toHaveProperty('error', 'Error al guardar la orden en la base de datos');
    }); 

    it('Deberia actualizar el total de la orden con exito', async () => {
        pool.query.mockResolvedValueOnce({ rows: [{ id: 1, total: 100 }] });

        const res = await request(app)
            .patch('/api/orders/1/total');

        expect(res.status).toEqual(200);
        expect(res.body.message).toEqual('Total de la orden actualizado exitosamente');
        expect(res.body.order).toHaveProperty('id', 1);
        expect(res.body.order).toHaveProperty('total', 100);
    });

    it('Deberia devolver error cuando no existe la orden al actualizar total', async () => {
        pool.query
        .mockResolvedValueOnce({ rows: [] });
        const res = await request(app)
            .patch('/api/orders/999/total');
        expect(res.status).toEqual(404);
        expect(res.body).toHaveProperty('error', 'Orden no encontrada');
    });

    it('Deberia manejar error de base de datos al actualizar total', async () => {
        pool.query.mockRejectedValueOnce(new Error('DB error'));
        const res = await request(app)
            .patch('/api/orders/1/total');
        expect(res.status).toEqual(500);
        expect(res.body).toHaveProperty('error', 'Error al actualizar el total de la orden en la base de datos');
    });

    it('Deberia traer todas las ordenes', async () => {
        pool.query.mockResolvedValueOnce({ rows: [
            { id: 1, customer_id: 1, address_id: 1, total: 100, payment_method: 'Credit card', status: 'Pending' },
            { id: 2, customer_id: 1, address_id: 1, total: 100, payment_method: 'Credit card', status: 'Pending' }
        ] });

        const res = await request(app)
            .get('/api/orders');
        expect(res.status).toEqual(200);
        expect(res.body.length).toBeGreaterThan(0);
        expect(res.body[0]).toHaveProperty('id', 1);
    });

    it('Deberia manejar error de base de datos al traer todas las ordenes', async () => {
        pool.query.mockRejectedValueOnce(new Error('DB error'));
        const res = await request(app)
            .get('/api/orders');
        expect(res.status).toEqual(500);
        expect(res.body).toHaveProperty('error', 'Error al obtener las órdenes');
    });

    it('Deberia traer una orden por ID', async () => {
        pool.query.mockResolvedValueOnce({ rows: [
            { id: 1, customer_id: 1, address_id: 1, total: 100, payment_method: 'Credit card', status: 'Pending' }
        ] });
        const res = await request(app)
            .get('/api/orders/1');
        expect(res.status).toEqual(200);
        expect(res.body).toHaveProperty('id', 1);
    });

    it('Deberia devolver error cuando no existe la orden al buscar por ID', async () => {
        pool.query
        .mockResolvedValueOnce({ rows: [] });
        const res = await request(app)
            .get('/api/orders/999');
        expect(res.status).toEqual(404);
        expect(res.body).toHaveProperty('error', 'Orden no encontrada');
    });

    it('Deberia manejar error de base de datos al buscar orden por ID', async () => {
        pool.query.mockRejectedValueOnce(new Error('DB error'));
        const res = await request(app)
            .get('/api/orders/1');
        expect(res.status).toEqual(500);
        expect(res.body).toHaveProperty('error', 'Error al obtener la orden');
    });

    it('Deberia traer ordenes por ID de cliente', async () => {
        pool.query.mockResolvedValueOnce({ rows: [
            { id: 1, customer_id: 1, address_id: 1, total: 100, payment_method: 'Credit card', status: 'Pending' },
            { id: 2, customer_id: 1, address_id: 1, total: 100, payment_method: 'Credit card', status: 'Pending' }
        ] });
        const res = await request(app)
            .get('/api/orders/customer/1');
        expect(res.status).toEqual(200);
        expect(res.body.length).toBeGreaterThan(0);
        expect(res.body[0]).toHaveProperty('customer_id', 1);
    });

    it('Deberia devolver error cuando no existen ordenes para el cliente', async () => {
        pool.query
        .mockResolvedValueOnce({ rows: [] });
        const res = await request(app)
            .get('/api/orders/customer/999');
        expect(res.status).toEqual(404);
        expect(res.body).toHaveProperty('error', 'Órdenes no encontradas para este cliente');
    });

    it('Deberia manejar error de base de datos al buscar ordenes por ID de cliente', async () => {
        pool.query.mockRejectedValueOnce(new Error('DB error'));
        const res = await request(app)
            .get('/api/orders/customer/1');
        expect(res.status).toEqual(500);
        expect(res.body).toHaveProperty('error', 'Error al obtener las órdenes del cliente');
    });

    it('Deberia eliminar una orden por ID', async () => {
        pool.query.mockResolvedValueOnce({ rows: [
            { id: 1, customer_id: 1, address_id: 1, total: 100, payment_method: 'Credit card', status: 'Pending' }
        ] });
        const res = await request(app)
            .delete('/api/orders/1');
        expect(res.status).toEqual(200);
        expect(res.body).toHaveProperty('message', 'Orden eliminada exitosamente');
        expect(res.body.order).toHaveProperty('id', 1);
    });

    it('Deberia devolver error cuando no existe la orden al eliminar', async () => {
        pool.query
        .mockResolvedValueOnce({ rows: [] });
        const res = await request(app)
            .delete('/api/orders/999');
        expect(res.status).toEqual(404);
        expect(res.body).toHaveProperty('error', 'Orden no encontrada');
    });

    it('Deberia manejar error de base de datos al eliminar orden', async () => {
        pool.query.mockRejectedValueOnce(new Error('DB error'));
        const res = await request(app)
            .delete('/api/orders/1');
        expect(res.status).toEqual(500);
        expect(res.body).toHaveProperty('error', 'Error al eliminar la orden');
    });

    it('Deberia actualizar parcialmente una orden sus status', async () => {
        pool.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] })
        .mockResolvedValueOnce({ rows: [
            { id: 1, customer_id: 2, address_id: 1, total: 100, payment_method: 'Debit card', status: 'Shipped' }
        ] });
        const res = await request(app)
            .patch('/api/orders/1') 
            .send({ customer_id: 2, payment_method: 'Debit card', status: 'Shipped' });

        expect(res.status).toEqual(200);
        expect(res.body.message).toBe('Orden actualizada exitosamente');
        expect(res.body.order).toHaveProperty('customer_id', 2);
        expect(res.body.order).toHaveProperty('payment_method', 'Debit card');
        expect(res.body.order).toHaveProperty('status', 'Shipped');
    });

    it('Deberia actualizar parcialmente una orden su customer_id', async () => {
        pool.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] })
        .mockResolvedValueOnce({ rows: [
            { id: 1, customer_id: 3, address_id: 1, total: 100, payment_method: 'Credit card', status: 'Pending' }
        ] });
        const res = await request(app)
            .patch('/api/orders/1') 
            .send({ customer_id: 3 });
        expect(res.status).toEqual(200);
        expect(res.body.message).toBe('Orden actualizada exitosamente');
        expect(res.body.order).toHaveProperty('customer_id', 3);
    });

    it('Deberia devolver error cuando no existe la orden al actualizar parcialmente', async () => {
        pool.query
        .mockResolvedValueOnce({ rows: [] });
        const res = await request(app)
            .patch('/api/orders/999') 
            .send({ customer_id: 2 });
        expect(res.status).toEqual(404);
        expect(res.body).toHaveProperty('error', 'Orden no encontrada');
    });

    it('Deberia manejar error de base de datos al actualizar parcialmente una orden', async () => {
        pool.query.mockRejectedValueOnce(new Error('DB error'));
        const res = await request(app)
            .patch('/api/orders/1') 
            .send({ customer_id: 2 });
        expect(res.status).toEqual(500);
        expect(res.body).toHaveProperty('error', 'Error al actualizar la orden en la base de datos');
    });

    it('Deberia actualizar el estado de la orden', async () => {
        pool.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] })
        .mockResolvedValueOnce({ rows: [
            { id: 1, customer_id: 1, address_id: 1, total: 100, payment_method: 'Credit card', status: 'Delivered' }
        ] });
        const res = await request(app)
            .patch('/api/orders/1/status') 
            .send({ status: 'Delivered' });
        expect(res.status).toEqual(200);
        expect(res.body.message).toBe('Estado de la orden actualizado exitosamente');
        expect(res.body.order).toHaveProperty('status', 'Delivered');
    });

    it('Deberia devolver error cuando falta el estado al actualizar estado de la orden', async () => {
        const res = await request(app)
            .patch('/api/orders/1/status') 
            .send({});
        expect(res.status).toEqual(400);
        expect(res.body).toHaveProperty('error', 'Falta el estado de la orden');
    });

    it('Deberia devolver error cuando no existe la orden al actualizar estado', async () => {
        pool.query
        .mockResolvedValueOnce({ rows: [] });
        const res = await request(app)
            .patch('/api/orders/999/status') 
            .send({ status: 'Delivered' });
        expect(res.status).toEqual(404);
        expect(res.body).toHaveProperty('error', 'Orden no encontrada');
    });

    it('Deberia manejar error de base de datos al actualizar estado de la orden', async () => {
        pool.query.mockRejectedValueOnce(new Error('DB error'));
        const res = await request(app)
            .patch('/api/orders/1/status') 
            .send({ status: 'Delivered' });
        expect(res.status).toEqual(500);
        expect(res.body).toHaveProperty('error', 'Error al actualizar el estado de la orden en la base de datos');
    });
});