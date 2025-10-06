const addressesService = require('../services/addressesService');
const { ValidationError, NotFoundError, DuplicateError } = require('../errors/customErrors');



const addAddress = async (req, res) => {
    try{
        const newAddress  = await addressesService.addAddress(req.body);
        res.status(201).json({
            message: 'Dirección creada exitosamente',
            address: newAddress 
        });
    }
    catch (error) {      
        if (error instanceof ValidationError) {
            return res.status(400).json({ error: error.message });
        } else if (error instanceof NotFoundError) {
            return res.status(404).json({ error: error.message });
        } else if (error instanceof DuplicateError) {
            return res.status(400).json({ error: error.message });
        }
        console.error('Error al crear la dirección:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const getAddresses = async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : 100;
        const addresses = await addressesService.getAllAddresses(limit);
        res.json(addresses);
    } catch (error) {
        if (error instanceof ValidationError) {
            return res.status(400).json({ error: error.message });
        }
        console.error('Error al obtener las direcciones:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const getAddressesByCustomerId = async (req, res) => {
  try{
    const customer_id = parseInt(req.params.customer_id);
    const addresses = await addressesService.getAddressesByCustomerId(customer_id);
    res.json(addresses);
  }
    catch (error) {
        if (error instanceof ValidationError) {
            return res.status(400).json({ error: error.message });
        }
        if (error instanceof NotFoundError) {
            return res.status(404).json({ error: error.message });
        }
        console.error('Error al obtener las direcciones del cliente:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const getPrimaryAddressByCustomerId = async (req, res) => {
    try{
        const customer_id = parseInt(req.params.customer_id);
        const address = await addressesService.getPrimaryAddressByCustomerId(customer_id);
        res.json(address);
    }
    catch (error) {
        if (error instanceof ValidationError) {
            return res.status(400).json({ error: error.message });
        }
        if (error instanceof NotFoundError) {
            return res.status(404).json({ error: error.message });
        }
        console.error('Error al obtener la dirección primaria del cliente:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const deleteAddress = async (req, res) => {
   try{
        const id = parseInt(req.params.id);
        const deletedAddress = await addressesService.deleteAddressById(id);
        res.json({
            message: 'Dirección eliminada exitosamente',
            address: deletedAddress
        });
   }
    catch (error) {
        if (error instanceof ValidationError) {
            return res.status(400).json({ error: error.message });
        }
        if (error instanceof NotFoundError) {
            return res.status(404).json({ error: error.message });
        }
        console.error('Error al eliminar la dirección:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const updateAddressPartial = async (req, res) => {
    try{
        const id = parseInt(req.params.id);
        const updatedAddress = await addressesService.updateAddressPartial(id, req.body);
        res.json({
            message: 'Dirección actualizada exitosamente',
            address: updatedAddress
        });
    }
    catch (error) {
        if (error instanceof ValidationError) {
            return res.status(400).json({ error: error.message });
        }
        if (error instanceof NotFoundError) {
            return res.status(404).json({ error: error.message });
        }
        console.error('Error al actualizar la dirección:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const updateAddress = async (req, res) => {
    try{
        const id = parseInt(req.params.id);
        const updatedAddress = await addressesService.updateAddress(id, req.body);
        res.json({
            message: 'Dirección actualizada exitosamente',
            address: updatedAddress

        });
    }
    catch (error) {
        if (error instanceof ValidationError) {
            return res.status(400).json({ error: error.message });
        }
        if (error instanceof NotFoundError) {
            return res.status(404).json({ error: error.message });
        }
        console.error('Error al actualizar la dirección:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const getAddressById = async (req, res) => {
    try{
        const id = parseInt(req.params.id);
        const address = await addressesService.getAddressById(id);
        res.json(address);
    }
    catch (error) {
        if (error instanceof ValidationError) {
            return res.status(400).json({ error: error.message });
        }
        if (error instanceof NotFoundError) {
            return res.status(404).json({ error: error.message });
        }
        console.error('Error al obtener la dirección:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};


module.exports = {
    addAddress,
    getAddresses,
    getAddressesByCustomerId,
    getPrimaryAddressByCustomerId,
    deleteAddress,
    updateAddressPartial,
    updateAddress,
    getAddressById
};