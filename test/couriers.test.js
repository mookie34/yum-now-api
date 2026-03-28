// Mock repository BEFORE requires
jest.mock("../repositories/couriers-repository");

const request = require("supertest");
const app = require("../app");
const couriersRepository = require("../repositories/couriers-repository");

describe("POST /api/couriers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create a valid courier", async () => {
    const mockCourier = {
      id: 1,
      name: "Juan Pérez",
      phone: "1234567890",
      vehicle: "Bicicleta",
      license_plate: "ABC123",
      available: true,
    };

    couriersRepository.create.mockResolvedValue(mockCourier);

    const res = await request(app).post("/api/couriers").send({
      name: "Juan Pérez",
      phone: "1234567890",
      vehicle: "Bicicleta",
      license_plate: "ABC123",
      available: true,
    });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe("Domiciliario creado exitosamente");
    expect(res.body.courier.name).toBe("Juan Pérez");
    expect(couriersRepository.create).toHaveBeenCalledWith({
      name: "Juan Pérez",
      phone: "1234567890",
      vehicle: "Bicicleta",
      license_plate: "ABC123",
      available: true,
    });
  });

  it("should default available=true when not sent", async () => {
    const mockCourier = {
      id: 1,
      name: "Juan Pérez",
      phone: "1234567890",
      vehicle: "Bicicleta",
      license_plate: "ABC123",
      available: true,
    };

    couriersRepository.create.mockResolvedValue(mockCourier);

    const res = await request(app).post("/api/couriers").send({
      name: "Juan Pérez",
      phone: "1234567890",
      vehicle: "Bicicleta",
      license_plate: "ABC123",
      // available not sent
    });

    expect(res.status).toBe(201);
    expect(couriersRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ available: true })
    );
  });

  it("should reject if name is missing", async () => {
    const res = await request(app).post("/api/couriers").send({
      phone: "1234567890",
      vehicle: "Bicicleta",
      license_plate: "ABC123",
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("nombre");
  });

  it("should reject if phone is missing", async () => {
    const res = await request(app).post("/api/couriers").send({
      name: "Juan Pérez",
      vehicle: "Bicicleta",
      license_plate: "ABC123",
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("teléfono");
  });

  it("should reject if vehicle is missing", async () => {
    const res = await request(app).post("/api/couriers").send({
      name: "Juan Pérez",
      phone: "1234567890",
      license_plate: "ABC123",
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("vehículo");
  });

  it("should reject if license_plate is missing", async () => {
    const res = await request(app).post("/api/couriers").send({
      name: "Juan Pérez",
      phone: "1234567890",
      vehicle: "Bicicleta",
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("placa");
  });

  it("should reject if name exceeds 100 characters", async () => {
    const res = await request(app)
      .post("/api/couriers")
      .send({
        name: "A".repeat(101),
        phone: "1234567890",
        vehicle: "Bicicleta",
        license_plate: "ABC123",
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("100 caracteres");
  });

  it("should reject if phone exceeds 20 characters", async () => {
    const res = await request(app)
      .post("/api/couriers")
      .send({
        name: "Juan Pérez",
        phone: "1".repeat(21),
        vehicle: "Bicicleta",
        license_plate: "ABC123",
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("20 caracteres");
  });

  it("should reject if available is not boolean", async () => {
    const res = await request(app).post("/api/couriers").send({
      name: "Juan Pérez",
      phone: "1234567890",
      vehicle: "Bicicleta",
      license_plate: "ABC123",
      available: "yes", // string instead of boolean
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("booleano");
  });

  it("should handle database errors", async () => {
    couriersRepository.create.mockRejectedValue(new Error("DB error"));

    const res = await request(app).post("/api/couriers").send({
      name: "Juan Pérez",
      phone: "1234567890",
      vehicle: "Bicicleta",
      license_plate: "ABC123",
    });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Error interno del servidor");
  });
});

describe("GET /api/couriers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should get all couriers with default pagination", async () => {
    const mockCouriers = [
      {
        id: 1,
        name: "Juan Pérez",
        phone: "1234567890",
        vehicle: "Bicicleta",
        license_plate: "ABC123",
        available: true,
      },
      {
        id: 2,
        name: "María Gómez",
        phone: "0987654321",
        vehicle: "Moto",
        license_plate: "XYZ789",
        available: false,
      },
    ];

    couriersRepository.getAll.mockResolvedValue(mockCouriers);

    const res = await request(app).get("/api/couriers");

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
    expect(res.body[0].name).toBe("Juan Pérez");
    expect(couriersRepository.getAll).toHaveBeenCalledWith(100, 0);
  });

  it("should get couriers with custom pagination", async () => {
    couriersRepository.getAll.mockResolvedValue([]);

    const res = await request(app)
      .get("/api/couriers")
      .query({ limit: 10, offset: 20 });

    expect(res.status).toBe(200);
    expect(couriersRepository.getAll).toHaveBeenCalledWith(10, 20);
  });

  it("should reject invalid limit", async () => {
    const res = await request(app).get("/api/couriers").query({ limit: -5 });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("límite");
  });

  it("should reject invalid offset", async () => {
    const res = await request(app).get("/api/couriers").query({ offset: -10 });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("offset");
  });

  it("should handle database errors", async () => {
    couriersRepository.getAll.mockRejectedValue(new Error("DB error"));

    const res = await request(app).get("/api/couriers");

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Error interno del servidor");
  });
});

describe("GET /api/couriers/available", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should get available couriers", async () => {
    const mockCouriers = [
      {
        id: 1,
        name: "Juan Pérez",
        phone: "1234567890",
        vehicle: "Bicicleta",
        license_plate: "ABC123",
        available: true,
      },
    ];

    couriersRepository.getAvailable.mockResolvedValue(mockCouriers);

    const res = await request(app).get("/api/couriers/available");

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].available).toBe(true);
    expect(res.body[0].name).toBe("Juan Pérez");
  });

  it("should return 404 if no couriers available", async () => {
    couriersRepository.getAvailable.mockResolvedValue([]);

    const res = await request(app).get("/api/couriers/available");

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("No hay Domiciliarios disponibles");
  });

  it("should handle database errors", async () => {
    couriersRepository.getAvailable.mockRejectedValue(new Error("DB error"));

    const res = await request(app).get("/api/couriers/available");

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Error interno del servidor");
  });
});

describe("GET /api/couriers/filter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should filter couriers by name", async () => {
    const mockCouriers = [
      {
        id: 1,
        name: "Juan Pérez",
        phone: "1234567890",
        vehicle: "Bicicleta",
        license_plate: "ABC123",
        available: true,
      },
    ];

    couriersRepository.getForFilter.mockResolvedValue(mockCouriers);

    const res = await request(app)
      .get("/api/couriers/filter")
      .query({ name: "Juan" });

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].name).toBe("Juan Pérez");
    expect(couriersRepository.getForFilter).toHaveBeenCalledWith({
      name: "Juan",
      phone: undefined,
      license_plate: undefined,
    });
  });

  it("should filter couriers by phone", async () => {
    const mockCouriers = [
      {
        id: 2,
        name: "María Gómez",
        phone: "0987654321",
        vehicle: "Moto",
        license_plate: "XYZ789",
        available: false,
      },
    ];

    couriersRepository.getForFilter.mockResolvedValue(mockCouriers);

    const res = await request(app)
      .get("/api/couriers/filter")
      .query({ phone: "0987" });

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].phone).toBe("0987654321");
  });

  it("should filter couriers by license plate", async () => {
    const mockCouriers = [
      {
        id: 2,
        name: "María Gómez",
        phone: "0987654321",
        vehicle: "Moto",
        license_plate: "XYZ789",
        available: false,
      },
    ];

    couriersRepository.getForFilter.mockResolvedValue(mockCouriers);

    const res = await request(app)
      .get("/api/couriers/filter")
      .query({ license_plate: "XYZ" });

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].license_plate).toBe("XYZ789");
  });

  it("should return 404 if no results found", async () => {
    couriersRepository.getForFilter.mockResolvedValue([]);

    const res = await request(app)
      .get("/api/couriers/filter")
      .query({ name: "NoExiste" });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("No se encontraron domiciliarios con esos filtros");
  });

  it("should handle database errors", async () => {
    couriersRepository.getForFilter.mockRejectedValue(new Error("DB error"));

    const res = await request(app)
      .get("/api/couriers/filter")
      .query({ name: "Juan" });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Error interno del servidor");
  });
});

