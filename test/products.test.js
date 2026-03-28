jest.mock("../services/product-service");

const request = require("supertest");
const app = require("../app");
const productService = require("../services/product-service");

describe("POST /api/products", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create a valid product", async () => {
    const mockProduct = {
      id: 1,
      name: "Producto 1",
      description: "Descripción del producto 1",
      price: 100.5,
      is_active: true,
    };

    productService.addProduct.mockResolvedValueOnce(mockProduct);

    const res = await request(app).post("/api/products").send({
      name: "Producto 1",
      description: "Descripción del producto 1",
      price: 100.5,
      is_active: true,
    });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe("Producto creado exitosamente");
    expect(res.body.product.name).toBe("Producto 1");
    expect(res.body.product.price).toBe(100.5);
  });

  it("should fail if name is missing", async () => {
    const { ValidationError } = require("../errors/custom-errors");

    productService.addProduct.mockRejectedValueOnce(
      new ValidationError("El nombre es requerido")
    );

    const res = await request(app).post("/api/products").send({
      description: "Descripción del producto",
      price: 100.5,
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("nombre es requerido");
  });

  it("should fail if price is missing", async () => {
    const { ValidationError } = require("../errors/custom-errors");

    productService.addProduct.mockRejectedValueOnce(
      new ValidationError("El precio es requerido")
    );

    const res = await request(app).post("/api/products").send({
      name: "Producto 1",
      description: "Descripción del producto",
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("precio es requerido");
  });

  it("should fail if price is negative", async () => {
    const { ValidationError } = require("../errors/custom-errors");

    productService.addProduct.mockRejectedValueOnce(
      new ValidationError("El precio no puede ser negativo")
    );

    const res = await request(app).post("/api/products").send({
      name: "Producto 1",
      description: "Descripción del producto",
      price: -50,
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("precio no puede ser negativo");
  });

  it("should fail if name is too short", async () => {
    const { ValidationError } = require("../errors/custom-errors");

    productService.addProduct.mockRejectedValueOnce(
      new ValidationError("El nombre debe tener mínimo 2 caracteres")
    );

    const res = await request(app).post("/api/products").send({
      name: "A",
      description: "Descripción del producto",
      price: 100.5,
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("nombre debe tener mínimo 2 caracteres");
  });

  it("should fail if product already exists", async () => {
    const { DuplicateError } = require("../errors/custom-errors");

    productService.addProduct.mockRejectedValueOnce(
      new DuplicateError("Ya existe un producto con ese nombre")
    );

    const res = await request(app).post("/api/products").send({
      name: "Producto 1",
      description: "Descripción del producto",
      price: 100.5,
    });

    expect(res.status).toBe(409);
    expect(res.body.error).toContain("Ya existe un producto");
  });

  it("should handle database errors", async () => {
    productService.addProduct.mockRejectedValueOnce(new Error("DB error"));

    const res = await request(app).post("/api/products").send({
      name: "Producto 1",
      description: "Descripción del producto",
      price: 100.5,
    });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Error interno del servidor");
  });
});

describe("GET /api/products", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should get all products", async () => {
    const mockProducts = [
      {
        id: 1,
        name: "Producto 1",
        description: "Desc 1",
        price: 100.5,
        is_active: true,
      },
      {
        id: 2,
        name: "Producto 2",
        description: "Desc 2",
        price: 200.75,
        is_active: true,
      },
    ];

    productService.getAllProducts.mockResolvedValueOnce(mockProducts);

    const res = await request(app).get("/api/products");

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
    expect(res.body[0].name).toBe("Producto 1");
  });

  it("should get products with limit and offset", async () => {
    const mockProducts = [
      {
        id: 1,
        name: "Producto 1",
        description: "Desc 1",
        price: 100.5,
        is_active: true,
      },
    ];

    productService.getAllProducts.mockResolvedValueOnce(mockProducts);

    const res = await request(app)
      .get("/api/products")
      .query({ limit: 10, offset: 0 });

    expect(res.status).toBe(200);
    expect(productService.getAllProducts).toHaveBeenCalledWith("10", "0");
  });

  it("should handle errors when fetching products", async () => {
    productService.getAllProducts.mockRejectedValueOnce(new Error("DB error"));

    const res = await request(app).get("/api/products");

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Error interno del servidor");
  });
});

describe("GET /api/products/filter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should filter products by minimum price", async () => {
    const mockProducts = [
      {
        id: 2,
        name: "Producto 2",
        description: "Desc 2",
        price: 200.75,
        is_active: true,
      },
    ];

    productService.searchProducts.mockResolvedValueOnce(mockProducts);

    const res = await request(app)
      .get("/api/products/filter")
      .query({ min_price: 150 });

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].name).toBe("Producto 2");
  });

  it("should filter products by name", async () => {
    const mockProducts = [
      {
        id: 1,
        name: "Producto 1",
        description: "Desc 1",
        price: 100.5,
        is_active: true,
      },
    ];

    productService.searchProducts.mockResolvedValueOnce(mockProducts);

    const res = await request(app)
      .get("/api/products/filter")
      .query({ name: "Producto 1" });

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].name).toBe("Producto 1");
  });

  it("should filter products by price range", async () => {
    const mockProducts = [
      {
        id: 2,
        name: "Producto 2",
        description: "Desc 2",
        price: 150.0,
        is_active: true,
      },
    ];

    productService.searchProducts.mockResolvedValueOnce(mockProducts);

    const res = await request(app)
      .get("/api/products/filter")
      .query({ min_price: 100, max_price: 200 });

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
  });

  it("should filter products by is_active", async () => {
    const mockProducts = [
      {
        id: 1,
        name: "Producto 1",
        description: "Desc 1",
        price: 100.5,
        is_active: true,
      },
    ];

    productService.searchProducts.mockResolvedValueOnce(mockProducts);

    const res = await request(app)
      .get("/api/products/filter")
      .query({ is_active: true });

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
  });

  it("should fail if no filter is provided", async () => {
    const { ValidationError } = require("../errors/custom-errors");

    productService.searchProducts.mockRejectedValueOnce(
      new ValidationError("Se requiere al menos un filtro")
    );

    const res = await request(app).get("/api/products/filter").query({});

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("al menos un filtro");
  });

  it("should fail if min_price is greater than max_price", async () => {
    const { ValidationError } = require("../errors/custom-errors");

    productService.searchProducts.mockRejectedValueOnce(
      new ValidationError("El precio mínimo no puede ser mayor que el máximo")
    );

    const res = await request(app)
      .get("/api/products/filter")
      .query({ min_price: 200, max_price: 100 });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("precio mínimo no puede ser mayor");
  });

  it("should handle errors when filtering products", async () => {
    productService.searchProducts.mockRejectedValueOnce(new Error("DB error"));

    const res = await request(app)
      .get("/api/products/filter")
      .query({ name: "Producto 1" });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Error interno del servidor");
  });
});

