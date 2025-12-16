/**
 * Custom error classes for application-specific errors
 *
 * Provides structured error handling with error codes, user-friendly messages,
 * and detailed developer information for debugging.
 */

/**
 * Error codes for different error types
 */
export enum ErrorCode {
  // Input validation errors
  INVALID_URL = 'INVALID_URL',
  INVALID_INPUT = 'INVALID_INPUT',
  URL_TOO_LONG = 'URL_TOO_LONG',

  // API errors
  API_KEY_MISSING = 'API_KEY_MISSING',
  API_LIMIT_EXCEEDED = 'API_LIMIT_EXCEEDED',
  OPENAI_ERROR = 'OPENAI_ERROR',
  TAVILY_ERROR = 'TAVILY_ERROR',

  // Rate limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // Analysis errors
  ANALYSIS_FAILED = 'ANALYSIS_FAILED',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  NSFW_CONTENT = 'NSFW_CONTENT',

  // System errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Base application error class
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly userMessage: string;
  public readonly developerMessage: string;
  public readonly timestamp: string;
  public readonly context?: Record<string, unknown>;

  constructor(
    code: ErrorCode,
    userMessage: string,
    developerMessage: string,
    statusCode: number = 500,
    context?: Record<string, unknown>
  ) {
    super(developerMessage);
    this.name = 'AppError';
    this.code = code;
    this.userMessage = userMessage;
    this.developerMessage = developerMessage;
    this.statusCode = statusCode;
    this.timestamp = new Date().toISOString();
    this.context = context;

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert error to JSON for logging
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.developerMessage,
      userMessage: this.userMessage,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
      context: this.context,
      stack: this.stack,
    };
  }
}

/**
 * Validation error (400 Bad Request)
 */
export class ValidationError extends AppError {
  constructor(userMessage: string, developerMessage: string, context?: Record<string, unknown>) {
    super(ErrorCode.INVALID_INPUT, userMessage, developerMessage, 400, context);
    this.name = 'ValidationError';
  }
}

/**
 * Rate limit error (429 Too Many Requests)
 */
export class RateLimitError extends AppError {
  constructor(
    userMessage: string,
    retryAfter: number,
    developerMessage: string = 'Rate limit exceeded'
  ) {
    super(ErrorCode.RATE_LIMIT_EXCEEDED, userMessage, developerMessage, 429, { retryAfter });
    this.name = 'RateLimitError';
  }
}

/**
 * API error (502 Bad Gateway / 503 Service Unavailable)
 */
export class APIError extends AppError {
  constructor(
    service: 'OpenAI' | 'Tavily',
    userMessage: string,
    developerMessage: string,
    context?: Record<string, unknown>
  ) {
    const code = service === 'OpenAI' ? ErrorCode.OPENAI_ERROR : ErrorCode.TAVILY_ERROR;
    super(code, userMessage, developerMessage, 502, { service, ...context });
    this.name = 'APIError';
  }
}

/**
 * Analysis error (500 Internal Server Error)
 */
export class AnalysisError extends AppError {
  constructor(userMessage: string, developerMessage: string, context?: Record<string, unknown>) {
    super(ErrorCode.ANALYSIS_FAILED, userMessage, developerMessage, 500, context);
    this.name = 'AnalysisError';
  }
}

/**
 * Check if error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Get user-friendly message from any error
 */
export function getUserMessage(error: unknown, language: 'sv' | 'en' = 'en'): string {
  if (isAppError(error)) {
    return error.userMessage;
  }

  if (error instanceof Error) {
    return error.message;
  }

  // Fallback generic messages
  return language === 'sv'
    ? 'Ett oväntat fel inträffade. Försök igen senare.'
    : 'An unexpected error occurred. Please try again later.';
}
