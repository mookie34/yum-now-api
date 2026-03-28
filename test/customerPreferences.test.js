jest.mock('../db', () => ({
    query: jest.fn(),
    end: jest.fn(),
    pool: {}
}));

const db = require('../db');
const request = require('supertest');
const app = require('../app');

describe('POST /api/customer-preferences (mock)',()=>{
    beforeEach(() => {
        db.query.mockReset();
    });

    it('should create a new customer preference', async () => {
        db.query
        .mockResolvedValueOnce({ rows: [{ id: 1}] }) // mock to verify customer_id
        .mockResolvedValueOnce({rows: [{ customer_id: 1, preference_key: 'default_payment_method', preference_value: 'nequi' }]
        });

        const res = await request(app)
            .post('/api/customer-preferences')
            .send({ customer_id: 1, preference_key: 'default_payment_method', preference_value: 'nequi' });

        expect(res.status).toBe(201);
        expect(res.body.message).toBe('Preferencia creada exitosamente');
        expect(res.body.preference.preference_key).toBe('default_payment_method');

    });

    it('should validate that customer_id is required', async () => {
        const res = await request(app)
            .post('/api/customer-preferences')
            .send({ preference_key: 'default_payment_method', preference_value: 'nequi' });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('customer_id es obligatorio');
    });

    it('should validate that customer_id exists in customers table', async () => {
        db.query.mockResolvedValueOnce({ rows: [] });

        const res = await request(app)
            .post('/api/customer-preferences')
            .send({ customer_id: 999, preference_key: 'default_payment_method', preference_value: 'nequi' });

        expect(res.status).toBe(404);
        expect(res.body.error).toBe('No existe un cliente con el customer_id proporcionado');
    });

    it('should handle internal server errors', async () => {
        db.query.mockRejectedValueOnce(new Error('Error de base de datos'));

        const res = await request(app)
            .post('/api/customer-preferences')
            .send({ customer_id: 1, preference_key: 'default_payment_method', preference_value: 'nequi' });

        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Error interno del servidor');
    });

    it('should validate that preference_key and preference_value are required', async () => {
        const res = await request(app)
            .post('/api/customer-preferences')
            .send({ customer_id: 1 });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('preference_key es obligatorio');
        expect(res.body.error).toContain('preference_value es obligatorio');
    });

    it('should validate that preference_value is not empty', async () => {
        const res = await request(app)
            .post('/api/customer-preferences')
            .send({ customer_id: 1, preference_key: 'default_payment_method', preference_value: '' });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('preference_value es obligatorio');
    });

    it('should validate that preference_key is not empty', async () => {
        const res = await request(app)
            .post('/api/customer-preferences')
            .send({ customer_id: 1, preference_key: '', preference_value: 'nequi' });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('preference_key es obligatorio');
    });

    it('should get all preferences for a customer', async () => {
        db.query
         .mockResolvedValueOnce({ rows: [{ id: 1}] })
        .mockResolvedValueOnce({rows: [
            { customer_id: 1, preference_key: 'default_payment_method', preference_value: 'nequi' },
            { customer_id: 1, preference_key: 'language', preference_value: 'es' }
        ]
        });

        const res = await request(app)
            .get('/api/customer-preferences/1');

        expect(res.status).toBe(200);
        expect(res.body.length).toBe(2);
        expect(res.body[0].preference_key).toBe('default_payment_method');
        expect(res.body[1].preference_key).toBe('language');

    });

    it('should return error when customer_id does not exist when fetching preferences', async () => {
        db.query.mockResolvedValueOnce({ rows: [] });

        const res = await request(app)
            .get('/api/customer-preferences/999');

        expect(res.status).toBe(404);
        expect(res.body.error).toBe('No existe un cliente con el customer_id proporcionado');
    });

    it('should return message when result is empty when fetching preferences', async () => {
        db.query
         .mockResolvedValueOnce({ rows: [{ id: 1}] })
        .mockResolvedValueOnce({rows: [] });

        const res = await request(app)
            .get('/api/customer-preferences/1');

        expect(res.status).toBe(200);
        expect(res.body.data).toEqual([]);
        expect(res.body.message).toBe('No se encontraron preferencias para este cliente.');
    });

    it('should handle internal server errors when fetching preferences', async () => {
        db.query.mockRejectedValueOnce(new Error('Error de base de datos'));

        const res = await request(app)
            .get('/api/customer-preferences/1');

        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Error interno del servidor');
    });

    it('should get a specific preference for a customer', async () => {
        db.query
         .mockResolvedValueOnce({ rows: [{ id: 1}] })
        .mockResolvedValueOnce({rows: [
            { customer_id: 1, preference_key: 'default_payment_method', preference_value: 'nequi' }
        ]
        });

        const res = await request(app)
            .get('/api/customer-preferences/customer/1/preference_key/default_payment_method');

        expect(res.status).toBe(200);
        expect(res.body.preference_key).toBe('default_payment_method');
        expect(res.body.preference_value).toBe('nequi');
    });

    it('should return error when customer_id does not exist when fetching specific preference', async () => {
        db.query.mockResolvedValueOnce({ rows: [] });

        const res = await request(app)
            .get('/api/customer-preferences/customer/999/preference_key/default_payment_method');

        expect(res.status).toBe(404);
        expect(res.body.error).toBe('No existe un cliente con el customer_id proporcionado');
    });

   it('should return error when specific preference does not exist for customer', async () => {
        db.query
         .mockResolvedValueOnce({ rows: [{ id: 1}] })
        .mockResolvedValueOnce({rows: [] });

        const res = await request(app)
            .get('/api/customer-preferences/customer/1/preference_key/non_existent_key');

        expect(res.status).toBe(404);
        expect(res.body.error).toBe('No se encontró la preferencia especificada para este cliente.');
    });

    it('should handle internal server errors when fetching specific preference', async () => {
        db.query.mockRejectedValueOnce(new Error('Error de base de datos'));

        const res = await request(app)
            .get('/api/customer-preferences/customer/1/preference_key/default_payment_method');

        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Error interno del servidor');
    });

    it('should validate that preference_key is not empty when fetching specific preference', async () => {
        const res = await request(app)
            .get('/api/customer-preferences/customer/1/preference_key/');

        expect(res.status).toBe(404); // Because the route won't match
    });

    it('should validate that customer_id is not empty when fetching specific preference', async () => {
        const res = await request(app)
            .get('/api/customer-preferences/customer//preference_key/default_payment_method');

        expect(res.status).toBe(404); // Because the route won't match
    });

    it('should update an existing customer preference', async () => {
        db.query
         .mockResolvedValueOnce({ rows: [{ id: 1}] }) // mock to verify customer_id
        .mockResolvedValueOnce({ rows: [{ customer_id: 1, preference_key: 'default_payment_method', preference_value: 'nequi' }] }) // mock to verify preference exists
        .mockResolvedValueOnce({ rows: [{ customer_id: 1, preference_key: 'default_payment_method', preference_value: 'daviplata' }] }); // mock for update

        const res = await request(app)
            .put('/api/customer-preferences/customer/1/preference_key/default_payment_method')
            .send({ customer_id: 1, preference_key: 'default_payment_method', preference_value: 'daviplata' });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Preferencia actualizada exitosamente.');
        expect(res.body.preference.preference_value).toBe('daviplata');
    });

    it('should validate that preference_value is required when updating a preference', async () => {
    const res = await request(app)
        .put('/api/customer-preferences/customer/1/preference_key/default_payment_method')
        .send({}); // without preference_value

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Debe proporcionar preference_value');
});

    it('should validate that customer_id exists in customers table when updating a preference', async () => {
        db.query.mockResolvedValueOnce({ rows: [] }); // customer does not exist

        const res = await request(app)
            .put('/api/customer-preferences/customer/999/preference_key/default_payment_method')
            .send({ preference_value: 'daviplata' });

        expect(res.status).toBe(404);
        expect(res.body.error).toBe('No existe un cliente con el customer_id proporcionado');
    });

    it('should validate that preference_value is not empty when updating a preference', async () => {
        const res = await request(app)
            .put('/api/customer-preferences/customer/1/preference_key/default_payment_method')
            .send({ preference_value: '' });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Debe proporcionar preference_value');
    });

    it('should return error when specific preference does not exist for customer when updating', async () => {
        db.query
            .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // mock: customer exists
            .mockResolvedValueOnce({ rows: [] });         // mock: preference does not exist

        const res = await request(app)
            .put('/api/customer-preferences/customer/1/preference_key/non_existent_key')
            .send({ preference_value: 'daviplata' });

        expect(res.status).toBe(404);
        expect(res.body.error).toBe('No se encontró la preferencia especificada para este cliente.');
    });

    it('should handle internal server errors when updating a preference', async () => {
        db.query.mockRejectedValueOnce(new Error('Error de base de datos'));

        const res = await request(app)
            .put('/api/customer-preferences/customer/1/preference_key/default_payment_method')
            .send({ preference_value: 'daviplata' });

        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Error interno del servidor');
    });

    it('should delete an existing customer preference', async () => {
        db.query
         .mockResolvedValueOnce({ rows: [{ id: 1}] }) // mock to verify customer_id
        .mockResolvedValueOnce({ rows: [{ customer_id: 1, preference_key: 'default_payment_method', preference_value: 'nequi' }] }) // mock to verify preference exists
        .mockResolvedValueOnce({ rows: [] }); // mock for deletion

        const res = await request(app)
            .delete('/api/customer-preferences/customer/1/preference_key/default_payment_method');

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Preferencia eliminada exitosamente.');
    });

    it('should validate that customer_id exists in customers table when deleting a preference', async () => {
        db.query.mockResolvedValueOnce({ rows: [] });

        const res = await request(app)
            .delete('/api/customer-preferences/customer/999/preference_key/default_payment_method');

        expect(res.status).toBe(404);
        expect(res.body.error).toBe('No existe un cliente con el customer_id proporcionado');
    });

    it('should return error when specific preference does not exist for customer when deleting', async () => {
        db.query
         .mockResolvedValueOnce({ rows: [{ id: 1}] }) // mock to verify customer_id
        .mockResolvedValueOnce({ rows: [] }); // mock to verify preference exists

        const res = await request(app)
            .delete('/api/customer-preferences/customer/1/preference_key/non_existent_key');

        expect(res.status).toBe(404);
        expect(res.body.error).toBe('No se encontró la preferencia especificada para este cliente.');
    });

    it('should handle internal server errors when deleting a preference', async () => {
        db.query.mockRejectedValueOnce(new Error('Error de base de datos'));

        const res = await request(app)
            .delete('/api/customer-preferences/customer/1/preference_key/default_payment_method');

        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Error interno del servidor');
    });

    it('should delete all preferences for a customer', async () => {
        db.query
         .mockResolvedValueOnce({ rows: [{ id: 1}] }) // mock to verify customer_id
        .mockResolvedValueOnce({ rows: [{ customer_id: 1, preference_key: 'default_payment_method', preference_value: 'nequi' }] }) // mock to verify preferences exist
        .mockResolvedValueOnce({ rows: [] }); // mock for deletion

        const res = await request(app)
            .delete('/api/customer-preferences/customer/1');

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Todas las preferencias del cliente fueron eliminadas exitosamente.');
    });

    it('should validate that customer_id exists in customers table when deleting all preferences', async () => {
        db.query.mockResolvedValueOnce({ rows: [] });

        const res = await request(app)
            .delete('/api/customer-preferences/customer/999');

        expect(res.status).toBe(404);
        expect(res.body.error).toBe('No existe un cliente con el customer_id proporcionado');
    });

    it('should return message when no preferences exist for customer when deleting all', async () => {
        db.query
         .mockResolvedValueOnce({ rows: [{ id: 1}] }) // mock to verify customer_id
        .mockResolvedValueOnce({ rows: [] }); // mock to verify preferences exist

        const res = await request(app)
            .delete('/api/customer-preferences/customer/1');

        expect(res.status).toBe(404);
        expect(res.body.error).toBe('No se encontraron preferencias para este cliente.');
    });

    it('should handle internal server errors when deleting all preferences', async () => {
        db.query.mockRejectedValueOnce(new Error('Error de base de datos'));

        const res = await request(app)
            .delete('/api/customer-preferences/customer/1');

        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Error interno del servidor');
    });


});
