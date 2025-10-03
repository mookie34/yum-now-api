jest.mock('../db', () => ({
    query: jest.fn(),
    end: jest.fn(),
    pool: {}
}));

const db = require('../db');
const request = require('supertest');
const app = require('../app'); 

describe('POST /api/products (mock)',()=>{
    it('Debe crear un producto válido (mock)', async()=>{
        db.query.mockResolvedValueOnce({
            rows: [{id:1,name:'Producto 1',description:'Descripción del producto 1',price:100.50}]
        });
        
        const res = await request(app)
        .post('/api/products')
        .send({name:'Producto 1',description:'Descripción del producto 1',price:100.50});

        expect(res.status).toBe(201);
        expect(res.body.message).toBe('Producto creado exitosamente');
        expect(res.body.product.name).toBe('Producto 1');
    });

    it('Debe fallar si falta algún dato (mock)', async()=>{
        const res = await request(app)
        .post('/api/products')
        .send({description:'Descripción del producto 1',price:100.50});

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Faltan datos: nombre o precio');
    });

    it('Debe manejar errores de base de datos (mock)', async()=>{
        db.query.mockRejectedValueOnce(new Error('DB error'));

        const res = await request(app)
        .post('/api/products')
        .send({name:'Producto 1',description:'Descripción del producto 1',price:100.50});

        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Error al guardar el producto en la base de datos');
    });

    it('Debe obtener todos los productos (mock)', async()=>{
        db.query.mockResolvedValueOnce({
            rows: [
                {id:1,name:'Producto 1',description:'Descripción del producto 1',price:100.50},
                {id:2,name:'Producto 2',description:'Descripción del producto 2',price:200.75}
            ]
        });

        const res = await request(app)
        .get('/api/products');

        expect(res.status).toBe(200);
        expect(res.body.length).toBe(2);
        expect(res.body[0].name).toBe('Producto 1');
    });

    it('Debe manejar errores al obtener productos (mock)', async()=>{
        db.query.mockRejectedValueOnce(new Error('DB error'));

        const res = await request(app)
        .get('/api/products');

        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Error al obtener los productos');
    });

    it('Debe filtrar productos (mock)', async()=>{
        db.query.mockResolvedValueOnce({
            rows: [
                {id:2,name:'Producto 2',description:'Descripción del producto 2',price:200.75}
            ]
        });

        const res = await request(app)
        .get('/api/products/filter')
        .query({min_price:150});

        expect(res.status).toBe(200);
        expect(res.body.length).toBe(1);
        expect(res.body[0].name).toBe('Producto 2');
    });

    it('Debe filtrar productos por nombre (mock)', async()=>{
        db.query.mockResolvedValueOnce({
            rows: [
                {id:1,name:'Producto 1',description:'Descripción del producto 1',price:100.50}
            ]
        });

        const res = await request(app)
        .get('/api/products/filter')
        .query({name:'Producto 1'});

        expect(res.status).toBe(200);
        expect(res.body.length).toBe(1);
        expect(res.body[0].name).toBe('Producto 1');
    });

    it('Debe manejar errores al filtrar productos (mock)', async()=>{
        db.query.mockRejectedValueOnce(new Error('DB error'));

        const res = await request(app)
        .get('/api/products/filter')
        .query({min_price:150});

        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Error al obtener los productos con filtros');
    });

    it('Debe obtener un producto por filtro pero no existe (mock)', async()=>{
        db.query.mockResolvedValueOnce({ rows: [] });

        const res = await request(app)
        .get('/api/products/filter')
        .query({name:'Producto 999'});

        expect(res.status).toBe(404);
        expect(res.body.error).toBe('No se encontraron productos con los filtros proporcionados');
    });

    it('Debe obtener un producto por ID (mock)', async()=>{
        db.query.mockResolvedValueOnce({
            rows: [{id:1,name:'Producto 1',description:'Descripción del producto 1',price:100.50}]
        });

        const res = await request(app)
        .get('/api/products/1');

        expect(res.status).toBe(200);
        expect(res.body.name).toBe('Producto 1');
        expect(res.body.id).toBe(1);
        expect(res.body.price).toBe(100.50);
    });

    it('Debe manejar producto no encontrado por ID (mock)', async()=>{
        db.query.mockResolvedValueOnce({ rows: [] });

        const res = await request(app)
        .get('/api/products/999');

        expect(res.status).toBe(404);
        expect(res.body.error).toBe('Producto no encontrado');
    });

    it('Debe manejar errores al obtener producto por ID (mock)', async()=>{
        db.query.mockRejectedValueOnce(new Error('DB error'));

        const res = await request(app)
        .get('/api/products/1');

        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Error al obtener el producto');
    }); 

    it('Debe eliminar un producto por ID (mock)', async()=>{
        db.query.mockResolvedValueOnce({
            rows: [{id:1,name:'Producto 1',description:'Descripción del producto 1',price:100.50}]
        });

        const res = await request(app)
        .delete('/api/products/1');

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Producto eliminado exitosamente');
        expect(res.body.product.id).toBe(1);
    });

    it('Debe manejar producto no encontrado al eliminar por ID (mock)', async()=>{
        db.query.mockResolvedValueOnce({ rows: [] });

        const res = await request(app)
        .delete('/api/products/999');

        expect(res.status).toBe(404);
        expect(res.body.error).toBe('Producto no encontrado');
    });

    it('Debe manejar errores al eliminar producto por ID (mock)', async()=>{
        db.query.mockRejectedValueOnce(new Error('DB error'));

        const res = await request(app)
        .delete('/api/products/1');

        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Error al eliminar el producto');
    }); 

    it('Debe actualizar un producto por ID (mock)', async()=>{
        db.query.mockResolvedValueOnce({
            rows: [{id:1,name:'Producto Actualizado',description:'Descripción actualizada',price:150.75}]
        });

        const res = await request(app)
        .put('/api/products/1')
        .send({name:'Producto Actualizado',description:'Descripción actualizada',price:150.75});

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Producto actualizado exitosamente');
        expect(res.body.product.name).toBe('Producto Actualizado');
    });

    it('Debe fallar al actualizar si falta algún dato (mock)', async()=>{
        const res = await request(app)
        .put('/api/products/1')
        .send({description:'Descripción actualizada',price:150.75});

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Faltan datos: nombre o precio');
    });

    it('Debe manejar producto no encontrado al actualizar por ID (mock)', async()=>{
        db.query.mockResolvedValueOnce({ rows: [] });

        const res = await request(app)
        .put('/api/products/999')
        .send({name:'Producto Actualizado',description:'Descripción actualizada',price:150.75});

        expect(res.status).toBe(404);
        expect(res.body.error).toBe('Producto no encontrado');
    });

    it('Debe manejar errores al actualizar producto por ID (mock)', async()=>{
        db.query.mockRejectedValueOnce(new Error('DB error'));

        const res = await request(app)
        .put('/api/products/1')
        .send({name:'Producto Actualizado',description:'Descripción actualizada',price:150.75});

        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Error al actualizar el producto en la base de datos');
    });

    it('Debe actualizar parcialmente un producto por ID (mock)', async()=>{
        db.query.mockResolvedValueOnce({
            rows: [{id:1,name:'Producto Parcial',description:'Descripción parcial',price:120.00}]
        });

        const res = await request(app)
        .patch('/api/products/1')
        .send({price:120.00});

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Producto actualizado exitosamente');
        expect(res.body.product.price).toBe(120.00);
    });

    it('Debe manejar producto no encontrado al actualizar parcialmente por ID (mock)', async()=>{
        db.query.mockResolvedValueOnce({ rows: [] });

        const res = await request(app)
        .patch('/api/products/999')
        .send({price:120.00});

        expect(res.status).toBe(404);
        expect(res.body.error).toBe('Producto no encontrado');
    });

    it('Debe manejar errores al actualizar parcialmente producto por ID (mock)', async()=>{
        db.query.mockRejectedValueOnce(new Error('DB error'));

        const res = await request(app)
        .patch('/api/products/1')
        .send({price:120.00});

        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Error al actualizar el producto en la base de datos.');
    });

    it('Debe fallar al actualizar parcialmente si no hay datos (mock)', async()=>{
        const res = await request(app)
        .patch('/api/products/1')
        .send({});

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('No se proporcionaron campos para actualizar');
    });
});

