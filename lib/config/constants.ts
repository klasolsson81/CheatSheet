/**
 * Application Constants
 *
 * Centralized configuration values extracted from magic numbers throughout the codebase.
 * Each constant includes documentation explaining its purpose and reasoning.
 */

// =============================================================================
// SEARCH PROVIDER CONFIGURATION
// =============================================================================

/**
 * Available search providers with fallback order
 */
export const SEARCH_PROVIDERS = {
  /** Tavily - Primary provider with excellent content extraction */
  TAVILY: 'Tavily',

  /** Serper.dev - 2,500 free searches/month, Google results */
  SERPER: 'Serper',

  /** Brave Search - 2,000 free searches/month, independent index */
  BRAVE: 'Brave',

  /** SerpAPI - 250 free searches/month, reliable */
  SERPAPI: 'SerpAPI',
} as const;

/**
 * Provider priorities (lower = higher priority)
 * Used for automatic fallback ordering
 */
export const PROVIDER_PRIORITIES = {
  [SEARCH_PROVIDERS.TAVILY]: 1,
  [SEARCH_PROVIDERS.SERPER]: 2,
  [SEARCH_PROVIDERS.BRAVE]: 3,
  [SEARCH_PROVIDERS.SERPAPI]: 4,
} as const;

/**
 * Free tier limits for each provider (searches per month)
 */
export const PROVIDER_FREE_LIMITS = {
  [SEARCH_PROVIDERS.TAVILY]: 1000, // Varies by plan
  [SEARCH_PROVIDERS.SERPER]: 2500,
  [SEARCH_PROVIDERS.BRAVE]: 2000,
  [SEARCH_PROVIDERS.SERPAPI]: 250,
} as const;

// =============================================================================
// GPT CONFIGURATION
// =============================================================================

/**
 * GPT model temperature (0.0 = deterministic, 1.0 = creative)
 * 0.7 balances creativity with consistency for sales intelligence
 */
export const GPT_TEMPERATURE = 0.7;

/**
 * Maximum character limits for research data fed to GPT
 * These limits prevent token overflow while preserving key insights
 */
export const GPT_RESEARCH_LIMITS = {
  /** Website content character limit (3000 chars ≈ 750 tokens) */
  WEBSITE_CONTENT: 3000,

  /** Leadership/key people data limit (2000 chars ≈ 500 tokens) */
  LEADERSHIP: 2000,

  /** Social media activity limit (2000 chars ≈ 500 tokens) */
  SOCIAL_MEDIA: 2000,

  /** News and press releases limit (2500 chars ≈ 625 tokens) */
  NEWS: 2500,

  /** Financial data limit (4000 chars ≈ 1000 tokens) - larger for detailed financials */
  FINANCIALS: 4000,

  /** Growth signals limit (1500 chars ≈ 375 tokens) */
  GROWTH_SIGNALS: 1500,

  /** GPT response preview for logging (first 500 chars) */
  RESPONSE_PREVIEW: 500,
} as const;

/**
 * Swedish company data extraction limit
 * Limits Allabolag search results to prevent excessive data
 */
export const SWEDISH_DATA_CONTENT_LIMIT = 3000;

// =============================================================================
// ICE BREAKER CONFIGURATION
// =============================================================================

/**
 * Number of ice breaker options to generate
 */
export const ICE_BREAKER_CONFIG = {
  /** Minimum number of ice breakers (always generate at least 1) */
  MIN_COUNT: 1,

  /** Target number of ice breakers (2-3 different approaches) */
  TARGET_COUNT: 2,

  /** Maximum number of ice breakers */
  MAX_COUNT: 3,

  /** Minimum word count per ice breaker */
  MIN_WORDS: 15,

  /** Maximum word count per ice breaker (concise, punchy openers) */
  MAX_WORDS: 20,

  /** Maximum recency in weeks for social media posts (prefer 2-4 weeks) */
  MAX_RECENCY_WEEKS: 4,

  /** Acceptable recency for personal insights (up to 6 weeks if authentic) */
  EXTENDED_RECENCY_WEEKS: 6,
} as const;

// =============================================================================
// SALES INTELLIGENCE CONFIGURATION
// =============================================================================

/**
 * Word count limits for generated content sections
 */
