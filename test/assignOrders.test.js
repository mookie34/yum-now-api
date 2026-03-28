// Mock the service instead of db
jest.mock('../services/assign-orders-service');

const assignOrdersService = require('../services/assign-orders-service');
const request = require('supertest');
const app = require('../app');
const {
  ValidationError,
  NotFoundError,
  DuplicateError,
} = require('../errors/custom-errors');

describe('POST /assignOrders', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create an order assignment correctly', async () => {
        assignOrdersService.createAssignment.mockResolvedValue({
            id: 1,
            order_id: 1,
            courier_id: 1,
            assigned_at: new Date()
        });

        const response = await request(app)
            .post('/api/assign-orders')
            .send({ order_id: 1, courier_id: 1 });

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('message', 'Orden asignada exitosamente.');
        expect(response.body).toHaveProperty('assignOrder');
        expect(assignOrdersService.createAssignment).toHaveBeenCalledWith({
            order_id: 1,
            courier_id: 1
        });
    });

    it('should return 404 if order does not exist', async () => {
        assignOrdersService.createAssignment.mockRejectedValue(
            new NotFoundError('No existe la orden')
        );

        const response = await request(app)
            .post('/api/assign-orders')
            .send({ order_id: 999, courier_id: 1 });

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'No existe la orden');
    });

    it('should return 404 if courier does not exist', async () => {
        assignOrdersService.createAssignment.mockRejectedValue(
            new NotFoundError('Repartidor no encontrado')
        );

        const response = await request(app)
            .post('/api/assign-orders')
            .send({ order_id: 1, courier_id: 999 });

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'Repartidor no encontrado');
    });

    it('should return 409 if assignment already exists', async () => {
        assignOrdersService.createAssignment.mockRejectedValue(
            new DuplicateError('La orden ya ha sido asignada a un repartidor')
        );

        const response = await request(app)
            .post('/api/assign-orders')
            .send({ order_id: 1, courier_id: 1 });

        expect(response.status).toBe(409);
        expect(response.body).toHaveProperty('error', 'La orden ya ha sido asignada a un repartidor');
    });

    it('should return 500 on server error', async () => {
        assignOrdersService.createAssignment.mockRejectedValue(
            new Error('DB error')
        );

        const response = await request(app)
            .post('/api/assign-orders')
            .send({ order_id: 1, courier_id: 1 });

        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty('error', 'Error interno del servidor');
    });

    it('should return 400 if parameters are missing', async () => {
        assignOrdersService.createAssignment.mockRejectedValue(
            new ValidationError('courier_id es requerido')
        );

        const response = await request(app)
            .post('/api/assign-orders')
            .send({ order_id: 1 }); // courier_id missing

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
    });

    it('should fetch all order assignments correctly', async () => {
        assignOrdersService.getAllAssignments.mockResolvedValue([
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
        ]);

        const response = await request(app)
            .get('/api/assign-orders');

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(1);
        expect(response.body[0]).toHaveProperty('assignment_id', 1);
        expect(response.body[0]).toHaveProperty('courier_name', 'Juan Perez');
    });

    it('should return 500 on server error when fetching assignments', async () => {
        assignOrdersService.getAllAssignments.mockRejectedValue(
            new Error('DB error')
        );

        const response = await request(app)
            .get('/api/assign-orders');

        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty('error', 'Error interno del servidor');
    });

    it('should return 404 if no order assignments available', async () => {
        assignOrdersService.getAllAssignments.mockRejectedValue(
            new NotFoundError('No hay asignaciones de órdenes disponibles.')
        );

        const response = await request(app)
            .get('/api/assign-orders');

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'No hay asignaciones de órdenes disponibles.');
    });

    it('should fetch order assignments by courier ID correctly', async () => {
        assignOrdersService.getAssignmentsByCourierId.mockResolvedValue([
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
        ]);

        const response = await request(app)
            .get('/api/assign-orders/courier/1');

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(1);
        expect(response.body[0]).toHaveProperty('assignment_id', 1);
        expect(response.body[0]).toHaveProperty('courier_name', 'Juan Perez');
    });

    it('should return 404 if courier does not exist when fetching by ID', async () => {
        assignOrdersService.getAssignmentsByCourierId.mockRejectedValue(
            new NotFoundError('Repartidor no encontrado')
        );

        const response = await request(app)
            .get('/api/assign-orders/courier/999');

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'Repartidor no encontrado');
    });

    it('should return 404 if no assignment exists for courier', async () => {
        assignOrdersService.getAssignmentsByCourierId.mockRejectedValue(
            new NotFoundError('No existe asignación para este repartidor')
        );

        const response = await request(app)
            .get('/api/assign-orders/courier/1');

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'No existe asignación para este repartidor');
    });

    it('should return 500 on server error when fetching by courier ID', async () => {
        assignOrdersService.getAssignmentsByCourierId.mockRejectedValue(
            new Error('DB error')
        );

        const response = await request(app)
            .get('/api/assign-orders/courier/1');

        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty('error', 'Error interno del servidor');
    });

    it('should fetch order assignment by order ID correctly', async () => {
        assignOrdersService.getAssignmentByOrderId.mockResolvedValue({
            assignment_id: 1,
            assigned_at: '2024-01-01T00:00:00Z',
            courier_name: 'Juan Perez',
            courier_phone: '123456789',
            courier_license_plate: 'ABC123',
            order_id: 1,
            total: 100.0,
            payment_method: 'credit_card',
            status: 'delivered'
        });

        const response = await request(app)
            .get('/api/assign-orders/order/1');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('assignment_id', 1);
        expect(response.body).toHaveProperty('courier_name', 'Juan Perez');
    });

    it('should return 404 if order does not exist when fetching by ID', async () => {
        assignOrdersService.getAssignmentByOrderId.mockRejectedValue(
            new NotFoundError('No existe la orden')
        );

        const response = await request(app)
            .get('/api/assign-orders/order/999');

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'No existe la orden');
    });

    it('should return 404 if no assignment exists for order', async () => {
        assignOrdersService.getAssignmentByOrderId.mockRejectedValue(
            new NotFoundError('No existe asignación para esta orden')
        );

        const response = await request(app)
            .get('/api/assign-orders/order/1');

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'No existe asignación para esta orden');
    });

    it('should return 500 on server error when fetching by order ID', async () => {
        assignOrdersService.getAssignmentByOrderId.mockRejectedValue(
            new Error('DB error')
        );

        const response = await request(app)
            .get('/api/assign-orders/order/1');

        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty('error', 'Error interno del servidor');
    });

    it('should update order assignment correctly', async () => {
        assignOrdersService.updateAssignmentCourier.mockResolvedValue({
            id: 1,
            order_id: 1,
            courier_id: 2
        });

        const response = await request(app)
            .put('/api/assign-orders/1')
            .send({ courier_id: 2 });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message', 'Asignación de orden actualizada exitosamente.');
        expect(response.body).toHaveProperty('assignOrder');
        expect(response.body.assignOrder).toEqual({ id: 1, order_id: 1, courier_id: 2 });
    });

    it('should return 404 if order does not exist when updating', async () => {
        assignOrdersService.updateAssignmentCourier.mockRejectedValue(
            new NotFoundError('No existe la orden')
        );

        const response = await request(app)
            .put('/api/assign-orders/999')
            .send({ courier_id: 2 });

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'No existe la orden');
    });

    it('should return 404 if courier does not exist when updating', async () => {
        assignOrdersService.updateAssignmentCourier.mockRejectedValue(
            new NotFoundError('Repartidor no encontrado')
        );

        const response = await request(app)
            .put('/api/assign-orders/1')
            .send({ courier_id: 999 });

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'Repartidor no encontrado');
    });

    it('should return 404 if no assignment exists for order when updating', async () => {
        assignOrdersService.updateAssignmentCourier.mockRejectedValue(
            new NotFoundError('No existe asignación para esta orden')
        );

        const response = await request(app)
            .put('/api/assign-orders/1')
            .send({ courier_id: 2 });

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'No existe asignación para esta orden');
    });

    it('should return 500 on server error when updating', async () => {
        assignOrdersService.updateAssignmentCourier.mockRejectedValue(
            new Error('DB error')
        );

        const response = await request(app)
            .put('/api/assign-orders/1')
            .send({ courier_id: 2 });

        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty('error', 'Error interno del servidor');
    });

    it('should delete order assignment correctly', async () => {
        assignOrdersService.deleteAssignment.mockResolvedValue({
            id: 1,
            order_id: 1,
            courier_id: 1
        });

        const response = await request(app)
            .delete('/api/assign-orders/1');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message', 'Asignación de orden eliminada exitosamente');
        expect(response.body).toHaveProperty('assignOrder');
        expect(response.body.assignOrder).toEqual({ id: 1, order_id: 1, courier_id: 1 });
    });

    it('should return 404 if order does not exist when deleting', async () => {
        assignOrdersService.deleteAssignment.mockRejectedValue(
            new NotFoundError('No existe la orden')
        );

        const response = await request(app)
            .delete('/api/assign-orders/999');

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'No existe la orden');
    });

    it('should return 404 if no assignment exists for order when deleting', async () => {
        assignOrdersService.deleteAssignment.mockRejectedValue(
            new NotFoundError('Asignamiento no encontrado')
        );

        const response = await request(app)
            .delete('/api/assign-orders/1');

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'Asignamiento no encontrado');
    });

    it('should return 500 on server error when deleting', async () => {
        assignOrdersService.deleteAssignment.mockRejectedValue(
            new Error('DB error')
        );

        const response = await request(app)
            .delete('/api/assign-orders/1');

        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty('error', 'Error interno del servidor');
    });
});
