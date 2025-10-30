// Mockear las dependencias ANTES de importarlas
jest.mock("../repositories/ordersRepository");
jest.mock("../repositories/customerRepository");
jest.mock("../repositories/addressesRepository");

const request = require("supertest");
const app = require("../app");
const ordersRepository = require("../repositories/ordersRepository");
const customerRepository = require("../repositories/customerRepository");
const addressRepository = require("../repositories/addressesRepository");

describe("Orders Controller Tests", () => {
  // Limpiar mocks después de cada test
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/orders", () => {
    it("Debería crear una nueva orden con éxito", async () => {
      // Arrange: Configurar mocks
      customerRepository.getById.mockResolvedValue({ id: 1, name: "John Doe" });
      addressRepository.getById.mockResolvedValue({ id: 1, street: "Main St" });
      ordersRepository.create.mockResolvedValue({
        id: 1,
        customer_id: 1,
        address_id: 1,
        total: 0,
        payment_method: "credit_card",
        status: "pending",
      });

      // Act: Hacer request
      const res = await request(app).post("/api/orders").send({
        customer_id: 1,
        address_id: 1,
        payment_method: "credit_card",
        status: "pending",
      });

      // Assert: Verificar respuesta
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("message", "Orden creada exitosamente");
      expect(res.body.order).toHaveProperty("id", 1);
      expect(res.body.order).toHaveProperty("customer_id", 1);
      expect(res.body.order).toHaveProperty("payment_method", "credit_card");

      // Verificar que los métodos fueron llamados correctamente
      expect(customerRepository.getById).toHaveBeenCalledWith(1);
      expect(addressRepository.getById).toHaveBeenCalledWith(1);
      expect(ordersRepository.create).toHaveBeenCalledWith({
        customer_id: 1,
        address_id: 1,
        payment_method: "credit_card",
        status: "pending",
      });
    });

    it("Debería devolver error cuando no existe el cliente", async () => {
      customerRepository.getById.mockResolvedValue(null);

      const res = await request(app).post("/api/orders").send({
        customer_id: 999,
        address_id: 1,
        payment_method: "credit_card",
        status: "pending",
      });

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("error", "Cliente no encontrado");
      expect(customerRepository.getById).toHaveBeenCalledWith(999);
      expect(addressRepository.getById).not.toHaveBeenCalled();
      expect(ordersRepository.create).not.toHaveBeenCalled();
    });

    it("Debería devolver error cuando no existe la dirección", async () => {
      customerRepository.getById.mockResolvedValue({ id: 1 });
      addressRepository.getById.mockResolvedValue(null);

      const res = await request(app).post("/api/orders").send({
        customer_id: 1,
        address_id: 999,
        payment_method: "credit_card",
        status: "pending",
      });

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("error", "Dirección no encontrada");
      expect(addressRepository.getById).toHaveBeenCalledWith(999);
      expect(ordersRepository.create).not.toHaveBeenCalled();
    });

    it("Debería devolver error cuando faltan datos obligatorios (customer_id)", async () => {
      const res = await request(app).post("/api/orders").send({
        address_id: 1,
        payment_method: "credit_card",
        status: "pending",
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("customer_id inválido");
      expect(ordersRepository.create).not.toHaveBeenCalled();
    });

    it("Debería devolver error cuando faltan datos obligatorios (address_id)", async () => {
      const res = await request(app).post("/api/orders").send({
        customer_id: 1,
        payment_method: "credit_card",
        status: "pending",
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("address_id inválido");
    });

    it("Debería devolver error cuando payment_method es inválido", async () => {
      const res = await request(app).post("/api/orders").send({
        customer_id: 1,
        address_id: 1,
        payment_method: "bitcoin", // No válido
        status: "pending",
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("payment_method inválido");
    });

    it("Debería devolver error cuando status es inválido", async () => {
      const res = await request(app).post("/api/orders").send({
        customer_id: 1,
        address_id: 1,
        payment_method: "credit_card",
        status: "invalid_status", // No válido
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("status inválido");
    });

    it("Debería manejar error de base de datos", async () => {
      customerRepository.getById.mockResolvedValue({ id: 1 });
      addressRepository.getById.mockResolvedValue({ id: 1 });
      ordersRepository.create.mockRejectedValue(new Error("DB error"));

      const res = await request(app).post("/api/orders").send({
        customer_id: 1,
        address_id: 1,
        payment_method: "credit_card",
        status: "pending",
      });

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty("error", "Error al crear la orden");
    });
  });

  describe("PATCH /api/orders/:id/total", () => {
    it("Debería actualizar el total de la orden con éxito", async () => {
      ordersRepository.getById.mockResolvedValue({ id: 1, total: 0 });
      ordersRepository.calculateAndUpdateTotal.mockResolvedValue({
        id: 1,
        customer_id: 1,
        address_id: 1,
        total: 150.5,
        payment_method: "credit_card",
        status: "pending",
      });

      const res = await request(app).patch("/api/orders/1/total");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty(
        "message",
        "Total de la orden actualizado exitosamente"
      );
      expect(res.body.order).toHaveProperty("id", 1);
      expect(res.body.order).toHaveProperty("total", 150.5);
      expect(ordersRepository.getById).toHaveBeenCalledWith("1");
      expect(ordersRepository.calculateAndUpdateTotal).toHaveBeenCalledWith(
        "1"
      );
    });

    it("Debería devolver error cuando no existe la orden", async () => {
      ordersRepository.getById.mockResolvedValue(null);

      const res = await request(app).patch("/api/orders/999/total");

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("error", "Orden no encontrada");
      expect(ordersRepository.calculateAndUpdateTotal).not.toHaveBeenCalled();
    });

    it("Debería devolver error con ID inválido", async () => {
      const res = await request(app).patch("/api/orders/invalid/total");

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("ID inválido");
    });

    it("Debería manejar error de base de datos", async () => {
      ordersRepository.getById.mockResolvedValue({ id: 1 });
      ordersRepository.calculateAndUpdateTotal.mockRejectedValue(
        new Error("DB error")
      );

      const res = await request(app).patch("/api/orders/1/total");

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty(
        "error",
        "Error al actualizar el total de la orden"
      );
    });
  });

  describe("GET /api/orders", () => {
    it("Debería traer todas las órdenes", async () => {
      const mockOrders = [
        { id: 1, customer_id: 1, total: 100, status: "pending" },
        { id: 2, customer_id: 2, total: 200, status: "shipped" },
      ];
      ordersRepository.getAll.mockResolvedValue(mockOrders);

      const res = await request(app).get("/api/orders");

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0]).toHaveProperty("id", 1);
      // ✅ CORREGIDO: Valores por defecto (100, 0)
      expect(ordersRepository.getAll).toHaveBeenCalledWith(100, 0);
    });

    it("Debería traer órdenes con paginación", async () => {
      const mockOrders = [
        { id: 1, customer_id: 1, total: 100, status: "pending" },
      ];
      ordersRepository.getAll.mockResolvedValue(mockOrders);

      const res = await request(app).get("/api/orders?limit=10&offset=5");

      expect(res.status).toBe(200);
      // ✅ CORREGIDO: Números, no strings
      expect(ordersRepository.getAll).toHaveBeenCalledWith(10, 5);
    });

    it("Debería devolver error con límite inválido", async () => {
      const res = await request(app).get("/api/orders?limit=-5");

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("límite");
    });

    it("Debería manejar error de base de datos", async () => {
      ordersRepository.getAll.mockRejectedValue(new Error("DB error"));

      const res = await request(app).get("/api/orders");

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty("error", "Error al obtener las órdenes");
    });
  });

  describe("GET /api/orders/:id", () => {
    it("Debería traer una orden por ID", async () => {
      ordersRepository.getById.mockResolvedValue({
        id: 1,
        customer_id: 1,
        address_id: 1,
        total: 100,
        payment_method: "credit_card",
        status: "pending",
      });

      const res = await request(app).get("/api/orders/1");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("id", 1);
      expect(res.body).toHaveProperty("customer_id", 1);
      expect(ordersRepository.getById).toHaveBeenCalledWith("1");
    });

    it("Debería devolver error cuando no existe la orden", async () => {
      ordersRepository.getById.mockResolvedValue(null);

      const res = await request(app).get("/api/orders/999");

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("error", "Orden no encontrada");
    });

    it("Debería devolver error con ID inválido", async () => {
      const res = await request(app).get("/api/orders/abc");

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("ID inválido");
    });

    it("Debería manejar error de base de datos", async () => {
      ordersRepository.getById.mockRejectedValue(new Error("DB error"));

      const res = await request(app).get("/api/orders/1");

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty("error", "Error al obtener la orden");
    });
  });

  describe("GET /api/orders/customer/:customer_id", () => {
    it("Debería traer órdenes por ID de cliente", async () => {
      const mockOrders = [
        { id: 1, customer_id: 1, total: 100 },
        { id: 2, customer_id: 1, total: 200 },
      ];
      ordersRepository.getByCustomerId.mockResolvedValue(mockOrders);

      const res = await request(app).get("/api/orders/customer/1");

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0]).toHaveProperty("customer_id", 1);
      expect(ordersRepository.getByCustomerId).toHaveBeenCalledWith("1");
    });

    it("Debería devolver array vacío cuando no hay órdenes para el cliente", async () => {
      ordersRepository.getByCustomerId.mockResolvedValue([]);

      const res = await request(app).get("/api/orders/customer/999");

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it("Debería devolver error con customer_id inválido", async () => {
      const res = await request(app).get("/api/orders/customer/invalid");

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("ID inválido");
    });

    it("Debería manejar error de base de datos", async () => {
      ordersRepository.getByCustomerId.mockRejectedValue(new Error("DB error"));

      const res = await request(app).get("/api/orders/customer/1");

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty(
        "error",
        "Error al obtener las órdenes del cliente"
      );
    });
  });

  describe("DELETE /api/orders/:id", () => {
    it("Debería eliminar una orden por ID", async () => {
      const mockOrder = {
        id: 1,
        customer_id: 1,
        address_id: 1,
        total: 100,
        payment_method: "credit_card",
        status: "pending",
      };
      ordersRepository.getById.mockResolvedValue(mockOrder);
      ordersRepository.delete.mockResolvedValue(mockOrder);

      const res = await request(app).delete("/api/orders/1");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty(
        "message",
        "Orden eliminada exitosamente"
      );
      expect(res.body.order).toHaveProperty("id", 1);
      expect(ordersRepository.getById).toHaveBeenCalledWith("1");
      expect(ordersRepository.delete).toHaveBeenCalledWith("1");
    });

    it("Debería devolver error cuando no existe la orden", async () => {
      ordersRepository.getById.mockResolvedValue(null);

      const res = await request(app).delete("/api/orders/999");

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("error", "Orden no encontrada");
      expect(ordersRepository.delete).not.toHaveBeenCalled();
    });

    it("Debería devolver error con ID inválido", async () => {
      const res = await request(app).delete("/api/orders/invalid");

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("ID inválido");
    });

    it("Debería manejar error de base de datos", async () => {
      ordersRepository.getById.mockResolvedValue({ id: 1 });
      ordersRepository.delete.mockRejectedValue(new Error("DB error"));

      const res = await request(app).delete("/api/orders/1");

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty("error", "Error al eliminar la orden");
    });
  });

  describe("PATCH /api/orders/:id", () => {
    it("Debería actualizar parcialmente una orden (múltiples campos)", async () => {
      ordersRepository.getById.mockResolvedValue({ id: 1 });
      ordersRepository.updatePartial.mockResolvedValue({
        id: 1,
        customer_id: 2,
        address_id: 1,
        total: 100,
        payment_method: "debit_card",
        status: "shipped",
      });

      const res = await request(app).patch("/api/orders/1").send({
        customer_id: 2,
        payment_method: "debit_card",
        status: "shipped",
      });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty(
        "message",
        "Orden actualizada exitosamente"
      );
      expect(res.body.order).toHaveProperty("customer_id", 2);
      expect(res.body.order).toHaveProperty("payment_method", "debit_card");
      expect(res.body.order).toHaveProperty("status", "shipped");
      expect(ordersRepository.updatePartial).toHaveBeenCalledWith("1", {
        customer_id: 2,
        payment_method: "debit_card",
        status: "shipped",
      });
    });

    it("Debería actualizar parcialmente solo customer_id", async () => {
      ordersRepository.getById.mockResolvedValue({ id: 1 });
      ordersRepository.updatePartial.mockResolvedValue({
        id: 1,
        customer_id: 3,
        address_id: 1,
        total: 100,
        payment_method: "credit_card",
        status: "pending",
      });

      const res = await request(app)
        .patch("/api/orders/1")
        .send({ customer_id: 3 });

      expect(res.status).toBe(200);
      expect(res.body.order).toHaveProperty("customer_id", 3);
      expect(ordersRepository.updatePartial).toHaveBeenCalledWith("1", {
        customer_id: 3,
      });
    });

    it("Debería devolver error cuando no existe la orden", async () => {
      ordersRepository.getById.mockResolvedValue(null);

      const res = await request(app)
        .patch("/api/orders/999")
        .send({ customer_id: 2 });

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("error", "Orden no encontrada");
      expect(ordersRepository.updatePartial).not.toHaveBeenCalled();
    });

    it("Debería devolver error con datos inválidos (payment_method)", async () => {
      const res = await request(app)
        .patch("/api/orders/1")
        .send({ payment_method: "invalid_method" });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("payment_method inválido");
    });

    it("Debería devolver error con ID inválido", async () => {
      const res = await request(app)
        .patch("/api/orders/invalid")
        .send({ customer_id: 2 });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("ID inválido");
    });

    it("Debería manejar error de base de datos", async () => {
      ordersRepository.getById.mockResolvedValue({ id: 1 });
      ordersRepository.updatePartial.mockRejectedValue(new Error("DB error"));

      const res = await request(app)
        .patch("/api/orders/1")
        .send({ customer_id: 2 });

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty("error", "Error al actualizar la orden");
    });
  });

  describe("PATCH /api/orders/:id/status", () => {
    it("Debería actualizar el estado de la orden", async () => {
      ordersRepository.getById.mockResolvedValue({ id: 1 });
      ordersRepository.updateStatus.mockResolvedValue({
        id: 1,
        customer_id: 1,
        address_id: 1,
        total: 100,
        payment_method: "credit_card",
        status: "delivered",
      });

      const res = await request(app)
        .patch("/api/orders/1/status")
        .send({ status: "delivered" });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty(
        "message",
        "Estado de la orden actualizado exitosamente"
      );
      expect(res.body.order).toHaveProperty("status", "delivered");
      expect(ordersRepository.updateStatus).toHaveBeenCalledWith(
        "1",
        "delivered"
      );
    });

    it("Debería devolver error cuando falta el estado", async () => {
      const res = await request(app).patch("/api/orders/1/status").send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Status inválido");
    });

    it("Debería devolver error con status inválido", async () => {
      const res = await request(app)
        .patch("/api/orders/1/status")
        .send({ status: "invalid_status" });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Status inválido");
    });

    it("Debería devolver error cuando no existe la orden", async () => {
      ordersRepository.getById.mockResolvedValue(null);

      const res = await request(app)
        .patch("/api/orders/999/status")
        .send({ status: "delivered" });

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("error", "Orden no encontrada");
      expect(ordersRepository.updateStatus).not.toHaveBeenCalled();
    });

    it("Debería devolver error con ID inválido", async () => {
      const res = await request(app)
        .patch("/api/orders/invalid/status")
        .send({ status: "delivered" });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("ID inválido");
    });

    it("Debería manejar error de base de datos", async () => {
      ordersRepository.getById.mockResolvedValue({ id: 1 });
      ordersRepository.updateStatus.mockRejectedValue(new Error("DB error"));

      const res = await request(app)
        .patch("/api/orders/1/status")
        .send({ status: "delivered" });

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty(
        "error",
        "Error al actualizar el estado de la orden"
      );
    });
  });

  describe("GET /api/orders/count", () => {
    it("Debería contar las órdenes del día", async () => {
      ordersRepository.countForDay.mockResolvedValue(15);

      const res = await request(app).get("/api/orders/count");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("count", 15);
      expect(res.body).toHaveProperty("message");
      expect(res.body).toHaveProperty("date");
      expect(ordersRepository.countForDay).toHaveBeenCalled();
    });

    it("Debería retornar 0 cuando no hay órdenes del día", async () => {
      ordersRepository.countForDay.mockResolvedValue(0);

      const res = await request(app).get("/api/orders/count");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("count", 0);
    });

    it("Debería manejar error de base de datos", async () => {
      ordersRepository.countForDay.mockRejectedValue(new Error("DB error"));

      const res = await request(app).get("/api/orders/count");

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty(
        "error",
        "Error al contar las órdenes del día"
      );
    });
  });
});
