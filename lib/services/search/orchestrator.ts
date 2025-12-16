/**
 * Search orchestrator with automatic fallback
 *
 * Manages multiple search providers with intelligent fallback logic.
 * Tracks provider health and usage statistics.
 * Automatically switches to backup providers when primary fails.
 */

import { BaseSearchProvider, SearchOptions, SearchResponse } from './providers/base';
import { TavilySearchProvider } from './providers/tavily';
import { SerperSearchProvider } from './providers/serper';
import { BraveSearchProvider } from './providers/brave';
import { SerpApiSearchProvider } from './providers/serpapi';
import logger from '@/lib/utils/logger';

/**
 * Provider usage statistics
 */
interface ProviderStats {
  name: string;
  searches: number;
  failures: number;
  lastUsed: number | null;
  lastError: string | null;
}

/**
 * Search orchestrator singleton
 */
class SearchOrchestrator {
  private providers: BaseSearchProvider[] = [];
  private stats: Map<string, ProviderStats> = new Map();
  private initialized = false;

  /**
   * Initialize all available providers
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    const providers: BaseSearchProvider[] = [];

    // 1. Tavily (Primary - best content extraction)
    if (process.env.TAVILY_API_KEY) {
      try {
        const tavily = new TavilySearchProvider(process.env.TAVILY_API_KEY, 1);
        providers.push(tavily);
        this.initStats(tavily.getName());
        logger.info('Tavily provider initialized', { priority: 1 });
      } catch (error) {
        logger.warn('Failed to initialize Tavily provider', { error });
      }
    }

    // 2. Serper (Fallback 1 - 2,500 free/month, Google results)
    if (process.env.SERPER_API_KEY) {
      try {
        const serper = new SerperSearchProvider(process.env.SERPER_API_KEY, 2);
        providers.push(serper);
        this.initStats(serper.getName());
        logger.info('Serper provider initialized', { priority: 2 });
      } catch (error) {
        logger.warn('Failed to initialize Serper provider', { error });
      }
    }

    // 3. Brave (Fallback 2 - 2,000 free/month, independent index)
    if (process.env.BRAVE_API_KEY) {
      try {
        const brave = new BraveSearchProvider(process.env.BRAVE_API_KEY, 3);
        providers.push(brave);
        this.initStats(brave.getName());
        logger.info('Brave provider initialized', { priority: 3 });
      } catch (error) {
        logger.warn('Failed to initialize Brave provider', { error });
      }
    }

    // 4. SerpAPI (Fallback 3 - 250 free/month, reliable)
    if (process.env.SERPAPI_API_KEY) {
      try {
        const serpapi = new SerpApiSearchProvider(process.env.SERPAPI_API_KEY, 4);
        providers.push(serpapi);
        this.initStats(serpapi.getName());
        logger.info('SerpAPI provider initialized', { priority: 4 });
      } catch (error) {
        logger.warn('Failed to initialize SerpAPI provider', { error });
      }
    }

    // Sort by priority (lower = higher priority)
    this.providers = providers.sort((a, b) => a.getPriority() - b.getPriority());

    if (this.providers.length === 0) {
      throw new Error('No search providers available. Please configure at least one API key.');
    }

    logger.info(`Search orchestrator initialized with ${this.providers.length} providers`, {
      providers: this.providers.map((p) => ({ name: p.getName(), priority: p.getPriority() })),
    });

    this.initialized = true;
  }

  /**
   * Initialize stats for provider
   */
  private initStats(name: string): void {
    this.stats.set(name, {
      name,
      searches: 0,
      failures: 0,
      lastUsed: null,
      lastError: null,
    });
  }

  /**
   * Update provider stats
   */
  private updateStats(name: string, success: boolean, error?: string): void {
    const stats = this.stats.get(name);
    if (!stats) return;

    stats.searches++;
    stats.lastUsed = Date.now();

    if (!success) {
      stats.failures++;
      stats.lastError = error || 'Unknown error';
    } else {
      stats.lastError = null;
    }
  }

  /**
   * Get provider statistics
   */
  getStats(): ProviderStats[] {
    return Array.from(this.stats.values());
  }

  /**
   * Search with automatic fallback
   *
   * Tries providers in priority order until one succeeds.
   * Logs detailed information about which provider was used.
   *
   * @param query - Search query
   * @param options - Search options
   * @returns Search response with results and provider name
   * @throws Error if all providers fail
   */
  async search(query: string, options?: SearchOptions): Promise<SearchResponse> {
    await this.initialize();

    const errors: Array<{ provider: string; error: string }> = [];

    for (const provider of this.providers) {
      try {
        // Check if provider is healthy before attempting search
        const health = await provider.isAvailable();

        if (!health.healthy) {
          const message = `${provider.getName()} unavailable: ${health.message}`;
          logger.warn(message);
          errors.push({ provider: provider.getName(), error: health.message || 'Unhealthy' });
          this.updateStats(provider.getName(), false, health.message);
          continue;
        }

        // Attempt search
        const result = await provider.search(query, options);

        // Update stats and log success
        this.updateStats(provider.getName(), true);
        logger.info(`Search completed successfully with ${provider.getName()}`, {
          provider: provider.getName(),
          resultCount: result.results.length,
          fallbacksAttempted: errors.length,
        });

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.warn(`${provider.getName()} search failed, trying next provider`, {
          provider: provider.getName(),
          error: errorMessage,
        });
        errors.push({ provider: provider.getName(), error: errorMessage });
        this.updateStats(provider.getName(), false, errorMessage);
      }
    }

    // All providers failed
    const failureMessage = `All search providers failed. Attempted: ${errors.map((e) => `${e.provider} (${e.error})`).join(', ')}`;
    logger.error('All search providers exhausted', undefined, {
      query: query.slice(0, 100),
      errors,
      providerCount: this.providers.length,
    });

    throw new Error(failureMessage);
  }

  /**
   * Extract content from URL (tries Tavily only as it's the only one that supports it)
   *
   * @param url - URL to extract content from
   * @returns Extracted content
   * @throws Error if extraction fails
   */
  async extract(url: string): Promise<string> {
    await this.initialize();

    // Find Tavily provider (only one with extraction support)
    const tavilyProvider = this.providers.find((p) => p.getName() === 'Tavily');

    if (!tavilyProvider) {
      throw new Error('Content extraction requires Tavily provider, which is not available');
    }

    try {
      const health = await tavilyProvider.isAvailable();

      if (!health.healthy) {
        throw new Error(`Tavily unavailable: ${health.message}`);
      }

      const content = await tavilyProvider.extract(url);
      this.updateStats(tavilyProvider.getName(), true);
      return content;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.updateStats(tavilyProvider.getName(), false, errorMessage);
      throw error;
    }
  }
}

// Singleton instance
const searchOrchestrator = new SearchOrchestrator();

export default searchOrchestrator;
