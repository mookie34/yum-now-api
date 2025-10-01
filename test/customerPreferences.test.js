jest.mock('../db', () => ({
    query: jest.fn()
}));

const pool = require('../db');
const request = require('supertest');
const app = require('../app');

describe('POST /api/customer-preferences (mock)',()=>{
    it('Deberia crear una nueva preferencia de cliente', async () => {
        pool.query
        .mockResolvedValueOnce({ rows: [{ id: 1}] }) // Mock para verificar customer_id
        .mockResolvedValueOnce({rows: [{ customer_id: 1, preference_key: 'default_payment_method', preference_value: 'nequi' }]
        });

        const res = await request(app)
            .post('/api/customer-preferences')
            .send({ customer_id: 1, preference_key: 'default_payment_method', preference_value: 'nequi' });

        expect(res.status).toBe(201);
        expect(res.body.message).toBe('Preferencia creada exitosamente');
        expect(res.body.preferencia.preference_key).toBe('default_payment_method');

    });

    it('Deberia validar que el customer_id es obligatorio', async () => {
        const res = await request(app)
            .post('/api/customer-preferences')
            .send({ preference_key: 'default_payment_method', preference_value: 'nequi' });

        expect(res.status).toBe(500);
        expect(res.body.message).toBe('Debe proporcionar customer_id, preference_key y preference_value');
    });

    it('Deberia validar que el customer_id exista en la tabla customers', async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        const res = await request(app)
            .post('/api/customer-preferences')
            .send({ customer_id: 999, preference_key: 'default_payment_method', preference_value: 'nequi' });

        expect(res.status).toBe(404);
        expect(res.body.message).toBe('No existe un cliente con el customer_id proporcionado');
    });

    it('Deberia manejar errores internos del servidor', async () => {
        pool.query.mockRejectedValueOnce(new Error('Error de base de datos'));

        const res = await request(app)
            .post('/api/customer-preferences')
            .send({ customer_id: 1, preference_key: 'default_payment_method', preference_value: 'nequi' });

        expect(res.status).toBe(500);
        expect(res.body.message).toBe('Error interno del servidor');
    });

    it('Deberia validar que preference_key y preference_value son obligatorios', async () => {
        const res = await request(app)
            .post('/api/customer-preferences')
            .send({ customer_id: 1 });

        expect(res.status).toBe(500);
        expect(res.body.message).toBe('Debe proporcionar customer_id, preference_key y preference_value');
    });

    it('Deberia validar que preference_value no este vacio', async () => {
        const res = await request(app)
            .post('/api/customer-preferences')
            .send({ customer_id: 1, preference_key: 'default_payment_method', preference_value: '' });

        expect(res.status).toBe(500);
        expect(res.body.message).toBe('Debe proporcionar customer_id, preference_key y preference_value');
    });

    it('Deberia validar que preference_key no este vacio', async () => {
        const res = await request(app)
            .post('/api/customer-preferences')
            .send({ customer_id: 1, preference_key: '', preference_value: 'nequi' });

        expect(res.status).toBe(500);
        expect(res.body.message).toBe('Debe proporcionar customer_id, preference_key y preference_value');
    });

    it('Deberia obtener todas las preferencias de un cliente', async () => {
        pool.query
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

    it('Deberia devolver error cuando no existe el customer_id al obtener preferencias', async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        const res = await request(app)
            .get('/api/customer-preferences/999');

        expect(res.status).toBe(404);
        expect(res.body.message).toBe('No existe un cliente con el customer_id proporcionado');
    });

    it('Deberia devolver mensaje cuando el resultado es vacio al obtener preferencias', async () => {
        pool.query
         .mockResolvedValueOnce({ rows: [{ id: 1}] })
        .mockResolvedValueOnce({rows: [] });

        const res = await request(app)
            .get('/api/customer-preferences/1');

        expect(res.status).toBe(200);
        expect(res.body.data).toEqual([]);
        expect(res.body.message).toBe('No se encontraron preferencias para este cliente.');
    });

    it('Deberia manejar errores internos del servidor al obtener preferencias', async () => {
        pool.query.mockRejectedValueOnce(new Error('Error de base de datos'));

        const res = await request(app)
            .get('/api/customer-preferences/1');

        expect(res.status).toBe(500);
        expect(res.body.message).toBe('Error interno del servidor');
    });

    it('Deberia obtener una preferencia especifica de un cliente', async () => {
        pool.query
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

    it('Deberia devolver error cuando no existe el customer_id al obtener una preferencia especifica', async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        const res = await request(app)
            .get('/api/customer-preferences/customer/999/preference_key/default_payment_method');

        expect(res.status).toBe(404);
        expect(res.body.message).toBe('No existe un cliente con el customer_id proporcionado');
    });

   it('Deberia devolver error cuando no existe la preferencia especifica para el cliente', async () => {
        pool.query
         .mockResolvedValueOnce({ rows: [{ id: 1}] })
        .mockResolvedValueOnce({rows: [] });

        const res = await request(app)
            .get('/api/customer-preferences/customer/1/preference_key/non_existent_key');

        expect(res.status).toBe(404);
        expect(res.body.message).toBe('No se encontró la preferencia especificada para este cliente.');
    }); 

    it('Deberia manejar errores internos del servidor al obtener una preferencia especifica', async () => {
        pool.query.mockRejectedValueOnce(new Error('Error de base de datos'));

        const res = await request(app)
            .get('/api/customer-preferences/customer/1/preference_key/default_payment_method');

        expect(res.status).toBe(500);
        expect(res.body.message).toBe('Error interno del servidor');
    });

    it('Deberia validar que preference_key no este vacio al obtener una preferencia especifica', async () => {
        const res = await request(app)
            .get('/api/customer-preferences/customer/1/preference_key/');

        expect(res.status).toBe(404); // Because the route won't match
    });

    it('Deberia validar que customer_id no este vacio al obtener una preferencia especifica', async () => {
        const res = await request(app)
            .get('/api/customer-preferences/customer//preference_key/default_payment_method');

        expect(res.status).toBe(404); // Because the route won't match
    });

    it('Deberia actualizar una preferencia existente de un cliente', async () => {
        pool.query
         .mockResolvedValueOnce({ rows: [{ id: 1}] }) // Mock para verificar customer_id
        .mockResolvedValueOnce({ rows: [{ customer_id: 1, preference_key: 'default_payment_method', preference_value: 'nequi' }] }) // Mock para verificar existencia de preferencia
        .mockResolvedValueOnce({ rows: [{ customer_id: 1, preference_key: 'default_payment_method', preference_value: 'daviplata' }] }); // Mock para la actualización

        const res = await request(app)
            .put('/api/customer-preferences/customer/1/preference_key/default_payment_method')
            .send({ customer_id: 1, preference_key: 'default_payment_method', preference_value: 'daviplata' });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Preferencia actualizada exitosamente.');
        expect(res.body.preferencia.preference_value).toBe('daviplata');
    });

    it('Debería validar que preference_value es obligatorio al actualizar una preferencia', async () => {
    const res = await request(app)
        .put('/api/customer-preferences/customer/1/preference_key/default_payment_method')
        .send({}); // sin preference_value

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Debe proporcionar preference_value');
});

    it('Debería validar que el customer_id exista en la tabla customers al actualizar una preferencia', async () => {
        pool.query.mockResolvedValueOnce({ rows: [] }); // no existe el customer

        const res = await request(app)
            .put('/api/customer-preferences/customer/999/preference_key/default_payment_method')
            .send({ preference_value: 'daviplata' });

        expect(res.status).toBe(404);
        expect(res.body.message).toBe('No existe un cliente con el customer_id proporcionado');
    });

    it('Debería validar que preference_value no esté vacío al actualizar una preferencia', async () => {
        const res = await request(app)
            .put('/api/customer-preferences/customer/1/preference_key/default_payment_method')
            .send({ preference_value: '' });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Debe proporcionar preference_value');
    });

    it('Debería devolver error cuando no existe la preferencia específica para el cliente al actualizar', async () => {
        pool.query
            .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // mock: customer existe
            .mockResolvedValueOnce({ rows: [] });         // mock: preferencia no existe

        const res = await request(app)
            .put('/api/customer-preferences/customer/1/preference_key/non_existent_key')
            .send({ preference_value: 'daviplata' });

        expect(res.status).toBe(404);
        expect(res.body.message).toBe('No se encontró la preferencia especificada para este cliente.');
    });

    it('Debería manejar errores internos del servidor al actualizar una preferencia', async () => {
        pool.query.mockRejectedValueOnce(new Error('Error de base de datos'));

        const res = await request(app)
            .put('/api/customer-preferences/customer/1/preference_key/default_payment_method')
            .send({ preference_value: 'daviplata' });

        expect(res.status).toBe(500);
        expect(res.body.message).toBe('Error interno del servidor');
    });

    it('Deberia eliminar una preferencia existente de un cliente', async () => {
        pool.query
         .mockResolvedValueOnce({ rows: [{ id: 1}] }) // Mock para verificar customer_id
        .mockResolvedValueOnce({ rows: [{ customer_id: 1, preference_key: 'default_payment_method', preference_value: 'nequi' }] }) // Mock para verificar existencia de preferencia
        .mockResolvedValueOnce({ rows: [] }); // Mock para la eliminación

        const res = await request(app)
            .delete('/api/customer-preferences/customer/1/preference_key/default_payment_method');

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Preferencia eliminada exitosamente.');
    });

    it('Deberia validar que el customer_id exista en la tabla customers al eliminar una preferencia', async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        const res = await request(app)
            .delete('/api/customer-preferences/customer/999/preference_key/default_payment_method');

        expect(res.status).toBe(404);
        expect(res.body.message).toBe('No existe un cliente con el customer_id proporcionado');
    });

    it('Deberia devolver error cuando no existe la preferencia especifica para el cliente al eliminar', async () => {
        pool.query
         .mockResolvedValueOnce({ rows: [{ id: 1}] }) // Mock para verificar customer_id
        .mockResolvedValueOnce({ rows: [] }); // Mock para verificar existencia de preferencia

        const res = await request(app)
            .delete('/api/customer-preferences/customer/1/preference_key/non_existent_key');

        expect(res.status).toBe(404);
        expect(res.body.message).toBe('No se encontró la preferencia especificada para este cliente.');
    });

    it('Deberia manejar errores internos del servidor al eliminar una preferencia', async () => {
        pool.query.mockRejectedValueOnce(new Error('Error de base de datos'));

        const res = await request(app)
            .delete('/api/customer-preferences/customer/1/preference_key/default_payment_method');

        expect(res.status).toBe(500);
        expect(res.body.message).toBe('Error interno del servidor');
    });

    it('Deberia eliminar todas las preferencias de un cliente', async () => {
        pool.query
         .mockResolvedValueOnce({ rows: [{ id: 1}] }) // Mock para verificar customer_id
        .mockResolvedValueOnce({ rows: [{ customer_id: 1, preference_key: 'default_payment_method', preference_value: 'nequi' }] }) // Mock para verificar existencia de preferencias
        .mockResolvedValueOnce({ rows: [] }); // Mock para la eliminación

        const res = await request(app)
            .delete('/api/customer-preferences/customer/1');

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Todas las preferencias del cliente fueron eliminadas exitosamente.');
    });

    it('Deberia validar que el customer_id exista en la tabla customers al eliminar todas las preferencias', async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        const res = await request(app)
            .delete('/api/customer-preferences/customer/999');

        expect(res.status).toBe(404);
        expect(res.body.message).toBe('No existe un cliente con el customer_id proporcionado');
    });

    it('Deberia devolver mensaje cuando no existen preferencias para el cliente al eliminar todas', async () => {
        pool.query
         .mockResolvedValueOnce({ rows: [{ id: 1}] }) // Mock para verificar customer_id
        .mockResolvedValueOnce({ rows: [] }); // Mock para verificar existencia de preferencias

        const res = await request(app)
            .delete('/api/customer-preferences/customer/1');

        expect(res.status).toBe(404);
        expect(res.body.message).toBe('No se encontraron preferencias para este cliente.');
    });

    it('Deberia manejar errores internos del servidor al eliminar todas las preferencias', async () => {
        pool.query.mockRejectedValueOnce(new Error('Error de base de datos'));

        const res = await request(app)
            .delete('/api/customer-preferences/customer/1');

        expect(res.status).toBe(500);
        expect(res.body.message).toBe('Error interno del servidor');
    });


});