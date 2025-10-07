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

class BusinessRuleError extends Error {
    constructor(message) {
        super(message);
        this.name = 'BusinessRuleError';
    }
}

module.exports = { ValidationError, NotFoundError, DuplicateError, BusinessRuleError };