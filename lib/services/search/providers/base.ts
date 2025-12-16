/**
 * Base search provider interface
 *
 * Defines the contract that all search providers must implement.
 * Enables unified search API with automatic fallback between providers.
 */

import logger from '@/lib/utils/logger';

/**
 * Search result from any provider
 */
export interface SearchResult {
  title: string;
  url: string;
  content: string;
  rawContent?: string;
}

/**
 * Search options
 */
export interface SearchOptions {
  maxResults?: number;
  searchDepth?: 'basic' | 'advanced';
}

/**
 * Search response
 */
export interface SearchResponse {
  results: SearchResult[];
  provider: string;
}

/**
 * Provider health check result
 */
export interface HealthCheckResult {
  healthy: boolean;
  message?: string;
}

/**
 * Abstract base class for search providers
 */
export abstract class BaseSearchProvider {
  protected readonly name: string;
  protected readonly priority: number;

  constructor(name: string, priority: number) {
    this.name = name;
    this.priority = priority;
  }

  /**
   * Get provider name
   */
  getName(): string {
    return this.name;
  }

  /**
   * Get provider priority (lower = higher priority)
   */
  getPriority(): number {
    return this.priority;
  }

  /**
   * Check if provider is available and healthy
   */
  abstract isAvailable(): Promise<HealthCheckResult>;

  /**
   * Perform search query
   *
   * @param query - Search query string
   * @param options - Search options
   * @returns Search results
   * @throws Error if search fails
   */
  abstract search(query: string, options?: SearchOptions): Promise<SearchResponse>;

  /**
   * Extract content from URL (if supported)
   *
   * @param url - URL to extract content from
   * @returns Extracted content
   * @throws Error if extraction not supported or fails
   */
  async extract(url: string): Promise<string> {
    throw new Error(`Content extraction not supported by ${this.name}`);
  }

  /**
   * Log search attempt
   */
  protected logSearch(query: string, options?: SearchOptions): void {
    logger.info(`Search attempt with ${this.name}`, {
      provider: this.name,
      query: query.slice(0, 100),
      maxResults: options?.maxResults,
      searchDepth: options?.searchDepth,
    });
  }

  /**
   * Log search success
   */
  protected logSuccess(resultCount: number, duration: number): void {
    logger.info(`Search successful with ${this.name}`, {
      provider: this.name,
      resultCount,
      durationMs: duration,
    });
  }

  /**
   * Log search failure
   */
  protected logFailure(error: Error): void {
    logger.error(`Search failed with ${this.name}`, error, {
      provider: this.name,
    });
  }

  /**
   * Format results with SOURCE tags for GPT
   */
  protected formatResults(results: SearchResult[]): string {
    if (!results || results.length === 0) {
      return 'No results found';
    }

    return results
      .map((r) => `[SOURCE: ${r.url}] ${r.title}: ${r.content}`)
      .join('\n');
  }
}
