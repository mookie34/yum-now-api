const customerService = require('../services/customerService');
const { ValidationError, NotFoundError, DuplicateError } = require('../errors/customErrors');

const addCustomer = async (req, res) => {
    try {
        const customer = await customerService.addCustomer(req.body);
        res.status(201).json({
            message: 'Cliente creado exitosamente',
            customer
        });
    } catch (err) {
        console.error('Error al crear cliente:', err.message);
        
        if (err instanceof ValidationError) {
            return res.status(400).json({ error: err.message });
        }
        
        if (err instanceof DuplicateError) {
            return res.status(409).json({ error: err.message });
        }
        
        res.status(500).json({ error: 'Error al crear el cliente' });
    }
};

const getCustomers = async (req, res) => {
    try {
        const customers = await customerService.getAllCustomers(req.query.limit);
        res.json(customers);
    } catch (err) {
        console.error('Error al obtener clientes:', err.message);
        res.status(500).json({ error: 'Error al obtener los clientes' });
    }
};

const getCustomerForPhone = async (req, res) => {
    try {
        const customer = await customerService.getCustomerByPhone(req.params.phone);
        res.json(customer);
    } catch (err) {
        console.error('Error al buscar cliente:', err.message);
        
        if (err instanceof ValidationError) {
            return res.status(400).json({ error: err.message });
        }
        
        if (err instanceof NotFoundError) {
            return res.status(404).json({ error: err.message });
        }
        
        res.status(500).json({ error: 'Error al buscar el cliente' });
    }
};

const updateCustomer = async (req, res) => {
    try {
        const customer = await customerService.updateCustomer(req.params.id, req.body);
        res.json({
            message: 'Cliente actualizado exitosamente',
            customer
        });
    } catch (err) {
        console.error('Error al actualizar cliente:', err.message);
        
        if (err instanceof ValidationError) {
            return res.status(400).json({ error: err.message });
        }
        
        if (err instanceof NotFoundError) {
            return res.status(404).json({ error: err.message });
        }
        
        if (err instanceof DuplicateError) {
            return res.status(409).json({ error: err.message });
        }
        
        res.status(500).json({ error: 'Error al actualizar el cliente' });
    }
};

const updateCustomerPartial = async (req, res) => {
    try {
        const customer = await customerService.updateCustomerPartial(req.params.id, req.body);
        res.json({
            message: 'Cliente actualizado exitosamente',
            customer
        });
    } catch (err) {
        console.error('Error al actualizar cliente:', err.message);
        
        if (err instanceof ValidationError) {
            return res.status(400).json({ error: err.message });
        }
        
        if (err instanceof NotFoundError) {
            return res.status(404).json({ error: err.message });
        }
        
        if (err instanceof DuplicateError) {
            return res.status(409).json({ error: err.message });
        }
        
        res.status(500).json({ error: 'Error al actualizar el cliente' });
    }
};

const deleteCustomer = async (req, res) => {
    try {
        const customer = await customerService.deleteCustomerById(req.params.id);
        res.json({
            message: 'Cliente eliminado exitosamente',
            customer
        });
    } catch (err) {
        console.error('Error al eliminar cliente:', err.message);
        
        if (err instanceof ValidationError) {
            return res.status(400).json({ error: err.message });
        }
        
        if (err instanceof NotFoundError) {
            return res.status(404).json({ error: err.message });
        }
        
        res.status(500).json({ error: 'Error al eliminar el cliente' });
    }
};

module.exports = {addCustomer,getCustomers,getCustomerForPhone,updateCustomer,updateCustomerPartial,deleteCustomer};