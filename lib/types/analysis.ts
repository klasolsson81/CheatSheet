/**
 * Type definitions for RECON analysis system
 *
 * This file contains all interfaces and types used across the application
 * for company analysis, research data, and search parameters.
 */

/**
 * Ice breaker with text and optional source URL
 */
export interface IceBreaker {
  text: string;
  source_url?: string;
}

/**
 * Advanced search parameters for targeted analysis
 *
 * Optional parameters to focus analysis on specific person/department/location
 */
export interface AdvancedSearchParams {
  contactPerson?: string;
  department?: string;
  location?: string;
  jobTitle?: string;
  specificFocus?: string;
}

/**
 * Complete analysis result returned by AI
 */
export interface AnalysisResult {
  summary: string;
  ice_breaker: IceBreaker[];
  pain_points: string[];
  sales_hooks: string[];
  financial_signals: string;
  company_tone: string;
  error?: string;
}

/**
 * Multi-source research data collected from various APIs
 */
export interface ResearchData {
  websiteContent: string;
  leadership: string;
  socialMedia: string;
  news: string;
  financials: string;
  signals: string;
}

/**
 * Result from Swedish company org number search
 */
export interface SwedishCompanyData {
  orgNumber: string;
  financialData: string;
}

/**
 * Tavily search result item
 */
export interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score?: number;
}

/**
 * Tavily search response
 */
export interface TavilySearchResponse {
  results?: TavilySearchResult[];
}
