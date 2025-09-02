import { describe, it, expect, vi } from 'vitest';
import {
  ApplicationError,
  handleError,
  withRetry,
  createErrorResponse
} from '@/lib/error-handler';
import { ZodError } from 'zod';

describe('ApplicationError', () => {
  it('should create an error with correct properties', () => {
    const error = new ApplicationError('VALIDATION_ERROR', 'Test message', {
      statusCode: 400,
      userMessage: 'User friendly message',
      retryable: false,
      details: { field: 'test' }
    });

    expect(error.type).toBe('VALIDATION_ERROR');
    expect(error.message).toBe('Test message');
    expect(error.statusCode).toBe(400);
    expect(error.userMessage).toBe('User friendly message');
    expect(error.retryable).toBe(false);
    expect(error.details).toEqual({ field: 'test' });
  });

  it('should use default values when options are not provided', () => {
    const error = new ApplicationError('AUTHENTICATION_ERROR', 'Auth failed');

    expect(error.statusCode).toBe(401);
    expect(error.userMessage).toBe('Please log in to continue.');
    expect(error.retryable).toBe(false);
  });

  it('should serialize to JSON correctly', () => {
    const error = new ApplicationError('RATE_LIMIT_ERROR', 'Too many requests', {
      details: { remaining: 0 }
    });

    const json = error.toJSON();

    expect(json).toEqual({
      type: 'RATE_LIMIT_ERROR',
      message: 'Too many requests',
      userMessage: 'Too many requests. Please wait a moment and try again.',
      statusCode: 429,
      retryable: true,
      details: { remaining: 0 }
    });
  });
});

describe('handleError', () => {
  it('should return ApplicationError unchanged', () => {
    const originalError = new ApplicationError('NOT_FOUND_ERROR', 'Not found');
    const result = handleError(originalError);

    expect(result).toBe(originalError);
  });

  it('should handle ZodError correctly', () => {
    const zodError = new ZodError([
      {
        code: 'invalid_type',
        expected: 'string',
        received: 'number',
        path: ['name'],
        message: 'Expected string, received number'
      }
    ]);

    const result = handleError(zodError);

    expect(result.type).toBe('VALIDATION_ERROR');
    expect(result.message).toBe('Validation failed');
    expect(result.details?.issues).toEqual(zodError.issues);
  });

  it('should detect network errors', () => {
    const networkError = new Error('ENOTFOUND example.com');
    const result = handleError(networkError);

    expect(result.type).toBe('NETWORK_ERROR');
    expect(result.originalError).toBe(networkError);
  });

  it('should detect authentication errors', () => {
    const authError = new Error('Unauthorized access');
    const result = handleError(authError);

    expect(result.type).toBe('AUTHENTICATION_ERROR');
    expect(result.originalError).toBe(authError);
  });

  it('should handle unknown errors', () => {
    const unknownError = 'String error';
    const result = handleError(unknownError);

    expect(result.type).toBe('UNKNOWN_ERROR');
    expect(result.message).toBe('An unknown error occurred');
  });
});

describe('withRetry', () => {
  it('should succeed on first attempt', async () => {
    const operation = vi.fn().mockResolvedValue('success');

    const result = await withRetry(operation, 3, 100);

    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('should retry on retryable errors', async () => {
    const operation = vi.fn()
      .mockRejectedValueOnce(new ApplicationError('NETWORK_ERROR', 'Network failed'))
      .mockResolvedValue('success');

    const result = await withRetry(operation, 3, 50);

    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('should not retry non-retryable errors', async () => {
    const error = new ApplicationError('VALIDATION_ERROR', 'Invalid input');
    const operation = vi.fn().mockRejectedValue(error);

    await expect(withRetry(operation, 3, 50)).rejects.toThrow(error);
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('should exhaust retries and throw last error', async () => {
    const error = new ApplicationError('NETWORK_ERROR', 'Network failed');
    const operation = vi.fn().mockRejectedValue(error);

    await expect(withRetry(operation, 2, 50)).rejects.toThrow(error);
    expect(operation).toHaveBeenCalledTimes(2);
  });
});

describe('createErrorResponse', () => {
  it('should create proper error response', () => {
    const error = new ApplicationError('VALIDATION_ERROR', 'Invalid data', {
      details: { field: 'email' },
      statusCode: 400
    });

    const response = createErrorResponse(error);

    expect(response.status).toBe(400);
    // Note: In a real test environment, you would parse the response body
    // This is a simplified test
  });
});
