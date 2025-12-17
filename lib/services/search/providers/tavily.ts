/**
 * Tavily search provider
 *
 * Primary search provider with excellent content extraction capabilities.
 * Best for deep research and content analysis.
 */

import { tavily } from '@tavily/core';
import { BaseSearchProvider, SearchOptions, SearchResponse, HealthCheckResult } from './base';

export class TavilySearchProvider extends BaseSearchProvider {
  private client: ReturnType<typeof tavily>;

  constructor(apiKey: string, priority: number = 1) {
    super('Tavily', priority);

    if (!apiKey) {
      throw new Error('Tavily API key is required');
    }

    this.client = tavily({ apiKey });
  }

  /**
   * Check if Tavily is available
   *
   * Note: This is a lightweight check that doesn't make API calls.
   * Actual availability is determined by trying the search request.
   * This saves API quota by avoiding unnecessary test searches.
   */
  async isAvailable(): Promise<HealthCheckResult> {
    if (!this.client || !process.env.TAVILY_API_KEY) {
      return {
        healthy: false,
        message: 'TAVILY_API_KEY not configured',
      };
    }

    // Assume healthy if client is initialized
    // Actual failures will be caught during search attempts
    return { healthy: true };
  }

  /**
   * Search with Tavily
   */
  async search(query: string, options?: SearchOptions): Promise<SearchResponse> {
    const startTime = Date.now();
    this.logSearch(query, options);

    try {
      const response = await this.client.search(query, {
        maxResults: options?.maxResults || 5,
        searchDepth: options?.searchDepth || 'advanced',
      });

      const results = response.results?.map((r: any) => ({
        title: r.title || '',
        url: r.url || '',
        content: r.content || '',
        rawContent: r.rawContent,
      })) || [];

      const duration = Date.now() - startTime;
      this.logSuccess(results.length, duration);

      return {
        results,
        provider: this.name,
      };
    } catch (error) {
      this.logFailure(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Extract website content with Tavily
   */
  async extract(url: string): Promise<string> {
    const startTime = Date.now();

    try {
      const extractResult = await this.client.extract([url]);
      const rawContent = extractResult.results?.[0]?.rawContent || '';

      const duration = Date.now() - startTime;
      this.logSuccess(rawContent.length > 0 ? 1 : 0, duration);

      return rawContent;
    } catch (error) {
      this.logFailure(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }
}
