jest.mock('../db', () => ({
    query: jest.fn(),
    end: jest.fn(),
    pool: {}
}));

const db = require('../db');
const request = require('supertest');
const app = require('../app'); 

describe('POST /api/customers (mock)', () => {
    
    // Limpiar mocks antes de cada test
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('Debe crear un cliente válido con email (mock)', async () => {
        db.query.mockResolvedValueOnce({
            rows: [{
                id: 1,
                name: 'Juan Pérez',
                email: 'juan@example.com',
                phone: '1234567890',
                created_at: new Date()
            }]
        });
        
        const res = await request(app)
            .post('/api/customers')
            .send({
                name: 'Juan Pérez',
                email: 'juan@example.com',
                phone: '1234567890'
            });

        expect(res.status).toBe(201);
        expect(res.body.message).toBe('Cliente creado exitosamente');
        expect(res.body.customer.name).toBe('Juan Pérez');
        expect(res.body.customer.email).toBe('juan@example.com');
    });

    it('Debe crear un cliente válido SIN email (mock)', async () => {
        db.query.mockResolvedValueOnce({
            rows: [{
                id: 2,
                name: 'María López',
                email: null,
                phone: '0987654321',
                created_at: new Date()
            }]
        });
        
        const res = await request(app)
            .post('/api/customers')
            .send({
                name: 'María López',
                phone: '0987654321'
            });

        expect(res.status).toBe(201);
        expect(res.body.message).toBe('Cliente creado exitosamente');
        expect(res.body.customer.name).toBe('María López');
        expect(res.body.customer.email).toBe(null);
    });

    it('Debe fallar si falta el nombre (mock)', async () => {
        const res = await request(app)
            .post('/api/customers')
            .send({
                phone: '1234567890'
            });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('Nombre inválido');
    });

    it('Debe fallar si falta el teléfono (mock)', async () => {
        const res = await request(app)
            .post('/api/customers')
            .send({
                name: 'Pedro García'
            });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('Teléfono inválido');
    });

    it('Debe fallar si el email es inválido (mock)', async () => {
        const res = await request(app)
            .post('/api/customers')
            .send({
                name: 'Pedro García',
                phone: '1234567890',
                email: 'email-invalido'
            });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('Email inválido');
    });

    it('Debe fallar si el teléfono ya existe (mock)', async () => {
        const error = new Error('Duplicate key');
        error.code = '23505'; // PostgreSQL UNIQUE violation
        db.query.mockRejectedValueOnce(error);

        const res = await request(app)
            .post('/api/customers')
            .send({
                name: 'Pedro García',
                phone: '1234567890'
            });

        expect(res.status).toBe(409);
        expect(res.body.error).toBe('Ya existe un cliente con ese número de teléfono');
    });

    it('Debe consultar clientes con límite (mock)', async () => {
        db.query.mockResolvedValueOnce({
            rows: [
                { id: 1, name: 'Juan', email: 'juan@example.com', phone: '1111111111', created_at: new Date() },
                { id: 2, name: 'María', email: null, phone: '2222222222', created_at: new Date() }
            ]
        });

        const res = await request(app)
            .get('/api/customers');

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(2);
        expect(res.body[0].name).toBe('Juan');
        
        // Verificar que se llamó con límite
        expect(db.query).toHaveBeenCalledWith(
            expect.stringContaining('LIMIT'),
            [50] // Límite por defecto
        );
    });

    it('Debe consultar clientes con límite personalizado (mock)', async () => {
        db.query.mockResolvedValueOnce({
            rows: []
        });

        const res = await request(app)
            .get('/api/customers?limit=20');

        expect(res.status).toBe(200);
        expect(db.query).toHaveBeenCalledWith(
            expect.stringContaining('LIMIT'),
            [20]
        );
    });

    it('Debe fallar en la consulta de clientes (mock)', async () => {
        db.query.mockRejectedValueOnce(new Error('DB error'));

        const res = await request(app).get('/api/customers');
        
        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Error al obtener los clientes');
    });

    it('Debe consultar cliente por teléfono (mock)', async () => {
        db.query.mockResolvedValueOnce({
            rows: [{
                id: 1,
                name: 'Juan',
                email: 'juan@example.com',
                phone: '1234567890',
                created_at: new Date()
            }]
        });

        const res = await request(app)
            .get('/api/customers/phone/1234567890');

        expect(res.status).toBe(200);
        expect(res.body.name).toBe('Juan');
        expect(res.body.phone).toBe('1234567890');
    });

    it('Debe fallar si no encuentra cliente por teléfono (mock)', async () => {
        db.query.mockResolvedValueOnce({ rows: [] });

        const res = await request(app)
            .get('/api/customers/phone/9999999999');

        expect(res.status).toBe(404);
        expect(res.body.error).toBe('Cliente no encontrado');
    });

    it('Debe fallar con teléfono muy corto (mock)', async () => {
        const res = await request(app)
            .get('/api/customers/phone/123');

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Teléfono inválido');
    });

    it('Debe actualizar un cliente completo (mock)', async () => {
        db.query.mockResolvedValueOnce({
            rows: [{
                id: 1,
                name: 'Juan Actualizado',
                email: 'nuevo@email.com',
                phone: '0987654321',
                created_at: new Date()
            }]
        });

        const res = await request(app)
            .put('/api/customers/1')
            .send({
                name: 'Juan Actualizado',
                email: 'nuevo@email.com',
                phone: '0987654321'
            });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Cliente actualizado exitosamente');
        expect(res.body.customer.name).toBe('Juan Actualizado');
    });

    it('Debe fallar actualización con ID inválido (mock)', async () => {
        const res = await request(app)
            .put('/api/customers/abc')
            .send({
                name: 'Juan',
                phone: '1234567890'
            });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('ID inválido');
    });

    it('Debe fallar si no encuentra cliente para actualizar (mock)', async () => {
        db.query.mockResolvedValueOnce({ rows: [] });

        const res = await request(app)
            .put('/api/customers/999')
            .send({
                name: 'No Existe',
                phone: '1234567890'
            });

        expect(res.status).toBe(404);
        expect(res.body.error).toBe('Cliente no encontrado');
    });

    it('Debe actualizar cliente parcialmente (solo teléfono) (mock)', async () => {
        db.query.mockResolvedValueOnce({
            rows: [{
                id: 1,
                name: 'Juan',
                email: 'juan@example.com',
                phone: '9999999999',
                created_at: new Date()
            }]
        });

        const res = await request(app)
            .patch('/api/customers/1')
            .send({ phone: '9999999999' });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Cliente actualizado exitosamente');
        expect(res.body.customer.phone).toBe('9999999999');
    });

    it('Debe actualizar parcialmente (quitar email) (mock)', async () => {
        db.query.mockResolvedValueOnce({
            rows: [{
                id: 1,
                name: 'Juan',
                email: null,
                phone: '1234567890',
                created_at: new Date()
            }]
        });

        const res = await request(app)
            .patch('/api/customers/1')
            .send({ email: '' });

        expect(res.status).toBe(200);
        expect(res.body.customer.email).toBe(null);
    });

    it('Debe fallar si no hay campos para actualizar parcialmente (mock)', async () => {
        const res = await request(app)
            .patch('/api/customers/1')
            .send({});

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('al menos un campo');
    });

    it('Debe fallar actualización parcial con nombre muy corto (mock)', async () => {
        const res = await request(app)
            .patch('/api/customers/1')
            .send({ name: 'J' });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('Nombre inválido');
    });

    it('Debe eliminar un cliente (mock)', async () => {
        db.query.mockResolvedValueOnce({
            rows: [{
                id: 1,
                name: 'Juan',
                email: 'juan@example.com',
                phone: '1234567890'
            }]
        });

        const res = await request(app)
            .delete('/api/customers/1');

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Cliente eliminado exitosamente');
    });

    it('Debe fallar si no encuentra cliente para eliminar (mock)', async () => {
        db.query.mockResolvedValueOnce({ rows: [] });

        const res = await request(app)
            .delete('/api/customers/999');

        expect(res.status).toBe(404);
        expect(res.body.error).toBe('Cliente no encontrado');
    });

    it('Debe fallar si cliente tiene órdenes asociadas (mock)', async () => {
        const error = new Error('Foreign key violation');
        error.code = '23503';
        db.query.mockRejectedValueOnce(error);

        const res = await request(app)
            .delete('/api/customers/1');

        expect(res.status).toBe(409);
        expect(res.body.error).toContain('órdenes asociadas');
    });

    it('Debe fallar con error genérico al eliminar (mock)', async () => {
        db.query.mockRejectedValueOnce(new Error('DB error'));

        const res = await request(app)
            .delete('/api/customers/1');

        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Error al eliminar el cliente');
    });
});