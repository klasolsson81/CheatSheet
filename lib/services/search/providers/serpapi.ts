/**
 * SerpAPI search provider
 *
 * Google search results via SerpAPI.
 * Free tier: 250 searches/month (user already has account)
 * Reliable and well-established service.
 */

import { BaseSearchProvider, SearchOptions, SearchResponse, HealthCheckResult } from './base';

interface SerpApiOrganicResult {
  title: string;
  link: string;
  snippet: string;
  position?: number;
}

interface SerpApiResponse {
  organic_results?: SerpApiOrganicResult[];
  answer_box?: {
    answer?: string;
    snippet?: string;
  };
  error?: string;
}

export class SerpApiSearchProvider extends BaseSearchProvider {
  private apiKey: string;
  private baseUrl = 'https://serpapi.com/search';

  constructor(apiKey: string, priority: number = 4) {
    super('SerpAPI', priority);

    if (!apiKey) {
      throw new Error('SerpAPI key is required');
    }

    this.apiKey = apiKey;
  }

  /**
   * Check if SerpAPI is available
   */
  async isAvailable(): Promise<HealthCheckResult> {
    if (!process.env.SERPAPI_API_KEY) {
      return {
        healthy: false,
        message: 'SERPAPI_API_KEY not configured',
      };
    }

    // Simple health check using account endpoint
    try {
      const url = new URL('https://serpapi.com/account');
      url.searchParams.set('api_key', this.apiKey);

      const response = await fetch(url.toString());

      if (response.status === 401) {
        return {
          healthy: false,
          message: 'Invalid SerpAPI key',
        };
      }

      if (!response.ok) {
        return {
          healthy: false,
          message: `SerpAPI HTTP ${response.status}`,
        };
      }

      const data = await response.json();

      // Check if searches are available
      if (data.plan_searches_left !== undefined && data.plan_searches_left <= 0) {
        return {
          healthy: false,
          message: 'SerpAPI searches exhausted',
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
   * Search with SerpAPI
   */
  async search(query: string, options?: SearchOptions): Promise<SearchResponse> {
    const startTime = Date.now();
    this.logSearch(query, options);

    try {
      const url = new URL(this.baseUrl);
      url.searchParams.set('q', query);
      url.searchParams.set('api_key', this.apiKey);
      url.searchParams.set('engine', 'google');
      url.searchParams.set('num', String(options?.maxResults || 10));

      const response = await fetch(url.toString());

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`SerpAPI error (${response.status}): ${errorText}`);
      }

      const data: SerpApiResponse = await response.json();

      // Check for API errors
      if (data.error) {
        throw new Error(`SerpAPI error: ${data.error}`);
      }

      // Map SerpAPI results to our format
      const results = (data.organic_results || []).map((r) => ({
        title: r.title,
        url: r.link,
        content: r.snippet,
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
