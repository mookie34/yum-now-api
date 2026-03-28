// Mock dependencies BEFORE importing them
jest.mock("../repositories/orders-repository");
jest.mock("../repositories/customer-repository");
jest.mock("../repositories/addresses-repository");

const request = require("supertest");
const app = require("../app");
const ordersRepository = require("../repositories/orders-repository");
const customerRepository = require("../repositories/customer-repository");
const addressRepository = require("../repositories/addresses-repository");

describe("Orders Controller Tests", () => {
  // Clear mocks after each test
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/orders", () => {
    it("should create a new order successfully", async () => {
      // Arrange: configure mocks
      customerRepository.getById.mockResolvedValue({
        id: 1,
        name: "John Doe",
      });
      addressRepository.getById.mockResolvedValue({
        id: 1,
        customer_id: 1,
        address_text: "123 Main St",
      });

      ordersRepository.paymentMethodExists.mockResolvedValue(true);
      ordersRepository.orderStatusExists.mockResolvedValue(true);

      ordersRepository.create.mockResolvedValue({
        id: 1,
        customer_id: 1,
        address_id: 1,
        total: 0, // always 0 on creation
        payment_method_id: 1,
        status_id: 1,
        created_at: new Date(),
      });

      // Act: make request
      const res = await request(app).post("/api/orders").send({
        customer_id: 1,
        address_id: 1,
        payment_method_id: 1,
        status_id: 1,
      });

      // Assert: verify response
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("message", "Orden creada exitosamente");
      expect(res.body.order).toHaveProperty("id", 1);
      expect(res.body.order).toHaveProperty("customer_id", 1);
      expect(res.body.order).toHaveProperty("total", 0); // always 0 on creation

      expect(customerRepository.getById).toHaveBeenCalledWith(1);
      expect(addressRepository.getById).toHaveBeenCalledWith(1);
      expect(ordersRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customer_id: 1,
          address_id: 1,
          payment_method_id: 1,
          total: 0,
        })
      );
    });

    it("should return error when customer does not exist", async () => {
      customerRepository.getById.mockResolvedValue(null);

      const res = await request(app).post("/api/orders").send({
        customer_id: 999,
        address_id: 1,
        payment_method_id: 1,
        status_id: 1,
      });

      expect(res.status).toBe(404);
      expect(res.body.error).toContain("Cliente no encontrado");
      expect(customerRepository.getById).toHaveBeenCalledWith(999);
      expect(addressRepository.getById).not.toHaveBeenCalled();
      expect(ordersRepository.create).not.toHaveBeenCalled();
    });

    it("should return error when address does not exist", async () => {
      customerRepository.getById.mockResolvedValue({ id: 1 });
      addressRepository.getById.mockResolvedValue(null);

      const res = await request(app).post("/api/orders").send({
        customer_id: 1,
        address_id: 999,
        payment_method_id: 1,
        status_id: 1,
      });

      expect(res.status).toBe(404);
      expect(res.body.error).toContain("Dirección no encontrada");
      expect(addressRepository.getById).toHaveBeenCalledWith(999);
      expect(ordersRepository.create).not.toHaveBeenCalled();
    });

    it("should return error when address does NOT belong to customer", async () => {
      customerRepository.getById.mockResolvedValue({
        id: 1,
        name: "John Doe",
      });
      addressRepository.getById.mockResolvedValue({
        id: 5,
        customer_id: 10, // address belongs to a different customer
        address_text: "456 Other St",
      });

      const res = await request(app).post("/api/orders").send({
        customer_id: 1,
        address_id: 5, // address belongs to customer 10
        payment_method_id: 1,
        status_id: 1,
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain(
        "La dirección no pertenece al cliente especificado"
      );
      expect(ordersRepository.create).not.toHaveBeenCalled();
    });

    it("should return error when required field is missing (customer_id)", async () => {
      const res = await request(app).post("/api/orders").send({
        address_id: 1,
        payment_method_id: 1,
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("customer_id inválido");
      expect(ordersRepository.create).not.toHaveBeenCalled();
    });

    it("should return error when required field is missing (address_id)", async () => {
      const res = await request(app).post("/api/orders").send({
        customer_id: 1,
        payment_method_id: 1,
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("address_id inválido");
    });

    it("should return error when payment_method_id is invalid", async () => {
      customerRepository.getById.mockResolvedValue({ id: 1 });
      addressRepository.getById.mockResolvedValue({
        id: 1,
        customer_id: 1,
      });

      // payment method does not exist or is inactive
      ordersRepository.paymentMethodExists.mockResolvedValue(false);

      const res = await request(app).post("/api/orders").send({
        customer_id: 1,
        address_id: 1,
        payment_method_id: 999, // invalid ID
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Método de pago no válido o inactivo");
    });

    it("should return error when status_id is invalid", async () => {
      customerRepository.getById.mockResolvedValue({ id: 1 });
      addressRepository.getById.mockResolvedValue({
        id: 1,
        customer_id: 1,
      });

      ordersRepository.paymentMethodExists.mockResolvedValue(true);
      ordersRepository.orderStatusExists.mockResolvedValue(false);

      const res = await request(app).post("/api/orders").send({
        customer_id: 1,
        address_id: 1,
        payment_method_id: 1,
        status_id: 999, // invalid ID
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Estado del pedido no válido");
    });

    it("should handle database errors", async () => {
      customerRepository.getById.mockResolvedValue({
        id: 1,
        name: "John Doe",
      });
      addressRepository.getById.mockResolvedValue({
        id: 1,
        customer_id: 1,
      });
      ordersRepository.paymentMethodExists.mockResolvedValue(true);
      ordersRepository.orderStatusExists.mockResolvedValue(true);

      ordersRepository.create.mockRejectedValue(new Error("DB error"));

      const res = await request(app).post("/api/orders").send({
        customer_id: 1,
        address_id: 1,
        payment_method_id: 1,
        status_id: 1,
      });

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty("error", "Error interno del servidor");
    });
  });

  describe("PUT /api/orders/:id/total", () => {
    it("should update order total successfully", async () => {
      ordersRepository.getById.mockResolvedValue({ id: 1, total: 0 });
      ordersRepository.calculateAndUpdateTotal.mockResolvedValue({
        id: 1,
        customer_id: 1,
        address_id: 1,
        total: 150.5,
        payment_method_id: 1,
        status_id: 1,
      });

      const res = await request(app).put("/api/orders/1/total");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty(
        "message",
        "Total de la orden actualizado exitosamente"
      );
      expect(res.body.order).toHaveProperty("id", 1);
      expect(res.body.order).toHaveProperty("total", 150.5);
      expect(ordersRepository.getById).toHaveBeenCalledWith("1");
      expect(ordersRepository.calculateAndUpdateTotal).toHaveBeenCalledWith("1");
    });

    it("should return error when order does not exist", async () => {
      ordersRepository.getById.mockResolvedValue(null);

      const res = await request(app).put("/api/orders/999/total");

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("error", "Orden no encontrada");
      expect(ordersRepository.calculateAndUpdateTotal).not.toHaveBeenCalled();
    });

    it("should return error with invalid ID", async () => {
      const res = await request(app).put("/api/orders/invalid/total");

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("ID inválido");
    });

    it("should handle database errors", async () => {
      ordersRepository.getById.mockResolvedValue({ id: 1 });
      ordersRepository.calculateAndUpdateTotal.mockRejectedValue(
        new Error("DB error")
      );

      const res = await request(app).put("/api/orders/1/total");

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty("error", "Error interno del servidor");
    });
  });

  describe("GET /api/orders", () => {
    it("should fetch all orders", async () => {
      const mockOrders = [
        { id: 1, customer_id: 1, total: 100, status: "pending" },
        { id: 2, customer_id: 2, total: 200, status: "shipped" },
      ];
      ordersRepository.getAll.mockResolvedValue(mockOrders);

      const res = await request(app).get("/api/orders");

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0]).toHaveProperty("id", 1);
      expect(ordersRepository.getAll).toHaveBeenCalledWith(100, 0);
    });

    it("should fetch orders with pagination", async () => {
      const mockOrders = [
        { id: 1, customer_id: 1, total: 100, status: "pending" },
      ];
      ordersRepository.getAll.mockResolvedValue(mockOrders);

      const res = await request(app).get("/api/orders?limit=10&offset=5");

      expect(res.status).toBe(200);
      expect(ordersRepository.getAll).toHaveBeenCalledWith(10, 5);
    });

    it("should return error with invalid limit", async () => {
      const res = await request(app).get("/api/orders?limit=-5");

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("límite");
    });

    it("should handle database errors", async () => {
      ordersRepository.getAll.mockRejectedValue(new Error("DB error"));

      const res = await request(app).get("/api/orders");

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty("error", "Error interno del servidor");
    });
  });

  describe("GET /api/orders/:id", () => {
    it("should fetch an order by ID", async () => {
      ordersRepository.getById.mockResolvedValue({
        id: 1,
        customer_id: 1,
        address_id: 1,
        total: 100,
        payment_method_id: 1,
        status_id: 1,
      });

      const res = await request(app).get("/api/orders/1");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("id", 1);
      expect(res.body).toHaveProperty("customer_id", 1);
      expect(ordersRepository.getById).toHaveBeenCalledWith("1");
    });

    it("should return error when order does not exist", async () => {
      ordersRepository.getById.mockResolvedValue(null);

      const res = await request(app).get("/api/orders/999");

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("error", "Orden no encontrada");
    });

    it("should return error with invalid ID", async () => {
      const res = await request(app).get("/api/orders/abc");

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("ID inválido");
    });

    it("should handle database errors", async () => {
      ordersRepository.getById.mockRejectedValue(new Error("DB error"));

      const res = await request(app).get("/api/orders/1");

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty("error", "Error interno del servidor");
    });
  });

  describe("GET /api/orders/customer/:customer_id", () => {
    it("should fetch orders by customer ID", async () => {
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

    it("should return empty array when customer has no orders", async () => {
      ordersRepository.getByCustomerId.mockResolvedValue([]);

      const res = await request(app).get("/api/orders/customer/999");

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it("should return error with invalid customer_id", async () => {
      const res = await request(app).get("/api/orders/customer/invalid");

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("ID inválido");
    });

    it("should handle database errors", async () => {
      ordersRepository.getByCustomerId.mockRejectedValue(new Error("DB error"));

      const res = await request(app).get("/api/orders/customer/1");

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty("error", "Error interno del servidor");
    });
  });

  describe("DELETE /api/orders/:id", () => {
    it("should delete an order by ID", async () => {
      const mockOrder = {
        id: 1,
        customer_id: 1,
        address_id: 1,
        total: 100,
        payment_method_id: 1,
        status_id: 1,
      };
      ordersRepository.getById.mockResolvedValue(mockOrder);
      ordersRepository.delete.mockResolvedValue(mockOrder);

      const res = await request(app).delete("/api/orders/1");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("message", "Orden eliminada exitosamente");
      expect(res.body.order).toHaveProperty("id", 1);
      expect(ordersRepository.getById).toHaveBeenCalledWith("1");
      expect(ordersRepository.delete).toHaveBeenCalledWith("1");
    });

    it("should return error when order does not exist", async () => {
      ordersRepository.getById.mockResolvedValue(null);

      const res = await request(app).delete("/api/orders/999");

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("error", "Orden no encontrada");
      expect(ordersRepository.delete).not.toHaveBeenCalled();
    });

    it("should return error with invalid ID", async () => {
      const res = await request(app).delete("/api/orders/invalid");

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("ID inválido");
    });

    it("should handle database errors", async () => {
      ordersRepository.getById.mockResolvedValue({ id: 1 });
      ordersRepository.delete.mockRejectedValue(new Error("DB error"));

      const res = await request(app).delete("/api/orders/1");

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty("error", "Error interno del servidor");
    });
  });

  describe("PATCH /api/orders/:id", () => {
    it("should update order status_id", async () => {
      ordersRepository.getById.mockResolvedValue({ id: 1, status_id: 1 });
      ordersRepository.orderStatusExists.mockResolvedValue(true);
      ordersRepository.updatePartial.mockResolvedValue({
        id: 1,
        customer_id: 1,
        address_id: 1,
        total: 100,
        payment_method_id: 1,
        status_id: 2,
      });

      const res = await request(app)
        .patch("/api/orders/1")
        .send({ status_id: 2 });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("message", "Orden actualizada exitosamente");
      expect(res.body.order).toHaveProperty("status_id", 2);
      expect(ordersRepository.updatePartial).toHaveBeenCalledWith("1", {
        status_id: 2,
      });
    });

    it("should return error when attempting to update customer_id (immutable field)", async () => {
      const res = await request(app)
        .patch("/api/orders/1")
        .send({ customer_id: 2 });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Solo se puede actualizar el estado");
      expect(res.body.error).toContain("customer_id");
      expect(ordersRepository.updatePartial).not.toHaveBeenCalled();
    });

    it("should return error when attempting to update payment_method_id (immutable field)", async () => {
      const res = await request(app)
        .patch("/api/orders/1")
        .send({ payment_method_id: 2 });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Solo se puede actualizar el estado");
      expect(res.body.error).toContain("payment_method_id");
    });

    it("should return error when attempting to update total (use PUT /total instead)", async () => {
      const res = await request(app)
        .patch("/api/orders/1")
        .send({ total: 500 });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Solo se puede actualizar el estado");
      expect(res.body.error).toContain("total");
    });

    it("should return error when order does not exist", async () => {
      ordersRepository.getById.mockResolvedValue(null);

      const res = await request(app)
        .patch("/api/orders/999")
        .send({ status_id: 2 });

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("error", "Orden no encontrada");
      expect(ordersRepository.updatePartial).not.toHaveBeenCalled();
    });

    it("should return error with invalid ID", async () => {
      const res = await request(app)
        .patch("/api/orders/invalid")
        .send({ status_id: 2 });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("ID inválido");
    });

    it("should handle database errors", async () => {
      ordersRepository.getById.mockResolvedValue({ id: 1 });
      ordersRepository.orderStatusExists.mockResolvedValue(true);
      ordersRepository.updatePartial.mockRejectedValue(new Error("DB error"));

      const res = await request(app)
        .patch("/api/orders/1")
        .send({ status_id: 2 });

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty("error", "Error interno del servidor");
    });
  });

  describe("PATCH /api/orders/:id/status", () => {
    it("should update order status", async () => {
      ordersRepository.getById.mockResolvedValue({ id: 1 });
      ordersRepository.orderStatusExists.mockResolvedValue(true);
      ordersRepository.updateStatus.mockResolvedValue({
        id: 1,
        customer_id: 1,
        address_id: 1,
        total: 100,
        payment_method_id: 1,
        status_id: 2,
      });

      const res = await request(app)
        .patch("/api/orders/1/status")
        .send({ status_id: 2 });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty(
        "message",
        "Estado de la orden actualizado exitosamente"
      );
      expect(res.body.order).toHaveProperty("status_id", 2);
      expect(ordersRepository.updateStatus).toHaveBeenCalledWith("1", 2);
    });

    it("should return error when status is missing", async () => {
      const res = await request(app).patch("/api/orders/1/status").send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("status_id inválido");
    });

    it("should return error with invalid status_id", async () => {
      ordersRepository.orderStatusExists.mockResolvedValue(false);

      const res = await request(app)
        .patch("/api/orders/1/status")
        .send({ status_id: 999 });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Estado del pedido no válido");
    });

    it("should return error when order does not exist", async () => {
      ordersRepository.getById.mockResolvedValue(null);
      ordersRepository.orderStatusExists.mockResolvedValue(true);

      const res = await request(app)
        .patch("/api/orders/999/status")
        .send({ status_id: 2 });

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("error", "Orden no encontrada");
      expect(ordersRepository.updateStatus).not.toHaveBeenCalled();
    });

    it("should return error with invalid ID", async () => {
      const res = await request(app)
        .patch("/api/orders/invalid/status")
        .send({ status_id: 2 });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("ID inválido");
    });

    it("should handle database errors", async () => {
      ordersRepository.getById.mockResolvedValue({ id: 1 });
      ordersRepository.orderStatusExists.mockResolvedValue(true);
      ordersRepository.updateStatus.mockRejectedValue(new Error("DB error"));

      const res = await request(app)
        .patch("/api/orders/1/status")
        .send({ status_id: 2 });

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty("error", "Error interno del servidor");
    });
  });

  describe("GET /api/orders/count", () => {
    it("should count today's orders", async () => {
      ordersRepository.countForDay.mockResolvedValue(15);

      const res = await request(app).get("/api/orders/count");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("count", 15);
      expect(res.body).toHaveProperty("message");
      expect(res.body).toHaveProperty("date");
      expect(ordersRepository.countForDay).toHaveBeenCalled();
    });

    it("should return 0 when no orders for the day", async () => {
      ordersRepository.countForDay.mockResolvedValue(0);

      const res = await request(app).get("/api/orders/count");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("count", 0);
    });

    it("should handle database errors", async () => {
      ordersRepository.countForDay.mockRejectedValue(new Error("DB error"));

      const res = await request(app).get("/api/orders/count");

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty("error", "Error interno del servidor");
    });
  });

  describe("GET /api/orders/status/:status_id", () => {
    it("should fetch orders by status", async () => {
      const mockOrders = [
        { id: 1, customer_id: 1, total: 100, status_id: 1 },
        { id: 2, customer_id: 2, total: 200, status_id: 1 },
      ];
      ordersRepository.orderStatusExists.mockResolvedValue(true);
      ordersRepository.getByStatus.mockResolvedValue(mockOrders);

      const res = await request(app).get("/api/orders/status/1");

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0]).toHaveProperty("status_id", 1);
      expect(ordersRepository.getByStatus).toHaveBeenCalledWith("1", 100, 0);
    });

    it("should handle error when status does not exist", async () => {
      ordersRepository.orderStatusExists.mockResolvedValue(false);

      const res = await request(app).get("/api/orders/status/999");

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Estado del pedido no válido");
      expect(ordersRepository.getByStatus).not.toHaveBeenCalled();
    });

    it("should fetch orders by status with pagination", async () => {
      const mockOrders = [{ id: 1, customer_id: 1, total: 100, status_id: 2 }];
      ordersRepository.orderStatusExists.mockResolvedValue(true);
      ordersRepository.getByStatus.mockResolvedValue(mockOrders);

      const res = await request(app).get("/api/orders/status/2?limit=50&offset=10");

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(ordersRepository.getByStatus).toHaveBeenCalledWith("2", 50, 10);
    });

    it("should return error with invalid status_id", async () => {
      const res = await request(app).get("/api/orders/status/invalid");

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("ID inválido");
    });

    it("should handle database errors", async () => {
      ordersRepository.orderStatusExists.mockResolvedValue(true);
      ordersRepository.getByStatus.mockRejectedValue(new Error("DB error"));

      const res = await request(app).get("/api/orders/status/1");

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty("error", "Error interno del servidor");
    });
  });
});
