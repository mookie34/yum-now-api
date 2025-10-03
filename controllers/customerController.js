const db = require('../db');

const validateCustomer = (name, email, phone, isPartial = false) => {
  const errors = [];
  
  // Validar nombre (REQUERIDO, max 100 caracteres)
  if (!isPartial || name !== undefined) {
    if (!name || name.trim().length < 2) {
      errors.push('Nombre inválido (mínimo 2 caracteres)');
    } else if (name.trim().length > 100) {
      errors.push('Nombre muy largo (máximo 100 caracteres)');
    }
  }
  
  // Validar email (OPCIONAL, max 100 caracteres)
  // Solo valida si se proporciona
  if (email !== undefined && email !== null && email.trim() !== '') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push('Email inválido');
    } else if (email.trim().length > 100) {
      errors.push('Email muy largo (máximo 100 caracteres)');
    }
  }
  
  // Validar teléfono (REQUERIDO, UNIQUE, max 20 caracteres)
  if (!isPartial || phone !== undefined) {
    if (!phone || phone.trim().length < 7) {
      errors.push('Teléfono inválido (mínimo 7 caracteres)');
    } else if (phone.trim().length > 20) {
      errors.push('Teléfono muy largo (máximo 20 caracteres)');
    }
    
    // Validar que contenga principalmente números
    const phoneRegex = /^[\d\s\-\(\)\+]+$/;
    if (phone && !phoneRegex.test(phone)) {
      errors.push('Teléfono contiene caracteres inválidos');
    }
  }
  
  return errors;
};

/**
 * Valida que el ID sea un número entero positivo
 */
const validateId = (id) => {
  if (!id || isNaN(id) || parseInt(id) <= 0) {
    return 'ID inválido';
  }
  return null;
};

// ============================================
// CONTROLADORES
// ============================================

const addCustomer = async (req, res) => {
  const { name, email, phone } = req.body;

  // Validar datos
  const errors = validateCustomer(name, email, phone);
  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join(', ') });
  }

  try {
    const emailValue = email && email.trim() !== '' 
      ? email.trim().toLowerCase() 
      : null;

    const result = await db.query(
      'INSERT INTO YuNowDataBase.customers (name, phone, email) VALUES ($1, $2, $3) RETURNING *',
      [name.trim(), phone.trim(), emailValue]
    );

    res.status(201).json({
      message: 'Cliente creado exitosamente',
      customer: result.rows[0]
    });
  } catch (err) {
    console.error('Error al crear cliente:', err.message);
    
    // Error 23505: Violación de UNIQUE constraint
    // En este caso, el PHONE ya existe (phone es UNIQUE)
    if (err.code === '23505') {
      return res.status(409).json({ 
        error: 'Ya existe un cliente con ese número de teléfono' 
      });
    }
    
    // Error 23502: NOT NULL constraint
    if (err.code === '23502') {
      return res.status(400).json({
        error: 'Faltan campos requeridos (name o phone)'
      });
    }
    
    res.status(500).json({ error: 'Error al crear el cliente' });
  }
};

const getCustomers = async (req, res) => {
  try {
    // Límite configurable: por defecto 50, máximo 100
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    
    const result = await db.query(
      'SELECT id, name, phone, email, created_at FROM YuNowDataBase.customers ORDER BY created_at DESC LIMIT $1',
      [limit]
    );
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener clientes:', err.message);
    res.status(500).json({ error: 'Error al obtener los clientes' });
  }
};

