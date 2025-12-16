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
   */
  async isAvailable(): Promise<HealthCheckResult> {
    if (!process.env.TAVILY_API_KEY) {
      return {
        healthy: false,
        message: 'TAVILY_API_KEY not configured',
      };
    }

    // Simple health check - try a minimal search
    try {
      await this.client.search('test', { maxResults: 1 });
      return { healthy: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Check for common error patterns
      if (errorMessage.includes('usage limit') || errorMessage.includes("plan's set usage")) {
        return {
          healthy: false,
          message: 'Tavily usage limit exceeded',
        };
      }

      if (errorMessage.includes('API key')) {
        return {
          healthy: false,
          message: 'Invalid Tavily API key',
        };
      }

      return {
        healthy: false,
        message: `Tavily error: ${errorMessage}`,
      };
    }
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
