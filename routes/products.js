const express = require('express');
const router = express.Router();
const productsController = require('../controllers/products-controller');
const authenticate = require('../middleware/authenticate');

// Public - product catalog
router.get('/', productsController.getProducts);
router.get('/filter', productsController.getProductsByFilter);
router.get('/:id', productsController.getProductById);

// Admin only - product management
router.post('/', authenticate, productsController.addProduct);
router.put('/:id', authenticate, productsController.updateProduct);
router.patch('/:id/deactivate', authenticate, productsController.deactivateProduct);
router.patch('/:id', authenticate, productsController.updateProductPartial);
router.delete('/:id', authenticate, productsController.deleteProduct);


module.exports = router;
