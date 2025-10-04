jest.mock('../db', () => ({
    query: jest.fn(),
    end: jest.fn(),
    pool: {}
}));

const db = require('../db');
const request = require('supertest');
const app = require('../app'); 

describe('POST /assignOrders', () => {
    it('Debe crear una asignación de órdenes correctamente', async () => {
        db.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Mock para existOrder
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Mock para existCourier
        .mockResolvedValueOnce({ rows: [] }) // Mock para verificar si ya existe la asignación
        .mockResolvedValueOnce({ rows: [{ order_id: 1, courier_id: 1 }] }); // Mock para insert

        const response = await request(app)
        .post('/api/assign-orders')
        .send({ order_id: 1, courier_id: 1 });

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('mensaje', 'Orden asignada exitosamente.');
        expect(response.body).toHaveProperty('assignOrder');
        expect(response.body.assignOrder).toEqual({ order_id: 1, courier_id: 1 });
    });

    it('Debe retornar 404 si la orden no existe', async () => {
        db.query.mockResolvedValueOnce({ rows: [] }); // Mock para existOrder

        const response = await request(app)
        .post('/api/assign-orders')
        .send({ order_id: 999, courier_id: 1 });

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'No existe la orden.');
    });

   it('Debe retornar 404 si el repartidor no existe', async () => {
        db.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Mock para existOrder
        .mockResolvedValueOnce({ rows: [] }); // Mock para existCourier

        const response = await request(app)
        .post('/api/assign-orders')
        .send({ order_id: 1, courier_id: 999 });

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'Repartidor no encontrado.');
    });

    it('Debe retornar 400 si la asignación ya existe', async () => {
        db.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Mock para existOrder
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Mock para existCourier
        .mockResolvedValueOnce({ rows: [{ order_id: 1, courier_id: 1 }] }); // Mock para verificar si ya existe la asignación

        const response = await request(app)
        .post('/api/assign-orders')
        .send({ order_id: 1, courier_id: 1 });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'La orden ya ha sido asignada a un repartidor.');
    });

    it('Debe retornar 500 en caso de error del servidor', async () => {
        db.query.mockRejectedValueOnce(new Error('DB error'));

        const response = await request(app)
        .post('/api/assign-orders')
        .send({ order_id: 1, courier_id: 1 });

        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty('error', 'Internal server error');
    });

    it('Debe retornar 400 si faltan parámetros', async () => {
        const response = await request(app)
        .post('/api/assign-orders')
        .send({ order_id: 1 }); // Falta courier_id

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'order_id y courier_id son requeridos.');
    });

    it('Debe consultar las asignaciones de órdenes correctamente', async () => {
        db.query.mockResolvedValueOnce({ rows: [
            {
                assignment_id: 1,
                assigned_at: '2024-01-01T00:00:00Z',
                courier_name: 'Juan Perez',
                courier_phone: '123456789',
                courier_license_plate: 'ABC123',
                order_id: 1,
                total: 100.0,
                payment_method: 'credit_card',
                status: 'delivered'
            }
        ] });

        const response = await request(app)
        .get('/api/assign-orders');
        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(1);
        expect(response.body[0]).toHaveProperty('assignment_id', 1);
        expect(response.body[0]).toHaveProperty('courier_name', 'Juan Perez');
    });

    it('Debe retornar 500 en caso de error del servidor al consultar asignaciones', async () => {
        db.query.mockRejectedValueOnce(new Error('DB error'));

        const response = await request(app)
        .get('/api/assign-orders');

        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty('error', 'Internal server error');
    });

    it('Debe retornar 404 si no hay asignaciones de órdenes disponibles', async () => {
        db.query.mockResolvedValueOnce({ rows: [] });

        const response = await request(app)
        .get('/api/assign-orders');

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'No hay asignaciones de órdenes disponibles.');
    });

    it('Debe consultar las asignaciones de órdenes por ID de repartidor correctamente', async () => {
        db.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Mock para existCourier
        .mockResolvedValueOnce({ rows: [
            {
                assignment_id: 1,
                assigned_at: '2024-01-01T00:00:00Z',
                courier_name: 'Juan Perez',
                courier_phone: '123456789',
                courier_license_plate: 'ABC123',
                order_id: 1,
                total: 100.0,
                payment_method: 'credit_card',
                status: 'delivered'
            }
        ] });

        const response = await request(app)
        .get('/api/assign-orders/courier/1');

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(1);
        expect(response.body[0]).toHaveProperty('assignment_id', 1);
        expect(response.body[0]).toHaveProperty('courier_name', 'Juan Perez');
    });

    it('Debe retornar 404 si el repartidor no existe al consultar por ID', async () => {
        db.query.mockResolvedValueOnce({ rows: [] }); // Mock para existCourier

        const response = await request(app)
        .get('/api/assign-orders/courier/999');

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'Repartidor no encontrado.');
    });;

    it('Debe retornar 404 si no existe asignación para el repartidor', async () => {
        db.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Mock para existCourier
        .mockResolvedValueOnce({ rows: [] }); // Mock para asignaciones

        const response = await request(app)
        .get('/api/assign-orders/courier/1');

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'No existe asignacion para este repartidor');
    });

    it('Debe retornar 500 en caso de error del servidor al consultar por ID de repartidor', async () => {
        db.query.mockRejectedValueOnce(new Error('DB error'));

        const response = await request(app)
        .get('/api/assign-orders/courier/1');

        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty('error', 'Internal server error');
    });

    it('Debe consultar las asignaciones de órdenes por ID de orden correctamente', async () => {
        db.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Mock para existOrder
        .mockResolvedValueOnce({ rows: [
            {
                assignment_id: 1,
                assigned_at: '2024-01-01T00:00:00Z',
                courier_name: 'Juan Perez',
                courier_phone: '123456789',
                courier_license_plate: 'ABC123',
                order_id: 1,
                total: 100.0,
                payment_method: 'credit_card',
                status: 'delivered'
            }
        ] });

        const response = await request(app)
        .get('/api/assign-orders/order/1');

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(1);
        expect(response.body[0]).toHaveProperty('assignment_id', 1);
        expect(response.body[0]).toHaveProperty('courier_name', 'Juan Perez');
    });

    it('Debe retornar 404 si la orden no existe al consultar por ID', async () => {
        db.query.mockResolvedValueOnce({ rows: [] }); // Mock para existOrder

        const response = await request(app)
        .get('/api/assign-orders/order/999');

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'No existe la orden.');
    });

    it('Debe retornar 404 si no existe asignación para la orden', async () => {
        db.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Mock para existOrder
        .mockResolvedValueOnce({ rows: [] }); // Mock para asignaciones

        const response = await request(app)
        .get('/api/assign-orders/order/1');

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'No existe asignación para esta orden');
    });

    it('Debe retornar 500 en caso de error del servidor al consultar por ID de orden', async () => {
        db.query.mockRejectedValueOnce(new Error('DB error'));

        const response = await request(app)
        .get('/api/assign-orders/order/1');

        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty('error', 'Internal server error');
    });

    it('Debe actualizar la asignación de orden correctamente', async () => {
        db.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // existOrder
        .mockResolvedValueOnce({ rows: [{ id: 2 }] }) // existCourier
        .mockResolvedValueOnce({ rows: [{ id: 1, order_id: 1, courier_id: 2 }] }); // update


        const response = await request(app)
        .put('/api/assign-orders/1')
        .send({ courier_id: 2 });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('mensaje', 'Asignación de orden actualizada exitosamente.');
        expect(response.body).toHaveProperty('assignOrder');
        expect(response.body.assignOrder).toEqual({ id: 1, order_id: 1, courier_id: 2 });
    });

    it('Debe retornar 404 si la orden no existe al actualizar', async () => {
        db.query.mockResolvedValueOnce({ rows: [] }); // existOrder

        const response = await request(app)
        .put('/api/assign-orders/999')
        .send({ courier_id: 2 });

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'No existe la orden.');
    });

    it('Debe retornar 404 si el repartidor no existe al actualizar', async () => {
        db.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // existOrder
        .mockResolvedValueOnce({ rows: [] }); // existCourier

        const response = await request(app)
        .put('/api/assign-orders/1')
        .send({ courier_id: 999 });

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'Repartidor no encontrado.');
    });

    it('Debe retornar 404 si no existe asignación para la orden al actualizar', async () => {
        db.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // existOrder
        .mockResolvedValueOnce({ rows: [{ id: 2 }] }) // existCourier
        .mockResolvedValueOnce({ rows: [] }); // update

        const response = await request(app)
        .put('/api/assign-orders/1')
        .send({ courier_id: 2 });

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'No existe asignación para esta orden');
    });

    it('Debe retornar 500 en caso de error del servidor al actualizar', async () => {
        db.query.mockRejectedValueOnce(new Error('DB error'));

        const response = await request(app)
        .put('/api/assign-orders/1')
        .send({ courier_id: 2 });

        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty('error', 'Internal server error');
    });

    it('Debe eliminar la asignación de orden correctamente', async () => {
        db.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // existOrder
        .mockResolvedValueOnce({ rows: [{ id: 1, order_id: 1, courier_id: 1 }] }); // delete

        const response = await request(app)
        .delete('/api/assign-orders/1');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('mensaje', 'Asignación de orden eliminada exitosamente');
        expect(response.body).toHaveProperty('assignOrder');
        expect(response.body.assignOrder).toEqual({ id: 1, order_id: 1, courier_id: 1 });
    });

    it('Debe retornar 404 si la orden no existe al eliminar', async () => {
        db.query.mockResolvedValueOnce({ rows: [] }); // existOrder

        const response = await request(app)
        .delete('/api/assign-orders/999');

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'No existe la orden.');
    });

    it('Debe retornar 404 si no existe asignación para la orden al eliminar', async () => {
        db.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // existOrder
        .mockResolvedValueOnce({ rows: [] }); // delete

        const response = await request(app)
        .delete('/api/assign-orders/1');

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'Asignamiento no encontrado.');
    });

    it('Debe retornar 500 en caso de error del servidor al eliminar', async () => {
        db.query.mockRejectedValueOnce(new Error('DB error'));

        const response = await request(app)
        .delete('/api/assign-orders/1');

        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty('error', 'Internal server error');
    });
});