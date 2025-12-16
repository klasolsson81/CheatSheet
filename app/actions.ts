'use server';

import OpenAI from 'openai';
import { tavily } from '@tavily/core';
import { headers } from 'next/headers';
import { checkRateLimit, getClientIP, getRateLimitErrorMessage } from '@/lib/rateLimit';
import { normalizeUrl, sanitizeAdvancedParams } from '@/lib/validators/urlValidator';
import { isSwedishCompany, searchSwedishCompanyData } from '@/lib/utils/swedishCompany';
import { extractWebsiteContent, performMultiSourceResearch } from '@/lib/services/searchService';
import { analyzeCompanyWithGPT } from '@/lib/services/gptService';
import analysisCache, { generateCacheKey } from '@/lib/cache/analysisCache';
import logger from '@/lib/utils/logger';
import {
  ValidationError,
  RateLimitError,
  APIError,
  AnalysisError,
  ErrorCode,
  getUserMessage,
} from '@/lib/errors/AppError';
import type { AnalysisResult, AdvancedSearchParams } from '@/lib/types/analysis';

/**
 * Analyze company URL and generate sales intelligence
 *
 * Main orchestrator function that:
 * 1. Validates rate limits and API keys
 * 2. Normalizes and sanitizes inputs
 * 3. Extracts website content
 * 4. Performs multi-source research (if Swedish: includes GPT-driven org number search)
 * 5. Analyzes data with GPT to generate sales intelligence
 *
 * @param inputUrl - Company website URL
 * @param advancedParams - Optional advanced targeting parameters
 * @param language - Output language ('sv' or 'en')
 * @returns Analysis result with sales intelligence
 */
