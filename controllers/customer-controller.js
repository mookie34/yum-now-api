const customerService = require('../services/customer-service');
const { ValidationError, NotFoundError, DuplicateError } = require('../errors/custom-errors');

const addCustomer = async (req, res) => {
    try {
        const customer = await customerService.addCustomer(req.body);
        res.status(201).json({
            message: 'Cliente creado exitosamente',
            customer
        });
    } catch (err) {
        console.error('Error creating customer:', err.message);

        if (err instanceof ValidationError) {
            return res.status(400).json({ error: err.message });
        }

        if (err instanceof DuplicateError) {
            return res.status(409).json({ error: err.message });
        }

        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const getCustomers = async (req, res) => {
    try {
        const customers = await customerService.getAllCustomers(req.query.limit, req.query.offset);
        res.json(customers);
    } catch (err) {
        console.error('Error fetching customers:', err.message);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const getCustomerByPhone = async (req, res) => {
    try {
        const customer = await customerService.getCustomerByPhone(req.params.phone);
        res.json(customer);
    } catch (err) {
        console.error('Error fetching customer by phone:', err.message);

        if (err instanceof ValidationError) {
            return res.status(400).json({ error: err.message });
        }

        if (err instanceof NotFoundError) {
            return res.status(404).json({ error: err.message });
        }

        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const getCustomerById = async (req, res) => {
    try {
        const customer = await customerService.getCustomerById(req.params.id);
        res.json(customer);
    } catch (err) {
        console.error('Error fetching customer by ID:', err.message);

        if (err instanceof NotFoundError) {
            return res.status(404).json({ error: err.message });
        }

        res.status(500).json({ error: 'Error interno del servidor' });
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
        console.error('Error updating customer:', err.message);

        if (err instanceof ValidationError) {
            return res.status(400).json({ error: err.message });
        }

        if (err instanceof NotFoundError) {
            return res.status(404).json({ error: err.message });
        }

        if (err instanceof DuplicateError) {
            return res.status(409).json({ error: err.message });
        }

        res.status(500).json({ error: 'Error interno del servidor' });
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
        console.error('Error partially updating customer:', err.message);

        if (err instanceof ValidationError) {
            return res.status(400).json({ error: err.message });
        }

        if (err instanceof NotFoundError) {
            return res.status(404).json({ error: err.message });
        }

        if (err instanceof DuplicateError) {
            return res.status(409).json({ error: err.message });
        }

        res.status(500).json({ error: 'Error interno del servidor' });
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
        console.error('Error deleting customer:', err.message);

        if (err instanceof ValidationError) {
            return res.status(400).json({ error: err.message });
        }

        if (err instanceof NotFoundError) {
            return res.status(404).json({ error: err.message });
        }

        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

module.exports = {addCustomer,getCustomers,getCustomerByPhone,updateCustomer,updateCustomerPartial,deleteCustomer,getCustomerById};
