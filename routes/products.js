const express = require('express');
const router = express.Router();
const productsController = require('../controllers/productsController');

// Create a product
router.post('/', productsController.addProduct);
// List products
router.get('/', productsController.getProducts);
// List products by filter
router.get('/filter', productsController.getProductsByFilter);
// Get a product by ID
router.get('/:id', productsController.getProductById);
// Deactivate a product (soft delete)
router.patch('/:id/deactivate', productsController.deactivateProduct);
// Delete a product
router.delete('/:id', productsController.deleteProduct);
// Update a product
router.put('/:id', productsController.updateProduct);
// Partially update a product
router.patch('/:id', productsController.updateProductPartial);


module.exports = router;
