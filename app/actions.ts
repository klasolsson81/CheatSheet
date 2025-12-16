'use server';

import OpenAI from 'openai';
import { tavily } from '@tavily/core';
import { headers } from 'next/headers';
import { checkRateLimit, getClientIP, getRateLimitErrorMessage } from '@/lib/rateLimit';
import { normalizeUrl, sanitizeAdvancedParams } from '@/lib/validators/urlValidator';
import { isSwedishCompany, searchSwedishCompanyData } from '@/lib/utils/swedishCompany';
import { extractWebsiteContent, performMultiSourceResearch } from '@/lib/services/searchService';
import { analyzeCompanyWithGPT } from '@/lib/services/gptService';
import type { AnalysisResult, AdvancedSearchParams } from '@/lib/types/analysis';

// Suppress Tavily's url.parse() deprecation warning from Tavily SDK
if (typeof process !== 'undefined') {
  const originalEmitWarning = process.emitWarning.bind(process);
  process.emitWarning = (warning: string | Error, type?: any, code?: any, ctor?: any) => {
    if (typeof warning === 'string' && warning.includes('url.parse()')) {
      return; // Suppress url.parse() deprecation from Tavily SDK
    }
    return originalEmitWarning(warning, type, code, ctor);
  };
}

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
  try {
    // STEP 1: RATE LIMITING
    const headersList = await headers();
    const clientIP = getClientIP(headersList);
    const rateLimitResult = checkRateLimit(clientIP);

    if (!rateLimitResult.allowed) {
      const errorMessage = getRateLimitErrorMessage(rateLimitResult.retryAfter || 300, language);
      console.log(`🚫 Rate limit exceeded for IP: ${clientIP} (retry after ${rateLimitResult.retryAfter}s)`);
      throw new Error(errorMessage);
    }

    console.log(`✅ Rate limit check passed for IP: ${clientIP} (${rateLimitResult.remaining} requests remaining)`);

    // STEP 2: VALIDATE API KEYS
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured. Please add it to your environment variables.');
    }

    if (!process.env.TAVILY_API_KEY) {
      throw new Error('TAVILY_API_KEY is not configured. Please add it to your environment variables.');
    }

    // STEP 3: NORMALIZE & SANITIZE INPUTS
    const url = normalizeUrl(inputUrl);

    if (!url) {
      throw new Error('Please enter a valid URL.');
    }

    // Sanitize advanced parameters to prevent prompt injection
    const sanitizedParams = advancedParams ? sanitizeAdvancedParams(advancedParams) : undefined;

    // STEP 4: INITIALIZE CLIENTS
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

    console.log(`🔍 Starting SMART research for: ${companyName} (${url}) ${isSwedish ? '🇸🇪' : ''}`);

    // STEP 5: EXTRACT WEBSITE CONTENT
    const websiteContent = await extractWebsiteContent(tavilyClient, url);

    // STEP 6: SWEDISH COMPANY SPECIAL HANDLING
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

    // STEP 7: MULTI-SOURCE PARALLEL RESEARCH
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

    return analysis;
  } catch (error) {
    console.error('❌ Analysis error:', error);

    if (error instanceof Error) {
      // Tavily API usage limit
      if (error.message.includes('usage limit') || error.message.includes("plan's set usage")) {
        throw new Error('Search API usage limit reached. Please try again later or contact support to upgrade.');
      }

      // Rate limiting error (already has user-friendly message)
      if (error.message.includes('många förfrågningar') || error.message.includes('Too many requests')) {
        throw error;
      }

      // Pass through other errors
      throw new Error(`Unable to generate complete analysis. ${error.message}`);
    }

    throw new Error('Unable to generate complete analysis. This may be due to API limits or insufficient data. Please try again later.');
  }
}
