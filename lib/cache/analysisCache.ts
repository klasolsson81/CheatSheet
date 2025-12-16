/**
 * In-memory cache for analysis results
 *
 * Provides caching layer to reduce API calls and improve response times.
 * Uses LRU (Least Recently Used) eviction when max size is reached.
 * Supports TTL (Time To Live) for automatic expiration.
 */

import type { AnalysisResult, AdvancedSearchParams } from '@/lib/types/analysis';
import crypto from 'crypto';
import { CACHE_CONFIG } from '@/lib/config/constants';

// Configuration
const MAX_CACHE_SIZE = parseInt(process.env.CACHE_MAX_SIZE || String(CACHE_CONFIG.DEFAULT_MAX_SIZE), 10);
const DEFAULT_TTL_MS = parseInt(process.env.CACHE_TTL_MS || String(CACHE_CONFIG.DEFAULT_TTL_MS), 10);

interface CacheEntry {
  data: AnalysisResult;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  evictions: number;
}

/**
 * Generate cache key from URL and advanced parameters
 *
 * @param url - Company URL
 * @param advancedParams - Optional advanced search parameters
 * @param language - Analysis language
 * @returns SHA-256 hash as cache key
 */
export function generateCacheKey(
  url: string,
  advancedParams?: AdvancedSearchParams,
  language: 'sv' | 'en' = 'en'
): string {
  // Normalize URL for consistent caching
  const normalizedUrl = url.toLowerCase().trim();

  // Create deterministic string from params
  const paramsString = advancedParams
    ? JSON.stringify({
        contactPerson: advancedParams.contactPerson?.toLowerCase().trim() || '',
        department: advancedParams.department?.toLowerCase().trim() || '',
        location: advancedParams.location?.toLowerCase().trim() || '',
        jobTitle: advancedParams.jobTitle?.toLowerCase().trim() || '',
        specificFocus: advancedParams.specificFocus?.toLowerCase().trim() || '',
      })
    : '';

  // Generate hash
  const input = `${normalizedUrl}:${paramsString}:${language}`;
  return crypto.createHash('sha256').update(input).digest('hex');
}

/**
 * In-memory LRU cache with TTL support
 */
class AnalysisCache {
  private cache: Map<string, CacheEntry>;
  private stats: CacheStats;

  constructor() {
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      size: 0,
      evictions: 0,
    };
  }

  /**
   * Get cached analysis result
   *
   * @param key - Cache key
   * @returns Cached result or null if not found/expired
   */
  get(key: string): AnalysisResult | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      console.log(`🗑️ Cache expired: ${key.slice(0, CACHE_CONFIG.KEY_PREVIEW_LENGTH)}...`);
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.size--;
      return null;
    }

    // Update access metadata
    entry.accessCount++;
    entry.lastAccessed = now;
    this.stats.hits++;

    console.log(`✅ Cache hit: ${key.slice(0, CACHE_CONFIG.KEY_PREVIEW_LENGTH)}... (accessed ${entry.accessCount}x)`);
    return entry.data;
  }

  /**
   * Set analysis result in cache
   *
   * @param key - Cache key
   * @param data - Analysis result
   * @param ttl - Time to live in milliseconds (default: 1 hour)
   */
  set(key: string, data: AnalysisResult, ttl: number = DEFAULT_TTL_MS): void {
    // Evict oldest entry if at max size
    if (this.cache.size >= MAX_CACHE_SIZE && !this.cache.has(key)) {
      this.evictOldest();
    }

    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      ttl,
      accessCount: 0,
      lastAccessed: now,
    });

    if (!this.cache.has(key)) {
      this.stats.size++;
    }

    console.log(`💾 Cached: ${key.slice(0, CACHE_CONFIG.KEY_PREVIEW_LENGTH)}... (TTL: ${ttl / 1000}s, size: ${this.cache.size}/${MAX_CACHE_SIZE})`);
  }

  /**
   * Evict least recently used entry
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    // Find LRU entry
    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      console.log(`🗑️ Evicting LRU: ${oldestKey.slice(0, CACHE_CONFIG.KEY_PREVIEW_LENGTH)}...`);
      this.cache.delete(oldestKey);
      this.stats.evictions++;
      this.stats.size--;
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.stats.size = 0;
    console.log('🗑️ Cache cleared');
  }

  /**
   * Remove expired entries
   */
  cleanup(): void {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        removed++;
      }
    }

    this.stats.size = this.cache.size;

    if (removed > 0) {
      console.log(`🗑️ Cleaned up ${removed} expired entries`);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats & { hitRate: string } {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? ((this.stats.hits / total) * 100).toFixed(CACHE_CONFIG.HIT_RATE_DECIMALS) : CACHE_CONFIG.DEFAULT_HIT_RATE;

    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
    };
  }

  /**
   * Check if cache has key
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }
}

// Singleton instance
const analysisCache = new AnalysisCache();

// Cleanup expired entries periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    analysisCache.cleanup();
  }, CACHE_CONFIG.CLEANUP_INTERVAL_MS);
}

export default analysisCache;