describe("GET /api/products/:id", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should get a product by ID", async () => {
    const mockProduct = {
      id: 1,
      name: "Producto 1",
      description: "Desc 1",
      price: 100.5,
      is_active: true,
    };

    productService.getProductById.mockResolvedValueOnce(mockProduct);

    const res = await request(app).get("/api/products/1");

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Producto 1");
    expect(res.body.id).toBe(1);
  });

  it("should fail with invalid ID", async () => {
    const { ValidationError } = require("../errors/custom-errors");

    productService.getProductById.mockRejectedValueOnce(
      new ValidationError("ID inválido")
    );

    const res = await request(app).get("/api/products/abc");

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("ID inválido");
  });

  it("should handle product not found", async () => {
    const { NotFoundError } = require("../errors/custom-errors");

    productService.getProductById.mockRejectedValueOnce(
      new NotFoundError("Producto no encontrado")
    );

    const res = await request(app).get("/api/products/999");

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Producto no encontrado");
  });

  it("should handle database errors", async () => {
    productService.getProductById.mockRejectedValueOnce(new Error("DB error"));

    const res = await request(app).get("/api/products/1");

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Error interno del servidor");
  });
});

describe("DELETE /api/products/:id", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should delete a product by ID", async () => {
    const mockProduct = {
      id: 1,
      name: "Producto 1",
      description: "Desc 1",
      price: 100.5,
      is_active: false,
    };

    productService.hardDelete.mockResolvedValueOnce(mockProduct);

    const res = await request(app).delete("/api/products/1");

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Producto eliminado exitosamente");
    expect(res.body.product.id).toBe(1);
  });

  it("should fail with invalid ID", async () => {
    const { ValidationError } = require("../errors/custom-errors");

    productService.hardDelete.mockRejectedValueOnce(
      new ValidationError("ID inválido")
    );

    const res = await request(app).delete("/api/products/abc");

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("ID inválido");
  });

  it("should handle product not found", async () => {
    const { NotFoundError } = require("../errors/custom-errors");

    productService.hardDelete.mockRejectedValueOnce(
      new NotFoundError("Producto no encontrado")
    );

    const res = await request(app).delete("/api/products/999");

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Producto no encontrado");
  });

  it("should handle database errors", async () => {
    productService.hardDelete.mockRejectedValueOnce(new Error("DB error"));

    const res = await request(app).delete("/api/products/1");

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Error interno del servidor");
  });
});

