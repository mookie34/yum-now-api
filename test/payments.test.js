jest.mock("../repositories/payments-repository");

const request = require("supertest");
const app = require("../app");
const paymentsRepository = require("../repositories/payments-repository");

describe("Payments Controller Tests", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // POST /api/payments
  // ============================================
  describe("POST /api/payments", () => {
    it("should create a digital payment successfully", async () => {
      paymentsRepository.getOrderWithPaymentMethod.mockResolvedValue({
        id: 1,
        total: 25000,
        payment_method_id: 1,
        payment_method_code: "nequi",
      });
      paymentsRepository.getByOrderId.mockResolvedValue(null);
      paymentsRepository.create.mockResolvedValue({
        id: 1,
        order_id: 1,
        receipt_image_url: "https://example.com/receipt.jpg",
        status: "pending",
        created_at: new Date(),
      });

      const res = await request(app).post("/api/payments").send({
        order_id: 1,
        receipt_image_url: "https://example.com/receipt.jpg",
      });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("message", "Pago registrado exitosamente");
      expect(res.body.payment).toHaveProperty("id", 1);
      expect(res.body.payment).toHaveProperty("status", "pending");
      expect(paymentsRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          order_id: 1,
          receipt_image_url: "https://example.com/receipt.jpg",
        })
      );
    });

    it("should create a digital payment without receipt URL", async () => {
      paymentsRepository.getOrderWithPaymentMethod.mockResolvedValue({
        id: 1,
        total: 25000,
        payment_method_id: 1,
        payment_method_code: "nequi",
      });
      paymentsRepository.getByOrderId.mockResolvedValue(null);
      paymentsRepository.create.mockResolvedValue({
        id: 1,
        order_id: 1,
        receipt_image_url: null,
        status: "pending",
      });

      const res = await request(app).post("/api/payments").send({
        order_id: 1,
      });

      expect(res.status).toBe(201);
      expect(paymentsRepository.create).toHaveBeenCalledWith({ order_id: 1 });
    });

    it("should create a cash payment and calculate change", async () => {
      paymentsRepository.getOrderWithPaymentMethod.mockResolvedValue({
        id: 2,
        total: 18000,
        payment_method_id: 4,
        payment_method_code: "cash",
      });
      paymentsRepository.getByOrderId.mockResolvedValue(null);
      paymentsRepository.create.mockResolvedValue({
        id: 2,
        order_id: 2,
        cash_given: 20000,
        change_due: 2000,
        status: "pending",
      });

      const res = await request(app).post("/api/payments").send({
        order_id: 2,
        cash_given: 20000,
      });

      expect(res.status).toBe(201);
      expect(paymentsRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          order_id: 2,
          cash_given: 20000,
          change_due: 2000,
        })
      );
    });

    it("should create a cash payment without cash_given", async () => {
      paymentsRepository.getOrderWithPaymentMethod.mockResolvedValue({
        id: 2,
        total: 18000,
        payment_method_id: 4,
        payment_method_code: "cash",
      });
      paymentsRepository.getByOrderId.mockResolvedValue(null);
      paymentsRepository.create.mockResolvedValue({
        id: 2,
        order_id: 2,
        status: "pending",
      });

      const res = await request(app).post("/api/payments").send({
        order_id: 2,
      });

      expect(res.status).toBe(201);
      expect(paymentsRepository.create).toHaveBeenCalledWith({ order_id: 2 });
    });

    it("should return error when order_id is invalid", async () => {
      const res = await request(app).post("/api/payments").send({
        order_id: "abc",
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("order_id invalido");
      expect(paymentsRepository.create).not.toHaveBeenCalled();
    });

    it("should return error when order_id is missing", async () => {
      const res = await request(app).post("/api/payments").send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("order_id invalido");
    });

    it("should return 404 when order does not exist", async () => {
      paymentsRepository.getOrderWithPaymentMethod.mockResolvedValue(null);

      const res = await request(app).post("/api/payments").send({
        order_id: 999,
      });

      expect(res.status).toBe(404);
      expect(res.body.error).toContain("Orden no encontrada");
    });

    it("should return 409 when payment already exists for order", async () => {
      paymentsRepository.getOrderWithPaymentMethod.mockResolvedValue({
        id: 1,
        total: 25000,
        payment_method_id: 1,
        payment_method_code: "nequi",
      });
      paymentsRepository.getByOrderId.mockResolvedValue({
        id: 1,
        order_id: 1,
        status: "pending",
      });

      const res = await request(app).post("/api/payments").send({
        order_id: 1,
      });

      expect(res.status).toBe(409);
      expect(res.body.error).toContain("Ya existe un pago registrado para esta orden");
      expect(paymentsRepository.create).not.toHaveBeenCalled();
    });

    it("should return error when cash_given is negative for cash payment", async () => {
      paymentsRepository.getOrderWithPaymentMethod.mockResolvedValue({
        id: 1,
        total: 18000,
        payment_method_id: 4,
        payment_method_code: "cash",
      });
      paymentsRepository.getByOrderId.mockResolvedValue(null);

      const res = await request(app).post("/api/payments").send({
        order_id: 1,
        cash_given: -5000,
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("cash_given debe ser un numero valido");
    });

    it("should handle database errors on create", async () => {
      paymentsRepository.getOrderWithPaymentMethod.mockResolvedValue({
        id: 1,
        total: 25000,
        payment_method_id: 1,
        payment_method_code: "nequi",
      });
      paymentsRepository.getByOrderId.mockResolvedValue(null);
      paymentsRepository.create.mockRejectedValue(new Error("DB error"));

      const res = await request(app).post("/api/payments").send({
        order_id: 1,
      });

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty("error", "Error interno del servidor");
    });
  });

  // ============================================
  // GET /api/payments
  // ============================================
  describe("GET /api/payments", () => {
    it("should fetch all payments", async () => {
      const mockPayments = [
        { id: 1, order_id: 1, status: "pending" },
        { id: 2, order_id: 2, status: "verified" },
      ];
      paymentsRepository.getAll.mockResolvedValue(mockPayments);

      const res = await request(app).get("/api/payments");

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(paymentsRepository.getAll).toHaveBeenCalledWith(100, 0);
    });

    it("should fetch payments with pagination", async () => {
      paymentsRepository.getAll.mockResolvedValue([]);

      const res = await request(app).get("/api/payments?limit=10&offset=5");

      expect(res.status).toBe(200);
      expect(paymentsRepository.getAll).toHaveBeenCalledWith(10, 5);
    });

    it("should return error with invalid limit", async () => {
      const res = await request(app).get("/api/payments?limit=-5");

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("límite");
    });

    it("should handle database errors", async () => {
      paymentsRepository.getAll.mockRejectedValue(new Error("DB error"));

      const res = await request(app).get("/api/payments");

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty("error", "Error interno del servidor");
    });
  });

  // ============================================
  // GET /api/payments/status/:status
  // ============================================
  describe("GET /api/payments/status/:status", () => {
    it("should fetch payments by pending status", async () => {
      const mockPayments = [
        { id: 1, order_id: 1, status: "pending" },
        { id: 3, order_id: 3, status: "pending" },
      ];
      paymentsRepository.getByStatus.mockResolvedValue(mockPayments);

      const res = await request(app).get("/api/payments/status/pending");

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(paymentsRepository.getByStatus).toHaveBeenCalledWith("pending", 100, 0);
    });

    it("should fetch payments by verified status", async () => {
      paymentsRepository.getByStatus.mockResolvedValue([]);

      const res = await request(app).get("/api/payments/status/verified");

      expect(res.status).toBe(200);
      expect(paymentsRepository.getByStatus).toHaveBeenCalledWith("verified", 100, 0);
    });

    it("should fetch payments by status with pagination", async () => {
      paymentsRepository.getByStatus.mockResolvedValue([]);

      const res = await request(app).get(
        "/api/payments/status/pending?limit=20&offset=10"
      );

      expect(res.status).toBe(200);
      expect(paymentsRepository.getByStatus).toHaveBeenCalledWith("pending", 20, 10);
    });

    it("should return error with invalid status", async () => {
      const res = await request(app).get("/api/payments/status/invalid_status");

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Estado invalido");
    });

    it("should handle database errors", async () => {
      paymentsRepository.getByStatus.mockRejectedValue(new Error("DB error"));

      const res = await request(app).get("/api/payments/status/pending");

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty("error", "Error interno del servidor");
    });
  });

  // ============================================
  // GET /api/payments/order/:order_id
  // ============================================
  describe("GET /api/payments/order/:order_id", () => {
    it("should fetch payment for an order", async () => {
      paymentsRepository.getByOrderId.mockResolvedValue({
        id: 1,
        order_id: 1,
        status: "pending",
        order_total: 25000,
        payment_method: "Nequi",
      });

      const res = await request(app).get("/api/payments/order/1");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("order_id", 1);
      expect(res.body).toHaveProperty("payment_method", "Nequi");
      expect(paymentsRepository.getByOrderId).toHaveBeenCalledWith("1");
    });

    it("should return 404 when no payment exists for order", async () => {
      paymentsRepository.getByOrderId.mockResolvedValue(null);

      const res = await request(app).get("/api/payments/order/999");

      expect(res.status).toBe(404);
      expect(res.body.error).toContain("Pago no encontrado para esta orden");
    });

    it("should return error with invalid order_id", async () => {
      const res = await request(app).get("/api/payments/order/abc");

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("order_id invalido");
    });

    it("should handle database errors", async () => {
      paymentsRepository.getByOrderId.mockRejectedValue(new Error("DB error"));

      const res = await request(app).get("/api/payments/order/1");

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty("error", "Error interno del servidor");
    });
  });

  // ============================================
  // PATCH /api/payments/order/:order_id/verify
  // ============================================
  describe("PATCH /api/payments/order/:order_id/verify", () => {
    it("should verify a payment successfully", async () => {
      paymentsRepository.getByOrderId.mockResolvedValue({
        id: 1,
        order_id: 1,
        status: "pending",
      });
      paymentsRepository.verify.mockResolvedValue({
        id: 1,
        order_id: 1,
        status: "verified",
        verified_by: "admin",
        verified_at: new Date(),
      });

      const res = await request(app)
        .patch("/api/payments/order/1/verify")
        .send({ verified_by: "admin", status: "verified" });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("message", "Pago verificado exitosamente");
      expect(res.body.payment).toHaveProperty("status", "verified");
      expect(paymentsRepository.verify).toHaveBeenCalledWith("1", {
        verified_by: "admin",
        status: "verified",
        admin_notes: null,
      });
    });

    it("should reject a payment successfully", async () => {
      paymentsRepository.getByOrderId.mockResolvedValue({
        id: 1,
        order_id: 1,
        status: "pending",
      });
      paymentsRepository.verify.mockResolvedValue({
        id: 1,
        order_id: 1,
        status: "rejected",
        verified_by: "admin",
        admin_notes: "Comprobante ilegible",
        verified_at: new Date(),
      });

      const res = await request(app)
        .patch("/api/payments/order/1/verify")
        .send({
          verified_by: "admin",
          status: "rejected",
          admin_notes: "Comprobante ilegible",
        });

      expect(res.status).toBe(200);
      expect(res.body.payment).toHaveProperty("status", "rejected");
      expect(res.body.payment).toHaveProperty("admin_notes", "Comprobante ilegible");
    });

    it("should return error when payment is not pending", async () => {
      paymentsRepository.getByOrderId.mockResolvedValue({
        id: 1,
        order_id: 1,
        status: "verified",
      });

      const res = await request(app)
        .patch("/api/payments/order/1/verify")
        .send({ verified_by: "admin", status: "verified" });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Solo se pueden verificar pagos en estado pendiente");
      expect(paymentsRepository.verify).not.toHaveBeenCalled();
    });

    it("should return 404 when payment does not exist", async () => {
      paymentsRepository.getByOrderId.mockResolvedValue(null);

      const res = await request(app)
        .patch("/api/payments/order/999/verify")
        .send({ verified_by: "admin", status: "verified" });

      expect(res.status).toBe(404);
      expect(res.body.error).toContain("Pago no encontrado para esta orden");
    });

    it("should return error when verified_by is missing", async () => {
      const res = await request(app)
        .patch("/api/payments/order/1/verify")
        .send({ status: "verified" });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("verified_by es obligatorio");
    });

    it("should return error when verification status is invalid", async () => {
      const res = await request(app)
        .patch("/api/payments/order/1/verify")
        .send({ verified_by: "admin", status: "pending" });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("El estado de verificacion debe ser");
    });

    it("should return error with invalid order_id", async () => {
      const res = await request(app)
        .patch("/api/payments/order/abc/verify")
        .send({ verified_by: "admin", status: "verified" });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("order_id invalido");
    });

    it("should handle database errors", async () => {
      paymentsRepository.getByOrderId.mockResolvedValue({
        id: 1,
        order_id: 1,
        status: "pending",
      });
      paymentsRepository.verify.mockRejectedValue(new Error("DB error"));

      const res = await request(app)
        .patch("/api/payments/order/1/verify")
        .send({ verified_by: "admin", status: "verified" });

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty("error", "Error interno del servidor");
    });
  });

  // ============================================
  // PATCH /api/payments/order/:order_id/receipt
  // ============================================
  describe("PATCH /api/payments/order/:order_id/receipt", () => {
    it("should update receipt image successfully", async () => {
      paymentsRepository.getByOrderId.mockResolvedValue({
        id: 1,
        order_id: 1,
        status: "pending",
      });
      paymentsRepository.updateReceiptImage.mockResolvedValue({
        id: 1,
        order_id: 1,
        receipt_image_url: "https://example.com/new-receipt.jpg",
        status: "pending",
      });

      const res = await request(app)
        .patch("/api/payments/order/1/receipt")
        .send({ receipt_image_url: "https://example.com/new-receipt.jpg" });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("message", "Comprobante actualizado exitosamente");
      expect(res.body.payment).toHaveProperty(
        "receipt_image_url",
        "https://example.com/new-receipt.jpg"
      );
    });

    it("should return error when payment is not pending", async () => {
      paymentsRepository.getByOrderId.mockResolvedValue({
        id: 1,
        order_id: 1,
        status: "verified",
      });

      const res = await request(app)
        .patch("/api/payments/order/1/receipt")
        .send({ receipt_image_url: "https://example.com/receipt.jpg" });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain(
        "Solo se puede actualizar el comprobante de un pago pendiente"
      );
      expect(paymentsRepository.updateReceiptImage).not.toHaveBeenCalled();
    });

    it("should return 404 when payment does not exist", async () => {
      paymentsRepository.getByOrderId.mockResolvedValue(null);

      const res = await request(app)
        .patch("/api/payments/order/999/receipt")
        .send({ receipt_image_url: "https://example.com/receipt.jpg" });

      expect(res.status).toBe(404);
      expect(res.body.error).toContain("Pago no encontrado para esta orden");
    });

    it("should return error when receipt_image_url is missing", async () => {
      const res = await request(app)
        .patch("/api/payments/order/1/receipt")
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("La URL del comprobante es obligatoria");
    });

    it("should return error when receipt_image_url exceeds 500 characters", async () => {
      const longUrl = "https://example.com/" + "a".repeat(500);

      const res = await request(app)
        .patch("/api/payments/order/1/receipt")
        .send({ receipt_image_url: longUrl });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("no puede exceder 500 caracteres");
    });

    it("should return error with invalid order_id", async () => {
      const res = await request(app)
        .patch("/api/payments/order/abc/receipt")
        .send({ receipt_image_url: "https://example.com/receipt.jpg" });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("order_id invalido");
    });

    it("should handle database errors", async () => {
      paymentsRepository.getByOrderId.mockResolvedValue({
        id: 1,
        order_id: 1,
        status: "pending",
      });
      paymentsRepository.updateReceiptImage.mockRejectedValue(
        new Error("DB error")
      );

      const res = await request(app)
        .patch("/api/payments/order/1/receipt")
        .send({ receipt_image_url: "https://example.com/receipt.jpg" });

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty("error", "Error interno del servidor");
    });
  });

  // ============================================
  // PATCH /api/payments/order/:order_id/amount
  // ============================================
  describe("PATCH /api/payments/order/:order_id/amount", () => {
    it("should update reported amount successfully", async () => {
      paymentsRepository.getByOrderId.mockResolvedValue({
        id: 1,
        order_id: 1,
        status: "pending",
      });
      paymentsRepository.updateAmountReported.mockResolvedValue({
        id: 1,
        order_id: 1,
        amount_reported: 25000,
        status: "pending",
      });

      const res = await request(app)
        .patch("/api/payments/order/1/amount")
        .send({ amount_reported: 25000 });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty(
        "message",
        "Monto reportado actualizado exitosamente"
      );
      expect(res.body.payment).toHaveProperty("amount_reported", 25000);
    });

    it("should return error when payment is not pending", async () => {
      paymentsRepository.getByOrderId.mockResolvedValue({
        id: 1,
        order_id: 1,
        status: "rejected",
      });

      const res = await request(app)
        .patch("/api/payments/order/1/amount")
        .send({ amount_reported: 25000 });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain(
        "Solo se puede actualizar el monto de un pago pendiente"
      );
      expect(paymentsRepository.updateAmountReported).not.toHaveBeenCalled();
    });

    it("should return 404 when payment does not exist", async () => {
      paymentsRepository.getByOrderId.mockResolvedValue(null);

      const res = await request(app)
        .patch("/api/payments/order/999/amount")
        .send({ amount_reported: 25000 });

      expect(res.status).toBe(404);
      expect(res.body.error).toContain("Pago no encontrado para esta orden");
    });

    it("should return error when amount_reported is missing", async () => {
      const res = await request(app)
        .patch("/api/payments/order/1/amount")
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("El monto reportado es obligatorio");
    });

    it("should return error when amount_reported is negative", async () => {
      const res = await request(app)
        .patch("/api/payments/order/1/amount")
        .send({ amount_reported: -100 });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("numero valido no negativo");
    });

    it("should return error with invalid order_id", async () => {
      const res = await request(app)
        .patch("/api/payments/order/abc/amount")
        .send({ amount_reported: 25000 });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("order_id invalido");
    });

    it("should handle database errors", async () => {
      paymentsRepository.getByOrderId.mockResolvedValue({
        id: 1,
        order_id: 1,
        status: "pending",
      });
      paymentsRepository.updateAmountReported.mockRejectedValue(
        new Error("DB error")
      );

      const res = await request(app)
        .patch("/api/payments/order/1/amount")
        .send({ amount_reported: 25000 });

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty("error", "Error interno del servidor");
    });
  });
});
