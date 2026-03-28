jest.mock('../services/customer-service');

const request = require('supertest');
const app = require('../app');
const customerService = require('../services/customer-service');
const { ValidationError, NotFoundError, DuplicateError } = require('../errors/custom-errors');

describe('POST /api/customers', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create a valid customer with email', async () => {
        const mockCustomer = {
            id: 1,
            name: 'Juan Pérez',
            email: 'juan@example.com',
            phone: '1234567890',
            created_at: new Date()
        };

        customerService.addCustomer.mockResolvedValueOnce(mockCustomer);

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

    it('should create a valid customer WITHOUT email', async () => {
        const mockCustomer = {
            id: 2,
            name: 'María López',
            email: null,
            phone: '0987654321',
            created_at: new Date()
        };

        customerService.addCustomer.mockResolvedValueOnce(mockCustomer);

        const res = await request(app)
            .post('/api/customers')
            .send({
                name: 'María López',
                phone: '0987654321'
            });

        expect(res.status).toBe(201);
        expect(res.body.customer.email).toBe(null);
    });

    it('should fail if name is missing', async () => {
        customerService.addCustomer.mockRejectedValueOnce(
            new ValidationError('Nombre inválido (mínimo 2 caracteres)')
        );

        const res = await request(app)
            .post('/api/customers')
            .send({
                phone: '1234567890'
            });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('Nombre inválido');
    });

    it('should fail if phone is missing', async () => {
        customerService.addCustomer.mockRejectedValueOnce(
            new ValidationError('Teléfono inválido (mínimo 7 caracteres)')
        );

        const res = await request(app)
            .post('/api/customers')
            .send({
                name: 'Pedro García'
            });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('Teléfono inválido');
    });

    it('should fail if email is invalid', async () => {
        customerService.addCustomer.mockRejectedValueOnce(
            new ValidationError('Email inválido')
        );

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

    it('should fail if phone already exists', async () => {
        customerService.addCustomer.mockRejectedValueOnce(
            new DuplicateError('Ya existe un cliente con ese número de teléfono')
        );

        const res = await request(app)
            .post('/api/customers')
            .send({
                name: 'Pedro García',
                phone: '1234567890'
            });

        expect(res.status).toBe(409);
        expect(res.body.error).toBe('Ya existe un cliente con ese número de teléfono');
    });
});

describe('GET /api/customers', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should fetch customers', async () => {
        const mockCustomers = [
            { id: 1, name: 'Juan', email: 'juan@example.com', phone: '1111111111' },
            { id: 2, name: 'María', email: null, phone: '2222222222' }
        ];

        customerService.getAllCustomers.mockResolvedValueOnce(mockCustomers);

        const res = await request(app).get('/api/customers');

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(2);
        expect(res.body[0].name).toBe('Juan');
    });

    it('should fail fetching customers on DB error', async () => {
        customerService.getAllCustomers.mockRejectedValueOnce(new Error('DB error'));

        const res = await request(app).get('/api/customers');

        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Error interno del servidor');
    });
});

describe('GET /api/customers/phone/:phone', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should fetch customer by phone', async () => {
        const mockCustomer = {
            id: 1,
            name: 'Juan',
            email: 'juan@example.com',
            phone: '1234567890'
        };

        customerService.getCustomerByPhone.mockResolvedValueOnce(mockCustomer);

        const res = await request(app).get('/api/customers/phone/1234567890');

        expect(res.status).toBe(200);
        expect(res.body.name).toBe('Juan');
    });

    it('should fail if customer not found by phone', async () => {
        customerService.getCustomerByPhone.mockRejectedValueOnce(
            new NotFoundError('Cliente no encontrado')
        );

        const res = await request(app).get('/api/customers/phone/9999999999');

        expect(res.status).toBe(404);
        expect(res.body.error).toBe('Cliente no encontrado');
    });

    it('should fail with phone too short', async () => {
        customerService.getCustomerByPhone.mockRejectedValueOnce(
            new ValidationError('Teléfono inválido (mínimo 7 caracteres)')
        );

        const res = await request(app).get('/api/customers/phone/123');

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Teléfono inválido (mínimo 7 caracteres)');
    });
});

describe('PUT /api/customers/:id', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should fully update a customer', async () => {
        const mockCustomer = {
            id: 1,
            name: 'Juan Actualizado',
            email: 'nuevo@email.com',
            phone: '0987654321'
        };

        customerService.updateCustomer.mockResolvedValueOnce(mockCustomer);

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

    it('should fail if customer not found for update', async () => {
        customerService.updateCustomer.mockRejectedValueOnce(
            new NotFoundError('Cliente no encontrado')
        );

        const res = await request(app)
            .put('/api/customers/999')
            .send({
                name: 'No Existe',
                phone: '1234567890'
            });

        expect(res.status).toBe(404);
        expect(res.body.error).toBe('Cliente no encontrado');
    });
});

describe('PATCH /api/customers/:id', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should partially update a customer', async () => {
        const mockCustomer = {
            id: 1,
            name: 'Juan',
            email: 'juan@example.com',
            phone: '9999999999'
        };

        customerService.updateCustomerPartial.mockResolvedValueOnce(mockCustomer);

        const res = await request(app)
            .patch('/api/customers/1')
            .send({ phone: '9999999999' });

        expect(res.status).toBe(200);
        expect(res.body.customer.phone).toBe('9999999999');
    });

    it('should fail if no fields provided for update', async () => {
        customerService.updateCustomerPartial.mockRejectedValueOnce(
            new ValidationError('Debe proporcionar al menos un campo para actualizar')
        );

        const res = await request(app)
            .patch('/api/customers/1')
            .send({});

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('al menos un campo');
    });
});

describe('DELETE /api/customers/:id', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should delete a customer', async () => {
        const mockCustomer = {
            id: 1,
            name: 'Juan',
            email: 'juan@example.com',
            phone: '1234567890'
        };

        customerService.deleteCustomerById.mockResolvedValueOnce(mockCustomer);

        const res = await request(app).delete('/api/customers/1');

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Cliente eliminado exitosamente');
    });

    it('should fail if customer not found for deletion', async () => {
        customerService.deleteCustomerById.mockRejectedValueOnce(
            new NotFoundError('Cliente no encontrado')
        );

        const res = await request(app).delete('/api/customers/999');

        expect(res.status).toBe(404);
        expect(res.body.error).toBe('Cliente no encontrado');
    });

    it('should fail if customer has associated orders', async () => {
        customerService.deleteCustomerById.mockRejectedValueOnce(
            new ValidationError('No se puede eliminar el cliente porque tiene ordenes asociadas')
        );

        const res = await request(app).delete('/api/customers/1');

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('ordenes asociadas');
    });
});
