const productService = require("../services/productService");
const {
  ValidationError,
  NotFoundError,
  DuplicateError,
} = require("../errors/customErrors");

// ============================================================================
// CREATE
// ============================================================================

const addProduct = async (req, res) => {
  try {
    const product = await productService.addProduct(req.body);
    res.status(201).json({
      message: "Producto creado exitosamente",
      product,
    });
  } catch (err) {
    console.error("Error creating product:", err.message);

    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }

    if (err instanceof DuplicateError) {
      return res.status(409).json({ error: err.message });
    }

    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// ============================================================================
// READ
// ============================================================================

const getProducts = async (req, res) => {
  try {
    const { limit, offset } = req.query;
    const products = await productService.getAllProducts(limit, offset);
    res.json(products);
  } catch (err) {
    console.error("Error fetching products:", err.message);

    // ValidationError handling for invalid pagination limits
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }

    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const getProductsByFilter = async (req, res) => {
  try {
    const products = await productService.searchProducts(req.query);
    res.json(products);
  } catch (err) {
    console.error("Error fetching products by filter:", err.message);

    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }

    if (err instanceof NotFoundError) {
      return res.status(404).json({ error: err.message });
    }

    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const getProductById = async (req, res) => {
  try {
    const product = await productService.getProductById(req.params.id);
    res.json(product);
  } catch (err) {
    console.error("Error fetching product by ID:", err.message);

    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }

    if (err instanceof NotFoundError) {
      return res.status(404).json({ error: err.message });
    }

    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// ============================================================================
// UPDATE
// ============================================================================

const updateProduct = async (req, res) => {
  try {
    const product = await productService.updateProduct(req.params.id, req.body);
    res.json({
      message: "Producto actualizado exitosamente",
      product,
    });
  } catch (err) {
    console.error("Error updating product:", err.message);

    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }

    if (err instanceof NotFoundError) {
      return res.status(404).json({ error: err.message });
    }

    if (err instanceof DuplicateError) {
      return res.status(409).json({ error: err.message });
    }

    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const updateProductPartial = async (req, res) => {
  try {
    const product = await productService.updateProductPartial(
      req.params.id,
      req.body
    );
    res.json({
      message: "Producto actualizado exitosamente",
      product,
    });
  } catch (err) {
    console.error("Error partially updating product:", err.message);

    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }

    if (err instanceof NotFoundError) {
      return res.status(404).json({ error: err.message });
    }

    if (err instanceof DuplicateError) {
      return res.status(409).json({ error: err.message });
    }

    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// ============================================================================
// DELETE
// ============================================================================

const deleteProduct = async (req, res) => {
  try {
    const product = await productService.hardDelete(req.params.id);
    res.json({
      message: "Producto eliminado exitosamente",
      product,
    });
  } catch (err) {
    console.error("Error deleting product:", err.message);

    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }

    if (err instanceof NotFoundError) {
      return res.status(404).json({ error: err.message });
    }

    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const deactivateProduct = async (req, res) => {
  try {
    const product = await productService.softDelete(req.params.id);
    res.json({
      message: "Producto desactivado exitosamente",
      product,
    });
  } catch (err) {
    console.error("Error deactivating product:", err.message);

    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }

    if (err instanceof NotFoundError) {
      return res.status(404).json({ error: err.message });
    }

    res.status(500).json({ error: "Error interno del servidor" });
  }
};

module.exports = {
  addProduct,
  getProducts,
  getProductById,
  getProductsByFilter,
  deleteProduct,
  deactivateProduct,
  updateProduct,
  updateProductPartial,
};
