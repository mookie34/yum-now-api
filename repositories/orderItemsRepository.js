const db = require("../db");

class OrderItemsRepository {
  constructor() {
    this.tableName = "yunowdatabase.order_items"; 
  }

  async create(orderItemData) {
    try {
      const { order_id, product_id, quantity, price } = orderItemData;
      const query = `
        INSERT INTO ${this.tableName} (order_id, product_id, quantity, price) 
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      const result = await db.query(query, [order_id, product_id, quantity, price]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error al crear item de orden: ${error.message}`);
    }
  }

  async getAll(limit = 100, offset = 0) {
    try {
      const query = `
        SELECT * FROM ${this.tableName}
        ORDER BY id ASC
        LIMIT $1 OFFSET $2
      `;
      const result = await db.query(query, [limit, offset]);
      return result.rows;
    } catch (error) {
      throw new Error(`Error al obtener items de orden: ${error.message}`);
    }
  }

  async getByOrderId(order_id) {
    try {
      const query = `
        SELECT * FROM ${this.tableName} 
        WHERE order_id = $1
        ORDER BY id ASC
      `;
      const result = await db.query(query, [order_id]);
      return result.rows;
    } catch (error) {
      throw new Error(`Error al obtener items por order_id: ${error.message}`);
    }
  }

  async getByOrderIdAndProductId(order_id, product_id) {
    try {
      const query = `
        SELECT * FROM ${this.tableName} 
        WHERE order_id = $1 AND product_id = $2
      `;
      const result = await db.query(query, [order_id, product_id]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error al obtener item de orden: ${error.message}`);
    }
  }

  async existsByOrderIdAndProductId(order_id, product_id) {
    try {
      const query = `
        SELECT EXISTS(
          SELECT 1 FROM ${this.tableName} 
          WHERE order_id = $1 AND product_id = $2
        ) as exists
      `;
      const result = await db.query(query, [order_id, product_id]);
      return result.rows[0].exists;
    } catch (error) {
      throw new Error(`Error al verificar existencia de item: ${error.message}`);
    }
  }

  async deleteByOrderId(order_id) {
    try {
      const query = `
        DELETE FROM ${this.tableName} 
        WHERE order_id = $1
        RETURNING *
      `;
      const result = await db.query(query, [order_id]);
      return result.rows;
    } catch (error) {
      throw new Error(`Error al eliminar items de orden: ${error.message}`);
    }
  }

  async deleteByOrderIdAndProductId(order_id, product_id) {
    try {
      const query = `
        DELETE FROM ${this.tableName} 
        WHERE order_id = $1 AND product_id = $2
        RETURNING *
      `;
      const result = await db.query(query, [order_id, product_id]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error al eliminar item de orden: ${error.message}`);
    }
  }

  async updateQuantity(order_id, product_id, quantity) {
    try {
      const query = `
        UPDATE ${this.tableName} 
        SET quantity = $1
        WHERE order_id = $2 AND product_id = $3
        RETURNING *
      `;
      const result = await db.query(query, [quantity, order_id, product_id]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error al actualizar cantidad: ${error.message}`);
    }
  }

  async updatePrice(order_id, product_id, price) {
    try {
      const query = `
        UPDATE ${this.tableName} 
        SET price = $1
        WHERE order_id = $2 AND product_id = $3
        RETURNING *
      `;
      const result = await db.query(query, [price, order_id, product_id]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error al actualizar precio: ${error.message}`);
    }
  }

  async updateQuantityAndPrice(order_id, product_id, quantity, price) {
    try {
      const query = `
        UPDATE ${this.tableName} 
        SET quantity = $1, price = $2
        WHERE order_id = $3 AND product_id = $4
        RETURNING *
      `;
      const result = await db.query(query, [quantity, price, order_id, product_id]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error al actualizar item de orden: ${error.message}`);
    }
  }
}

module.exports = new OrderItemsRepository();