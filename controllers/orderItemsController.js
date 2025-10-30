const ordersItemsService = require('../services/ordersItemsService');
const { ValidationError, NotFoundError } = require('../errors/customErrors');

const addOrderItem = async (req, res) => {
    try {
        const { order_id, product_id, quantity } = req.body;

        const orderItem = await ordersItemsService.addOrderItem({
            order_id,
            product_id,
            quantity
        });

        res.status(201).json({
            message: 'Item de orden creado exitosamente',
            orderItem
        });
    } catch (error) {
        if (error instanceof ValidationError) {
            return res.status(400).json({ error: error.message });
        }
        if (error instanceof NotFoundError) {
            return res.status(404).json({ error: error.message });
        }
        console.error(error.message);
        res.status(500).json({ error: 'Error al guardar el item de orden en la base de datos' });
    }
};

const getAllOrderItems = async (req, res) => {
    try {
        const { limit, offset } = req.query;

        const orderItems = await ordersItemsService.getAllOrderItems(
            limit || 100,
            offset || 0
        );

        res.status(200).json(orderItems);
    } catch (error) {
        if (error instanceof ValidationError) {
            return res.status(400).json({ error: error.message });
        }
        console.error(error.message);
        res.status(500).json({ error: 'Error al obtener los items de orden desde la base de datos' });
    }
};

const getOrderItemByOrderId = async (req, res) => {
    try {
        const { orderId } = req.params;
        const orderItems = await ordersItemsService.getOrderItemsByOrderId(orderId);
        res.status(200).json(orderItems);
    } catch (error) {
        if (error instanceof ValidationError) {
            return res.status(400).json({ error: error.message });
        }
        if (error instanceof NotFoundError) {
            return res.status(404).json({ error: error.message });
        }
        console.error(error.message);
        res.status(500).json({ error: 'Error al obtener los items de orden desde la base de datos' });
    }
};

const deleteAllItemsInOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const deletedItems = await ordersItemsService.deleteOrderItemsByOrderId(orderId);
        res.status(200).json({
            message: 'Items de orden eliminados exitosamente',
            deletedItems
        });
    } catch (error) {
        if (error instanceof ValidationError) {
            return res.status(400).json({ error: error.message });
        }
        if (error instanceof NotFoundError) {
            return res.status(404).json({ error: error.message });
        }
        console.error(error.message);
        res.status(500).json({ error: 'Error al eliminar los items de orden desde la base de datos' });
    }
};

const deleteItemInOrderByIdProduct = async (req, res) => {
    try {
        const { orderId, productId } = req.params;
        const deletedItem = await ordersItemsService.deleteOrderItemByOrderIdAndProductId(
            orderId,
            productId
        );
        res.status(200).json({
            message: 'Item de orden eliminado exitosamente',
            deletedItem
        });
    } catch (error) {
        if (error instanceof ValidationError) {
            return res.status(400).json({ error: error.message });
        }
        if (error instanceof NotFoundError) {
            return res.status(404).json({ error: error.message });
        }
        console.error(error.message);
        res.status(500).json({ error: 'Error al eliminar el item de orden desde la base de datos' });
    }
};

const updateQuantityOrPriceInOrderItem = async (req, res) => {
    try {
        const { orderId, productId } = req.params;
        const { quantity, price } = req.body;

        const updatedItem = await ordersItemsService.updateOrderItem(
            orderId,
            productId,
            { quantity, price }
        );

        res.status(200).json({
            message: 'Item de orden actualizado exitosamente',
            updatedItem
        });
    } catch (error) {
        if (error instanceof ValidationError) {
            return res.status(400).json({ error: error.message });
        }
        if (error instanceof NotFoundError) {
            return res.status(404).json({ error: error.message });
        }
        console.error(error.message);
        res.status(500).json({ error: 'Error al actualizar el item de orden en la base de datos' });
    }
};

module.exports = {
    addOrderItem,
    getAllOrderItems,
    getOrderItemByOrderId,
    deleteAllItemsInOrder,
    deleteItemInOrderByIdProduct,
    updateQuantityOrPriceInOrderItem
};