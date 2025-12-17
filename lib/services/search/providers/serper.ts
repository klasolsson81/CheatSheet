/**
 * Serper.dev search provider
 *
 * Google search results via Serper API.
 * Free tier: 2,500 searches/month
 * Fast and reliable with good quality results.
 */

import { BaseSearchProvider, SearchOptions, SearchResponse, HealthCheckResult } from './base';

interface SerperResult {
  title: string;
  link: string;
  snippet: string;
  position?: number;
}

interface SerperResponse {
  organic?: SerperResult[];
  answerBox?: {
    answer?: string;
    snippet?: string;
  };
}

export class SerperSearchProvider extends BaseSearchProvider {
  private apiKey: string;
  private baseUrl = 'https://google.serper.dev/search';

  constructor(apiKey: string, priority: number = 2) {
    super('Serper', priority);

    if (!apiKey) {
      throw new Error('Serper API key is required');
    }

    this.apiKey = apiKey;
  }

  /**
   * Check if Serper is available
   *
   * Note: This is a lightweight check that doesn't make API calls.
   * Actual availability is determined by trying the search request.
   * This saves API quota by avoiding unnecessary test searches.
   */
  async isAvailable(): Promise<HealthCheckResult> {
    if (!this.apiKey || !process.env.SERPER_API_KEY) {
      return {
        healthy: false,
        message: 'SERPER_API_KEY not configured',
      };
    }

    // Assume healthy if API key exists
    // Actual failures will be caught during search attempts
    return { healthy: true };
  }

  /**
   * Search with Serper
   */
  async search(query: string, options?: SearchOptions): Promise<SearchResponse> {
    const startTime = Date.now();
    this.logSearch(query, options);

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'X-API-KEY': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: query,
          num: options?.maxResults || 10,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Serper API error (${response.status}): ${errorText}`);
      }

      const data: SerperResponse = await response.json();

      // Map Serper results to our format
      const results = (data.organic || []).map((r) => ({
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
