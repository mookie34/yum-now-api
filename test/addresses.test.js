jest.mock('../services/addresses-service');
const request = require('supertest');
const app = require('../app');
const addressesService = require('../services/addresses-service');
const { ValidationError, NotFoundError, DuplicateError } = require('../errors/custom-errors');

describe('POST /api/addresses', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create an address successfully', async () => {
        const mockAddress = {
            id: 1,
            customer_id: 1,
            label: 'Casa',
            address_text: 'Calle Falsa 123',
            reference: 'Cerca del parque',
            latitude: 40.7128,
            longitude: -74.0060,
            is_primary: true
        };

        addressesService.addAddress.mockResolvedValueOnce(mockAddress);

        const res = await request(app)
            .post('/api/addresses')
            .send({
                customer_id: 1,
                label: 'Casa',
                address_text: 'Calle Falsa 123',
                reference: 'Cerca del parque',
                latitude: 40.7128,
                longitude: -74.0060,
                is_primary: true
            });

        expect(res.status).toBe(201);
        expect(res.body.message).toBe('Dirección creada exitosamente');
        expect(res.body.address).toEqual(mockAddress);
        expect(addressesService.addAddress).toHaveBeenCalledTimes(1);
    });

    it('should fail if customer_id is missing', async () => {
        addressesService.addAddress.mockRejectedValueOnce(
            new ValidationError('ID de cliente inválido')
        );

        const res = await request(app)
            .post('/api/addresses')
            .send({ label: 'Casa', address_text: 'Calle 123' });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('ID de cliente inválido');
    });

    it('should fail if label is missing', async () => {
        addressesService.addAddress.mockRejectedValueOnce(
            new ValidationError('La etiqueta es obligatoria')
        );

        const res = await request(app)
            .post('/api/addresses')
            .send({ customer_id: 1, address_text: 'Calle 123' });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('La etiqueta es obligatoria');
    });

    it('should fail if address_text is missing', async () => {
        addressesService.addAddress.mockRejectedValueOnce(
            new ValidationError('La dirección es obligatoria')
        );

        const res = await request(app)
            .post('/api/addresses')
            .send({ customer_id: 1, label: 'Casa' });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('La dirección es obligatoria');
    });

    it('should fail if customer does not exist', async () => {
        addressesService.addAddress.mockRejectedValueOnce(
            new NotFoundError('Cliente no encontrado')
        );

        const res = await request(app)
            .post('/api/addresses')
            .send({
                customer_id: 999,
                label: 'Casa',
                address_text: 'Calle 123'
            });

        expect(res.status).toBe(404);
        expect(res.body.error).toBe('Cliente no encontrado');
    });

    it('should handle internal server errors', async () => {
        addressesService.addAddress.mockRejectedValueOnce(
            new Error('Database connection error')
        );

        const res = await request(app)
            .post('/api/addresses')
            .send({
                customer_id: 1,
                label: 'Casa',
                address_text: 'Calle 123'
            });

        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Error interno del servidor');
    });
});

describe('GET /api/addresses', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should get all addresses', async () => {
        const mockAddresses = [
            { id: 1, customer_id: 1, label: 'Casa', address_text: 'Calle 1' },
            { id: 2, customer_id: 2, label: 'Oficina', address_text: 'Calle 2' }
        ];

        addressesService.getAllAddresses.mockResolvedValueOnce(mockAddresses);

        const res = await request(app).get('/api/addresses');

        expect(res.status).toBe(200);
        expect(res.body).toEqual(mockAddresses);
        expect(res.body.length).toBe(2);
    });

    it('should get addresses with custom limit', async () => {
        const mockAddresses = [
            { id: 1, customer_id: 1, label: 'Casa', address_text: 'Calle 1' }
        ];

        addressesService.getAllAddresses.mockResolvedValueOnce(mockAddresses);

        const res = await request(app).get('/api/addresses?limit=50');

        expect(res.status).toBe(200);
        expect(addressesService.getAllAddresses).toHaveBeenCalledWith('50', undefined);
    });

    it('should fail with invalid limit', async () => {
        addressesService.getAllAddresses.mockRejectedValueOnce(
            new ValidationError('El límite debe ser un número positivo')
        );

        const res = await request(app).get('/api/addresses?limit=-5');

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('El límite debe ser un número positivo');
    });
});

describe('GET /api/addresses/customer/:customer_id', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should get addresses by customer_id', async () => {
        const mockAddresses = [
            { id: 1, customer_id: 1, label: 'Casa', address_text: 'Calle 1' },
            { id: 2, customer_id: 1, label: 'Oficina', address_text: 'Calle 2' }
        ];

        addressesService.getAddressesByCustomerId.mockResolvedValueOnce(mockAddresses);

        const res = await request(app).get('/api/addresses/customer/1');

        expect(res.status).toBe(200);
        expect(res.body).toEqual(mockAddresses);
        expect(res.body.length).toBe(2);
    });

    it('should fail if no addresses found for customer', async () => {
        addressesService.getAddressesByCustomerId.mockRejectedValueOnce(
            new NotFoundError('No se encontraron direcciones para este cliente')
        );

        const res = await request(app).get('/api/addresses/customer/999');

        expect(res.status).toBe(404);
        expect(res.body.error).toBe('No se encontraron direcciones para este cliente');
    });

    it('should fail with invalid customer_id', async () => {
        addressesService.getAddressesByCustomerId.mockRejectedValueOnce(
            new ValidationError('ID inválido')
        );

        const res = await request(app).get('/api/addresses/customer/abc');

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('ID inválido');
    });
});

