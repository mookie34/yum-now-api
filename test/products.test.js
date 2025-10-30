jest.mock("../services/productService");

const request = require("supertest");
const app = require("../app");
const productService = require("../services/productService");

describe("POST /api/products", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Debe crear un producto válido", async () => {
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

  it("Debe fallar si falta el nombre", async () => {
    const { ValidationError } = require("../errors/customErrors");

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

  it("Debe fallar si falta el precio", async () => {
    const { ValidationError } = require("../errors/customErrors");

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

  it("Debe fallar si el precio es negativo", async () => {
    const { ValidationError } = require("../errors/customErrors");

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

  it("Debe fallar si el nombre es muy corto", async () => {
    const { ValidationError } = require("../errors/customErrors");

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

  it("Debe fallar si el producto ya existe", async () => {
    const { DuplicateError } = require("../errors/customErrors");

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

  it("Debe manejar errores de base de datos", async () => {
    productService.addProduct.mockRejectedValueOnce(new Error("DB error"));

    const res = await request(app).post("/api/products").send({
      name: "Producto 1",
      description: "Descripción del producto",
      price: 100.5,
    });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Error al crear el producto");
  });
});

describe("GET /api/products", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Debe obtener todos los productos", async () => {
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

  it("Debe obtener productos con limit y offset", async () => {
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

  it("Debe manejar errores al obtener productos", async () => {
    productService.getAllProducts.mockRejectedValueOnce(new Error("DB error"));

    const res = await request(app).get("/api/products");

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Error al obtener los productos");
  });
});

describe("GET /api/products/filter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Debe filtrar productos por precio mínimo", async () => {
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

  it("Debe filtrar productos por nombre", async () => {
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

  it("Debe filtrar productos por rango de precio", async () => {
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

  it("Debe filtrar productos por is_active", async () => {
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

  it("Debe fallar si no se proporciona ningún filtro", async () => {
    const { ValidationError } = require("../errors/customErrors");

    productService.searchProducts.mockRejectedValueOnce(
      new ValidationError("Se requiere al menos un filtro")
    );

    const res = await request(app).get("/api/products/filter").query({});

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("al menos un filtro");
  });

  it("Debe fallar si min_price es mayor que max_price", async () => {
    const { ValidationError } = require("../errors/customErrors");

    productService.searchProducts.mockRejectedValueOnce(
      new ValidationError("El precio mínimo no puede ser mayor que el máximo")
    );

    const res = await request(app)
      .get("/api/products/filter")
      .query({ min_price: 200, max_price: 100 });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("precio mínimo no puede ser mayor");
  });

  it("Debe manejar errores al filtrar productos", async () => {
    productService.searchProducts.mockRejectedValueOnce(new Error("DB error"));

    const res = await request(app)
      .get("/api/products/filter")
      .query({ name: "Producto 1" });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Error al obtener los productos con filtros");
  });
});

describe("GET /api/products/:id", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Debe obtener un producto por ID", async () => {
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

  it("Debe fallar con ID inválido", async () => {
    const { ValidationError } = require("../errors/customErrors");

    productService.getProductById.mockRejectedValueOnce(
      new ValidationError("ID inválido")
    );

    const res = await request(app).get("/api/products/abc");

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("ID inválido");
  });

  it("Debe manejar producto no encontrado", async () => {
    const { NotFoundError } = require("../errors/customErrors");

    productService.getProductById.mockRejectedValueOnce(
      new NotFoundError("Producto no encontrado")
    );

    const res = await request(app).get("/api/products/999");

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Producto no encontrado");
  });

  it("Debe manejar errores de base de datos", async () => {
    productService.getProductById.mockRejectedValueOnce(new Error("DB error"));

    const res = await request(app).get("/api/products/1");

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Error al obtener el producto");
  });
});

describe("DELETE /api/products/:id", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Debe eliminar un producto por ID", async () => {
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

  it("Debe fallar con ID inválido", async () => {
    const { ValidationError } = require("../errors/customErrors");

    productService.hardDelete.mockRejectedValueOnce(
      new ValidationError("ID inválido")
    );

    const res = await request(app).delete("/api/products/abc");

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("ID inválido");
  });

  it("Debe manejar producto no encontrado", async () => {
    const { NotFoundError } = require("../errors/customErrors");

    productService.hardDelete.mockRejectedValueOnce(
      new NotFoundError("Producto no encontrado")
    );

    const res = await request(app).delete("/api/products/999");

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Producto no encontrado");
  });

  it("Debe manejar errores de base de datos", async () => {
    productService.hardDelete.mockRejectedValueOnce(new Error("DB error"));

    const res = await request(app).delete("/api/products/1");

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Error al eliminar el producto");
  });
});

describe("PUT /api/products/:id", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Debe actualizar un producto completamente", async () => {
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

  it("Debe fallar si falta el nombre", async () => {
    const { ValidationError } = require("../errors/customErrors");

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

  it("Debe fallar si falta el precio", async () => {
    const { ValidationError } = require("../errors/customErrors");

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

  it("Debe fallar si el producto no existe", async () => {
    const { NotFoundError } = require("../errors/customErrors");

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

  it("Debe fallar si el nuevo nombre ya existe", async () => {
    const { DuplicateError } = require("../errors/customErrors");

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

  it("Debe manejar errores de base de datos", async () => {
    productService.updateProduct.mockRejectedValueOnce(new Error("DB error"));

    const res = await request(app).put("/api/products/1").send({
      name: "Producto Actualizado",
      description: "Descripción actualizada",
      price: 150.75,
    });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Error al actualizar el producto");
  });
});

describe("PATCH /api/products/:id", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Debe actualizar parcialmente solo el precio", async () => {
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

  it("Debe actualizar parcialmente solo el nombre", async () => {
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

  it("Debe fallar si no se proporciona ningún campo", async () => {
    const { ValidationError } = require("../errors/customErrors");

    productService.updateProductPartial.mockRejectedValueOnce(
      new ValidationError("Se requiere al menos un campo para actualizar")
    );

    const res = await request(app).patch("/api/products/1").send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("al menos un campo para actualizar");
  });

  it("Debe fallar si el producto no existe", async () => {
    const { NotFoundError } = require("../errors/customErrors");

    productService.updateProductPartial.mockRejectedValueOnce(
      new NotFoundError("Producto no encontrado")
    );

    const res = await request(app)
      .patch("/api/products/999")
      .send({ price: 120.0 });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Producto no encontrado");
  });

  it("Debe fallar si el nuevo nombre ya existe", async () => {
    const { DuplicateError } = require("../errors/customErrors");

    productService.updateProductPartial.mockRejectedValueOnce(
      new DuplicateError("Ya existe un producto con ese nombre")
    );

    const res = await request(app)
      .patch("/api/products/1")
      .send({ name: "Producto 2" });

    expect(res.status).toBe(409);
    expect(res.body.error).toContain("Ya existe un producto");
  });

  it("Debe manejar errores de base de datos", async () => {
    productService.updateProductPartial.mockRejectedValueOnce(
      new Error("DB error")
    );

    const res = await request(app)
      .patch("/api/products/1")
      .send({ price: 120.0 });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Error al actualizar el producto");
  });
});