const getCustomerForPhone = async (req, res) => {
  const { phone } = req.params;
  
  if (!phone || phone.trim().length < 7) {
    return res.status(400).json({ error: 'Teléfono inválido' });
  }

  try {
    const result = await db.query(
      'SELECT id, name, phone, email, created_at FROM YuNowDataBase.customers WHERE phone = $1',
      [phone.trim()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al buscar cliente:', err.message);
    res.status(500).json({ error: 'Error al buscar el cliente' });
  }
};

const updateCustomer = async (req, res) => {
  const { id } = req.params;
  const { name, email, phone } = req.body;

  const idError = validateId(id);
  if (idError) {
    return res.status(400).json({ error: idError });
  }

  const errors = validateCustomer(name, email, phone);
  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join(', ') });
  }

  try {
    const emailValue = email && email.trim() !== '' 
      ? email.trim().toLowerCase() 
      : null;

    const result = await db.query(
      'UPDATE YuNowDataBase.customers SET name = $1, phone = $2, email = $3 WHERE id = $4 RETURNING *',
      [name.trim(), phone.trim(), emailValue, parseInt(id)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    res.json({
      message: 'Cliente actualizado exitosamente',
      customer: result.rows[0]
    });
  } catch (err) {
    console.error('Error al actualizar cliente:', err.message);
    
    if (err.code === '23505') {
      return res.status(409).json({ 
        error: 'Ya existe un cliente con ese número de teléfono' 
      });
    }
    
    res.status(500).json({ error: 'Error al actualizar el cliente' });
  }
};

const updateCustomerPartial = async (req, res) => {
  const { id } = req.params;
  const { name, email, phone } = req.body;

  const idError = validateId(id);
  if (idError) {
    return res.status(400).json({ error: idError });
  }

  if (name === undefined && email === undefined && phone === undefined) {
    return res.status(400).json({ 
      error: 'Debe proporcionar al menos un campo para actualizar (name, email o phone)' 
    });
  }

  try {
    const fields = [];
    const values = [];
    let counter = 1;

    if (name !== undefined) {
      if (!name || name.trim().length < 2) {
        return res.status(400).json({ 
          error: 'Nombre inválido (mínimo 2 caracteres)' 
        });
      }
      if (name.trim().length > 100) {
        return res.status(400).json({ 
          error: 'Nombre muy largo (máximo 100 caracteres)' 
        });
      }
      fields.push(`name = $${counter++}`);
      values.push(name.trim());
    }

    if (phone !== undefined) {
      if (!phone || phone.trim().length < 7) {
        return res.status(400).json({ 
          error: 'Teléfono inválido (mínimo 7 caracteres)' 
        });
      }
      if (phone.trim().length > 20) {
        return res.status(400).json({ 
          error: 'Teléfono muy largo (máximo 20 caracteres)' 
        });
      }
      const phoneRegex = /^[\d\s\-\(\)\+]+$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({ 
          error: 'Teléfono contiene caracteres inválidos' 
        });
      }
      fields.push(`phone = $${counter++}`);
      values.push(phone.trim());
    }

    if (email !== undefined) {
      if (email === null || email.trim() === '') {
        // Permitir establecer email como NULL
        fields.push(`email = $${counter++}`);
        values.push(null);
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({ error: 'Email inválido' });
        }
        if (email.trim().length > 100) {
          return res.status(400).json({ 
            error: 'Email muy largo (máximo 100 caracteres)' 
          });
        }
        fields.push(`email = $${counter++}`);
        values.push(email.trim().toLowerCase());
      }
    }

    values.push(parseInt(id));

    const query = `UPDATE YuNowDataBase.customers SET ${fields.join(', ')} WHERE id = $${counter} RETURNING *`;
    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    res.json({
      message: 'Cliente actualizado exitosamente',
      customer: result.rows[0]
    });
  } catch (err) {
    console.error('Error al actualizar cliente:', err.message);
    
    if (err.code === '23505') {
      return res.status(409).json({ 
        error: 'Ya existe un cliente con ese número de teléfono' 
      });
    }
    
    res.status(500).json({ error: 'Error al actualizar el cliente' });
  }
};

const deleteCustomer = async (req, res) => {
  const { id } = req.params;

  const idError = validateId(id);
  if (idError) {
    return res.status(400).json({ error: idError });
  }

  try {
    const result = await db.query(
      'DELETE FROM YuNowDataBase.customers WHERE id = $1 RETURNING *',
      [parseInt(id)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    res.json({
      message: 'Cliente eliminado exitosamente',
      customer: result.rows[0]
    });
  } catch (err) {
    console.error('Error al eliminar cliente:', err.message);
    
    // Error 23503: Foreign key constraint
    // Si el cliente tiene órdenes asociadas
    if (err.code === '23503') {
      return res.status(409).json({
        error: 'No se puede eliminar el cliente porque tiene órdenes asociadas'
      });
    }
    
    res.status(500).json({ error: 'Error al eliminar el cliente' });
  }
};

module.exports = {
  addCustomer,
  getCustomers,
  getCustomerForPhone,
  updateCustomer,
  updateCustomerPartial,
  deleteCustomer
};