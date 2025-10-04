const customerRepository = require('../repositories/customerRepository');

// Clases de errores personalizados
class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
    }
}

class NotFoundError extends Error {
    constructor(message) {
        super(message);
        this.name = 'NotFoundError';
    }
}

class DuplicateError extends Error {
    constructor(message) {
        super(message);
        this.name = 'DuplicateError';
    }
}

// Clase del servicio
class CustomerService {
    validateCustomerData(name, email, phone, isPartial = false){
        const errors = [];
    
        // Validar nombre (REQUERIDO, max 100 caracteres)
        if (!isPartial || name !== undefined) {
            if (!name || name.trim().length < 2) {
            errors.push('Nombre inválido (mínimo 2 caracteres)');
            } else if (name.trim().length > 100) {
            errors.push('Nombre muy largo (máximo 100 caracteres)');
            }
        }
    
        // Validar email (OPCIONAL, max 100 caracteres)
        // Solo valida si se proporciona
        if (email !== undefined && email !== null && email.trim() !== '') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
            errors.push('Email inválido');
            } else if (email.trim().length > 100) {
            errors.push('Email muy largo (máximo 100 caracteres)');
            }
        }
    
        // Validar teléfono (REQUERIDO, UNIQUE, max 20 caracteres)
        if (!isPartial || phone !== undefined) {
            if (!phone || phone.trim().length < 7) {
            errors.push('Teléfono inválido (mínimo 7 caracteres)');
            } else if (phone.trim().length > 20) {
            errors.push('Teléfono muy largo (máximo 20 caracteres)');
            }
        
            // Validar que contenga principalmente números
            const phoneRegex = /^[\d\s\-\(\)\+]+$/;
            if (phone && !phoneRegex.test(phone)) {
            errors.push('Teléfono contiene caracteres inválidos');
            }
        }
    
        if (errors.length > 0) {
            throw new ValidationError(errors.join(', '));
        }
    };

    /**
    * Valida que el ID sea un número entero positivo
    */
    validateId(id){
        if (!id || isNaN(id) || parseInt(id) <= 0) {
            throw new ValidationError('ID inválido');
        }
    };

    normalizeCustomerData(name, email, phone){
        const normalizedData = {
            name: name.trim(),
            phone: phone.trim(),
            email: email && email.trim() !== '' ? email.trim().toLowerCase() : null
        };
        return normalizedData;
    };

    async addCustomer(customerData) {
        const { name, email, phone } = customerData;
        // Validar datos
        this.validateCustomerData(name, email, phone);
        // Normalizar datos
        const normalizedData = this.normalizeCustomerData(name, email, phone);
        try{
            return await customerRepository.create(normalizedData);
        }
        catch(err){
            if (err.code === '23505') { // Código de error de violación de unicidad en PostgreSQL
                throw new DuplicateError('El teléfono ya está registrado');
            } else {
                throw err; // Re-lanzar otros errores
            }
        }
    };

    async getAllCustomers(limit = 100) {
        const validLimit = Math.min(parseInt(limit) || 50, 100);
        return await customerRepository.getAll(validLimit);
    };

    async getCustomerByPhone(phone) {
        if (!phone || phone.trim().length < 7) {
            throw new ValidationError('Teléfono inválido (mínimo 7 caracteres)');
        }
        const customer = await customerRepository.getByPhone(phone.trim());
        if (!customer) {
            throw new NotFoundError('Cliente no encontrado');
        }
        return customer;
    };

    async getCustomerById(id) {
        this.validateId(id);
        
        const customer = await customerRepository.getById(id);
        if (!customer) {
            throw new NotFoundError('Cliente no encontrado');
        }
        return customer;
    };

    async updateCustomer(id, customerData) {
        const { name, email, phone } = customerData;
        this.validateId(id);
        
        // Validar datos
        this.validateCustomerData(name, email, phone);
        // Normalizar datos
        const normalizedData = this.normalizeCustomerData(name, email, phone);
        try{
            const updatedCustomer = await customerRepository.update(id, normalizedData);
            if (!updatedCustomer) {
                throw new NotFoundError('Cliente no encontrado');
            }
            return updatedCustomer;
        }
        catch(err){
            if (err.code === '23505') { // Código de error de violación de unicidad en PostgreSQL
                throw new DuplicateError('El teléfono ya está registrado');
            } else {
                throw err; // Re-lanzar otros errores
            }
        }
    };

    async updateCustomerPartial(id, customerData) {
        const { name, email, phone } = customerData;
        this.validateId(id);
        
        if (name === undefined && email === undefined && phone === undefined) {
            throw new ValidationError('Debe proporcionar al menos un campo para actualizar (name, email o phone)');
        }
        // Validar datos
        this.validateCustomerData(name, email, phone, true);
        // Normalizar datos
        const normalizedData = {};
        if (name !== undefined) normalizedData.name = name.trim();
        if (phone !== undefined) normalizedData.phone = phone.trim();
        if (email !== undefined) normalizedData.email = email && email.trim() !== '' ? email.trim().toLowerCase() : null;
        try{
            const updatedCustomer = await customerRepository.updatePartial(id, normalizedData);
            if (!updatedCustomer) {
                throw new NotFoundError('Cliente no encontrado');
            }
            return updatedCustomer;
        }
        catch(err){
            if (err.code === '23505') { // Código de error de violación de unicidad en PostgreSQL
                throw new DuplicateError('El teléfono ya está registrado');
            } else {
                throw err; // Re-lanzar otros errores
            }
        }
    };

    async deleteCustomerById(id) {
        this.validateId(id);
        try{
            const deletedCustomer = await customerRepository.deleteById(id);
            if (!deletedCustomer) {
                throw new NotFoundError('Cliente no encontrado');
            }
            return deletedCustomer;
        }
        catch(err){
            if (err.code === '23503') { // Código de error de violación de clave foránea en PostgreSQL
                throw new ValidationError('No se puede eliminar el cliente porque tiene ordenes asociadas');
            }
            throw err; // Re-lanzar otros errores
        }
       
    };
}

// Exportar TODO
module.exports = {
    customerService: new CustomerService(),
    ValidationError,
    NotFoundError,
    DuplicateError
};