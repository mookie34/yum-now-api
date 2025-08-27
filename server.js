const express = require('express');
const bodyParser = require('body-parser');
const customerRoutes = require('./routes/customers');
const couriersRoutes = require('./routes/couriers');
const productsRoutes = require('./routes/products');
const addressesRoutes = require('./routes/addresses');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());

// Rutas
app.use('/api/customers', customerRoutes);
app.use('/api/couriers',couriersRoutes);   
app.use('/api/products', productsRoutes);
app.use('/api/addresses', addressesRoutes);


// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
