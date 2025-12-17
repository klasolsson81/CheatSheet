/**
 * Structured logging utility
 *
 * Provides consistent, structured logging across the application
 * with different log levels and contextual information.
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
}

/**
 * Format log entry as JSON string
 *
 * Pretty-printed in development, single-line in production
 * for better compatibility with log aggregation tools.
 */
function formatLogEntry(entry: LogEntry): string {
  const isDevelopment = process.env.NODE_ENV === 'development';
  return isDevelopment ? JSON.stringify(entry, null, 2) : JSON.stringify(entry);
}

/**
 * Get emoji for log level
 */
function getLogEmoji(level: LogLevel): string {
  switch (level) {
    case LogLevel.DEBUG:
      return '🐛';
    case LogLevel.INFO:
      return 'ℹ️';
    case LogLevel.WARN:
      return '⚠️';
    case LogLevel.ERROR:
      return '❌';
    default:
      return '📝';
  }
}

/**
 * Log message with context
 */
function log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    context,
  };

  if (error) {
    entry.error = {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: (error as any).code,
    };
  }

  // In development, use pretty console output
  if (process.env.NODE_ENV === 'development') {
    const emoji = getLogEmoji(level);
    const prefix = `${emoji} [${level}]`;

    if (error) {
      console.error(prefix, message, context || '', error);
    } else if (level === LogLevel.ERROR) {
      console.error(prefix, message, context || '');
    } else if (level === LogLevel.WARN) {
      console.warn(prefix, message, context || '');
    } else {
      console.log(prefix, message, context || '');
    }
  } else {
    // In production, use structured JSON logging
    console.log(formatLogEntry(entry));
  }
}

/**
 * Logger class with convenience methods
 */
class Logger {
  debug(message: string, context?: LogContext): void {
    log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: LogContext): void {
    log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: LogContext): void {
    log(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    log(LogLevel.ERROR, message, context, error);
  }

  /**
   * Log analysis start
   */
  analysisStart(url: string, isSwedish: boolean, hasAdvanced: boolean): void {
    this.info('Analysis started', {
      url,
      isSwedish,
      hasAdvancedParams: hasAdvanced,
    });
  }

  /**
   * Log analysis complete
   */
  analysisComplete(url: string, duration: number, cached: boolean): void {
    this.info('Analysis completed', {
      url,
      durationMs: duration,
      cached,
    });
  }

  /**
   * Log cache hit
   */
  cacheHit(key: string, accessCount: number): void {
    this.info('Cache hit', {
      key: key.slice(0, 12),
      accessCount,
    });
  }

  /**
   * Log cache miss
   */
  cacheMiss(key: string): void {
    this.info('Cache miss', {
      key: key.slice(0, 12),
    });
  }

  /**
   * Log cache stats
   */
  cacheStats(hits: number, misses: number, hitRate: string, size: number): void {
    this.info('Cache statistics', {
      hits,
      misses,
      hitRate,
      size,
    });
  }

  /**
   * Log rate limit check
   */
  rateLimitCheck(ip: string, remaining: number, allowed: boolean): void {
    if (allowed) {
      this.info('Rate limit check passed', { ip, remaining });
    } else {
      this.warn('Rate limit exceeded', { ip });
    }
  }

  /**
   * Log API call
   */
  apiCall(service: string, operation: string, duration?: number): void {
    this.info('API call', {
      service,
      operation,
      durationMs: duration,
    });
  }
}

// Singleton instance
const logger = new Logger();

export default logger;
