const express = require('express');
const bodyParser = require('body-parser');

const productsRouter = require('./routes/products');
const ordersRouter = require('./routes/orders');
const orderItemsRouter = require('./routes/orderItems');
const customersRouter = require('./routes/customers');
const couriersRouter = require('./routes/couriers');
const assignOrdersRouter = require('./routes/assignOrders');
const addressessRouter = require('./routes/addresses');

const app = express();
app.use(bodyParser.json());

app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/order-items', orderItemsRouter);
app.use('/api/customers', customersRouter);
app.use('/api/couriers', couriersRouter);
app.use('/api/assign-orders', assignOrdersRouter);
app.use('/api/addresses', addressessRouter);

module.exports = app;