export const CONTENT_LIMITS = {
  /** Summary section: 1-2 sentences */
  SUMMARY_MIN_SENTENCES: 1,
  SUMMARY_MAX_SENTENCES: 2,

  /** Pain points: 3 bullet points */
  PAIN_POINTS_COUNT: 3,
  PAIN_POINTS_MIN_WORDS: 5,
  PAIN_POINTS_MAX_WORDS: 10,

  /** Sales hooks: 2 bullet points */
  SALES_HOOKS_COUNT: 2,
  SALES_HOOKS_MIN_WORDS: 8,
  SALES_HOOKS_MAX_WORDS: 12,

  /** Financial signals: 1-2 sentences */
  FINANCIAL_SIGNALS_MIN_SENTENCES: 1,
  FINANCIAL_SIGNALS_MAX_SENTENCES: 2,

  /** Company tone: 2-4 words */
  COMPANY_TONE_MIN_WORDS: 2,
  COMPANY_TONE_MAX_WORDS: 4,
} as const;

// =============================================================================
// SEARCH CONFIGURATION
// =============================================================================

/**
 * Maximum results for each Tavily search stream
 * Balance between data quality and API quota/performance
 */
export const SEARCH_LIMITS = {
  /** Leadership & key people search results */
  LEADERSHIP: 4,

  /** Social media activity results (recent LinkedIn posts) */
  SOCIAL_MEDIA: 5,

  /** News and press releases */
  NEWS: 5,

  /** Financial results - general companies */
  FINANCIALS_GENERAL: 2,

  /** Financial results - Swedish companies (includes Allabolag) */
  FINANCIALS_SWEDISH: 3,

  /** Growth signals (hiring, funding, expansion) */
  GROWTH_SIGNALS: 4,
} as const;

/**
 * Current month threshold for date filtering
 * Determines which months to include in "current" searches
 */
export const CURRENT_MONTH_THRESHOLD = 6;

// =============================================================================
// CACHE CONFIGURATION
// =============================================================================

/**
 * Cache settings for analysis results
 */
export const CACHE_CONFIG = {
  /** Default maximum cache entries (LRU eviction) */
  DEFAULT_MAX_SIZE: 100,

  /** Default TTL in milliseconds (1 hour) */
  DEFAULT_TTL_MS: 60 * 60 * 1000,

  /** Cache cleanup interval in milliseconds (5 minutes) */
  CLEANUP_INTERVAL_MS: 5 * 60 * 1000,

  /** Cache key preview length for logging */
  KEY_PREVIEW_LENGTH: 12,

  /** Decimal places for hit rate percentage */
  HIT_RATE_DECIMALS: 2,

  /** Default hit rate string when no requests */
  DEFAULT_HIT_RATE: '0.00',
} as const;

// =============================================================================
// VALIDATION CONFIGURATION
// =============================================================================

/**
 * Input validation limits
 */
export const VALIDATION_LIMITS = {
  /** Maximum URL length to prevent abuse */
  MAX_URL_LENGTH: 500,

  /** Maximum length for text input fields (department, location, jobTitle) */
  MAX_TEXT_FIELD_LENGTH: 100,

  /** Maximum length for specific focus field */
  MAX_SPECIFIC_FOCUS_LENGTH: 300,

  /** Maximum summary length in response */
  MAX_SUMMARY_LENGTH: 1000,

  /** Maximum financial signals length */
  MAX_FINANCIAL_SIGNALS_LENGTH: 1000,

  /** Maximum company tone length */
  MAX_COMPANY_TONE_LENGTH: 100,
} as const;

// =============================================================================
// RATE LIMITING CONFIGURATION
// =============================================================================

/**
 * Rate limiting constants
 */
export const RATE_LIMIT_CONFIG = {
  /** Milliseconds to seconds conversion factor */
  MS_TO_SECONDS: 1000,

  /** Default retry-after time in seconds when limit exceeded */
  DEFAULT_RETRY_AFTER_SECONDS: 300,
} as const;

// =============================================================================
// HTTP STATUS CODES
// =============================================================================

/**
 * HTTP status codes used in custom error classes
 */
export const HTTP_STATUS = {
  /** Bad Request - validation errors */
  BAD_REQUEST: 400,

  /** Too Many Requests - rate limiting */
  TOO_MANY_REQUESTS: 429,

  /** Internal Server Error - analysis errors */
  INTERNAL_SERVER_ERROR: 500,

  /** Bad Gateway - external API errors */
  BAD_GATEWAY: 502,
} as const;

// =============================================================================
// LOGGING CONFIGURATION
// =============================================================================

/**
 * Logging and debugging constants
 */
export const LOGGING_CONFIG = {
  /** Number of spaces for JSON.stringify indentation */
  JSON_INDENT_SPACES: 2,
} as const;
