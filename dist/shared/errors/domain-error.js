"use strict";
/**
 * Domain-specific error classes
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnauthorizedError = exports.NotFoundError = exports.ValidationError = exports.DomainError = void 0;
class DomainError extends Error {
    code;
    constructor(message, code) {
        super(message);
        this.code = code;
        this.name = 'DomainError';
    }
}
exports.DomainError = DomainError;
class ValidationError extends DomainError {
    constructor(message) {
        super(message, 'VALIDATION_ERROR');
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
class NotFoundError extends DomainError {
    constructor(message) {
        super(message, 'NOT_FOUND');
        this.name = 'NotFoundError';
    }
}
exports.NotFoundError = NotFoundError;
class UnauthorizedError extends DomainError {
    constructor(message) {
        super(message, 'UNAUTHORIZED');
        this.name = 'UnauthorizedError';
    }
}
exports.UnauthorizedError = UnauthorizedError;
//# sourceMappingURL=domain-error.js.map