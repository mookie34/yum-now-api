const addressesRepository = require('../repositories/addresses-repository');
const customerRepository = require('../repositories/customer-repository');
const {ValidationError, NotFoundError, DuplicateError} = require('../errors/custom-errors');
const { parsePagination } = require('../utils/sanitize');

class AddressesService {
    validateCustomerId(customer_id, isPartial) {
        if (!isPartial || customer_id !== undefined) {
            if (!customer_id || isNaN(customer_id) || parseInt(customer_id) <= 0) {
                return 'ID de cliente inválido';
            }
        }
        return null;
    }

    validateLabel(label, isPartial) {
        if (!isPartial || label !== undefined) {
            if (!label || label.trim() === '') {
                return 'La etiqueta es obligatoria';
            } else if (label.length > 50) {
                return 'La etiqueta no debe exceder los 50 caracteres';
            }
        }
        return null;
    }

    validateAddressText(address_text, isPartial) {
        if (!isPartial || address_text !== undefined) {
            if (!address_text || address_text.trim() === '') {
                return 'La dirección es obligatoria';
            } else if (address_text.length > 255) {
                return 'La dirección no debe exceder los 255 caracteres';
            }
        }
        return null;
    }

    validateReference(reference) {
        if (reference !== undefined && reference !== null) {
            if (reference.length > 255) {
                return 'La referencia no debe exceder los 255 caracteres';
            }
        }
        return null;
    }

    validateCoordinates(latitude, longitude) {
        const errors = [];
        if (latitude !== undefined && latitude !== null) {
            const lat = parseFloat(latitude);
            if (isNaN(lat) || lat < -90 || lat > 90) {
                errors.push('Latitud inválida. Debe estar entre -90 y 90');
            }
        }
        if (longitude !== undefined && longitude !== null) {
            const lon = parseFloat(longitude);
            if (isNaN(lon) || lon < -180 || lon > 180) {
                errors.push('Longitud inválida. Debe estar entre -180 y 180');
            }
        }
        return errors;
    }

    validateIsPrimary(is_primary, isPartial) {
        if (!isPartial || is_primary !== undefined) {
            if (is_primary !== undefined && typeof is_primary !== 'boolean') {
                return 'is_primary debe ser un valor booleano';
            }
        }
        return null;
    }

    collectAddressErrors(customer_id, label, address_text, reference, latitude, longitude, is_primary, isPartial) {
        const errors = [];
        const validators = [
            this.validateCustomerId(customer_id, isPartial),
            this.validateLabel(label, isPartial),
            this.validateAddressText(address_text, isPartial),
            this.validateReference(reference),
            this.validateIsPrimary(is_primary, isPartial)
        ];
        validators.filter(Boolean).forEach(err => errors.push(err));
        errors.push(...this.validateCoordinates(latitude, longitude));
        return errors;
    }

    validateAddressData(customer_id, label, address_text, reference, latitude, longitude, is_primary, isPartial = false){
        const errors = this.collectAddressErrors(customer_id, label, address_text, reference, latitude, longitude, is_primary, isPartial);
        if (errors.length > 0) {
            throw new ValidationError(errors.join('; '));
        }
    };

        validateId(id){
            if (!id || isNaN(id) || parseInt(id) <= 0) {
                throw new ValidationError('ID inválido');
            }
        };

        async addAddress(addressData) {

            const { customer_id, label, address_text, reference, latitude, longitude, is_primary } = addressData;
            // Validate input data
            this.validateAddressData(customer_id, label, address_text, reference, latitude, longitude, is_primary);

            // Verify that the customer exists
            const customer = await customerRepository.getById(customer_id);
            if (!customer) {
                throw new NotFoundError('Cliente no encontrado');
            }
            // If is_primary is true, unset other primary addresses for this customer
            if (is_primary) {
                await addressesRepository.unsetPrimaryAddresses(customer_id);
            }
            // Create the address
            const newAddress = await addressesRepository.create(addressData);
            return newAddress;
        };

        async getAllAddresses(limit) {
            const pagination = parsePagination(limit, 0);
            const addresses = await addressesRepository.getAll(pagination.limit);
            return addresses;
        };

        async getAddressesByCustomerId(customer_id) {
            this.validateId(customer_id);
            // Verify that the customer exists
            const customer = await customerRepository.getById(customer_id);
            if (!customer) {
                throw new NotFoundError('Cliente no encontrado');
            }
            const addresses = await addressesRepository.getByCustomerId(customer_id);
            return addresses;
        };

        async getPrimaryAddressByCustomerId(customer_id) {
            this.validateId(customer_id);
            // Verify that the customer exists
            const customer = await customerRepository.getById(customer_id);
            if (!customer) {
                throw new NotFoundError('Cliente no encontrado');
            }
            const address = await addressesRepository.getPrimaryByCustomerId(customer_id);
            return address;
        };

        async getAddressById(id) {
            this.validateId(id);
            const address = await addressesRepository.getById(id);
            if (!address) {
                throw new NotFoundError('Dirección no encontrada');
            }
            return address;
        };

        async deleteAddressById(id) {
            this.validateId(id);
            const address = await addressesRepository.getById(id);
            if (!address) {
                throw new NotFoundError('Dirección no encontrada');
            }

            if (address.is_primary) {
                throw new ValidationError('No se puede eliminar una dirección primaria. Primero asigne otra dirección como primaria o desmarque esta dirección como primaria.');
            }

            const deletedAddress = await addressesRepository.deleteById(id);
            return deletedAddress;
        };

        async updateAddress(id, addressData) {
            const { customer_id, label, address_text, reference, latitude, longitude, is_primary } = addressData;
            this.validateId(id);

                // Validate input data
                this.validateAddressData(customer_id, label, address_text, reference, latitude, longitude, is_primary);
                // If is_primary is true, unset other primary addresses for this customer
                if (is_primary) {
                    await addressesRepository.unsetPrimaryAddresses(customer_id);
                }
                const updatedAddress = await addressesRepository.update(id, addressData);
                if (!updatedAddress) {
                    throw new NotFoundError('Dirección no encontrada');
                }
                return updatedAddress;
        };

        async updateAddressPartial(id, addressData) {
            const { customer_id, label, address_text, reference, latitude, longitude, is_primary } = addressData;
            this.validateId(id);

                if (customer_id === undefined && label === undefined && address_text === undefined &&
                    reference === undefined && latitude === undefined && longitude === undefined &&
                    is_primary === undefined) {
                    throw new ValidationError('Debe proporcionar al menos un campo para actualizar');
                }
                // Validate input data
                this.validateAddressData(customer_id, label, address_text, reference, latitude, longitude, is_primary, true);

                const existingAddress = await addressesRepository.getById(id);
                if (!existingAddress) {
                    throw new NotFoundError('Dirección no encontrada');
                }

                // If is_primary is true, unset other primary addresses for this customer
                if (is_primary) {
                    await addressesRepository.unsetPrimaryAddresses(existingAddress.customer_id);
                }

                const updatedAddress = await addressesRepository.updatePartial(id, addressData);
                if (!updatedAddress) {
                    throw new NotFoundError('Dirección no encontrada');
                }
                return updatedAddress;
        };
}

module.exports = new AddressesService();
