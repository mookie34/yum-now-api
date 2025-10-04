require('dotenv').config({ quiet: true });
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const productsRouter = require('./routes/products');
const ordersRouter = require('./routes/orders');
const orderItemsRouter = require('./routes/orderItems');
const customersRouter = require('./routes/customers');
const couriersRouter = require('./routes/couriers');
const assignOrdersRouter = require('./routes/assignOrders');
const addressessRouter = require('./routes/addresses');
const customerPreferencesRouter = require('./routes/customerPreferences');

const app = express();
// ============================================
// MIDDLEWARES DE SEGURIDAD
// ============================================

// Helmet - Protege headers HTTP
app.use(helmet());

// CORS - Permite frontend separado
app.use(cors());

// Rate Limiting - Previene ataques
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // Máximo 100 requests por IP
    message: 'Demasiadas peticiones, intenta más tarde'
  });
  app.use('/api/', limiter);

  // ============================================
// PARSEO DE BODY
// ============================================
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// ============================================
// RUTAS
// ============================================
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/order-items', orderItemsRouter);
app.use('/api/customers', customersRouter);
app.use('/api/couriers', couriersRouter);
app.use('/api/assign-orders', assignOrdersRouter);
app.use('/api/addresses', addressessRouter);
app.use('/api/customer-preferences', customerPreferencesRouter);

// ============================================
// HEALTH CHECK
// ============================================
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
  });

// ============================================
// MANEJO DE ERRORES
// ============================================

// Error 404 - Ruta no encontrada
app.use((req, res, next) => {
    res.status(404).json({
      error: 'Ruta no encontrada',
      path: req.originalUrl
    });
  });
  
  // Error 500 - Error del servidor
  app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    
    res.status(err.status || 500).json({
      error: err.message || 'Error interno del servidor'
    });
  });

//console.log("DB host:", process.env.DB_HOST);

module.exports = app;