describe('GET /api/addresses/primary/:customer_id', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should get primary address for customer', async () => {
        const mockAddress = {
            id: 1,
            customer_id: 1,
            label: 'Casa',
            address_text: 'Calle 1',
            is_primary: true
        };

        addressesService.getPrimaryAddressByCustomerId.mockResolvedValueOnce(mockAddress);

        const res = await request(app).get('/api/addresses/primary/1');

        expect(res.status).toBe(200);
        expect(res.body).toEqual(mockAddress);
        expect(res.body.is_primary).toBe(true);
    });

    it('should fail if no primary address found', async () => {
        addressesService.getPrimaryAddressByCustomerId.mockRejectedValueOnce(
            new NotFoundError('No se encontró una dirección primaria para este cliente')
        );

        const res = await request(app).get('/api/addresses/primary/999');

        expect(res.status).toBe(404);
        expect(res.body.error).toContain('dirección primaria');
    });
});

describe('GET /api/addresses/:id', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should get an address by ID', async () => {
        const mockAddress = {
            id: 1,
            customer_id: 1,
            label: 'Casa',
            address_text: 'Calle 1'
        };

        addressesService.getAddressById.mockResolvedValueOnce(mockAddress);

        const res = await request(app).get('/api/addresses/1');

        expect(res.status).toBe(200);
        expect(res.body).toEqual(mockAddress);
    });

    it('should fail if address not found', async () => {
        addressesService.getAddressById.mockRejectedValueOnce(
            new NotFoundError('Dirección no encontrada')
        );

        const res = await request(app).get('/api/addresses/999');

        expect(res.status).toBe(404);
        expect(res.body.error).toBe('Dirección no encontrada');
    });
});

describe('PATCH /api/addresses/:id', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should partially update an address', async () => {
        const mockUpdatedAddress = {
            id: 1,
            customer_id: 1,
            label: 'Casa Actualizada',
            address_text: 'Calle 1'
        };

        addressesService.updateAddressPartial.mockResolvedValueOnce(mockUpdatedAddress);

        const res = await request(app)
            .patch('/api/addresses/1')
            .send({ label: 'Casa Actualizada' });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Dirección actualizada exitosamente');
        expect(res.body.address.label).toBe('Casa Actualizada');
    });

    it('should fail if address to update is not found', async () => {
        addressesService.updateAddressPartial.mockRejectedValueOnce(
            new NotFoundError('Dirección no encontrada')
        );

        const res = await request(app)
            .patch('/api/addresses/999')
            .send({ label: 'Nueva etiqueta' });

        expect(res.status).toBe(404);
        expect(res.body.error).toBe('Dirección no encontrada');
    });

    it('should fail with invalid data', async () => {
        addressesService.updateAddressPartial.mockRejectedValueOnce(
            new ValidationError('La etiqueta no debe exceder los 50 caracteres')
        );

        const res = await request(app)
            .patch('/api/addresses/1')
            .send({ label: 'A'.repeat(51) });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('50 caracteres');
    });
});

describe('PUT /api/addresses/:id', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should fully update an address', async () => {
        const mockUpdatedAddress = {
            id: 1,
            customer_id: 1,
            label: 'Oficina',
            address_text: 'Nueva Calle 123',
            reference: 'Nueva referencia',
            latitude: 10.5,
            longitude: -70.2,
            is_primary: false
        };

        addressesService.updateAddress.mockResolvedValueOnce(mockUpdatedAddress);

        const res = await request(app)
            .put('/api/addresses/1')
            .send({
                customer_id: 1,
                label: 'Oficina',
                address_text: 'Nueva Calle 123',
                reference: 'Nueva referencia',
                latitude: 10.5,
                longitude: -70.2,
                is_primary: false
            });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Dirección actualizada exitosamente');
        expect(res.body.address).toEqual(mockUpdatedAddress);
    });
});

describe('DELETE /api/addresses/:id', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should delete an address successfully', async () => {
        const mockDeletedAddress = {
            id: 1,
            customer_id: 1,
            label: 'Casa',
            address_text: 'Calle 1'
        };

        addressesService.deleteAddressById.mockResolvedValueOnce(mockDeletedAddress);

        const res = await request(app).delete('/api/addresses/1');

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Dirección eliminada exitosamente');
        expect(res.body.address).toEqual(mockDeletedAddress);
    });

    it('should fail when deleting a primary address', async () => {
        addressesService.deleteAddressById.mockRejectedValueOnce(
            new ValidationError('No se puede eliminar una dirección primaria')
        );

        const res = await request(app).delete('/api/addresses/1');

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('primaria');
    });

    it('should fail if address to delete is not found', async () => {
        addressesService.deleteAddressById.mockRejectedValueOnce(
            new NotFoundError('Dirección no encontrada')
        );

        const res = await request(app).delete('/api/addresses/999');

        expect(res.status).toBe(404);
        expect(res.body.error).toBe('Dirección no encontrada');
    });
});
