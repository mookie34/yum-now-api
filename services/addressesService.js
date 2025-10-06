const addressesRepository = require('../repositories/addressesRepository');
const customerRepository = require('../repositories/customerRepository');
const {ValidationError, NotFoundError, DuplicateError} = require('../errors/customErrors');

class AddressesService {
    ValidateAddressData(customer_id, label, address_text, reference, latitude, longitude, is_primary, isPartial = false){
        const errors = [];
        
            // Validar customer_id (REQUERIDO, debe existir en tabla customers)
            if (!isPartial || customer_id !== undefined) {
                if (!customer_id || isNaN(customer_id) || parseInt(customer_id) <= 0) {
                    errors.push('ID de cliente inválido');
                }
            }
            // Validar label (REQUERIDO, no vacío, longitud máxima 50)
            if (!isPartial || label !== undefined) {
                if (!label || label.trim() === '') {
                    errors.push('La etiqueta es obligatoria');
                } else if (label.length > 50) {
                    errors.push('La etiqueta no debe exceder los 50 caracteres');
                }
            }
            // Validar address_text (REQUERIDO, no vacío, longitud máxima 255)
            if (!isPartial || address_text !== undefined) {
                if (!address_text || address_text.trim() === '') {
                    errors.push('La dirección es obligatoria');
                } else if (address_text.length > 255) {
                    errors.push('La dirección no debe exceder los 255 caracteres');
                }
            }
            // Validar reference (OPCIONAL, longitud máxima 255)
            if (reference !== undefined && reference !== null) {
                if (reference.length > 255) {
                    errors.push('La referencia no debe exceder los 255 caracteres');
                }
            }
            // Validar latitude (OPCIONAL, debe ser un número entre -90 y 90)
            if (latitude !== undefined && latitude !== null) {
                const lat = parseFloat(latitude);
                if (isNaN(lat) || lat < -90 || lat > 90) {
                    errors.push('Latitud inválida. Debe estar entre -90 y 90');
                }
            }
            // Validar longitude (OPCIONAÑ, debe ser un número entre -180 y 180)
            if (longitude !== undefined && longitude !== null) {
                const lon = parseFloat(longitude);
                if (isNaN(lon) || lon < -180 || lon > 180) {
                    errors.push('Longitud inválida. Debe estar entre -180 y 180');
                }
            }
            // Validar is_primary (REQUERIDO, booleano)
            if (!isPartial || is_primary !== undefined) {
                if (is_primary !== undefined && typeof is_primary !== 'boolean') {
                    errors.push('is_primary debe ser un valor booleano');
                }
            }

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
            // Validar datos
            this.ValidateAddressData(customer_id, label, address_text, reference, latitude, longitude, is_primary);

            // Verificar que el cliente exista
            const customer = await customerRepository.getById(customer_id);
            if (!customer) {
                throw new NotFoundError('Cliente no encontrado');
            }
            // Si is_primary es true, desmarcar otras direcciones primarias del mismo cliente
            if (is_primary) {
                await addressesRepository.unsetPrimaryAddresses(customer_id);
            }
            // Crear la dirección
            const newAddress = await addressesRepository.create(addressData);
            return newAddress;
        };

        async getAllAddresses(limit = 100) {
            limit = parseInt(limit);
            if (isNaN(limit) || limit <= 0) {
                throw new ValidationError('El límite debe ser un número positivo');
            }
            const addresses = await addressesRepository.getAll(limit);
            return addresses;
        };
        
        async getAddressesByCustomerId(customer_id) {
            this.validateId(customer_id);
            // Verificar que el cliente exista
            const customer = await customerRepository.getById(customer_id);
            if (!customer) {
                throw new NotFoundError('Cliente no encontrado');
            }
            const addresses = await addressesRepository.getByCustomerId(customer_id);
            return addresses;
        };

        async getPrimaryAddressByCustomerId(customer_id) {
            this.validateId(customer_id);
            // Verificar que el cliente exista
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
                
                // Validar datos
                this.ValidateAddressData(customer_id, label, address_text, reference, latitude, longitude, is_primary);
                // Si is_primary es true, desmarcar otras direcciones primarias del mismo cliente
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
                // Validar datos
                this.ValidateAddressData(customer_id, label, address_text, reference, latitude, longitude, is_primary, true);
                // Si is_primary es true, desmarcar otras direcciones primarias del mismo cliente
                if (is_primary) {
                    await addressesRepository.unsetPrimaryAddresses(customer_id);
                }
                const updatedAddress = await addressesRepository.updatePartial(id, addressData);
                if (!updatedAddress) {
                    throw new NotFoundError('Dirección no encontrada');
                }
                return updatedAddress;
        };
}

module.exports = new AddressesService();

