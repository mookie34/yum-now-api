const productService = require('../services/productService')
const { ValidationError, NotFoundError, DuplicateError } = require('../errors/customErrors');

const addProduct = async (req, res) => {
    try {
        const product = await productService.addProduct(req.body);
        res.status(201).json({
            message: 'Producto creado exitosamente',
            product
        });
    } catch (err) {
        console.error('Error al crear producto:', err.message);
         if (err instanceof ValidationError) {
            return res.status(400).json({ error: err.message });
        }
        
        if (err instanceof DuplicateError) {
            return res.status(409).json({ error: err.message });
        }
        
        res.status(500).json({ error: 'Error al crear el producto' });
    }
};

const getProducts = async (req, res) => {
    try {
        const {limit, offset } = req.query;
        const products = await productService.getAllProducts(limit, offset);
        res.json(products);
    } catch (err) {
        console.error('Error al obtener productos: ',err.message);
        res.status(500).json({ error: 'Error al obtener los productos' });
    }
};

const getProductForFilter = async (req, res) => {
    try {
        const product = await productService.searchProducts(req.query);
        res.json(product);
    } catch (err) {
        console.error('Error al obtener productos: ',err.message);
        if (err instanceof ValidationError) {
            return res.status(400).json({ error: err.message });
        }
        
        if (err instanceof NotFoundError) {
            return res.status(404).json({ error: err.message });
        }
        res.status(500).json({ error: 'Error al obtener los productos con filtros' });
    }
};

const getProductById = async (req, res) => {
    try {
        const product = await productService.getProductById(req.params.id);
        res.json(product);
    } catch (err) {
        console.error('Error al obtener el producto: ',err.message);
        if (err instanceof ValidationError) {
            return res.status(400).json({ error: err.message });
        }
        
        if (err instanceof NotFoundError) {
            return res.status(404).json({ error: err.message });
        }
        res.status(500).json({ error: 'Error al obtener el producto' });
    }
}

const deleteProduct = async (req, res) => {
    try {
        const product = await productService.hardDelete(req.params.id);
         res.json({
            message: 'Producto eliminado exitosamente',
            product
        });
    } catch (err) {
        console.error('Error al eliminar producto: ', err.message);
                if (err instanceof ValidationError) {
            return res.status(400).json({ error: err.message });
        }
        
        if (err instanceof NotFoundError) {
            return res.status(404).json({ error: err.message });
        }

        res.status(500).json({ error: 'Error al eliminar el producto' });
    }
};

const deactivateProduct = async (req, res) => {
    try {
        const product = await productService.softDelete(req.params.id);
         res.json({
            message: 'Producto desactivado exitosamente',
            product
        });
    } catch (err) {
        console.error('Error al desactivar producto: ', err.message);
                if (err instanceof ValidationError) {
            return res.status(400).json({ error: err.message });
        }
        
        if (err instanceof NotFoundError) {
            return res.status(404).json({ error: err.message });
        }

        res.status(500).json({ error: 'Error al desactivar el producto' });
    }
};

const updateProduct = async (req, res) => {
    try {
        const product = await productService.updateProduct(req.params.id, req.body);
        res.json({
            message: 'Producto actualizado exitosamente',
            product
        });
    } catch (err) {
        console.error('Error al actualizar producto: ',err.message);
         if (err instanceof ValidationError) {
            return res.status(400).json({ error: err.message });
        }
        
        if (err instanceof NotFoundError) {
            return res.status(404).json({ error: err.message });
        }
        
        if (err instanceof DuplicateError) {
            return res.status(409).json({ error: err.message });
        }
        res.status(500).json({ error: 'Error al actualizar el producto' });
    }
};

const updateProductPartial = async (req, res) => {
    try {
       const product = await productService.updateProductPartial(req.params.id, req.body);
       res.json({
            message: 'Producto actualizado exitosamente',
            product
        });
    } catch (err) {
        console.error('Error al actualizar producto:', err.message);
        
        if (err instanceof ValidationError) {
            return res.status(400).json({ error: err.message });
        }
        
        if (err instanceof NotFoundError) {
            return res.status(404).json({ error: err.message });
        }
        
        if (err instanceof DuplicateError) {
            return res.status(409).json({ error: err.message });
        }
        
        res.status(500).json({ error: 'Error al actualizar el producto' });
    }
};

module.exports = {addProduct, getProducts,getProductById, getProductForFilter, deleteProduct, updateProduct, updateProductPartial,deactivateProduct};