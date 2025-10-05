const addressesRepository = require('../repositories/addressesRepository');

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

class AddressesService {

}

module.exports = new AddressesService(), ValidationError, NotFoundError, DuplicateError;
