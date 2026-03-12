const customerPreferencesRepository = require("../repositories/customer-preferences-repository");
const { ValidationError, NotFoundError } = require("../errors/custom-errors");

class CustomerPreferencesService {
  validateId(id) {
    if (!id || isNaN(id) || parseInt(id) <= 0) {
      throw new ValidationError("ID de cliente inválido");
    }
  }

  validatePreferenceData(data) {
    const errors = [];
    const { customer_id, preference_key, preference_value } = data;

    if (!customer_id) {
      errors.push("customer_id es obligatorio");
    } else if (isNaN(customer_id) || parseInt(customer_id) <= 0) {
      errors.push("customer_id debe ser un número positivo");
    }

    if (!preference_key || String(preference_key).trim() === "") {
      errors.push("preference_key es obligatorio");
    } else if (String(preference_key).length > 255) {
      errors.push("preference_key no puede exceder los 255 caracteres");
    }

    if (!preference_value || String(preference_value).trim() === "") {
      errors.push("preference_value es obligatorio");
    } else if (String(preference_value).length > 255) {
      errors.push("preference_value no puede exceder los 255 caracteres");
    }

    if (errors.length > 0) {
      throw new ValidationError(errors.join(", "));
    }
  }

  async ensureCustomerExists(customerId) {
    const customer = await customerPreferencesRepository.findCustomerById(customerId);
    if (!customer) {
      throw new NotFoundError("No existe un cliente con el customer_id proporcionado");
    }
  }

  async createPreference(preferenceData) {
    this.validatePreferenceData(preferenceData);
    await this.ensureCustomerExists(preferenceData.customer_id);
    return await customerPreferencesRepository.create(preferenceData);
  }

  async getPreferencesByCustomerId(customerId) {
    this.validateId(customerId);
    await this.ensureCustomerExists(customerId);
    return await customerPreferencesRepository.findByCustomerId(customerId);
  }

  async getSpecificPreference(customerId, preferenceKey) {
    this.validateId(customerId);
    await this.ensureCustomerExists(customerId);

    const preference = await customerPreferencesRepository.findByCustomerIdAndKey(customerId, preferenceKey);
    if (!preference) {
      throw new NotFoundError("No se encontró la preferencia especificada para este cliente.");
    }
    return preference;
  }

  async updatePreference(customerId, preferenceKey, preferenceValue) {
    this.validateId(customerId);

    if (!preferenceValue || String(preferenceValue).trim() === "") {
      throw new ValidationError("Debe proporcionar preference_value");
    }

    await this.ensureCustomerExists(customerId);

    const existing = await customerPreferencesRepository.findByCustomerIdAndKey(customerId, preferenceKey);
    if (!existing) {
      throw new NotFoundError("No se encontró la preferencia especificada para este cliente.");
    }

    return await customerPreferencesRepository.updateByCustomerIdAndKey(customerId, preferenceKey, preferenceValue);
  }

  async deletePreference(customerId, preferenceKey) {
    this.validateId(customerId);
    await this.ensureCustomerExists(customerId);

    const existing = await customerPreferencesRepository.findByCustomerIdAndKey(customerId, preferenceKey);
    if (!existing) {
      throw new NotFoundError("No se encontró la preferencia especificada para este cliente.");
    }

    return await customerPreferencesRepository.deleteByCustomerIdAndKey(customerId, preferenceKey);
  }

  async deleteAllPreferences(customerId) {
    this.validateId(customerId);
    await this.ensureCustomerExists(customerId);

    const preferences = await customerPreferencesRepository.findByCustomerId(customerId);
    if (preferences.length === 0) {
      throw new NotFoundError("No se encontraron preferencias para este cliente.");
    }

    return await customerPreferencesRepository.deleteAllByCustomerId(customerId);
  }
}

module.exports = new CustomerPreferencesService();
