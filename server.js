const express = require('express');
const bodyParser = require('body-parser');
const customerRoutes = require('./routes/customers');
const couriersRoutes = require('./routes/couriers');
const productsRoutes = require('./routes/products');
const addressesRoutes = require('./routes/addresses');
const ordersRoutes = require('./routes/orders');
const orderItemsRoutes = require('./routes/orderItems');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());

// Rutas
app.use('/api/customers', customerRoutes);
app.use('/api/couriers',couriersRoutes);   
app.use('/api/products', productsRoutes);
app.use('/api/addresses', addressesRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/order-items', orderItemsRoutes);
app.use('/api/assign-orders', require('./routes/assignOrders')); 


// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
