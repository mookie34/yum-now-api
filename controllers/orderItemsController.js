const db = require('../db');

const addOrderItem = async (req, res) => {
    const { order_id, product_id, quantity } = req.body;

    if (!order_id || !product_id || !quantity) {
        return res.status(400).json({ error: 'Faltan datos: order_id, product_id, quantity' });
    }

    try {
        const existOrderId=await db.query('SELECT id FROM YuNowDataBase.orders WHERE id = $1', [order_id]);
        if(existOrderId.rows.length===0){
            return res.status(404).json({ error: 'Orden no encontrada' });
        }

        const productResult = await db.query('SELECT price FROM YuNowDataBase.products WHERE id = $1', [product_id]);

        if (productResult.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        const price = productResult.rows[0].price;

        const result = await db.query(
            'INSERT INTO YuNowDataBase.order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4) RETURNING *',
            [order_id, product_id, quantity, price]
        );

        res.status(201).json({
            message: 'Item de orden creado exitosamente',
            orderItem: result.rows[0]
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Error al guardar el item de orden en la base de datos' });
    }
}

const getAllOrderItems = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM YuNowDataBase.order_items');
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Error al obtener los items de orden desde la base de datos' });
    }
}

const getOrderItemByOrderId = async (req, res) => {
    const { orderId } = req.params;

    try {
        const result = await db.query('SELECT * FROM YuNowDataBase.order_items WHERE order_id = $1', [orderId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No se encontraron items de orden para el ID de orden proporcionado' });
        }
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Error al obtener los items de orden desde la base de datos' });
    }
}

const deleteAllItemsInOrder = async (req, res) => {
    const { orderId } = req.params;

    try {
        const result = await db.query('DELETE FROM YuNowDataBase.order_items WHERE order_id = $1 RETURNING *', [orderId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No se encontraron items de orden para el ID de orden proporcionado' });
        }
        res.status(200).json({ message: 'Items de orden eliminados exitosamente', deletedItems: result.rows });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Error al eliminar los items de orden desde la base de datos' });
    }
}

    const deleteItemInOrderByIdProduct = async (req, res) => {
    const { orderId, productId } = req.params;

    try {
        const existOrderId=await db.query('SELECT id FROM YuNowDataBase.orders WHERE id = $1', [orderId]);
        if(existOrderId.rows.length===0){
            return res.status(404).json({ error: 'Orden no encontrada' });
        }

        const existProductId=await db.query('SELECT id FROM YuNowDataBase.products WHERE id = $1', [productId]);
        if(existProductId.rows.length===0){
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        const result = await db.query('DELETE FROM YuNowDataBase.order_items WHERE order_id = $1 AND product_id = $2 RETURNING *', [orderId, productId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No se encontraron items de orden para el ID de orden y producto proporcionados' });
        }
        res.status(200).json({ message: 'Item de orden eliminado exitosamente', deletedItem: result.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Error al eliminar el item de orden desde la base de datos' });
    }
}

const updateQuantityOrPriceInOrderItem = async (req, res) => {
    const { orderId, productId } = req.params;
    const { quantity, price } = req.body;

    if (!quantity && !price) {
        return res.status(400).json({ error: 'Faltan datos: quantity o price' });
    }

    let query = 'UPDATE YuNowDataBase.order_items SET ';
    const values = [];
    let index = 1;

    if (quantity) {
        query += `quantity = $${index}, `;
        values.push(quantity);
        index++;
    }
    if (price) {
        query += `price = $${index}, `;
        values.push(price);
        index++;
    }

    query = query.slice(0, -2); // Remove last comma and space
    query += ` WHERE order_id = $${index} AND product_id = $${index + 1} RETURNING *`;
    values.push(orderId, productId);

    try {
        existOrderId=await db.query('SELECT id FROM YuNowDataBase.orders WHERE id = $1', [orderId]);
        if(existOrderId.rows.length===0){
            return res.status(404).json({ error: 'Orden no encontrada' });
        }

        existProductId=await db.query('SELECT id FROM YuNowDataBase.products WHERE id = $1', [productId]);
        if(existProductId.rows.length===0){
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        
        const result = await db.query(query, values);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No se encontraron items de orden para el ID de orden y producto proporcionados' });
        }
        res.status(200).json({ message: 'Item de orden actualizado exitosamente', updatedItem: result.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Error al actualizar el item de orden en la base de datos' });
    }
}


module.exports = {addOrderItem, getAllOrderItems, getOrderItemByOrderId, deleteAllItemsInOrder, deleteItemInOrderByIdProduct, updateQuantityOrPriceInOrderItem};  