export async function analyzeUrl(
  inputUrl: string,
  advancedParams?: AdvancedSearchParams,
  language: 'sv' | 'en' = 'en'
): Promise<AnalysisResult> {
  const startTime = Date.now();

  try {
    // STEP 1: RATE LIMITING
    const headersList = await headers();
    const clientIP = getClientIP(headersList);
    const rateLimitResult = checkRateLimit(clientIP);

    logger.rateLimitCheck(clientIP, rateLimitResult.remaining, rateLimitResult.allowed);

    if (!rateLimitResult.allowed) {
      const errorMessage = getRateLimitErrorMessage(rateLimitResult.retryAfter || 300, language);
      throw new RateLimitError(errorMessage, rateLimitResult.retryAfter || 300);
    }

    // STEP 2: VALIDATE API KEYS
    if (!process.env.OPENAI_API_KEY) {
      throw new ValidationError(
        'Service configuration error. Please contact support.',
        'OPENAI_API_KEY is not configured',
        { service: 'OpenAI' }
      );
    }

    if (!process.env.TAVILY_API_KEY) {
      throw new ValidationError(
        'Service configuration error. Please contact support.',
        'TAVILY_API_KEY is not configured',
        { service: 'Tavily' }
      );
    }

    // STEP 3: NORMALIZE & SANITIZE INPUTS
    const url = normalizeUrl(inputUrl);

    if (!url) {
      throw new ValidationError(
        language === 'sv' ? 'Ange en giltig URL.' : 'Please enter a valid URL.',
        'URL normalization failed',
        { inputUrl }
      );
    }

    // Sanitize advanced parameters to prevent prompt injection
    const sanitizedParams = advancedParams ? sanitizeAdvancedParams(advancedParams) : undefined;

    // STEP 4: CHECK CACHE
    const cacheKey = generateCacheKey(url, sanitizedParams, language);
    const cachedResult = analysisCache.get(cacheKey);

    if (cachedResult) {
      const duration = Date.now() - startTime;
      logger.analysisComplete(url, duration, true);
      return cachedResult;
    }

    logger.cacheMiss(cacheKey);

    // STEP 5: INITIALIZE CLIENTS
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const tavilyClient = tavily({
      apiKey: process.env.TAVILY_API_KEY,
    });

    // Extract company name from URL
    const urlMatch = url.match(/(?:https?:\/\/)?(?:www\.)?([^\/\.]+)/);
    const companyName = urlMatch ? urlMatch[1] : 'the company';
    const isSwedish = isSwedishCompany(url);

    logger.analysisStart(url, isSwedish, !!sanitizedParams);

    // STEP 6: EXTRACT WEBSITE CONTENT
    const websiteContent = await extractWebsiteContent(tavilyClient, url);

    // STEP 7: SWEDISH COMPANY SPECIAL HANDLING
    // If Swedish company, use GPT-driven search for org number + financials
    let orgNumber = '';
    let gptFinancialData = '';

    if (isSwedish) {
      console.log('🇸🇪 Swedish company detected, using GPT-driven search...');
      try {
        const gptResult = await searchSwedishCompanyData(companyName, url, tavilyClient, openai);
        orgNumber = gptResult.orgNumber;
        gptFinancialData = gptResult.financialData;
      } catch (error) {
        console.error('❌ GPT-driven search failed:', error instanceof Error ? error.message : 'Unknown error');
      }
    }

    // STEP 8: MULTI-SOURCE PARALLEL RESEARCH
    const research = await performMultiSourceResearch(
      tavilyClient,
      companyName,
      url,
      websiteContent,
      isSwedish,
      orgNumber,
      gptFinancialData,
      sanitizedParams
    );

    // STEP 8: GPT ANALYSIS
    const analysis = await analyzeCompanyWithGPT(
      openai,
      companyName,
      url,
      research,
      isSwedish,
      language,
      sanitizedParams
    );

    // STEP 9: CACHE RESULT
    // Cache for 1 hour (3600000 ms) - configurable via env
    const cacheTTL = parseInt(process.env.CACHE_TTL_MS || '3600000', 10);
    analysisCache.set(cacheKey, analysis, cacheTTL);

    // Log cache stats and completion
    const stats = analysisCache.getStats();
    logger.cacheStats(stats.hits, stats.misses, stats.hitRate, stats.size);

    const duration = Date.now() - startTime;
    logger.analysisComplete(url, duration, false);

    return analysis;
  } catch (error) {
    // Log the error with details
    logger.error('Analysis failed', error instanceof Error ? error : undefined, {
      url: inputUrl,
      language,
      hasAdvancedParams: !!advancedParams,
    });

    // Re-throw AppErrors as-is (they have user-friendly messages)
    if (error instanceof ValidationError || error instanceof RateLimitError) {
      throw error;
    }

    // Handle known API errors
    if (error instanceof Error) {
      // Tavily API usage limit
      if (error.message.includes('usage limit') || error.message.includes("plan's set usage")) {
        throw new APIError(
          'Tavily',
          language === 'sv'
            ? 'Sök-API gränsen nådd. Försök igen senare eller kontakta support.'
            : 'Search API usage limit reached. Please try again later or contact support.',
          error.message,
          { originalError: error.message }
        );
      }

      // OpenAI API errors
      if (error.message.includes('OpenAI') || error.message.includes('gpt')) {
        throw new APIError(
          'OpenAI',
          language === 'sv'
            ? 'AI-tjänsten är tillfälligt otillgänglig. Försök igen om en stund.'
            : 'AI service temporarily unavailable. Please try again in a moment.',
          error.message,
          { originalError: error.message }
        );
      }

      // Generic analysis error
      throw new AnalysisError(
        language === 'sv'
          ? 'Kunde inte slutföra analysen. Försök igen eller kontakta support.'
          : 'Unable to complete analysis. Please try again or contact support.',
        error.message,
        { originalError: error.message }
      );
    }

    // Unknown error
    throw new AnalysisError(
      language === 'sv'
        ? 'Ett oväntat fel inträffade. Försök igen senare.'
        : 'An unexpected error occurred. Please try again later.',
      'Unknown error during analysis',
      { error: String(error) }
    );
  }
}
