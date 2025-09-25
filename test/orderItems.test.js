jest.mock('../db', () => ({
  query: jest.fn(),
}));

const db = require('../db');
const request = require('supertest');
const app = require('../app'); 
const pool = require('../db');

describe('Order Items API', () => {
    it('Debería agregar un item de orden', async () => {
        pool.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) 
        .mockResolvedValueOnce({ rows: [{ price: 50 }] })
        .mockResolvedValueOnce(({ rows: [{ order_id: 1,product_id:1,quantity:2,price: 50  }] }));
       
        const res = await request(app).post('/api/order-items').send({ order_id: 1, product_id: 1, quantity: 2 });

        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('message', 'Item de orden creado exitosamente');
        expect(res.body).toHaveProperty('orderItem');
    });

    it('Deberia validarr datos faltantes al agregar item de orden', async () => {
        const res = await request(app).post('/api/order-items').send({ product_id: 1, quantity: 2 });
        expect(res.statusCode).toEqual(400);
        expect(res.body).toHaveProperty('error', 'Faltan datos: order_id, product_id, quantity');
    });

    it('Deberia retornar error si el order_id no existe al agregar item de orden', async () => {
        pool.query
        .mockResolvedValueOnce({ rows: [] });

        const res = await request(app).post('/api/order-items').send({ order_id: 999, product_id: 1, quantity: 2 });
        expect(res.statusCode).toEqual(404);
        expect(res.body).toHaveProperty('error', 'Orden no encontrada');
    });

    it('Deberia retornar error si el product_id no existe al agregar item de orden', async () => {
        pool.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) 
        .mockResolvedValueOnce({ rows: [] });

        const res = await request(app).post('/api/order-items').send({ order_id: 1, product_id: 999, quantity: 2 });
        expect(res.statusCode).toEqual(404);
        expect(res.body).toHaveProperty('error', 'Producto no encontrado');
    });

    it('Debería devolver error 500 si hay un problema con la base de datos al agregar item de orden', async () => {
        pool.query.mockRejectedValue(new Error('DB error'));
        const res = await request(app).post('/api/order-items').send({ order_id: 1, product_id: 1, quantity: 2 });
        expect(res.statusCode).toEqual(500);
        expect(res.body).toHaveProperty('error', 'Error al guardar el item de orden en la base de datos');
    });

    it('Debería obtener todos los items de orden', async () => {
        pool.query.mockResolvedValue({ rows: [{ order_id: 1, product_id: 1, quantity: 2, price: 50 }] });
        const res = await request(app).get('/api/order-items');
        expect(res.statusCode).toEqual(200);
        expect(res.body.length).toBeGreaterThan(0);
    });

    it('Debería devolver error 500 si hay un problema con la base de datos al obtener todos los items de orden', async () => {
        pool.query.mockRejectedValue(new Error('DB error'));
        const res = await request(app).get('/api/order-items');
        expect(res.statusCode).toEqual(500);
        expect(res.body).toHaveProperty('error', 'Error al obtener los items de orden desde la base de datos');
    });

    it('Debería obtener items de orden por order_id', async () => {
        pool.query.mockResolvedValue({ rows: [{ order_id: 1, product_id: 1, quantity: 2, price: 50 }] });
        const res = await request(app).get('/api/order-items/order/1');
        expect(res.statusCode).toEqual(200);
        expect(res.body.length).toBeGreaterThan(0);
    });

    it('Debería devolver 404 si no se encuentran items de orden para el order_id proporcionado', async () => {
        pool.query.mockResolvedValue({ rows: [] });
        const res = await request(app).get('/api/order-items/order/999');
        expect(res.statusCode).toEqual(404);
        expect(res.body).toHaveProperty('error', 'No se encontraron items de orden para el ID de orden proporcionado');
    });

    it('Debería devolver error 500 si hay un problema con la base de datos al obtener items de orden por order_id', async () => {
        pool.query.mockRejectedValue(new Error('DB error'));
        const res = await request(app).get('/api/order-items/order/1');
        expect(res.statusCode).toEqual(500);
        expect(res.body).toHaveProperty('error', 'Error al obtener los items de orden desde la base de datos');
    });

   it('Deberia eliminar todos los items de orden', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }, { id: 2 }, { id: 3 }] });

    const res = await request(app).delete('/api/order-items/order/1'); 
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('message', 'Items de orden eliminados exitosamente'); 
    expect(res.body.deletedItems).toHaveLength(3);
    });

    it('Deberia retornar 404 si no hay items de orden para eliminar', async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });
        const res = await request(app).delete('/api/order-items/order/999'); 
        expect(res.statusCode).toEqual(404);
        expect(res.body).toHaveProperty('error', 'No se encontraron items de orden para el ID de orden proporcionado');
    });

    it('Debería devolver error 500 si hay un problema con la base de datos al eliminar items de orden', async () => {
        pool.query.mockRejectedValue(new Error('DB error'));
        const res = await request(app).delete('/api/order-items/order/1');
        expect(res.statusCode).toEqual(500);
        expect(res.body).toHaveProperty('error', 'Error al eliminar los items de orden desde la base de datos');
    });

    it('Deberia eliminar un item de orden por order_id y product_id', async () => {
        pool.query
        // SELECT order
        .mockResolvedValueOnce({ rows: [{ id: 1 }] })
        // SELECT product
        .mockResolvedValueOnce({ rows: [{ id: 1 }] })
        // DELETE FROM order_items ...
        .mockResolvedValueOnce({ rows: [{ id: 1, order_id: 1, product_id: 1 }] });
        
        const res = await request(app).delete('/api/order-items/order/1/product/1');
    
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('message', 'Item de orden eliminado exitosamente');
        expect(res.body).toHaveProperty('deletedItem');
    });

    it('Deberia retornar 404 si el order_id no existe al eliminar item de orden', async () => {
        pool.query
        .mockResolvedValueOnce({ rows: [] }); // Simula que no se encuentra la orden
        const res = await request(app).delete('/api/order-items/order/999/product/1');
        expect(res.statusCode).toEqual(404);
        expect(res.body).toHaveProperty('error', 'Orden no encontrada');
    });

    it('Deberia retornar 404 si el product_id no existe al eliminar item de orden', async () => {
        pool.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Simula que la orden existe
        .mockResolvedValueOnce({ rows: [] }); // Simula que no se encuentra el producto
        const res = await request(app).delete('/api/order-items/order/1/product/999');
        expect(res.statusCode).toEqual(404);
        expect(res.body).toHaveProperty('error', 'Producto no encontrado');
    }); 

    it('Debería devolver 404 si no se encuentra el item de orden para eliminar', async () => {
        pool.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Simula que la orden existe
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Simula que el producto existe
        .mockResolvedValueOnce({ rows: [] }); // Simula que no se encuentra el item de orden

        const res = await request(app).delete('/api/order-items/order/1/product/1');
        expect(res.statusCode).toEqual(404);
        expect(res.body).toHaveProperty('error', 'No se encontraron items de orden para el ID de orden y producto proporcionados');
    });

    it('Debería devolver error 500 si hay un problema con la base de datos al eliminar item de orden', async () => {
        pool.query.mockRejectedValue(new Error('DB error'));
        const res = await request(app).delete('/api/order-items/order/1/product/1');
        expect(res.statusCode).toEqual(500);
        expect(res.body).toHaveProperty('error', 'Error al eliminar el item de orden desde la base de datos');
    });

    it('Deberia actualizar cantidad y/o precio en un item de orden', async () => {
        pool.query
        // SELECT order
        .mockResolvedValueOnce({ rows: [{ id: 1 }] })
        // SELECT product
        .mockResolvedValueOnce({ rows: [{ id: 1 }] })
        // UPDATE order_items ...
        .mockResolvedValueOnce({ rows: [{ id: 1, order_id: 1, product_id: 1, quantity: 5, price: 100 }] });

        const res = await request(app).patch('/api/order-items/order/1/product/1').send({ quantity: 5, price: 100 });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('message', 'Item de orden actualizado exitosamente');
        expect(res.body).toHaveProperty('updatedItem');
    });

    it('Deberia retornar 400 si no se envian quantity o price al actualizar item de orden', async () => {
        const res = await request(app).patch('/api/order-items/order/1/product/1').send({});
        expect(res.statusCode).toEqual(400);
        expect(res.body).toHaveProperty('error', 'Faltan datos: quantity o price');
    });

    it('Debería devolver 404 si no encuentra la orden para actualizar item de orden', async () => {
        pool.query
        .mockResolvedValueOnce({ rows: [] }); // Simula que no se encuentra la orden
        const res = await request(app).patch('/api/order-items/order/999/product/1').send({ quantity: 5 });
        expect(res.statusCode).toEqual(404);
        expect(res.body).toHaveProperty('error', 'Orden no encontrada');
    });

    it('Debería devolver 404 si no encuentra el producto para actualizar item de orden', async () => {
        pool.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Simula que la orden existe
        .mockResolvedValueOnce({ rows: [] });

        const res = await request(app).patch('/api/order-items/order/1/product/999').send({ quantity: 5 });
        expect(res.statusCode).toEqual(404);
        expect(res.body).toHaveProperty('error', 'Producto no encontrado');
    });

    it('Debería devolver 404 si no se encuentra el item de orden para actualizar', async () => {
        pool.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Simula que la orden existe
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Simula que el producto existe
        .mockResolvedValueOnce({ rows: [] }); // Simula que no se encuentra el item de orden

        const res = await request(app).patch('/api/order-items/order/1/product/1').send({ quantity: 5 });
        expect(res.statusCode).toEqual(404);
        expect(res.body).toHaveProperty('error', 'No se encontraron items de orden para el ID de orden y producto proporcionados');
    });

    it('Debería devolver error 500 si hay un problema con la base de datos al actualizar item de orden', async () => {
        pool.query.mockRejectedValue(new Error('DB error'));
        const res = await request(app).patch('/api/order-items/order/1/product/1').send({ quantity: 5 });
        expect(res.statusCode).toEqual(500);
        expect(res.body).toHaveProperty('error', 'Error al actualizar el item de orden en la base de datos');
    });

});