const express = require("express");
const router = express.Router();
const courierController = require("../controllers/couriersController");

// Listar mensajeros por filtro
router.get("/filter", courierController.getCourierForFilter);
// Listar mensajeros disponibles
router.get("/available", courierController.getCouriersAvailable);
// Crear un mensajero
router.post("/", courierController.addCourier);
// Listar todos los mensajeros (con paginación opcional)
router.get("/", courierController.getCouriers);

// Obtener un mensajero por ID
router.get("/:id", courierController.getCourierById);
// Actualizar un mensajero completamente
router.put("/:id", courierController.updateCourier);
// Actualizar un mensajero parcialmente
router.patch("/:id", courierController.updateCourierPartial);
// Eliminar un mensajero
router.delete("/:id", courierController.deleteCourier);

module.exports = router;
