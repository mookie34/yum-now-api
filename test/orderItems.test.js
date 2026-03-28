// Mock the service instead of db
jest.mock('../services/orders-items-service');

const request = require('supertest');
const app = require('../app');
const ordersItemsService = require('../services/orders-items-service');
const { ValidationError, NotFoundError } = require('../errors/custom-errors');

describe('Order Items API', () => {
    // Clear mocks after each test
    afterEach(() => {
        jest.clearAllMocks();
    });

    // ============================================
    // POST /api/order-items - Create order item
    // ============================================

    describe('POST /api/order-items', () => {
        it('should add an order item', async () => {
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

        it('should validate missing fields when adding order item (order_id)', async () => {
            ordersItemsService.addOrderItem.mockRejectedValue(
                new ValidationError('order_id inválido')
            );

            const res = await request(app)
                .post('/api/order-items')
                .send({ product_id: 1, quantity: 2 });

            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('error', 'order_id inválido');
        });

        it('should validate missing fields when adding order item (product_id)', async () => {
            ordersItemsService.addOrderItem.mockRejectedValue(
                new ValidationError('product_id inválido')
            );

            const res = await request(app)
                .post('/api/order-items')
                .send({ order_id: 1, quantity: 2 });

            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('error', 'product_id inválido');
        });

        it('should validate missing fields when adding order item (quantity)', async () => {
            ordersItemsService.addOrderItem.mockRejectedValue(
                new ValidationError('quantity inválido')
            );

            const res = await request(app)
                .post('/api/order-items')
                .send({ order_id: 1, product_id: 1 });

            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('error', 'quantity inválido');
        });

        it('should return error if order_id does not exist when adding order item', async () => {
            ordersItemsService.addOrderItem.mockRejectedValue(
                new NotFoundError('Orden no encontrada')
            );

            const res = await request(app)
                .post('/api/order-items')
                .send({ order_id: 999, product_id: 1, quantity: 2 });

            expect(res.statusCode).toEqual(404);
            expect(res.body).toHaveProperty('error', 'Orden no encontrada');
        });

        it('should return error if product_id does not exist when adding order item', async () => {
            ordersItemsService.addOrderItem.mockRejectedValue(
                new NotFoundError('Producto no encontrado')
            );

            const res = await request(app)
                .post('/api/order-items')
                .send({ order_id: 1, product_id: 999, quantity: 2 });

            expect(res.statusCode).toEqual(404);
            expect(res.body).toHaveProperty('error', 'Producto no encontrado');
        });

        it('should validate negative quantity', async () => {
            ordersItemsService.addOrderItem.mockRejectedValue(
                new ValidationError('quantity inválido')
            );

            const res = await request(app)
                .post('/api/order-items')
                .send({ order_id: 1, product_id: 1, quantity: -5 });

            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('error', 'quantity inválido');
        });

        it('should return 500 error on unexpected problem when adding order item', async () => {
            ordersItemsService.addOrderItem.mockRejectedValue(
                new Error('Error inesperado en la base de datos')
            );

            const res = await request(app)
                .post('/api/order-items')
                .send({ order_id: 1, product_id: 1, quantity: 2 });

            expect(res.statusCode).toEqual(500);
            expect(res.body).toHaveProperty('error', 'Error interno del servidor');
        });
    });

    // ============================================
    // GET /api/order-items - Get all
    // ============================================

    describe('GET /api/order-items', () => {
        it('should get all order items', async () => {
            const mockOrderItems = [
                { id: 1, order_id: 1, product_id: 1, quantity: 2, price: 50 },
                { id: 2, order_id: 1, product_id: 2, quantity: 1, price: 30 }
            ];

            ordersItemsService.getAllOrderItems.mockResolvedValue(mockOrderItems);

            const res = await request(app).get('/api/order-items');

            expect(res.statusCode).toEqual(200);
            expect(res.body.length).toBeGreaterThan(0);
            expect(res.body).toEqual(mockOrderItems);
            expect(ordersItemsService.getAllOrderItems).toHaveBeenCalledWith(undefined, undefined);
        });

        it('should get items with custom pagination', async () => {
            const mockOrderItems = [
                { id: 11, order_id: 2, product_id: 1, quantity: 3, price: 75 }
            ];

            ordersItemsService.getAllOrderItems.mockResolvedValue(mockOrderItems);

            const res = await request(app).get('/api/order-items?limit=10&offset=10');

            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual(mockOrderItems);
            expect(ordersItemsService.getAllOrderItems).toHaveBeenCalledWith("10", "10");
        });

        it('should validate invalid limit', async () => {
            ordersItemsService.getAllOrderItems.mockRejectedValue(
                new ValidationError('El límite debe ser un número positivo')
            );

            const res = await request(app).get('/api/order-items?limit=-5');

            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('error', 'El límite debe ser un número positivo');
        });

        it('should validate invalid offset', async () => {
            ordersItemsService.getAllOrderItems.mockRejectedValue(
                new ValidationError('El offset debe ser un número no negativo')
            );

            const res = await request(app).get('/api/order-items?offset=-1');

            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('error', 'El offset debe ser un número no negativo');
        });

        it('should return 500 error on database problem when fetching all items', async () => {
            ordersItemsService.getAllOrderItems.mockRejectedValue(
                new Error('DB error')
            );

            const res = await request(app).get('/api/order-items');

            expect(res.statusCode).toEqual(500);
            expect(res.body).toHaveProperty('error', 'Error interno del servidor');
        });
    });

    // ============================================
    // GET /api/order-items/order/:orderId
    // ============================================

    describe('GET /api/order-items/order/:orderId', () => {
        it('should get order items by order_id', async () => {
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

        it('should return 404 if no order items found for given order_id', async () => {
            ordersItemsService.getOrderItemsByOrderId.mockRejectedValue(
                new NotFoundError('No se encontraron items de orden para el ID de orden proporcionado')
            );

            const res = await request(app).get('/api/order-items/order/999');

            expect(res.statusCode).toEqual(404);
            expect(res.body).toHaveProperty('error', 'No se encontraron items de orden para el ID de orden proporcionado');
        });

        it('should validate invalid order_id', async () => {
            ordersItemsService.getOrderItemsByOrderId.mockRejectedValue(
                new ValidationError('order_id inválido')
            );

            const res = await request(app).get('/api/order-items/order/abc');

            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('error', 'order_id inválido');
        });

        it('should return 500 error on database problem when fetching items by order_id', async () => {
            ordersItemsService.getOrderItemsByOrderId.mockRejectedValue(
                new Error('DB error')
            );

            const res = await request(app).get('/api/order-items/order/1');

            expect(res.statusCode).toEqual(500);
            expect(res.body).toHaveProperty('error', 'Error interno del servidor');
        });
    });

    // ============================================
    // DELETE /api/order-items/order/:orderId
    // ============================================

    describe('DELETE /api/order-items/order/:orderId', () => {
        it('should delete all order items', async () => {
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

        it('should return 404 if no order items to delete', async () => {
            ordersItemsService.deleteOrderItemsByOrderId.mockRejectedValue(
                new NotFoundError('No se encontraron items de orden para el ID de orden proporcionado')
            );

            const res = await request(app).delete('/api/order-items/order/999');

            expect(res.statusCode).toEqual(404);
            expect(res.body).toHaveProperty('error', 'No se encontraron items de orden para el ID de orden proporcionado');
        });

        it('should validate invalid order_id when deleting', async () => {
            ordersItemsService.deleteOrderItemsByOrderId.mockRejectedValue(
                new ValidationError('order_id inválido')
            );

            const res = await request(app).delete('/api/order-items/order/-1');

            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('error', 'order_id inválido');
        });

        it('should return 500 error on database problem when deleting items', async () => {
            ordersItemsService.deleteOrderItemsByOrderId.mockRejectedValue(
                new Error('DB error')
            );

            const res = await request(app).delete('/api/order-items/order/1');

            expect(res.statusCode).toEqual(500);
            expect(res.body).toHaveProperty('error', 'Error interno del servidor');
        });
    });

    // ============================================
    // DELETE /api/order-items/order/:orderId/product/:productId
    // ============================================

    describe('DELETE /api/order-items/order/:orderId/product/:productId', () => {
        it('should delete an order item by order_id and product_id', async () => {
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

        it('should return 404 if order_id does not exist when deleting item', async () => {
            ordersItemsService.deleteOrderItemByOrderIdAndProductId.mockRejectedValue(
                new NotFoundError('Orden no encontrada')
            );

            const res = await request(app).delete('/api/order-items/order/999/product/1');

            expect(res.statusCode).toEqual(404);
            expect(res.body).toHaveProperty('error', 'Orden no encontrada');
        });

        it('should return 404 if product_id does not exist when deleting item', async () => {
            ordersItemsService.deleteOrderItemByOrderIdAndProductId.mockRejectedValue(
                new NotFoundError('Producto no encontrado')
            );

            const res = await request(app).delete('/api/order-items/order/1/product/999');

            expect(res.statusCode).toEqual(404);
            expect(res.body).toHaveProperty('error', 'Producto no encontrado');
        });

        it('should return 404 if order item not found for deletion', async () => {
            ordersItemsService.deleteOrderItemByOrderIdAndProductId.mockRejectedValue(
                new NotFoundError('No se encontró el item de orden para el ID de orden y producto proporcionados')
            );

            const res = await request(app).delete('/api/order-items/order/1/product/1');

            expect(res.statusCode).toEqual(404);
            expect(res.body).toHaveProperty('error', 'No se encontró el item de orden para el ID de orden y producto proporcionados');
        });

        it('should validate invalid order_id when deleting specific item', async () => {
            ordersItemsService.deleteOrderItemByOrderIdAndProductId.mockRejectedValue(
                new ValidationError('order_id inválido')
            );

            const res = await request(app).delete('/api/order-items/order/abc/product/1');

            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('error', 'order_id inválido');
        });

        it('should validate invalid product_id when deleting specific item', async () => {
            ordersItemsService.deleteOrderItemByOrderIdAndProductId.mockRejectedValue(
                new ValidationError('product_id inválido')
            );

            const res = await request(app).delete('/api/order-items/order/1/product/xyz');

            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('error', 'product_id inválido');
        });

        it('should return 500 error on database problem when deleting specific item', async () => {
            ordersItemsService.deleteOrderItemByOrderIdAndProductId.mockRejectedValue(
                new Error('DB error')
            );

            const res = await request(app).delete('/api/order-items/order/1/product/1');

            expect(res.statusCode).toEqual(500);
            expect(res.body).toHaveProperty('error', 'Error interno del servidor');
        });
    });

    // ============================================
    // PATCH /api/order-items/order/:orderId/product/:productId
    // ============================================

    describe('PATCH /api/order-items/order/:orderId/product/:productId', () => {
        it('should update quantity and price on an order item', async () => {
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

        it('should update only quantity', async () => {
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

        it('should update only price', async () => {
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

        it('should return 400 if neither quantity nor price is sent when updating', async () => {
            ordersItemsService.updateOrderItem.mockRejectedValue(
                new ValidationError('Debe proporcionar quantity o price para actualizar')
            );

            const res = await request(app)
                .patch('/api/order-items/order/1/product/1')
                .send({});

            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('error', 'Debe proporcionar quantity o price para actualizar');
        });

        it('should validate invalid quantity when updating', async () => {
            ordersItemsService.updateOrderItem.mockRejectedValue(
                new ValidationError('quantity inválido')
            );

            const res = await request(app)
                .patch('/api/order-items/order/1/product/1')
                .send({ quantity: -5 });

            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('error', 'quantity inválido');
        });

        it('should validate invalid price when updating', async () => {
            ordersItemsService.updateOrderItem.mockRejectedValue(
                new ValidationError('price inválido')
            );

            const res = await request(app)
                .patch('/api/order-items/order/1/product/1')
                .send({ price: -10 });

            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('error', 'price inválido');
        });

        it('should return 404 if order not found when updating', async () => {
            ordersItemsService.updateOrderItem.mockRejectedValue(
                new NotFoundError('Orden no encontrada')
            );

            const res = await request(app)
                .patch('/api/order-items/order/999/product/1')
                .send({ quantity: 5 });

            expect(res.statusCode).toEqual(404);
            expect(res.body).toHaveProperty('error', 'Orden no encontrada');
        });

        it('should return 404 if product not found when updating', async () => {
            ordersItemsService.updateOrderItem.mockRejectedValue(
                new NotFoundError('Producto no encontrado')
            );

            const res = await request(app)
                .patch('/api/order-items/order/1/product/999')
                .send({ quantity: 5 });

            expect(res.statusCode).toEqual(404);
            expect(res.body).toHaveProperty('error', 'Producto no encontrado');
        });

        it('should return 404 if order item not found when updating', async () => {
            ordersItemsService.updateOrderItem.mockRejectedValue(
                new NotFoundError('No se encontró el item de orden para el ID de orden y producto proporcionados')
            );

            const res = await request(app)
                .patch('/api/order-items/order/1/product/1')
                .send({ quantity: 5 });

            expect(res.statusCode).toEqual(404);
            expect(res.body).toHaveProperty('error', 'No se encontró el item de orden para el ID de orden y producto proporcionados');
        });

        it('should validate invalid order_id when updating', async () => {
            ordersItemsService.updateOrderItem.mockRejectedValue(
                new ValidationError('order_id inválido')
            );

            const res = await request(app)
                .patch('/api/order-items/order/abc/product/1')
                .send({ quantity: 5 });

            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('error', 'order_id inválido');
        });

        it('should validate invalid product_id when updating', async () => {
            ordersItemsService.updateOrderItem.mockRejectedValue(
                new ValidationError('product_id inválido')
            );

            const res = await request(app)
                .patch('/api/order-items/order/1/product/xyz')
                .send({ quantity: 5 });

            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('error', 'product_id inválido');
        });

        it('should return 500 error on database problem when updating', async () => {
            ordersItemsService.updateOrderItem.mockRejectedValue(
                new Error('DB error')
            );

            const res = await request(app)
                .patch('/api/order-items/order/1/product/1')
                .send({ quantity: 5 });

            expect(res.statusCode).toEqual(500);
            expect(res.body).toHaveProperty('error', 'Error interno del servidor');
        });
    });
});
