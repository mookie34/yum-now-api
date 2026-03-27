const { ValidationError } = require('../errors/custom-errors');

const MAX_SANITIZED_LENGTH = 100;

function sanitizeForErrorMessage(input) {
    if (input === null || input === undefined) {
        return '';
    }

    const text = String(input);
    const sanitized = text
        .replace(/[<>"'&]/g, '')
        .trim();

    if (sanitized.length > MAX_SANITIZED_LENGTH) {
        return sanitized.substring(0, MAX_SANITIZED_LENGTH) + '...';
    }

    return sanitized;
}

const MAX_PAGINATION_LIMIT = 100;
const DEFAULT_LIMIT = 100;
const DEFAULT_OFFSET = 0;

function parsePagination(limit, offset) {
    const parsedLimit = parseInt(limit);
    const parsedOffset = parseInt(offset);

    if (limit !== undefined && limit !== null && limit !== '') {
        if (isNaN(parsedLimit) || parsedLimit <= 0) {
            throw new ValidationError('El límite debe ser un número positivo');
        }
    }

    if (offset !== undefined && offset !== null && offset !== '') {
        if (isNaN(parsedOffset) || parsedOffset < 0) {
            throw new ValidationError('El offset debe ser un número no negativo');
        }
    }

    const validLimit = Math.min(
        isNaN(parsedLimit) || parsedLimit <= 0 ? DEFAULT_LIMIT : parsedLimit,
        MAX_PAGINATION_LIMIT
    );

    const validOffset = isNaN(parsedOffset) || parsedOffset < 0
        ? DEFAULT_OFFSET
        : parsedOffset;

    return { limit: validLimit, offset: validOffset };
}

module.exports = { sanitizeForErrorMessage, parsePagination };