describe("GET /api/couriers/:id", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should get a courier by ID", async () => {
    const mockCourier = {
      id: 1,
      name: "Juan Pérez",
      phone: "1234567890",
      vehicle: "Bicicleta",
      license_plate: "ABC123",
      available: true,
    };

    couriersRepository.getById.mockResolvedValue(mockCourier);

    const res = await request(app).get("/api/couriers/1");

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Juan Pérez");
    expect(couriersRepository.getById).toHaveBeenCalledWith("1");
  });

  it("should return 404 if courier does not exist", async () => {
    couriersRepository.getById.mockResolvedValue(null);

    const res = await request(app).get("/api/couriers/999");

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Domiciliario no encontrado");
  });

  it("should reject invalid ID", async () => {
    const res = await request(app).get("/api/couriers/abc");

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("ID");
  });

  it("should reject negative ID", async () => {
    const res = await request(app).get("/api/couriers/-5");

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("ID");
  });
});

describe("DELETE /api/couriers/:id", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should delete an existing courier", async () => {
    const mockCourier = {
      id: 1,
      name: "Juan Pérez",
      phone: "1234567890",
      vehicle: "Bicicleta",
      license_plate: "ABC123",
      available: true,
    };

    couriersRepository.delete.mockResolvedValue(mockCourier);

    const res = await request(app).delete("/api/couriers/1");

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Domiciliario eliminado exitosamente");
    expect(res.body.courier.id).toBe(1);
  });

  it("should return 404 if courier does not exist", async () => {
    couriersRepository.delete.mockResolvedValue(null);

    const res = await request(app).delete("/api/couriers/999");

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Domiciliario no encontrado");
  });

  it("should handle database errors", async () => {
    couriersRepository.delete.mockRejectedValue(new Error("DB error"));

    const res = await request(app).delete("/api/couriers/1");

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Error interno del servidor");
  });
});

