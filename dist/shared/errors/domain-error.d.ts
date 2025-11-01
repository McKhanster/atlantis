/**
 * Domain-specific error classes
 */
export declare class DomainError extends Error {
    readonly code: string;
    constructor(message: string, code: string);
}
export declare class ValidationError extends DomainError {
    constructor(message: string);
}
export declare class NotFoundError extends DomainError {
    constructor(message: string);
}
export declare class UnauthorizedError extends DomainError {
    constructor(message: string);
}
//# sourceMappingURL=domain-error.d.ts.map