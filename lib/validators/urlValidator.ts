/**
 * URL validation and sanitization utilities
 *
 * Provides security-focused validation and sanitization for URLs and text inputs.
 * Prevents XSS, prompt injection, and other input-based attacks.
 */

// Configuration constants
const MAX_URL_LENGTH = 500; // Maximum URL length to prevent abuse
const DEFAULT_TEXT_MAX_LENGTH = 200; // Default max length for text inputs

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
