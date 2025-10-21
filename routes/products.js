const express = require('express');
const router = express.Router();
const productsController = require('../controllers/productsController');

// Crear un producto
router.post('/', productsController.addProduct);
// Listar productos
router.get('/', productsController.getProducts);
// Listar productos por filtro
router.get('/filter', productsController.getProductForFilter);
// Obtener un producto por ID
router.get('/:id', productsController.getProductById);
// Desactivar un producto (soft delete)
router.patch('/:id/deactivate', productsController.deactivateProduct);
// Eliminar un producto
router.delete('/:id', productsController.deleteProduct);
// Actualizar un producto
router.put('/:id', productsController.updateProduct);
// Actualizar un producto parcialmente
router.patch('/:id', productsController.updateProductPartial);


module.exports = router;
