import { ZodError } from 'zod';

export type ErrorType =
  | 'VALIDATION_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'AUTHORIZATION_ERROR'
  | 'NOT_FOUND_ERROR'
  | 'RATE_LIMIT_ERROR'
  | 'DATABASE_ERROR'
  | 'EXTERNAL_API_ERROR'
  | 'SCRAPING_ERROR'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

export interface AppError {
  type: ErrorType;
  message: string;
  originalError?: Error;
  statusCode?: number;
  details?: Record<string, any>;
  userMessage?: string;
  retryable?: boolean;
}

export class ApplicationError extends Error implements AppError {
  public readonly type: ErrorType;
  public readonly statusCode: number;
  public readonly userMessage: string;
  public readonly retryable: boolean;
  public readonly details?: Record<string, any>;
  public readonly originalError?: Error;

  constructor(
    type: ErrorType,
    message: string,
    options: {
      statusCode?: number;
      userMessage?: string;
      retryable?: boolean;
      details?: Record<string, any>;
      originalError?: Error;
    } = {}
  ) {
    super(message);
    this.name = 'ApplicationError';
    this.type = type;
    this.statusCode = options.statusCode || this.getDefaultStatusCode(type);
    this.userMessage = options.userMessage || this.getDefaultUserMessage(type);
    this.retryable = options.retryable ?? this.getDefaultRetryable(type);
    this.details = options.details;
    this.originalError = options.originalError;
  }

  private getDefaultStatusCode(type: ErrorType): number {
    switch (type) {
      case 'VALIDATION_ERROR':
        return 400;
      case 'AUTHENTICATION_ERROR':
        return 401;
      case 'AUTHORIZATION_ERROR':
        return 403;
      case 'NOT_FOUND_ERROR':
        return 404;
      case 'RATE_LIMIT_ERROR':
        return 429;
      case 'DATABASE_ERROR':
      case 'EXTERNAL_API_ERROR':
      case 'SCRAPING_ERROR':
        return 500;
      case 'NETWORK_ERROR':
        return 503;
      default:
        return 500;
    }
  }

  private getDefaultUserMessage(type: ErrorType): string {
    switch (type) {
      case 'VALIDATION_ERROR':
        return 'Please check your input and try again.';
      case 'AUTHENTICATION_ERROR':
        return 'Please log in to continue.';
      case 'AUTHORIZATION_ERROR':
        return 'You don\'t have permission to perform this action.';
      case 'NOT_FOUND_ERROR':
        return 'The requested resource was not found.';
      case 'RATE_LIMIT_ERROR':
        return 'Too many requests. Please wait a moment and try again.';
      case 'DATABASE_ERROR':
        return 'A database error occurred. Please try again later.';
      case 'EXTERNAL_API_ERROR':
        return 'External service is temporarily unavailable.';
      case 'SCRAPING_ERROR':
        return 'Failed to scrape the target website. Please check the URL and try again.';
      case 'NETWORK_ERROR':
        return 'Network connection failed. Please check your internet connection.';
      default:
        return 'An unexpected error occurred. Please try again later.';
    }
  }

  private getDefaultRetryable(type: ErrorType): boolean {
    switch (type) {
      case 'VALIDATION_ERROR':
      case 'AUTHENTICATION_ERROR':
      case 'AUTHORIZATION_ERROR':
      case 'NOT_FOUND_ERROR':
        return false;
      case 'RATE_LIMIT_ERROR':
      case 'DATABASE_ERROR':
      case 'EXTERNAL_API_ERROR':
      case 'SCRAPING_ERROR':
      case 'NETWORK_ERROR':
      case 'UNKNOWN_ERROR':
        return true;
      default:
        return false;
    }
  }

  toJSON() {
    return {
      type: this.type,
      message: this.message,
      userMessage: this.userMessage,
      statusCode: this.statusCode,
      retryable: this.retryable,
      details: this.details,
    };
  }
}

// Error handler functions
export function handleError(error: unknown): ApplicationError {
  // If it's already an ApplicationError, return it
  if (error instanceof ApplicationError) {
    return error;
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return new ApplicationError('VALIDATION_ERROR', 'Validation failed', {
      details: { issues: error.issues },
      userMessage: 'Please check your input and correct any errors.',
    });
  }

  // Handle standard errors
  if (error instanceof Error) {
    // Check for specific error patterns
    if (error.message.includes('ENOTFOUND') || error.message.includes('network')) {
      return new ApplicationError('NETWORK_ERROR', error.message, {
        originalError: error,
      });
    }

    if (error.message.includes('Unauthorized') || error.message.includes('401')) {
      return new ApplicationError('AUTHENTICATION_ERROR', error.message, {
        originalError: error,
      });
    }

    if (error.message.includes('Forbidden') || error.message.includes('403')) {
      return new ApplicationError('AUTHORIZATION_ERROR', error.message, {
        originalError: error,
      });
    }

    if (error.message.includes('Not Found') || error.message.includes('404')) {
      return new ApplicationError('NOT_FOUND_ERROR', error.message, {
        originalError: error,
      });
    }

    if (error.message.includes('Rate limit') || error.message.includes('429')) {
      return new ApplicationError('RATE_LIMIT_ERROR', error.message, {
        originalError: error,
      });
    }

    // Database errors
    if (error.message.includes('database') || error.message.includes('prisma')) {
      return new ApplicationError('DATABASE_ERROR', error.message, {
        originalError: error,
      });
    }

    return new ApplicationError('UNKNOWN_ERROR', error.message, {
      originalError: error,
    });
  }

  // Handle unknown error types
  return new ApplicationError('UNKNOWN_ERROR', 'An unknown error occurred', {
    details: { originalError: error },
  });
}

// Retry mechanism
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: ApplicationError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = handleError(error);

      // Don't retry if the error is not retryable
      if (!lastError.retryable || attempt === maxRetries) {
        throw lastError;
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }

  throw lastError!;
}

// API response wrapper
export function createErrorResponse(error: ApplicationError) {
  return Response.json(
    {
      error: {
        type: error.type,
        message: error.userMessage,
        details: error.details,
        retryable: error.retryable,
      },
    },
    { status: error.statusCode }
  );
}

// Client-side error reporting
export function reportError(error: ApplicationError, context?: Record<string, any>) {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Application Error:', {
      ...error.toJSON(),
      context,
      stack: error.stack,
    });
  }

  // In production, you would send this to your error tracking service
  // Example: Sentry, LogRocket, etc.
  // sentry.captureException(error, { extra: context });
}
