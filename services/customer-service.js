const customerRepository = require('../repositories/customer-repository');
const {ValidationError, NotFoundError, DuplicateError} = require('../errors/custom-errors');
const { parsePagination } = require('../utils/sanitize');

// Service class
class CustomerService {
    validateCustomerData(name, email, phone, isPartial = false){
        const errors = [];
    
        // Validate name (REQUIRED, max 100 characters)
        if (!isPartial || name !== undefined) {
            if (!name || name.trim().length < 2) {
            errors.push('Nombre inválido (mínimo 2 caracteres)');
            } else if (name.trim().length > 100) {
            errors.push('Nombre muy largo (máximo 100 caracteres)');
            }
        }
    
        // Validate email (OPTIONAL, max 100 characters, only validated if provided)
        if (email !== undefined && email !== null && email.trim() !== '') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
            errors.push('Email inválido');
            } else if (email.trim().length > 100) {
            errors.push('Email muy largo (máximo 100 caracteres)');
            }
        }
    
        // Validate phone (REQUIRED, UNIQUE, max 20 characters)
        if (!isPartial || phone !== undefined) {
            if (!phone || phone.trim().length < 7) {
            errors.push('Teléfono inválido (mínimo 7 caracteres)');
            } else if (phone.trim().length > 20) {
            errors.push('Teléfono muy largo (máximo 20 caracteres)');
            }
        
            // Validate that the phone contains mainly digits
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
    * Validates that the ID is a positive integer
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
        // Validate data
        this.validateCustomerData(name, email, phone);
        // Normalize data
        const normalizedData = this.normalizeCustomerData(name, email, phone);
        try{
            return await customerRepository.create(normalizedData);
        }
        catch(err){
            if (err.code === '23505') { // PostgreSQL unique constraint violation code
                throw new DuplicateError('El teléfono ya está registrado');
            } else {
                throw err; // Propagate unexpected errors
            }
        }
    };

    async getAllCustomers(limit) {
        const pagination = parsePagination(limit, 0);
        return await customerRepository.getAll(pagination.limit);
    };

    async getCustomerByPhone(phone) {
        const customer = await customerRepository.getByPhone(phone.trim());
        if (!customer || customer.length === 0) {
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
        
        // Validate data
        this.validateCustomerData(name, email, phone);
        // Normalize data
        const normalizedData = this.normalizeCustomerData(name, email, phone);
        try{
            const updatedCustomer = await customerRepository.update(id, normalizedData);
            if (!updatedCustomer) {
                throw new NotFoundError('Cliente no encontrado');
            }
            return updatedCustomer;
        }
        catch(err){
            if (err.code === '23505') { // PostgreSQL unique constraint violation code
                throw new DuplicateError('El teléfono ya está registrado');
            } else {
                throw err; // Propagate unexpected errors
            }
        }
    };

    async updateCustomerPartial(id, customerData) {
        const { name, email, phone } = customerData;
        this.validateId(id);
        
        if (name === undefined && email === undefined && phone === undefined) {
            throw new ValidationError('Debe proporcionar al menos un campo para actualizar (name, email o phone)');
        }
        // Validate data
        this.validateCustomerData(name, email, phone, true);
        // Normalize data
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
            if (err.code === '23505') { // PostgreSQL unique constraint violation code
                throw new DuplicateError('El teléfono ya está registrado');
            } else {
                throw err; // Propagate unexpected errors
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
            if (err.code === '23503') { // PostgreSQL foreign key constraint violation code
                throw new ValidationError('No se puede eliminar el cliente porque tiene ordenes asociadas');
            }
            throw err; // Propagate unexpected errors
        }
       
    };
}

module.exports = new CustomerService();
