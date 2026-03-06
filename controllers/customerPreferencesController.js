const customerPreferencesService = require("../services/customerPreferencesService");
const { ValidationError, NotFoundError } = require("../errors/customErrors");

const createCustomerPreference = async (req, res) => {
  try {
    const preference = await customerPreferencesService.createPreference(req.body);
    res.status(201).json({ message: "Preferencia creada exitosamente", preference: preference });
  } catch (err) {
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }
    if (err instanceof NotFoundError) {
      return res.status(404).json({ error: err.message });
    }
    console.error("Error creando preferencia de cliente:", err.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const getCustomerPreferences = async (req, res) => {
  try {
    const { customer_id } = req.params;
    const preferences = await customerPreferencesService.getPreferencesByCustomerId(customer_id);

    if (preferences.length === 0) {
      return res.status(200).json({ message: "No se encontraron preferencias para este cliente.", data: [] });
    }

    res.status(200).json(preferences);
  } catch (err) {
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }
    if (err instanceof NotFoundError) {
      return res.status(404).json({ error: err.message });
    }
    console.error("Error obteniendo preferencias de cliente:", err.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const getCustomerSpecificPreference = async (req, res) => {
  try {
    const { customer_id, preference_key } = req.params;
    const preference = await customerPreferencesService.getSpecificPreference(customer_id, preference_key);
    res.status(200).json(preference);
  } catch (err) {
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }
    if (err instanceof NotFoundError) {
      return res.status(404).json({ error: err.message });
    }
    console.error("Error obteniendo preferencia específica de cliente:", err.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const updateCustomerPreference = async (req, res) => {
  try {
    const { customer_id, preference_key } = req.params;
    const { preference_value } = req.body;
    const preference = await customerPreferencesService.updatePreference(customer_id, preference_key, preference_value);
    res.status(200).json({ message: "Preferencia actualizada exitosamente.", preference: preference });
  } catch (err) {
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }
    if (err instanceof NotFoundError) {
      return res.status(404).json({ error: err.message });
    }
    console.error("Error actualizando preferencia de cliente:", err.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const deleteCustomerPreference = async (req, res) => {
  try {
    const { customer_id, preference_key } = req.params;
    await customerPreferencesService.deletePreference(customer_id, preference_key);
    res.status(200).json({ message: "Preferencia eliminada exitosamente." });
  } catch (err) {
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }
    if (err instanceof NotFoundError) {
      return res.status(404).json({ error: err.message });
    }
    console.error("Error eliminando preferencia de cliente:", err.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const deleteAllCustomerPreferences = async (req, res) => {
  try {
    const { customer_id } = req.params;
    await customerPreferencesService.deleteAllPreferences(customer_id);
    res.status(200).json({ message: "Todas las preferencias del cliente fueron eliminadas exitosamente." });
  } catch (err) {
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }
    if (err instanceof NotFoundError) {
      return res.status(404).json({ error: err.message });
    }
    console.error("Error eliminando todas las preferencias de cliente:", err.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

module.exports = {
  createCustomerPreference,
  getCustomerPreferences,
  getCustomerSpecificPreference,
  updateCustomerPreference,
  deleteCustomerPreference,
  deleteAllCustomerPreferences,
};
