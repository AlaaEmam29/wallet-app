import { Request, Response, NextFunction } from 'express';
import { MongoError } from 'mongodb';
import { ZodError } from 'zod';

/**
 * Interface for RFC 7807 Problem Details
 */
export interface ProblemDetails {
    type: string; // A URI identifier for the problem type
    title: string; // A short, human-readable summary of the problem type
    status: number; // The HTTP status code
    detail: string; // A human-readable explanation specific to this occurrence
    instance?: string; // A URI reference that identifies the specific occurrence of the problem
    validationErrors?: { [key: string]: string }; // Optional validation errors
}

/**
 * Operational Error class that fully encapsulates RFC 7807 Problem Details
 * This eliminates the need for any if/else or switch/case in the middleware
 */
export class OperationalError extends Error implements ProblemDetails {
    readonly type: string;
    readonly title: string;
    readonly status: number;
    readonly detail: string;
    readonly instance?: string;
    readonly validationErrors?: { [key: string]: string };
    readonly isOperational: boolean = true;

    constructor(
        detail: string,
        status: number = 500,
        title: string = 'Internal Server Error',
        errorType: string = 'internal-error',
        instance?: string,
        validationErrors?: { [key: string]: string }
    ) {
        super(detail);
        this.name = this.constructor.name;
        this.detail = detail;
        this.status = status;
        this.title = title;
        this.type = `https://httpstatus.in/${status}`;
        this.instance = instance;
        this.validationErrors = validationErrors;

        // Capture stack trace
        Error.captureStackTrace(this, this.constructor);
    }

    /**
     * Converts ZodError to OperationalError with validation errors
     */
    static fromZodError(error: ZodError, instance?: string): OperationalError {
        const validationErrors: { [key: string]: string } = {};

        error.errors.forEach((err) => {
            const key = err.path.join('.');
            validationErrors[key] = err.message;
        });

        return new OperationalError(
            'Invalid input data provided.',
            400,
            'Validation Failed',
            'validation-error',
            instance,
            validationErrors
        );
    }

    /**
     * Converts MongoError to OperationalError
     */
    static fromMongoError(error: MongoError, instance?: string): OperationalError {
        if (error.code === 11000) {
            return new OperationalError(
                'A resource with the provided unique identifier already exists.',
                409,
                'Resource Already Exists',
                'resource-conflict',
                instance
            );
        }

        return new OperationalError(
            'A database error occurred.',
            500,
            'Database Error',
            'database-error',
            instance
        );
    }

    /**
     * Converts JWT errors to OperationalError
     */
    static fromJwtError(error?: Error, instance?: string): OperationalError {
        return new OperationalError(
            'Invalid or expired authentication token.',
            401,
            'Authentication Failed',
            'authentication-error',
            instance
        );
    }

    /**
     * Creates a NotFound error
     */
    static notFound(resource: string, instance?: string): OperationalError {
        return new OperationalError(
            `${resource} not found.`,
            404,
            `${resource} Not Found`,
            'not-found',
            instance
        );
    }

    /**
     * Creates a BadRequest error
     */
    static badRequest(
        detail: string,
        instance?: string,
        validationErrors?: { [key: string]: string }
    ): OperationalError {
        return new OperationalError(
            detail,
            400,
            'Bad Request',
            'bad-request',
            instance,
            validationErrors
        );
    }

    /**
     * Creates a Conflict error
     */
    static conflict(detail: string, instance?: string): OperationalError {
        return new OperationalError(
            detail,
            409,
            'Resource Already Exists',
            'resource-conflict',
            instance
        );
    }

    /**
     * Creates an Unauthorized error
     */
    static unauthorized(
        detail: string = 'Invalid or expired authentication token.',
        instance?: string
    ): OperationalError {
        return new OperationalError(
            detail,
            401,
            'Authentication Failed',
            'authentication-error',
            instance
        );
    }

    /**
     * Creates a Forbidden error
     */
    static forbidden(detail: string = 'Access denied.', instance?: string): OperationalError {
        return new OperationalError(detail, 403, 'Access Denied', 'forbidden', instance);
    }

    /**
     * Creates an InternalServerError
     */
    static internal(
        detail: string = 'An unexpected error occurred.',
        instance?: string
    ): OperationalError {
        return new OperationalError(
            detail,
            500,
            'Internal Server Error',
            'internal-error',
            instance
        );
    }

    /**
     * Creates a ValidationError
     */
    static validation(
        validationErrors: { [key: string]: string },
        instance?: string
    ): OperationalError {
        return new OperationalError(
            'Invalid input data provided.',
            400,
            'Validation Failed',
            'validation-error',
            instance,
            validationErrors
        );
    }

    /**
     * Creates an InsufficientFunds error
     */
    static insufficientFunds(instance?: string): OperationalError {
        return new OperationalError(
            'Insufficient funds.',
            400,
            'Insufficient Funds',
            'insufficient-funds',
            instance
        );
    }
}

/**
 * Simplified error handling middleware with no if/else or switch/case logic
 * All error handling logic is encapsulated in the OperationalError class
 */
export const errorMiddleware = (
    err: any,
    req: Request,
    res: Response,
    next?: NextFunction
): void => {
    let error: OperationalError;

    try {
        // Convert various error types to OperationalError
        if (err instanceof OperationalError) {
            // Already an OperationalError, use as is
            error = err;
        } else if (err instanceof ZodError) {
            error = OperationalError.fromZodError(err, req.originalUrl);
        } else if (
            err instanceof MongoError ||
            err.name === 'MongoError' ||
            err.name === 'MongoServerError'
        ) {
            error = OperationalError.fromMongoError(err, req.originalUrl);
        } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
            error = OperationalError.fromJwtError(err, req.originalUrl);
        } else {
            // For any other error, create a generic internal server error
            error = OperationalError.internal(
                err.message || 'An unexpected error occurred.',
                req.originalUrl
            );
        }
    } catch (conversionError) {
        // If error conversion fails, use a fallback error
        error = OperationalError.internal(
            'An unexpected error occurred during error handling.',
            req.originalUrl
        );
    }

    // Send the Problem Details JSON response
    // Since OperationalError implements ProblemDetails, we can send it directly
    res.status(error.status).header('Content-Type', 'application/problem+json').json(error);
};
