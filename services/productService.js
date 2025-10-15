const ProductRepository= require('../repositories/productsRepository');
const {ValidationError, NotFoundError, DuplicateError} = require('../errors/customErrors');

class ProductService{
    validateProductData(name, description, price, isPartial = false){
        const errors = [];

        if (!isPartial || data.name !== undefined) {
            if (!data.name || typeof data.name !== 'string') {
                errors.push('El nombre es requerido y debe ser texto');
            } else if (data.name.trim().length < 2) {
                errors.push('El nombre debe tener mínimo 2 caracteres');
            } else if (data.name.trim().length > 100) {
                errors.push('El nombre no puede exceder 100 caracteres');
            }
        }

        if (data.description !== undefined && data.description !== null && data.description !== '') {
            if (typeof data.description !== 'string') {
                errors.push('La descripción debe ser texto');
            } else if (data.description.trim().length < 2) {
                errors.push('La descripción debe tener mínimo 2 caracteres');
            } else if (data.description.length > 5000) {
                errors.push('La descripción es demasiado larga (máximo 5000 caracteres)');
            }
        }

        if (!isPartial || data.price !== undefined) {
            if (data.price === undefined || data.price === null || data.price === '') {
                errors.push('El precio es requerido');
            } else {
                const numPrice = parseFloat(data.price);

                if (isNaN(numPrice)) {
                    errors.push('El precio debe ser un número válido');
                } else if (!isFinite(numPrice)) {
                    errors.push('El precio debe ser un número finito');
                } else if (numPrice < 0) {
                    errors.push('El precio no puede ser negativo');
                } else if (numPrice > 99999999.99) {
                    errors.push('El precio excede el máximo permitido (99,999,999.99)');
                } else {
                    // Verificar dígitos enteros (máximo 8)
                    const integerPart = Math.floor(numPrice);
                    if (integerPart.toString().length > 8) {
                        errors.push('El precio tiene demasiados dígitos enteros (máximo 8)');
                    }
                }
            }
        }

        if (data.is_active !== undefined) {
            const validBooleanValues = [true, false, 'true', 'false', '1', '0', 1, 0];
            if (!validBooleanValues.includes(data.is_active) && 
                data.is_active !== null && 
                data.is_active !== '') {
                errors.push('is_active debe ser true o false');
            }
        }

        if (errors.length > 0) {
            throw new ValidationError(errors.join(', '));
        }
    };

    validateId(id){
        if (!id || isNaN(id) || parseInt(id) <= 0) {
            throw new ValidationError('ID inválido');
        }
    };

    normalizeProductData(data, isPartial = false) {
        const normalized = {};

        if (data.name !== undefined) {
            normalized.name = data.name.trim();
        }

        if (!isPartial || data.description !== undefined) {
            if (data.description === undefined || 
                data.description === null || 
                data.description === '' || 
                (typeof data.description === 'string' && data.description.trim() === '')) {
                normalized.description = null;
            } else {
                normalized.description = data.description.trim();
            }
        }

        if (data.price !== undefined) {
            const numPrice = parseFloat(data.price);
            normalized.price = Math.round(numPrice * 100) / 100;
        }
        if (!isPartial || data.is_active !== undefined) {
            if (data.is_active === undefined || 
                data.is_active === null || 
                data.is_active === '') {
                normalized.is_active = false;
            } else if (typeof data.is_active === 'boolean') {
                normalized.is_active = data.is_active;
            } else if (data.is_active === 'true' || data.is_active === '1' || data.is_active === 1) {
                normalized.is_active = true;
            } else if (data.is_active === 'false' || data.is_active === '0' || data.is_active === 0) {
                normalized.is_active = false;
            } else {
                normalized.is_active = false; // Default si no se puede convertir
            }
        }

        return normalized;
    }


    async addProduct(productData){
        this.validateProductData(productData, false);
        const normalizedData = this.normalizeProductData(productData,false);

         const existingProduct = await productsRepository.findByName(normalized.name);
        if (existingProduct) {
            throw new DuplicateError(`Ya existe un producto con el nombre "${normalized.name}"`);
        }
        
        return await productsRepository.create(normalizedData);
    }
}

module.exports = new ProductService();