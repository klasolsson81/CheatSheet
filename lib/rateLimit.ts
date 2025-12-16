/**
 * Simple in-memory rate limiter for API endpoints
 *
 * Limits requests per IP address to prevent abuse.
 *
 * Configuration:
 * - 10 requests per 5 minutes per IP (default)
 * - Configurable via environment variables
 *
 * NOTE: This is an in-memory solution suitable for single-instance deployments.
 * For production with multiple instances, consider Redis-based rate limiting.
 */

import { RATE_LIMIT_CONFIG } from '@/lib/config/constants';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limit tracking
const rateLimitStore = new Map<string, RateLimitEntry>();

// Configuration
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '300000'); // 5 minutes default
const RATE_LIMIT_MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '10'); // 10 requests default

/**
 * Clean up expired entries every 10 minutes to prevent memory leaks
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 600000); // 10 minutes

/**
 * Check if a request from the given identifier (IP) should be rate limited
 *
 * @param identifier - Unique identifier (typically IP address)
 * @returns Object with allowed status and metadata
 */
export function checkRateLimit(identifier: string): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
} {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // No entry exists or window expired - allow request
  if (!entry || entry.resetTime < now) {
    const newResetTime = now + RATE_LIMIT_WINDOW_MS;
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: newResetTime,
    });

    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX_REQUESTS - 1,
      resetTime: newResetTime,
    };
  }

  // Check if limit exceeded
  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfter: Math.ceil((entry.resetTime - now) / RATE_LIMIT_CONFIG.MS_TO_SECONDS), // seconds
    };
  }

  // Increment count and allow request
  entry.count++;
  rateLimitStore.set(identifier, entry);

  return {
    allowed: true,
    remaining: RATE_LIMIT_MAX_REQUESTS - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Get client IP address from request headers
 * Handles various proxy headers (Vercel, Cloudflare, etc.)
 *
 * @param headers - Request headers
 * @returns Client IP address or 'unknown'
 */
export function getClientIP(headers: Headers): string {
  // Check Vercel's forwarded IP
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim();
  }

  // Check Cloudflare's connecting IP
  const cfConnectingIP = headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Check other common headers
  const realIP = headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  // Fallback
  return 'unknown';
}

/**
 * Format rate limit error message for user
 *
 * @param retryAfter - Seconds until rate limit resets
 * @param language - Language for error message ('sv' or 'en')
 * @returns User-friendly error message
 */
export function getRateLimitErrorMessage(retryAfter: number, language: 'sv' | 'en' = 'en'): string {
  const minutes = Math.ceil(retryAfter / 60);

  if (language === 'sv') {
    return `För många förfrågningar. Vänligen vänta ${minutes} minut${minutes > 1 ? 'er' : ''} innan du försöker igen.`;
  }

  return `Too many requests. Please wait ${minutes} minute${minutes > 1 ? 's' : ''} before trying again.`;
}
