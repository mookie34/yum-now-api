const ordersItemsRepository = require('../repositories/orderItemsRepository');
const productsRepository = require('../repositories/productsRepository');
const ordersRepository = require('../repositories/ordersRepository');
const { ValidationError, NotFoundError } = require('../errors/customErrors');

class OrdersItemsService {

    validateItemsOrderData(itemsOrderData, isPartial = false) {
        const errors = [];
        const { order_id, product_id, quantity, price } = itemsOrderData;

        // Validar order_id
        if (!isPartial || order_id !== undefined) {
            if (!order_id || isNaN(order_id) || parseInt(order_id) <= 0) {
                errors.push("order_id inválido");
            }
        }

        // Validar product_id
        if (!isPartial || product_id !== undefined) {
            if (!product_id || isNaN(product_id) || parseInt(product_id) <= 0) {
                errors.push("product_id inválido");
            }
        }

        // Validar quantity
        if (!isPartial || quantity !== undefined) {
            if (!quantity || isNaN(quantity) || parseInt(quantity) <= 0) {
                errors.push("quantity inválido");
            }
        }

        // Validar price
        if (!isPartial || price !== undefined) {
            if (price === undefined || isNaN(price) || parseFloat(price) < 0) {
                errors.push("price inválido");
            }
        }

        if (errors.length > 0) {
            throw new ValidationError(errors.join(", "));
        }
    }

    validateId(id, fieldName = "ID") {
        if (!id || isNaN(id) || parseInt(id) <= 0) {
            throw new ValidationError(`${fieldName} inválido`);
        }
    }

    async addOrderItem(orderItemData) {
        const { order_id, product_id, quantity } = orderItemData;
        
        this.validateItemsOrderData({ order_id, product_id, quantity }, false);

        const order = await ordersRepository.getById(order_id);
        if (!order) {
            throw new NotFoundError("Orden no encontrada");
        }

        const product = await productsRepository.getById(product_id);
        if (!product) {
            throw new NotFoundError("Producto no encontrado");
        }
        return await ordersItemsRepository.create({
            order_id: parseInt(order_id),
            product_id: parseInt(product_id),
            quantity: parseInt(quantity),
            price: product.price 
        });
    }

    async getAllOrderItems(limit = 100, offset = 0) {
        limit = parseInt(limit);
        offset = parseInt(offset);
        
        if (isNaN(limit) || limit <= 0) {
            throw new ValidationError("El límite debe ser un número positivo");
        }
        if (isNaN(offset) || offset < 0) {
            throw new ValidationError("El offset debe ser un número no negativo");
        }
        
        return await ordersItemsRepository.getAll(limit, offset);
    }

    async getOrderItemsByOrderId(order_id) {
        this.validateId(order_id, "order_id");
        
        const orderItems = await ordersItemsRepository.getByOrderId(order_id);
        
        if (orderItems.length === 0) {
            throw new NotFoundError("No se encontraron items de orden para el ID de orden proporcionado");
        }
        
        return orderItems;
    }

    async deleteOrderItemsByOrderId(order_id) {
        this.validateId(order_id, "order_id");
        
        const deletedItems = await ordersItemsRepository.deleteByOrderId(order_id);
        
        if (deletedItems.length === 0) {
            throw new NotFoundError("No se encontraron items de orden para el ID de orden proporcionado");
        }
        
        return deletedItems;
    }

    async deleteOrderItemByOrderIdAndProductId(order_id, product_id) {
        this.validateId(order_id, "order_id");
        this.validateId(product_id, "product_id");
        
        const order = await ordersRepository.getById(order_id);
        if (!order) {
            throw new NotFoundError("Orden no encontrada");
        }

        const product = await productsRepository.getById(product_id);
        if (!product) {
            throw new NotFoundError("Producto no encontrado");
        }
        
        const deletedItem = await ordersItemsRepository.deleteByOrderIdAndProductId(order_id, product_id);
        
        if (!deletedItem) {
            throw new NotFoundError("No se encontró el item de orden para el ID de orden y producto proporcionados");
        }
        
        return deletedItem;
    }

    async updateQuantityOrderItem(order_id, product_id, newQuantity) {
        this.validateId(order_id, "order_id");
        this.validateId(product_id, "product_id");
        
        this.validateItemsOrderData({ quantity: newQuantity }, true);

        const order = await ordersRepository.getById(order_id);
        if (!order) {
            throw new NotFoundError("Orden no encontrada");
        }

        const product = await productsRepository.getById(product_id);
        if (!product) {
            throw new NotFoundError("Producto no encontrado");
        }

        const exists = await ordersItemsRepository.existsByOrderIdAndProductId(order_id, product_id);
        if (!exists) {
            throw new NotFoundError("No se encontró el item de orden para el ID de orden y producto proporcionados");
        }

        return await ordersItemsRepository.updateQuantity(order_id, product_id, parseInt(newQuantity));
    }

    async updatePriceOrderItem(order_id, product_id, newPrice) {
        this.validateId(order_id, "order_id");
        this.validateId(product_id, "product_id"); 
        this.validateItemsOrderData({ price: newPrice }, true);

        const order = await ordersRepository.getById(order_id);
        if (!order) {
            throw new NotFoundError("Orden no encontrada");
        }

        const product = await productsRepository.getById(product_id);
        if (!product) {
            throw new NotFoundError("Producto no encontrado");
        }

        const exists = await ordersItemsRepository.existsByOrderIdAndProductId(order_id, product_id);
        if (!exists) {
            throw new NotFoundError("No se encontró el item de orden para el ID de orden y producto proporcionados");
        }

        return await ordersItemsRepository.updatePrice(order_id, product_id, parseFloat(newPrice));
    }

    async updateOrderItem(order_id, product_id, updateData) {
        this.validateId(order_id, "order_id");
        this.validateId(product_id, "product_id");

        const { quantity, price } = updateData;

        if (quantity === undefined && price === undefined) {
            throw new ValidationError("Debe proporcionar quantity o price para actualizar");
        }
        this.validateItemsOrderData(updateData, true);

        const order = await ordersRepository.getById(order_id);
        if (!order) {
            throw new NotFoundError("Orden no encontrada");
        }

        const product = await productsRepository.getById(product_id);
        if (!product) {
            throw new NotFoundError("Producto no encontrado");
        }

        const exists = await ordersItemsRepository.existsByOrderIdAndProductId(order_id, product_id);
        if (!exists) {
            throw new NotFoundError("No se encontró el item de orden para el ID de orden y producto proporcionados");
        }

        if (quantity !== undefined && price !== undefined) {
            return await ordersItemsRepository.updateQuantityAndPrice(
                order_id, 
                product_id, 
                parseInt(quantity), 
                parseFloat(price)
            );
        } else if (quantity !== undefined) {
            return await ordersItemsRepository.updateQuantity(
                order_id, 
                product_id, 
                parseInt(quantity)
            );
        } else {
            return await ordersItemsRepository.updatePrice(
                order_id, 
                product_id, 
                parseFloat(price)
            );
        }
    }
}

module.exports = new OrdersItemsService();