const {ValidationError, NotFoundError, DuplicateError} = require('../errors/customErrors');
const productsRepository = require('../repositories/productsRepository');

class ProductService{
    validateProductData(name, description, price,is_active, isPartial = false){
        const errors = [];

        if (!isPartial || name !== undefined) {
            if (!name || typeof name !== 'string') {
                errors.push('El nombre es requerido y debe ser texto');
            } else if (name.trim().length < 2) {
                errors.push('El nombre debe tener mínimo 2 caracteres');
            } else if (name.trim().length > 100) {
                errors.push('El nombre no puede exceder 100 caracteres');
            }
        }

        if (description !== undefined && description !== null && description !== '') {
            if (typeof description !== 'string') {
                errors.push('La descripción debe ser texto');
            } else if (description.trim().length < 2) {
                errors.push('La descripción debe tener mínimo 2 caracteres');
            } else if (description.length > 5000) {
                errors.push('La descripción es demasiado larga (máximo 5000 caracteres)');
            }
        }

        if (!isPartial || price !== undefined) {
            if (price === undefined || price === null || price === '') {
                errors.push('El precio es requerido');
            } else {
                const numPrice = parseFloat(price);

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

        if (is_active !== undefined) {
            const validBooleanValues = [true, false, 'true', 'false', '1', '0', 1, 0];
            if (!validBooleanValues.includes(is_active) && 
                is_active !== null && 
                is_active !== '') {
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

    validateFilters(filters) {
        const errors = [];
        const { name, min_price, max_price, is_active } = filters;

        // Validar nombre si se proporciona
        if (name !== undefined && name !== null && name !== '') {
            if (typeof name !== 'string') {
                errors.push('El nombre debe ser texto');
            } else if (name.trim().length < 2) {
                errors.push('El nombre debe tener mínimo 2 caracteres para búsqueda');
            }
        }

        // Validar min_price
        if (min_price !== undefined && min_price !== null && min_price !== '') {
            const numMinPrice = parseFloat(min_price);
            if (isNaN(numMinPrice)) {
                errors.push('El precio mínimo debe ser un número válido');
            } else if (numMinPrice < 0) {
                errors.push('El precio mínimo no puede ser negativo');
            }
        }

        // Validar max_price
        if (max_price !== undefined && max_price !== null && max_price !== '') {
            const numMaxPrice = parseFloat(max_price);
            if (isNaN(numMaxPrice)) {
                errors.push('El precio máximo debe ser un número válido');
            } else if (numMaxPrice < 0) {
                errors.push('El precio máximo no puede ser negativo');
            }
        }

        // Validar rango de precios
        if (min_price !== undefined && max_price !== undefined && 
            min_price !== null && max_price !== null) {
            const numMin = parseFloat(min_price);
            const numMax = parseFloat(max_price);
            if (!isNaN(numMin) && !isNaN(numMax) && numMin > numMax) {
                errors.push('El precio mínimo no puede ser mayor que el precio máximo');
            }
        }

        // Validar is_active
        if (is_active !== undefined && is_active !== null && is_active !== '') {
            const validBooleanValues = [true, false, 'true', 'false', '1', '0', 1, 0];
            if (!validBooleanValues.includes(is_active)) {
                errors.push('is_active debe ser true o false');
            }
        }

        if (errors.length > 0) {
            throw new ValidationError(errors.join(', '));
        }
    };

    normalizeProductData(name,description,price,is_active) {
        const normalized = {};

        if (name !== undefined) {
            normalized.name = name.trim();
        }

        if (description !== undefined) {
            if (description === undefined || 
                description === null || 
                description === '' || 
                (typeof description === 'string' && description.trim() === '')) {
                normalized.description = null;
            } else {
                normalized.description = description.trim();
            }
        }

        if (price !== undefined) {
            const numPrice = parseFloat(price);
            normalized.price = Math.round(numPrice * 100) / 100;
        }
        if ( is_active !== undefined) {
            if (is_active === undefined || 
                is_active === null || 
                is_active === '') {
                normalized.is_active = false;
            } else if (typeof is_active === 'boolean') {
                normalized.is_active = is_active;
            } else if (is_active === 'true' || is_active === '1' || is_active === 1) {
                normalized.is_active = true;
            } else if (is_active === 'false' || is_active === '0' || is_active === 0) {
                normalized.is_active = false;
            } else {
                normalized.is_active = false; // Default si no se puede convertir
            }
        }

        return normalized;
    };
    async addProduct(productData){
        const { name, description, price, is_active } = productData;
        this.validateProductData(name,description,price,is_active,false);
        const normalizedData = this.normalizeProductData(name,description,price,is_active);
         const existingProduct = await productsRepository.findByName(normalizedData.name);
        if (existingProduct) {
            throw new DuplicateError(`Ya existe un producto con el nombre "${normalizedData.name}"`);
        }
        
        return await productsRepository.create(normalizedData);
    };

    async getAllProducts(limit = 100, offset = 0){
        const validLimit = Math.min(parseInt(limit) || 50, 100);
        const validOffset = parseInt(offset) || 0;
        return await productsRepository.getAll(validLimit,validOffset);
    };

    async getProductById(id){
        this.validateId(id);
        const product = await productsRepository.getById(id);
        if(!product){
            throw new NotFoundError('Producto no encontrado');
        }
        return product;
    };

     async findProductByName(name) {
        if (!name || typeof name !== 'string' || name.trim().length < 2) {
            throw new ValidationError('El nombre debe tener mínimo 2 caracteres');
        }
        
        const product = await productsRepository.findByName(name.trim());
        if (!product) {
            throw new NotFoundError(`No se encontró un producto con el nombre "${name}"`);
        }
        
        return product;
    };

    async searchProducts(filters) {
        this.validateFilters(filters);
        const normalizedFilters = this.normalizeFilters(filters);
        
        if (Object.keys(normalizedFilters).length === 0) {
            throw new ValidationError('Debe proporcionar al menos un filtro de búsqueda');
        }
        
        return await productsRepository.findByFilters(normalizedFilters);
    };

    async softDelete(id) {
        this.validateId(id);
        const result = await productsRepository.softDelete(id);
        if (!result) {
            throw new NotFoundError('Producto no encontrado');
        }
        return result;
    };

    async hardDelete(id){
        this.validateId(id);
        const result = await productsRepository.hardDelete(id);
        if (!result) {
            throw new NotFoundError('Producto no encontrado');
        }
        return result;
    };

    async updateProduct(id,productData){
         const { name, description, price, is_active = false } = productData;
        this.validateId(id);
        this.validateProductData(name,description,price,is_active,false);
        const normalizedData = this.normalizeProductData(name, description, price, is_active);
        const existingProduct = await productsRepository.getById(id);
        if (!existingProduct) {
            throw new NotFoundError('Producto no encontrado');
        }
        if (normalizedData.name && normalizedData.name !== existingProduct.name) {
            const duplicateProduct = await productsRepository.findByName(normalizedData.name);
            if (duplicateProduct) {
                throw new DuplicateError(`Ya existe un producto con el nombre "${normalizedData.name}"`);
            }
        }
        return await productsRepository.update(id, normalizedData);
    };

    async updateProductPartial(id, productData) {
        const { name, description, price, is_active } = productData;
        
        this.validateId(id);
        
        if (name === undefined && description === undefined && 
            price === undefined && is_active === undefined) {
            throw new ValidationError('Debe proporcionar al menos un campo para actualizar');
        }
        
        this.validateProductData(name, description, price, is_active, true);
        const normalizedData = this.normalizeProductData(name, description, price, is_active);

        const existingProduct = await productsRepository.getById(id);
        if (!existingProduct) {
            throw new NotFoundError('Producto no encontrado');
        }

        if (normalizedData.name && normalizedData.name !== existingProduct.name) {
            const duplicateProduct = await productsRepository.findByName(normalizedData.name);
            if (duplicateProduct) {
                throw new DuplicateError(`Ya existe un producto con el nombre "${normalizedData.name}"`);
            }
        }
        
        return await productsRepository.updatePartial(id, normalizedData);
    };

    async productExists(id) {
        this.validateId(id);
        return await productsRepository.exists(id);
    };

    async getTotalProducts() {
        return await productsRepository.count();
    };

}

module.exports = new ProductService();