/**
 * URL validation and sanitization utilities
 *
 * Provides security-focused validation and sanitization for URLs and text inputs.
 * Prevents XSS, prompt injection, and other input-based attacks.
 */

import { promises as dns } from 'dns';
import https from 'https';
import http from 'http';

// Configuration constants
const MAX_URL_LENGTH = 500; // Maximum URL length to prevent abuse
const DEFAULT_TEXT_MAX_LENGTH = 200; // Default max length for text inputs
const DOMAIN_CHECK_TIMEOUT = 5000; // 5 second timeout for domain checks
const DOMAIN_CACHE_TTL = 300000; // 5 minutes cache for domain validation

/**
 * Domain validation cache
 */
interface DomainCacheEntry {
  result: DomainValidationResult;
  expiry: number;
}

const domainCache = new Map<string, DomainCacheEntry>();

/**
 * Sanitize URL input to prevent XSS and injection attacks
 *
 * @param input - Raw URL input from user
 * @returns Sanitized URL string
 * @throws Error if URL is invalid or contains dangerous patterns
 */
export function sanitizeUrl(input: string): string {
  // Remove any non-printable characters and excessive whitespace
  const cleaned = input.trim().replace(/[\x00-\x1F\x7F]/g, '');

  // Limit length to prevent abuse
  if (cleaned.length > MAX_URL_LENGTH) {
    throw new Error(`URL too long. Maximum length is ${MAX_URL_LENGTH} characters.`);
  }

  if (!cleaned) {
    throw new Error('URL cannot be empty.');
  }

  // Block dangerous patterns
  const dangerousPatterns = [
    /javascript:/i,
    /data:/i,
    /vbscript:/i,
    /file:/i,
    /about:/i,
    /<script/i,
    /on\w+=/i, // onclick, onerror, etc.
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(cleaned)) {
      throw new Error('Invalid URL format. Please provide a valid HTTP/HTTPS URL.');
    }
  }

  return cleaned;
}

/**
 * Normalize URL by adding https:// if missing
 *
 * @param url - URL to normalize
 * @returns Normalized URL with protocol
 * @throws Error if URL format is invalid
 */
export function normalizeUrl(url: string): string {
  // First sanitize the input
  const sanitized = sanitizeUrl(url);

  // Check if URL already has a protocol
  if (sanitized.match(/^https?:\/\//i)) {
    return sanitized;
  }

  // Add https:// prefix
  const normalized = `https://${sanitized}`;

  // Validate final URL format
  try {
    new URL(normalized);
    return normalized;
  } catch {
    throw new Error('Invalid URL format. Please provide a valid domain or URL.');
  }
}

/**
 * Sanitize text input to prevent prompt injection attacks
 *
 * Removes dangerous patterns that could manipulate AI prompts or break JSON.
 *
 * @param input - Raw text input from user
 * @param maxLength - Maximum allowed length (default: 200)
 * @returns Sanitized text string
 */
export function sanitizeTextInput(input: string, maxLength: number = DEFAULT_TEXT_MAX_LENGTH): string {
  if (!input) return '';

  // Remove non-printable characters
  let cleaned = input.trim().replace(/[\x00-\x1F\x7F]/g, '');

  // Limit length
  if (cleaned.length > maxLength) {
    cleaned = cleaned.slice(0, maxLength);
  }

  // Remove potential prompt injection patterns
  const dangerousPatterns = [
    /ignore\s+(previous|all)\s+instructions/i,
    /forget\s+everything/i,
    /system\s*:/i,
    /assistant\s*:/i,
    /<\|im_start\|>/i,
    /<\|im_end\|>/i,
    /```/g, // Remove code blocks
  ];

  for (const pattern of dangerousPatterns) {
    cleaned = cleaned.replace(pattern, '');
  }

  // Escape special characters that could break JSON or prompts
  cleaned = cleaned
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/["'`]/g, match => `\\${match}`); // Escape quotes

  return cleaned;
}

/**
 * Validate and sanitize advanced search parameters
 *
 * @param params - Advanced search parameters object
 * @returns Sanitized parameters object
 */
export function sanitizeAdvancedParams(params: {
  contactPerson?: string;
  department?: string;
  location?: string;
  jobTitle?: string;
  specificFocus?: string;
}) {
  return {
    contactPerson: sanitizeTextInput(params.contactPerson || '', 150),
    department: sanitizeTextInput(params.department || '', 100),
    location: sanitizeTextInput(params.location || '', 100),
    jobTitle: sanitizeTextInput(params.jobTitle || '', 100),
    specificFocus: sanitizeTextInput(params.specificFocus || '', 300),
  };
}

/**
 * Domain validation result
 */
export interface DomainValidationResult {
  exists: boolean;
  error?: string;
  suggestion?: string;
  details?: string;
}

/**
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy matching to suggest similar domains
 *
 * @param a - First string
 * @param b - Second string
 * @returns Edit distance between strings
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Extract hostname from URL
 *
 * @param url - Full URL
 * @returns Hostname without protocol
 */
