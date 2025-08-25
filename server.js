const express = require('express');
const bodyParser = require('body-parser');
const customerRoutes = require('./routes/customers');
const couriesRoutes = require('./routes/couriers');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());

// Rutas
app.use('/api/customers', customerRoutes);
app.use('/api/couriers',couriesRoutes);   
app.use('/api/products', productsRoutes);


// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
