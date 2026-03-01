// Mock del service en lugar del db
jest.mock('../services/assignOrdersService');

const assignOrdersService = require('../services/assignOrdersService');
const request = require('supertest');
const app = require('../app');
const {
  ValidationError,
  NotFoundError,
  DuplicateError,
} = require('../errors/customErrors'); 

describe('POST /assignOrders', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('Debe crear una asignación de órdenes correctamente', async () => {
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
        expect(response.body).toHaveProperty('mensaje', 'Orden asignada exitosamente.');
        expect(response.body).toHaveProperty('assignOrder');
        expect(assignOrdersService.createAssignment).toHaveBeenCalledWith({
            order_id: 1,
            courier_id: 1
        });
    });

    it('Debe retornar 404 si la orden no existe', async () => {
        assignOrdersService.createAssignment.mockRejectedValue(
            new NotFoundError('No existe la orden')
        );

        const response = await request(app)
            .post('/api/assign-orders')
            .send({ order_id: 999, courier_id: 1 });

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'No existe la orden');
    });

    it('Debe retornar 404 si el repartidor no existe', async () => {
        assignOrdersService.createAssignment.mockRejectedValue(
            new NotFoundError('Repartidor no encontrado')
        );

        const response = await request(app)
            .post('/api/assign-orders')
            .send({ order_id: 1, courier_id: 999 });

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'Repartidor no encontrado');
    });

    it('Debe retornar 400 si la asignación ya existe', async () => {
        assignOrdersService.createAssignment.mockRejectedValue(
            new DuplicateError('La orden ya ha sido asignada a un repartidor')
        );

        const response = await request(app)
            .post('/api/assign-orders')
            .send({ order_id: 1, courier_id: 1 });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'La orden ya ha sido asignada a un repartidor');
    });

    it('Debe retornar 500 en caso de error del servidor', async () => {
        assignOrdersService.createAssignment.mockRejectedValue(
            new Error('DB error')
        );

        const response = await request(app)
            .post('/api/assign-orders')
            .send({ order_id: 1, courier_id: 1 });

        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty('error', 'Internal server error');
    });

    it('Debe retornar 400 si faltan parámetros', async () => {
        assignOrdersService.createAssignment.mockRejectedValue(
            new ValidationError('courier_id es requerido')
        );

        const response = await request(app)
            .post('/api/assign-orders')
            .send({ order_id: 1 }); // Falta courier_id

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
    });

    it('Debe consultar las asignaciones de órdenes correctamente', async () => {
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

    it('Debe retornar 500 en caso de error del servidor al consultar asignaciones', async () => {
        assignOrdersService.getAllAssignments.mockRejectedValue(
            new Error('DB error')
        );

        const response = await request(app)
            .get('/api/assign-orders');

        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty('error', 'Internal server error');
    });

    it('Debe retornar 404 si no hay asignaciones de órdenes disponibles', async () => {
        assignOrdersService.getAllAssignments.mockRejectedValue(
            new NotFoundError('No hay asignaciones de órdenes disponibles.')
        );

        const response = await request(app)
            .get('/api/assign-orders');

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'No hay asignaciones de órdenes disponibles.');
    });

    it('Debe consultar las asignaciones de órdenes por ID de repartidor correctamente', async () => {
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

    it('Debe retornar 404 si el repartidor no existe al consultar por ID', async () => {
        assignOrdersService.getAssignmentsByCourierId.mockRejectedValue(
            new NotFoundError('Repartidor no encontrado')
        );

        const response = await request(app)
            .get('/api/assign-orders/courier/999');

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'Repartidor no encontrado');
    });

    it('Debe retornar 404 si no existe asignación para el repartidor', async () => {
        assignOrdersService.getAssignmentsByCourierId.mockRejectedValue(
            new NotFoundError('No existe asignación para este repartidor')
        );

        const response = await request(app)
            .get('/api/assign-orders/courier/1');

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'No existe asignación para este repartidor');
    });

    it('Debe retornar 500 en caso de error del servidor al consultar por ID de repartidor', async () => {
        assignOrdersService.getAssignmentsByCourierId.mockRejectedValue(
            new Error('DB error')
        );

        const response = await request(app)
            .get('/api/assign-orders/courier/1');

        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty('error', 'Internal server error');
    });

    it('Debe consultar las asignaciones de órdenes por ID de orden correctamente', async () => {
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

    it('Debe retornar 404 si la orden no existe al consultar por ID', async () => {
        assignOrdersService.getAssignmentByOrderId.mockRejectedValue(
            new NotFoundError('No existe la orden')
        );

        const response = await request(app)
            .get('/api/assign-orders/order/999');

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'No existe la orden');
    });

    it('Debe retornar 404 si no existe asignación para la orden', async () => {
        assignOrdersService.getAssignmentByOrderId.mockRejectedValue(
            new NotFoundError('No existe asignación para esta orden')
        );

        const response = await request(app)
            .get('/api/assign-orders/order/1');

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'No existe asignación para esta orden');
    });

    it('Debe retornar 500 en caso de error del servidor al consultar por ID de orden', async () => {
        assignOrdersService.getAssignmentByOrderId.mockRejectedValue(
            new Error('DB error')
        );

        const response = await request(app)
            .get('/api/assign-orders/order/1');

        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty('error', 'Internal server error');
    });

    it('Debe actualizar la asignación de orden correctamente', async () => {
        assignOrdersService.updateAssignmentCourier.mockResolvedValue({
            id: 1,
            order_id: 1,
            courier_id: 2
        });

        const response = await request(app)
            .put('/api/assign-orders/1')
            .send({ courier_id: 2 });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('mensaje', 'Asignación de orden actualizada exitosamente.');
        expect(response.body).toHaveProperty('assignOrder');
        expect(response.body.assignOrder).toEqual({ id: 1, order_id: 1, courier_id: 2 });
    });

    it('Debe retornar 404 si la orden no existe al actualizar', async () => {
        assignOrdersService.updateAssignmentCourier.mockRejectedValue(
            new NotFoundError('No existe la orden')
        );

        const response = await request(app)
            .put('/api/assign-orders/999')
            .send({ courier_id: 2 });

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'No existe la orden');
    });

    it('Debe retornar 404 si el repartidor no existe al actualizar', async () => {
        assignOrdersService.updateAssignmentCourier.mockRejectedValue(
            new NotFoundError('Repartidor no encontrado')
        );

        const response = await request(app)
            .put('/api/assign-orders/1')
            .send({ courier_id: 999 });

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'Repartidor no encontrado');
    });

    it('Debe retornar 404 si no existe asignación para la orden al actualizar', async () => {
        assignOrdersService.updateAssignmentCourier.mockRejectedValue(
            new NotFoundError('No existe asignación para esta orden')
        );

        const response = await request(app)
            .put('/api/assign-orders/1')
            .send({ courier_id: 2 });

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'No existe asignación para esta orden');
    });

    it('Debe retornar 500 en caso de error del servidor al actualizar', async () => {
        assignOrdersService.updateAssignmentCourier.mockRejectedValue(
            new Error('DB error')
        );

        const response = await request(app)
            .put('/api/assign-orders/1')
            .send({ courier_id: 2 });

        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty('error', 'Internal server error');
    });

    it('Debe eliminar la asignación de orden correctamente', async () => {
        assignOrdersService.deleteAssignment.mockResolvedValue({
            id: 1,
            order_id: 1,
            courier_id: 1
        });

        const response = await request(app)
            .delete('/api/assign-orders/1');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('mensaje', 'Asignación de orden eliminada exitosamente');
        expect(response.body).toHaveProperty('assignOrder');
        expect(response.body.assignOrder).toEqual({ id: 1, order_id: 1, courier_id: 1 });
    });

    it('Debe retornar 404 si la orden no existe al eliminar', async () => {
        assignOrdersService.deleteAssignment.mockRejectedValue(
            new NotFoundError('No existe la orden')
        );

        const response = await request(app)
            .delete('/api/assign-orders/999');

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'No existe la orden');
    });

    it('Debe retornar 404 si no existe asignación para la orden al eliminar', async () => {
        assignOrdersService.deleteAssignment.mockRejectedValue(
            new NotFoundError('Asignamiento no encontrado')
        );

        const response = await request(app)
            .delete('/api/assign-orders/1');

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'Asignamiento no encontrado');
    });

    it('Debe retornar 500 en caso de error del servidor al eliminar', async () => {
        assignOrdersService.deleteAssignment.mockRejectedValue(
            new Error('DB error')
        );

        const response = await request(app)
            .delete('/api/assign-orders/1');

        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty('error', 'Internal server error');
    });
});