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
const addressesRouter = require('./routes/addresses');
const customerPreferencesRouter = require('./routes/customerPreferences');

const app = express();
// ============================================
// SECURITY MIDDLEWARES
// ============================================

// Helmet - Protects HTTP headers
app.use(helmet());

// CORS - Allows separate frontend
app.use(cors({ origin: process.env.FRONTEND_URL }));

// Rate Limiting - Prevents abuse
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Max 100 requests per IP
    message: 'Demasiadas peticiones, intenta más tarde'
  });
  app.use('/api/', limiter);

  // ============================================
// BODY PARSING
// ============================================
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// ============================================
// ROUTES
// ============================================
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/order-items', orderItemsRouter);
app.use('/api/customers', customersRouter);
app.use('/api/couriers', couriersRouter);
app.use('/api/assign-orders', assignOrdersRouter);
app.use('/api/addresses', addressesRouter);
app.use('/api/customer-preferences', customerPreferencesRouter);

// ============================================
// HEALTH CHECK
// ============================================
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
  });

// ============================================
// ERROR HANDLING
// ============================================

// 404 - Route not found
app.use((req, res, next) => {
    res.status(404).json({
      error: 'Ruta no encontrada',
      path: req.originalUrl
    });
  });

  // 500 - Server error
  app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    
    const statusCode = err.status || 500;
    const message = statusCode === 500 ? 'Error interno del servidor' : err.message;
    res.status(statusCode).json({ error: message });
  });

//console.log("DB host:", process.env.DB_HOST);

module.exports = app;