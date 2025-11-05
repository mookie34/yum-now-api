// Mock del service en lugar de db
jest.mock('../services/ordersItemsService');

const request = require('supertest');
const app = require('../app');
const ordersItemsService = require('../services/ordersItemsService');
const { ValidationError, NotFoundError } = require('../errors/customErrors');

describe('Order Items API', () => {
    // Limpiar mocks después de cada test
    afterEach(() => {
        jest.clearAllMocks();
    });

    // ============================================
    // POST /api/order-items - Crear item de orden
    // ============================================
    
    describe('POST /api/order-items', () => {
        it('Debería agregar un item de orden', async () => {
            const mockOrderItem = {
                id: 1,
                order_id: 1,
                product_id: 1,
                quantity: 2,
                price: 50
            };

            ordersItemsService.addOrderItem.mockResolvedValue(mockOrderItem);

            const res = await request(app)
                .post('/api/order-items')
                .send({ order_id: 1, product_id: 1, quantity: 2 });

            expect(res.statusCode).toEqual(201);
            expect(res.body).toHaveProperty('message', 'Item de orden creado exitosamente');
            expect(res.body).toHaveProperty('orderItem');
            expect(res.body.orderItem).toEqual(mockOrderItem);
            expect(ordersItemsService.addOrderItem).toHaveBeenCalledWith({
                order_id: 1,
                product_id: 1,
                quantity: 2
            });
        });

        it('Debería validar datos faltantes al agregar item de orden (order_id)', async () => {
            ordersItemsService.addOrderItem.mockRejectedValue(
                new ValidationError('order_id inválido')
            );

            const res = await request(app)
                .post('/api/order-items')
                .send({ product_id: 1, quantity: 2 });

            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('error', 'order_id inválido');
        });

        it('Debería validar datos faltantes al agregar item de orden (product_id)', async () => {
            ordersItemsService.addOrderItem.mockRejectedValue(
                new ValidationError('product_id inválido')
            );

            const res = await request(app)
                .post('/api/order-items')
                .send({ order_id: 1, quantity: 2 });

            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('error', 'product_id inválido');
        });

        it('Debería validar datos faltantes al agregar item de orden (quantity)', async () => {
            ordersItemsService.addOrderItem.mockRejectedValue(
                new ValidationError('quantity inválido')
            );

            const res = await request(app)
                .post('/api/order-items')
                .send({ order_id: 1, product_id: 1 });

            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('error', 'quantity inválido');
        });

        it('Debería retornar error si el order_id no existe al agregar item de orden', async () => {
            ordersItemsService.addOrderItem.mockRejectedValue(
                new NotFoundError('Orden no encontrada')
            );

            const res = await request(app)
                .post('/api/order-items')
                .send({ order_id: 999, product_id: 1, quantity: 2 });

            expect(res.statusCode).toEqual(404);
            expect(res.body).toHaveProperty('error', 'Orden no encontrada');
        });

        it('Debería retornar error si el product_id no existe al agregar item de orden', async () => {
            ordersItemsService.addOrderItem.mockRejectedValue(
                new NotFoundError('Producto no encontrado')
            );

            const res = await request(app)
                .post('/api/order-items')
                .send({ order_id: 1, product_id: 999, quantity: 2 });

            expect(res.statusCode).toEqual(404);
            expect(res.body).toHaveProperty('error', 'Producto no encontrado');
        });

        it('Debería validar quantity negativo', async () => {
            ordersItemsService.addOrderItem.mockRejectedValue(
                new ValidationError('quantity inválido')
            );

            const res = await request(app)
                .post('/api/order-items')
                .send({ order_id: 1, product_id: 1, quantity: -5 });

            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('error', 'quantity inválido');
        });

        it('Debería devolver error 500 si hay un problema inesperado al agregar item de orden', async () => {
            ordersItemsService.addOrderItem.mockRejectedValue(
                new Error('Error inesperado en la base de datos')
            );

            const res = await request(app)
                .post('/api/order-items')
                .send({ order_id: 1, product_id: 1, quantity: 2 });

            expect(res.statusCode).toEqual(500);
            expect(res.body).toHaveProperty('error', 'Error al guardar el item de orden en la base de datos');
        });
    });

    // ============================================
    // GET /api/order-items - Obtener todos
    // ============================================

    describe('GET /api/order-items', () => {
        it('Debería obtener todos los items de orden', async () => {
            const mockOrderItems = [
                { id: 1, order_id: 1, product_id: 1, quantity: 2, price: 50 },
                { id: 2, order_id: 1, product_id: 2, quantity: 1, price: 30 }
            ];

            ordersItemsService.getAllOrderItems.mockResolvedValue(mockOrderItems);

            const res = await request(app).get('/api/order-items');

            expect(res.statusCode).toEqual(200);
            expect(res.body.length).toBeGreaterThan(0);
            expect(res.body).toEqual(mockOrderItems);
            expect(ordersItemsService.getAllOrderItems).toHaveBeenCalledWith(100, 0);
        });

        it('Debería obtener items con paginación personalizada', async () => {
            const mockOrderItems = [
                { id: 11, order_id: 2, product_id: 1, quantity: 3, price: 75 }
            ];

            ordersItemsService.getAllOrderItems.mockResolvedValue(mockOrderItems);

            const res = await request(app).get('/api/order-items?limit=10&offset=10');

            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual(mockOrderItems);
            expect(ordersItemsService.getAllOrderItems).toHaveBeenCalledWith('10', '10');
        });

        it('Debería validar limit inválido', async () => {
            ordersItemsService.getAllOrderItems.mockRejectedValue(
                new ValidationError('El límite debe ser un número positivo')
            );

            const res = await request(app).get('/api/order-items?limit=-5');

            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('error', 'El límite debe ser un número positivo');
        });

        it('Debería validar offset inválido', async () => {
            ordersItemsService.getAllOrderItems.mockRejectedValue(
                new ValidationError('El offset debe ser un número no negativo')
            );

            const res = await request(app).get('/api/order-items?offset=-1');

            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('error', 'El offset debe ser un número no negativo');
        });

        it('Debería devolver error 500 si hay un problema con la base de datos al obtener todos los items', async () => {
            ordersItemsService.getAllOrderItems.mockRejectedValue(
                new Error('DB error')
            );

            const res = await request(app).get('/api/order-items');

            expect(res.statusCode).toEqual(500);
            expect(res.body).toHaveProperty('error', 'Error al obtener los items de orden desde la base de datos');
        });
    });

    // ============================================
    // GET /api/order-items/order/:orderId
    // ============================================

    describe('GET /api/order-items/order/:orderId', () => {
        it('Debería obtener items de orden por order_id', async () => {
            const mockOrderItems = [
                { id: 1, order_id: 1, product_id: 1, quantity: 2, price: 50 },
                { id: 2, order_id: 1, product_id: 2, quantity: 1, price: 30 }
            ];

            ordersItemsService.getOrderItemsByOrderId.mockResolvedValue(mockOrderItems);

            const res = await request(app).get('/api/order-items/order/1');

            expect(res.statusCode).toEqual(200);
            expect(res.body.length).toBeGreaterThan(0);
            expect(res.body).toEqual(mockOrderItems);
            expect(ordersItemsService.getOrderItemsByOrderId).toHaveBeenCalledWith('1');
        });

        it('Debería devolver 404 si no se encuentran items de orden para el order_id proporcionado', async () => {
            ordersItemsService.getOrderItemsByOrderId.mockRejectedValue(
                new NotFoundError('No se encontraron items de orden para el ID de orden proporcionado')
            );

            const res = await request(app).get('/api/order-items/order/999');

            expect(res.statusCode).toEqual(404);
            expect(res.body).toHaveProperty('error', 'No se encontraron items de orden para el ID de orden proporcionado');
        });

        it('Debería validar order_id inválido', async () => {
            ordersItemsService.getOrderItemsByOrderId.mockRejectedValue(
                new ValidationError('order_id inválido')
            );

            const res = await request(app).get('/api/order-items/order/abc');

            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('error', 'order_id inválido');
        });

        it('Debería devolver error 500 si hay un problema con la base de datos al obtener items por order_id', async () => {
            ordersItemsService.getOrderItemsByOrderId.mockRejectedValue(
                new Error('DB error')
            );

            const res = await request(app).get('/api/order-items/order/1');

            expect(res.statusCode).toEqual(500);
            expect(res.body).toHaveProperty('error', 'Error al obtener los items de orden desde la base de datos');
        });
    });

    // ============================================
    // DELETE /api/order-items/order/:orderId
    // ============================================

    describe('DELETE /api/order-items/order/:orderId', () => {
        it('Debería eliminar todos los items de orden', async () => {
            const mockDeletedItems = [
                { id: 1, order_id: 1, product_id: 1, quantity: 2, price: 50 },
                { id: 2, order_id: 1, product_id: 2, quantity: 1, price: 30 },
                { id: 3, order_id: 1, product_id: 3, quantity: 5, price: 20 }
            ];

            ordersItemsService.deleteOrderItemsByOrderId.mockResolvedValue(mockDeletedItems);

            const res = await request(app).delete('/api/order-items/order/1');

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('message', 'Items de orden eliminados exitosamente');
            expect(res.body.deletedItems).toHaveLength(3);
            expect(res.body.deletedItems).toEqual(mockDeletedItems);
            expect(ordersItemsService.deleteOrderItemsByOrderId).toHaveBeenCalledWith('1');
        });

        it('Debería retornar 404 si no hay items de orden para eliminar', async () => {
            ordersItemsService.deleteOrderItemsByOrderId.mockRejectedValue(
                new NotFoundError('No se encontraron items de orden para el ID de orden proporcionado')
            );

            const res = await request(app).delete('/api/order-items/order/999');

            expect(res.statusCode).toEqual(404);
            expect(res.body).toHaveProperty('error', 'No se encontraron items de orden para el ID de orden proporcionado');
        });

        it('Debería validar order_id inválido al eliminar', async () => {
            ordersItemsService.deleteOrderItemsByOrderId.mockRejectedValue(
                new ValidationError('order_id inválido')
            );

            const res = await request(app).delete('/api/order-items/order/-1');

            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('error', 'order_id inválido');
        });

        it('Debería devolver error 500 si hay un problema con la base de datos al eliminar items', async () => {
            ordersItemsService.deleteOrderItemsByOrderId.mockRejectedValue(
                new Error('DB error')
            );

            const res = await request(app).delete('/api/order-items/order/1');

            expect(res.statusCode).toEqual(500);
            expect(res.body).toHaveProperty('error', 'Error al eliminar los items de orden desde la base de datos');
        });
    });

    // ============================================
    // DELETE /api/order-items/order/:orderId/product/:productId
    // ============================================

    describe('DELETE /api/order-items/order/:orderId/product/:productId', () => {
        it('Debería eliminar un item de orden por order_id y product_id', async () => {
            const mockDeletedItem = {
                id: 1,
                order_id: 1,
                product_id: 1,
                quantity: 2,
                price: 50
            };

            ordersItemsService.deleteOrderItemByOrderIdAndProductId.mockResolvedValue(mockDeletedItem);

            const res = await request(app).delete('/api/order-items/order/1/product/1');

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('message', 'Item de orden eliminado exitosamente');
            expect(res.body).toHaveProperty('deletedItem');
            expect(res.body.deletedItem).toEqual(mockDeletedItem);
            expect(ordersItemsService.deleteOrderItemByOrderIdAndProductId).toHaveBeenCalledWith('1', '1');
        });

        it('Debería retornar 404 si el order_id no existe al eliminar item', async () => {
            ordersItemsService.deleteOrderItemByOrderIdAndProductId.mockRejectedValue(
                new NotFoundError('Orden no encontrada')
            );

            const res = await request(app).delete('/api/order-items/order/999/product/1');

            expect(res.statusCode).toEqual(404);
            expect(res.body).toHaveProperty('error', 'Orden no encontrada');
        });

        it('Debería retornar 404 si el product_id no existe al eliminar item', async () => {
            ordersItemsService.deleteOrderItemByOrderIdAndProductId.mockRejectedValue(
                new NotFoundError('Producto no encontrado')
            );

            const res = await request(app).delete('/api/order-items/order/1/product/999');

            expect(res.statusCode).toEqual(404);
            expect(res.body).toHaveProperty('error', 'Producto no encontrado');
        });

        it('Debería devolver 404 si no se encuentra el item de orden para eliminar', async () => {
            ordersItemsService.deleteOrderItemByOrderIdAndProductId.mockRejectedValue(
                new NotFoundError('No se encontró el item de orden para el ID de orden y producto proporcionados')
            );

            const res = await request(app).delete('/api/order-items/order/1/product/1');

            expect(res.statusCode).toEqual(404);
            expect(res.body).toHaveProperty('error', 'No se encontró el item de orden para el ID de orden y producto proporcionados');
        });

        it('Debería validar order_id inválido al eliminar item específico', async () => {
            ordersItemsService.deleteOrderItemByOrderIdAndProductId.mockRejectedValue(
                new ValidationError('order_id inválido')
            );

            const res = await request(app).delete('/api/order-items/order/abc/product/1');

            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('error', 'order_id inválido');
        });

        it('Debería validar product_id inválido al eliminar item específico', async () => {
            ordersItemsService.deleteOrderItemByOrderIdAndProductId.mockRejectedValue(
                new ValidationError('product_id inválido')
            );

            const res = await request(app).delete('/api/order-items/order/1/product/xyz');

            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('error', 'product_id inválido');
        });

        it('Debería devolver error 500 si hay un problema con la base de datos al eliminar item específico', async () => {
            ordersItemsService.deleteOrderItemByOrderIdAndProductId.mockRejectedValue(
                new Error('DB error')
            );

            const res = await request(app).delete('/api/order-items/order/1/product/1');

            expect(res.statusCode).toEqual(500);
            expect(res.body).toHaveProperty('error', 'Error al eliminar el item de orden desde la base de datos');
        });
    });

    // ============================================
    // PATCH /api/order-items/order/:orderId/product/:productId
    // ============================================

    describe('PATCH /api/order-items/order/:orderId/product/:productId', () => {
        it('Debería actualizar quantity y price en un item de orden', async () => {
            const mockUpdatedItem = {
                id: 1,
                order_id: 1,
                product_id: 1,
                quantity: 5,
                price: 100
            };

            ordersItemsService.updateOrderItem.mockResolvedValue(mockUpdatedItem);

            const res = await request(app)
                .patch('/api/order-items/order/1/product/1')
                .send({ quantity: 5, price: 100 });

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('message', 'Item de orden actualizado exitosamente');
            expect(res.body).toHaveProperty('updatedItem');
            expect(res.body.updatedItem).toEqual(mockUpdatedItem);
            expect(ordersItemsService.updateOrderItem).toHaveBeenCalledWith('1', '1', { quantity: 5, price: 100 });
        });

        it('Debería actualizar solo quantity', async () => {
            const mockUpdatedItem = {
                id: 1,
                order_id: 1,
                product_id: 1,
                quantity: 10,
                price: 50
            };

            ordersItemsService.updateOrderItem.mockResolvedValue(mockUpdatedItem);

            const res = await request(app)
                .patch('/api/order-items/order/1/product/1')
                .send({ quantity: 10 });

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('updatedItem');
            expect(res.body.updatedItem.quantity).toEqual(10);
            expect(ordersItemsService.updateOrderItem).toHaveBeenCalledWith('1', '1', { quantity: 10 });
        });

        it('Debería actualizar solo price', async () => {
            const mockUpdatedItem = {
                id: 1,
                order_id: 1,
                product_id: 1,
                quantity: 2,
                price: 75
            };

            ordersItemsService.updateOrderItem.mockResolvedValue(mockUpdatedItem);

            const res = await request(app)
                .patch('/api/order-items/order/1/product/1')
                .send({ price: 75 });

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('updatedItem');
            expect(res.body.updatedItem.price).toEqual(75);
            expect(ordersItemsService.updateOrderItem).toHaveBeenCalledWith('1', '1', { price: 75 });
        });

        it('Debería retornar 400 si no se envían quantity o price al actualizar', async () => {
            ordersItemsService.updateOrderItem.mockRejectedValue(
                new ValidationError('Debe proporcionar quantity o price para actualizar')
            );

            const res = await request(app)
                .patch('/api/order-items/order/1/product/1')
                .send({});

            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('error', 'Debe proporcionar quantity o price para actualizar');
        });

        it('Debería validar quantity inválido al actualizar', async () => {
            ordersItemsService.updateOrderItem.mockRejectedValue(
                new ValidationError('quantity inválido')
            );

            const res = await request(app)
                .patch('/api/order-items/order/1/product/1')
                .send({ quantity: -5 });

            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('error', 'quantity inválido');
        });

        it('Debería validar price inválido al actualizar', async () => {
            ordersItemsService.updateOrderItem.mockRejectedValue(
                new ValidationError('price inválido')
            );

            const res = await request(app)
                .patch('/api/order-items/order/1/product/1')
                .send({ price: -10 });

            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('error', 'price inválido');
        });

        it('Debería devolver 404 si no encuentra la orden para actualizar', async () => {
            ordersItemsService.updateOrderItem.mockRejectedValue(
                new NotFoundError('Orden no encontrada')
            );

            const res = await request(app)
                .patch('/api/order-items/order/999/product/1')
                .send({ quantity: 5 });

            expect(res.statusCode).toEqual(404);
            expect(res.body).toHaveProperty('error', 'Orden no encontrada');
        });

        it('Debería devolver 404 si no encuentra el producto para actualizar', async () => {
            ordersItemsService.updateOrderItem.mockRejectedValue(
                new NotFoundError('Producto no encontrado')
            );

            const res = await request(app)
                .patch('/api/order-items/order/1/product/999')
                .send({ quantity: 5 });

            expect(res.statusCode).toEqual(404);
            expect(res.body).toHaveProperty('error', 'Producto no encontrado');
        });

        it('Debería devolver 404 si no se encuentra el item para actualizar', async () => {
            ordersItemsService.updateOrderItem.mockRejectedValue(
                new NotFoundError('No se encontró el item de orden para el ID de orden y producto proporcionados')
            );

            const res = await request(app)
                .patch('/api/order-items/order/1/product/1')
                .send({ quantity: 5 });

            expect(res.statusCode).toEqual(404);
            expect(res.body).toHaveProperty('error', 'No se encontró el item de orden para el ID de orden y producto proporcionados');
        });

        it('Debería validar order_id inválido al actualizar', async () => {
            ordersItemsService.updateOrderItem.mockRejectedValue(
                new ValidationError('order_id inválido')
            );

            const res = await request(app)
                .patch('/api/order-items/order/abc/product/1')
                .send({ quantity: 5 });

            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('error', 'order_id inválido');
        });

        it('Debería validar product_id inválido al actualizar', async () => {
            ordersItemsService.updateOrderItem.mockRejectedValue(
                new ValidationError('product_id inválido')
            );

            const res = await request(app)
                .patch('/api/order-items/order/1/product/xyz')
                .send({ quantity: 5 });

            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('error', 'product_id inválido');
        });

        it('Debería devolver error 500 si hay un problema con la base de datos al actualizar', async () => {
            ordersItemsService.updateOrderItem.mockRejectedValue(
                new Error('DB error')
            );

            const res = await request(app)
                .patch('/api/order-items/order/1/product/1')
                .send({ quantity: 5 });

            expect(res.statusCode).toEqual(500);
            expect(res.body).toHaveProperty('error', 'Error al actualizar el item de orden en la base de datos');
        });
    });
});