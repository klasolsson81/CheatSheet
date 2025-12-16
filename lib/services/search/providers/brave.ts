/**
 * Brave Search API provider
 *
 * Independent search index with privacy focus.
 * Free tier: 2,000 searches/month
 * Good quality results from their own index.
 */

import { BaseSearchProvider, SearchOptions, SearchResponse, HealthCheckResult } from './base';

interface BraveWebResult {
  title: string;
  url: string;
  description: string;
  age?: string;
  language?: string;
}

interface BraveSearchResponse {
  web?: {
    results?: BraveWebResult[];
  };
}

export class BraveSearchProvider extends BaseSearchProvider {
  private apiKey: string;
  private baseUrl = 'https://api.search.brave.com/res/v1/web/search';

  constructor(apiKey: string, priority: number = 3) {
    super('Brave', priority);

    if (!apiKey) {
      throw new Error('Brave API key is required');
    }

    this.apiKey = apiKey;
  }

  /**
   * Check if Brave Search is available
   */
  async isAvailable(): Promise<HealthCheckResult> {
    if (!process.env.BRAVE_API_KEY) {
      return {
        healthy: false,
        message: 'BRAVE_API_KEY not configured',
      };
    }

    // Simple health check
    try {
      const url = new URL(this.baseUrl);
      url.searchParams.set('q', 'test');
      url.searchParams.set('count', '1');

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip',
          'X-Subscription-Token': this.apiKey,
        },
      });

      if (response.status === 401) {
        return {
          healthy: false,
          message: 'Invalid Brave API key',
        };
      }

      if (response.status === 429) {
        return {
          healthy: false,
          message: 'Brave rate limit exceeded',
        };
      }

      if (!response.ok) {
        return {
          healthy: false,
          message: `Brave HTTP ${response.status}`,
        };
      }

      return { healthy: true };
    } catch (error) {
      return {
        healthy: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Search with Brave
   */
  async search(query: string, options?: SearchOptions): Promise<SearchResponse> {
    const startTime = Date.now();
    this.logSearch(query, options);

    try {
      const url = new URL(this.baseUrl);
      url.searchParams.set('q', query);
      url.searchParams.set('count', String(options?.maxResults || 10));

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip',
          'X-Subscription-Token': this.apiKey,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Brave API error (${response.status}): ${errorText}`);
      }

      const data: BraveSearchResponse = await response.json();

      // Map Brave results to our format
      const results = (data.web?.results || []).map((r) => ({
        title: r.title,
        url: r.url,
        content: r.description,
      }));

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
}