describe("PUT /api/couriers/:id", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should update an existing courier", async () => {
    const mockUpdated = {
      id: 1,
      name: "Juan Pérez",
      phone: "1112223333",
      vehicle: "Moto",
      license_plate: "NEW123",
      available: false,
    };

    couriersRepository.update.mockResolvedValue(mockUpdated);

    const res = await request(app).put("/api/couriers/1").send({
      name: "Juan Pérez",
      phone: "1112223333",
      vehicle: "Moto",
      license_plate: "NEW123",
      available: false,
    });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Domiciliario actualizado exitosamente");
    expect(res.body.courier.phone).toBe("1112223333");
    expect(res.body.courier.vehicle).toBe("Moto");
  });

  it("should return 404 if courier does not exist", async () => {
    couriersRepository.update.mockResolvedValue(null);

    const res = await request(app).put("/api/couriers/999").send({
      name: "No Existe",
      phone: "0000000000",
      vehicle: "Ninguno",
      license_plate: "NONE",
      available: false,
    });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Domiciliario no encontrado");
  });

  it("should reject if required fields are missing", async () => {
    const res = await request(app).put("/api/couriers/1").send({
      name: "Juan Pérez",
      phone: "1112223333",
      // vehicle and license_plate missing
    });

    expect(res.status).toBe(400);
  });

  it("should handle database errors", async () => {
    couriersRepository.update.mockRejectedValue(new Error("DB error"));

    const res = await request(app).put("/api/couriers/1").send({
      name: "Juan Pérez",
      phone: "1112223333",
      vehicle: "Moto",
      license_plate: "NEW123",
      available: false,
    });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Error interno del servidor");
  });
});

describe("PATCH /api/couriers/:id", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should partially update a courier", async () => {
    const mockUpdated = {
      id: 1,
      name: "Juan Pérez",
      phone: "1112223333",
      vehicle: "Bicicleta",
      license_plate: "ABC123",
      available: false,
    };

    couriersRepository.updatePartial.mockResolvedValue(mockUpdated);

    const res = await request(app)
      .patch("/api/couriers/1")
      .send({ phone: "1112223333", available: false });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Domiciliario actualizado exitosamente");
    expect(res.body.courier.phone).toBe("1112223333");
    expect(res.body.courier.available).toBe(false);
  });

  it("should update a single field", async () => {
    const mockUpdated = {
      id: 1,
      name: "Juan Pérez",
      phone: "9999999999",
      vehicle: "Bicicleta",
      license_plate: "ABC123",
      available: true,
    };

    couriersRepository.updatePartial.mockResolvedValue(mockUpdated);

    const res = await request(app)
      .patch("/api/couriers/1")
      .send({ phone: "9999999999" });

    expect(res.status).toBe(200);
    expect(res.body.courier.phone).toBe("9999999999");
  });

  it("should return 404 if courier does not exist", async () => {
    couriersRepository.updatePartial.mockResolvedValue(null);

    const res = await request(app)
      .patch("/api/couriers/999")
      .send({ phone: "0000000000" });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Domiciliario no encontrado");
  });

  it("should validate sent fields", async () => {
    const res = await request(app)
      .patch("/api/couriers/1")
      .send({ phone: "1".repeat(21) }); // exceeds limit

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("20 caracteres");
  });

  it("should handle database errors", async () => {
    couriersRepository.updatePartial.mockRejectedValue(new Error("DB error"));

    const res = await request(app)
      .patch("/api/couriers/1")
      .send({ phone: "1112223333" });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Error interno del servidor");
  });
});
