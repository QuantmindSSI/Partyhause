// Custom error classes
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, code: string, statusCode: number = 500) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  public readonly fieldErrors: Record<string, string[]>;

  constructor(message: string, fieldErrors: Record<string, string[]> = {}) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
    this.fieldErrors = fieldErrors;
  }
}

export class NetworkError extends AppError {
  public readonly originalError?: Error;

  constructor(message: string, originalError?: Error) {
    super(message, 'NETWORK_ERROR', 0);
    this.name = 'NetworkError';
    this.originalError = originalError;
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTHENTICATION_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 'AUTHORIZATION_ERROR', 403);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

// Error handler utilities
export class ErrorHandler {
  static handle(error: unknown): AppError {
    // Handle Zod validation errors
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      const zodError = error as any;
      const fieldErrors: Record<string, string[]> = {};

      zodError.errors.forEach((err: any) => {
        const field = err.path.join('.');
        if (!fieldErrors[field]) {
          fieldErrors[field] = [];
        }
        fieldErrors[field].push(err.message);
      });

      return new ValidationError('Validation failed', fieldErrors);
    }

    // Anything carrying a `code` is treated as a database error. Reached via
    // PostgreSQL SQLSTATE codes surfaced through Prisma.
    if (error && typeof error === 'object' && 'code' in error) {
      return this.handlePostgresError(error as any);
    }

    // Handle network errors
    if (!navigator.onLine) {
      return new NetworkError('No internet connection available');
    }

    // Handle generic errors
    if (error instanceof Error) {
      return new AppError(error.message, 'UNKNOWN_ERROR');
    }

    return new AppError('An unexpected error occurred', 'UNKNOWN_ERROR');
  }

  /**
   * Maps a PostgreSQL SQLSTATE code to a typed application error.
   *
   * This used to also match `PGRST116` and `PGRST301`. Those are PostgREST
   * codes, emitted by an HTTP layer this system no longer has, never by
   * PostgreSQL itself. They are dropped rather than kept "just in case",
   * because an unreachable case in a dispatch table is a claim about the
   * system that is not true.
   *
   * The three that remain are raw SQLSTATE values and are still reachable:
   * Prisma surfaces them on constraint and permission failures.
   *
   * @param error An object carrying a `code`, and optionally a `message`.
   * @returns The most specific `AppError` subclass for that code, or a generic
   *   `DATABASE_ERROR` when the code is unrecognised. Never throws.
   */
  private static handlePostgresError(error: { code?: unknown; message?: unknown }): AppError {
    const code = error.code;
    const message = typeof error.message === 'string' && error.message
      ? error.message
      : 'Database operation failed';

    switch (code) {
      case '23505': // unique_violation
        return new ValidationError('A record with this information already exists');
      case '23503': // foreign_key_violation
        return new ValidationError('Referenced record does not exist');
      case '42501': // insufficient_privilege
        return new AuthorizationError('Permission denied');
      default:
        return new AppError(message, 'DATABASE_ERROR');
    }
  }

  static isOperationalError(error: Error): boolean {
    return error instanceof AppError && error.isOperational;
  }

  static logError(error: Error, context?: Record<string, any>): void {
    const errorInfo = {
      name: error.name,
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // In development, log to console
    if (import.meta.env.DEV) {
      console.error('Application Error:', errorInfo);
    }

    // In production, send to error reporting service
    if (import.meta.env.PROD) {
      // TODO: Send to error reporting service (e.g., Sentry)
      console.error('Production Error:', errorInfo);
    }
  }
}

// Async error boundary hook
export const useAsyncError = () => {
  const [, setError] = React.useState();

  return React.useCallback((error: Error) => {
    setError(() => {
      throw error;
    });
  }, []);
};

// React import for the hook
import React from 'react';