describe("PUT /api/products/:id", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fully update a product", async () => {
    const updatedProduct = {
      id: 1,
      name: "Producto Actualizado",
      description: "Descripción actualizada",
      price: 150.75,
      is_active: true,
    };

    productService.updateProduct.mockResolvedValueOnce(updatedProduct);

    const res = await request(app).put("/api/products/1").send({
      name: "Producto Actualizado",
      description: "Descripción actualizada",
      price: 150.75,
      is_active: true,
    });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Producto actualizado exitosamente");
    expect(res.body.product.name).toBe("Producto Actualizado");
  });

  it("should fail if name is missing", async () => {
    const { ValidationError } = require("../errors/custom-errors");

    productService.updateProduct.mockRejectedValueOnce(
      new ValidationError("El nombre es requerido")
    );

    const res = await request(app).put("/api/products/1").send({
      description: "Descripción actualizada",
      price: 150.75,
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("nombre es requerido");
  });

  it("should fail if price is missing", async () => {
    const { ValidationError } = require("../errors/custom-errors");

    productService.updateProduct.mockRejectedValueOnce(
      new ValidationError("El precio es requerido")
    );

    const res = await request(app).put("/api/products/1").send({
      name: "Producto Actualizado",
      description: "Descripción actualizada",
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("precio es requerido");
  });

  it("should fail if product does not exist", async () => {
    const { NotFoundError } = require("../errors/custom-errors");

    productService.updateProduct.mockRejectedValueOnce(
      new NotFoundError("Producto no encontrado")
    );

    const res = await request(app).put("/api/products/999").send({
      name: "Producto Actualizado",
      description: "Descripción actualizada",
      price: 150.75,
    });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Producto no encontrado");
  });

  it("should fail if new name already exists", async () => {
    const { DuplicateError } = require("../errors/custom-errors");

    productService.updateProduct.mockRejectedValueOnce(
      new DuplicateError("Ya existe un producto con ese nombre")
    );

    const res = await request(app).put("/api/products/1").send({
      name: "Producto 2",
      description: "Descripción actualizada",
      price: 150.75,
    });

    expect(res.status).toBe(409);
    expect(res.body.error).toContain("Ya existe un producto");
  });

  it("should handle database errors", async () => {
    productService.updateProduct.mockRejectedValueOnce(new Error("DB error"));

    const res = await request(app).put("/api/products/1").send({
      name: "Producto Actualizado",
      description: "Descripción actualizada",
      price: 150.75,
    });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Error interno del servidor");
  });
});

describe("PATCH /api/products/:id", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should partially update only price", async () => {
    const updatedProduct = {
      id: 1,
      name: "Producto 1",
      description: "Desc 1",
      price: 120.0,
      is_active: true,
    };

    productService.updateProductPartial.mockResolvedValueOnce(updatedProduct);

    const res = await request(app)
      .patch("/api/products/1")
      .send({ price: 120.0 });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Producto actualizado exitosamente");
    expect(res.body.product.price).toBe(120.0);
  });

  it("should partially update only name", async () => {
    const updatedProduct = {
      id: 1,
      name: "Producto Modificado",
      description: "Desc 1",
      price: 100.5,
      is_active: true,
    };

    productService.updateProductPartial.mockResolvedValueOnce(updatedProduct);

    const res = await request(app)
      .patch("/api/products/1")
      .send({ name: "Producto Modificado" });

    expect(res.status).toBe(200);
    expect(res.body.product.name).toBe("Producto Modificado");
  });

  it("should fail if no field is provided", async () => {
    const { ValidationError } = require("../errors/custom-errors");

    productService.updateProductPartial.mockRejectedValueOnce(
      new ValidationError("Se requiere al menos un campo para actualizar")
    );

    const res = await request(app).patch("/api/products/1").send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("al menos un campo para actualizar");
  });

  it("should fail if product does not exist", async () => {
    const { NotFoundError } = require("../errors/custom-errors");

    productService.updateProductPartial.mockRejectedValueOnce(
      new NotFoundError("Producto no encontrado")
    );

    const res = await request(app)
      .patch("/api/products/999")
      .send({ price: 120.0 });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Producto no encontrado");
  });

  it("should fail if new name already exists", async () => {
    const { DuplicateError } = require("../errors/custom-errors");

    productService.updateProductPartial.mockRejectedValueOnce(
      new DuplicateError("Ya existe un producto con ese nombre")
    );

    const res = await request(app)
      .patch("/api/products/1")
      .send({ name: "Producto 2" });

    expect(res.status).toBe(409);
    expect(res.body.error).toContain("Ya existe un producto");
  });

  it("should handle database errors", async () => {
    productService.updateProductPartial.mockRejectedValueOnce(
      new Error("DB error")
    );

    const res = await request(app)
      .patch("/api/products/1")
      .send({ price: 120.0 });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Error interno del servidor");
  });
});
