// Mock del repository (debe ir ANTES de los requires)
jest.mock("../repositories/couriersRepository");

const request = require("supertest");
const app = require("../app");
const couriersRepository = require("../repositories/couriersRepository");

describe("POST /api/couriers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Debe crear un Domiciliario válido", async () => {
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

  it("Debe usar available=true por defecto si no se envía", async () => {
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
      // available no enviado
    });

    expect(res.status).toBe(201);
    expect(couriersRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ available: true })
    );
  });

  it("Debe rechazar si falta el nombre", async () => {
    const res = await request(app).post("/api/couriers").send({
      phone: "1234567890",
      vehicle: "Bicicleta",
      license_plate: "ABC123",
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("nombre");
  });

  it("Debe rechazar si falta el teléfono", async () => {
    const res = await request(app).post("/api/couriers").send({
      name: "Juan Pérez",
      vehicle: "Bicicleta",
      license_plate: "ABC123",
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("teléfono");
  });

  it("Debe rechazar si falta el vehículo", async () => {
    const res = await request(app).post("/api/couriers").send({
      name: "Juan Pérez",
      phone: "1234567890",
      license_plate: "ABC123",
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("vehículo");
  });

  it("Debe rechazar si falta la placa", async () => {
    const res = await request(app).post("/api/couriers").send({
      name: "Juan Pérez",
      phone: "1234567890",
      vehicle: "Bicicleta",
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("placa");
  });

  it("Debe rechazar si el nombre excede 100 caracteres", async () => {
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

  it("Debe rechazar si el teléfono excede 20 caracteres", async () => {
    const res = await request(app)
      .post("/api/couriers")
      .send({
        name: "Juan Pérez",
        phone: "1".repeat(21),
        vehicle: "Bicicleta",
        license_plate: "ABC123",
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("15 caracteres");
  });

  it("Debe rechazar si available no es booleano", async () => {
    const res = await request(app).post("/api/couriers").send({
      name: "Juan Pérez",
      phone: "1234567890",
      vehicle: "Bicicleta",
      license_plate: "ABC123",
      available: "yes", // String en vez de boolean
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("booleano");
  });

  it("Debe manejar error de base de datos", async () => {
    couriersRepository.create.mockRejectedValue(new Error("DB error"));

    const res = await request(app).post("/api/couriers").send({
      name: "Juan Pérez",
      phone: "1234567890",
      vehicle: "Bicicleta",
      license_plate: "ABC123",
    });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe(
      "Error al guardar el domiciliario en la base de datos"
    );
  });
});

describe("GET /api/couriers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Debe obtener todos los Domiciliarios con paginación por defecto", async () => {
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

  it("Debe obtener Domiciliarios con paginación personalizada", async () => {
    couriersRepository.getAll.mockResolvedValue([]);

    const res = await request(app)
      .get("/api/couriers")
      .query({ limit: 10, offset: 20 });

    expect(res.status).toBe(200);
    expect(couriersRepository.getAll).toHaveBeenCalledWith(10, 20);
  });

  it("Debe rechazar límite inválido", async () => {
    const res = await request(app).get("/api/couriers").query({ limit: -5 });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("límite");
  });

  it("Debe rechazar offset inválido", async () => {
    const res = await request(app).get("/api/couriers").query({ offset: -10 });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("offset");
  });

  it("Debe manejar error de base de datos", async () => {
    couriersRepository.getAll.mockRejectedValue(new Error("DB error"));

    const res = await request(app).get("/api/couriers");

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Error al obtener los Domiciliarios");
  });
});

describe("GET /api/couriers/available", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Debe obtener Domiciliarios disponibles", async () => {
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

  it("Debe retornar 404 si no hay Domiciliarios disponibles", async () => {
    couriersRepository.getAvailable.mockResolvedValue([]);

    const res = await request(app).get("/api/couriers/available");

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("No hay Domiciliarios disponibles");
  });

  it("Debe manejar error de base de datos", async () => {
    couriersRepository.getAvailable.mockRejectedValue(new Error("DB error"));

    const res = await request(app).get("/api/couriers/available");

    expect(res.status).toBe(500);
    expect(res.body.error).toBe(
      "Error al obtener los Domiciliarios disponibles"
    );
  });
});

describe("GET /api/couriers/filter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Debe filtrar Domiciliarios por nombre", async () => {
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

  it("Debe filtrar Domiciliarios por teléfono", async () => {
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

  it("Debe filtrar Domiciliarios por placa", async () => {
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

  it("Debe retornar 404 si no hay resultados", async () => {
    couriersRepository.getForFilter.mockResolvedValue([]);

    const res = await request(app)
      .get("/api/couriers/filter")
      .query({ name: "NoExiste" });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe(
      "No se encontraron domiciliarios con esos filtros"
    );
  });

  it("Debe manejar error de base de datos", async () => {
    couriersRepository.getForFilter.mockRejectedValue(new Error("DB error"));

    const res = await request(app)
      .get("/api/couriers/filter")
      .query({ name: "Juan" });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe(
      "Error al obtener los Domiciliarios por filtro"
    );
  });
});

describe("GET /api/couriers/:id", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Debe obtener un Domiciliario por ID", async () => {
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

  it("Debe retornar 404 si el Domiciliario no existe", async () => {
    couriersRepository.getById.mockResolvedValue(null);

    const res = await request(app).get("/api/couriers/999");

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Domiciliario no encontrado");
  });

  it("Debe rechazar ID inválido", async () => {
    const res = await request(app).get("/api/couriers/abc");

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("ID");
  });

  it("Debe rechazar ID negativo", async () => {
    const res = await request(app).get("/api/couriers/-5");

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("ID");
  });
});

describe("DELETE /api/couriers/:id", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Debe eliminar un Domiciliario existente", async () => {
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

  it("Debe retornar 404 si el Domiciliario no existe", async () => {
    couriersRepository.delete.mockResolvedValue(null);

    const res = await request(app).delete("/api/couriers/999");

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Domiciliario no encontrado");
  });

  it("Debe manejar error de base de datos", async () => {
    couriersRepository.delete.mockRejectedValue(new Error("DB error"));

    const res = await request(app).delete("/api/couriers/1");

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Error al eliminar el Domiciliario");
  });
});

describe("PUT /api/couriers/:id", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Debe actualizar un Domiciliario existente", async () => {
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

  it("Debe retornar 404 si el Domiciliario no existe", async () => {
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

  it("Debe rechazar si faltan campos obligatorios", async () => {
    const res = await request(app).put("/api/couriers/1").send({
      name: "Juan Pérez",
      phone: "1112223333",
      // Faltan vehicle y license_plate
    });

    expect(res.status).toBe(400);
  });

  it("Debe manejar error de base de datos", async () => {
    couriersRepository.update.mockRejectedValue(new Error("DB error"));

    const res = await request(app).put("/api/couriers/1").send({
      name: "Juan Pérez",
      phone: "1112223333",
      vehicle: "Moto",
      license_plate: "NEW123",
      available: false,
    });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Error al actualizar el Domiciliario");
  });
});

describe("PATCH /api/couriers/:id", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Debe actualizar parcialmente un Domiciliario", async () => {
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

  it("Debe actualizar solo un campo", async () => {
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

  it("Debe retornar 404 si el Domiciliario no existe", async () => {
    couriersRepository.updatePartial.mockResolvedValue(null);

    const res = await request(app)
      .patch("/api/couriers/999")
      .send({ phone: "0000000000" });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Domiciliario no encontrado");
  });

  it("Debe validar campos enviados", async () => {
    const res = await request(app)
      .patch("/api/couriers/1")
      .send({ phone: "1".repeat(21) }); // Excede límite

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("15 caracteres");
  });

  it("Debe manejar error de base de datos", async () => {
    couriersRepository.updatePartial.mockRejectedValue(new Error("DB error"));

    const res = await request(app)
      .patch("/api/couriers/1")
      .send({ phone: "1112223333" });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Error al actualizar el Domiciliario");
  });
});