function extractHostname(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    // If URL parsing fails, try to extract manually
    const match = url.match(/(?:https?:\/\/)?(?:www\.)?([^\/]+)/);
    return match ? match[1] : url;
  }
}

/**
 * Check if domain exists via DNS lookup
 *
 * @param hostname - Domain hostname to check
 * @returns true if DNS resolves, false otherwise
 */
async function checkDNS(hostname: string): Promise<boolean> {
  try {
    await Promise.race([
      dns.resolve(hostname),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('DNS timeout')), DOMAIN_CHECK_TIMEOUT)
      ),
    ]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if domain is accessible via HTTP/HTTPS HEAD request
 *
 * @param url - Full URL to check
 * @returns true if accessible, false otherwise
 */
async function checkHTTP(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const urlObj = new URL(url);
      const protocol = urlObj.protocol === 'https:' ? https : http;

      const req = protocol.request(
        url,
        {
          method: 'HEAD',
          timeout: DOMAIN_CHECK_TIMEOUT,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; DomainValidator/1.0)',
          },
        },
        (res) => {
          // Accept any response (even errors) as long as server responds
          resolve(res.statusCode !== undefined && res.statusCode < 500);
        }
      );

      req.on('error', () => resolve(false));
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });
      req.end();
    } catch {
      resolve(false);
    }
  });
}

/**
 * Find similar domain suggestions using fuzzy matching
 *
 * @param hostname - Invalid hostname
 * @returns Suggested similar hostname or undefined
 */
function findSimilarDomain(hostname: string): string | undefined {
  // Common Swedish company domains to check
  const commonDomains = [
    hostname.replace(/\d+/g, ''), // Remove numbers (klasolsson81.se → klasolsson.se)
    hostname.replace(/www\./g, ''),
    hostname.replace(/-/g, ''),
  ];

  // Check if removing numbers makes a valid-looking domain
  const withoutNumbers = hostname.replace(/\d+/g, '');
  if (withoutNumbers !== hostname && withoutNumbers.includes('.')) {
    return withoutNumbers;
  }

  return undefined;
}

/**
 * Validate that a domain exists and is accessible
 *
 * Performs DNS lookup and HTTP HEAD request to verify domain.
 * Provides fuzzy matching suggestions for common typos.
 * Results are cached for 5 minutes to avoid redundant checks.
 *
 * @param url - URL to validate
 * @param language - Language for error messages ('sv' or 'en')
 * @returns Validation result with exists flag, error message, and suggestions
 */
export async function validateDomainExists(
  url: string,
  language: 'sv' | 'en' = 'en'
): Promise<DomainValidationResult> {
  try {
    const hostname = extractHostname(url);
    const now = Date.now();

    // Check cache first
    const cached = domainCache.get(hostname);
    if (cached && cached.expiry > now) {
      console.log(`✅ Using cached domain validation for ${hostname}`);
      return cached.result;
    }

    // Step 1: DNS lookup
    const dnsExists = await checkDNS(hostname);

    if (!dnsExists) {
      // Try to find similar domain
      const suggestion = findSimilarDomain(hostname);

      const result: DomainValidationResult = suggestion
        ? {
            exists: false,
            error:
              language === 'sv'
                ? `Domänen "${hostname}" hittades inte. Menade du "${suggestion}"?`
                : `Domain "${hostname}" not found. Did you mean "${suggestion}"?`,
            suggestion,
            details: 'DNS_NOT_FOUND',
          }
        : {
            exists: false,
            error:
              language === 'sv'
                ? `Domänen "${hostname}" hittades inte. Kontrollera stavningen och försök igen.`
                : `Domain "${hostname}" not found. Please check the spelling and try again.`,
            details: 'DNS_NOT_FOUND',
          };

      // Cache the negative result
      domainCache.set(hostname, {
        result,
        expiry: now + DOMAIN_CACHE_TTL,
      });

      return result;
    }

    // Step 2: HTTP accessibility check
    const httpAccessible = await checkHTTP(url);

    if (!httpAccessible) {
      const result: DomainValidationResult = {
        exists: false,
        error:
          language === 'sv'
            ? `Webbplatsen "${hostname}" svarar inte. Den kan vara offline eller otillgänglig.`
            : `Website "${hostname}" is not responding. It may be offline or inaccessible.`,
        details: 'HTTP_NOT_ACCESSIBLE',
      };

      // Cache the negative result (shorter TTL for offline sites)
      domainCache.set(hostname, {
        result,
        expiry: now + 60000, // 1 minute for offline sites (might come back online)
      });

      return result;
    }

    // Domain exists and is accessible - cache the positive result
    const result: DomainValidationResult = { exists: true };
    domainCache.set(hostname, {
      result,
      expiry: now + DOMAIN_CACHE_TTL,
    });

    return result;
  } catch (error) {
    // Validation error - return generic message
    return {
      exists: false,
      error:
        language === 'sv'
          ? 'Kunde inte validera domänen. Försök igen.'
          : 'Unable to validate domain. Please try again.',
      details: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
    };
  }
}
