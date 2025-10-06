jest.mock('../services/customerService');

const request = require('supertest');
const app = require('../app');
const customerService = require('../services/customerService');
const { ValidationError, NotFoundError, DuplicateError } = require('../errors/customErrors');

describe('POST /api/customers', () => {
    
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('Debe crear un cliente válido con email', async () => {
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

    it('Debe crear un cliente válido SIN email', async () => {
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

    it('Debe fallar si falta el nombre', async () => {
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

    it('Debe fallar si falta el teléfono', async () => {
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

    it('Debe fallar si el email es inválido', async () => {
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

    it('Debe fallar si el teléfono ya existe', async () => {
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

    it('Debe consultar clientes', async () => {
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

    it('Debe fallar en la consulta de clientes', async () => {
        customerService.getAllCustomers.mockRejectedValueOnce(new Error('DB error'));

        const res = await request(app).get('/api/customers');
        
        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Error al obtener los clientes');
    });
});

describe('GET /api/customers/phone/:phone', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('Debe consultar cliente por teléfono', async () => {
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

    it('Debe fallar si no encuentra cliente por teléfono', async () => {
        customerService.getCustomerByPhone.mockRejectedValueOnce(
            new NotFoundError('Cliente no encontrado')
        );

        const res = await request(app).get('/api/customers/phone/9999999999');

        expect(res.status).toBe(404);
        expect(res.body.error).toBe('Cliente no encontrado');
    });

    it('Debe fallar con teléfono muy corto', async () => {
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

    it('Debe actualizar un cliente completo', async () => {
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

    it('Debe fallar si no encuentra cliente para actualizar', async () => {
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

    it('Debe actualizar cliente parcialmente', async () => {
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

    it('Debe fallar si no hay campos para actualizar', async () => {
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

    it('Debe eliminar un cliente', async () => {
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

    it('Debe fallar si no encuentra cliente para eliminar', async () => {
        customerService.deleteCustomerById.mockRejectedValueOnce(
            new NotFoundError('Cliente no encontrado')
        );

        const res = await request(app).delete('/api/customers/999');

        expect(res.status).toBe(404);
        expect(res.body.error).toBe('Cliente no encontrado');
    });

    it('Debe fallar si cliente tiene órdenes asociadas', async () => {
        customerService.deleteCustomerById.mockRejectedValueOnce(
            new ValidationError('No se puede eliminar el cliente porque tiene ordenes asociadas')
        );

        const res = await request(app).delete('/api/customers/1');

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('ordenes asociadas');
    });
});