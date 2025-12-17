/**
 * Multi-source research service
 *
 * Aggregates data from multiple sources in parallel:
 * 1. Website content
 * 2. Leadership & key people
 * 3. Social media activity
 * 4. Recent news & press
 * 5. Financial results
 * 6. Growth signals
 *
 * Uses search orchestrator with automatic fallback between providers.
 */

import type { ResearchData } from '@/lib/types/analysis';
import { SEARCH_LIMITS, CURRENT_MONTH_THRESHOLD } from '@/lib/config/constants';
import searchOrchestrator from './search/orchestrator';

/**
 * Get current month names for social media search
 *
 * @returns Space-separated month names for current half of year
 */
function getCurrentMonths(): string {
  const currentMonth = new Date().getMonth();
  return currentMonth < CURRENT_MONTH_THRESHOLD
    ? 'January February March April May'
    : 'June July August September October November December';
}

/**
 * Validate and sanitize search query component
 *
 * @param value - Query component to validate
 * @param maxLength - Maximum allowed length
 * @returns Validated and truncated string
 */
function validateQueryComponent(value: string | undefined, maxLength: number = 100): string {
  if (!value) return '';

  const trimmed = value.trim();

  // Reject if too short (less than 2 chars)
  if (trimmed.length < 2) return '';

  // Truncate if too long
  return trimmed.slice(0, maxLength);
}

/**
 * Execute multi-source parallel research
 *
 * Performs 6 parallel searches to gather comprehensive company intelligence.
 * Uses search orchestrator with automatic fallback between providers.
 *
 * @param companyName - Company name extracted from URL
 * @param url - Company website URL
 * @param websiteContent - Pre-extracted website content
 * @param isSwedish - Whether company is Swedish (.se domain)
 * @param orgNumber - Swedish org number (if found)
 * @param gptFinancialData - GPT-verified financial data for Swedish companies
 * @param sanitizedParams - Sanitized advanced search parameters
 * @returns Research data from all sources
 */
export async function performMultiSourceResearch(
  companyName: string,
  url: string,
  websiteContent: string,
  isSwedish: boolean,
  orgNumber: string,
  gptFinancialData: string,
  sanitizedParams?: {
    contactPerson?: string;
    department?: string;
    location?: string;
    jobTitle?: string;
    specificFocus?: string;
  }
): Promise<ResearchData> {
  // Validate and sanitize all input components
  const validCompanyName = validateQueryComponent(companyName, 100);
  const validContactPerson = validateQueryComponent(sanitizedParams?.contactPerson, 100);
  const validJobTitle = validateQueryComponent(sanitizedParams?.jobTitle, 100);
  const validDepartment = validateQueryComponent(sanitizedParams?.department, 100);
  const validLocation = validateQueryComponent(sanitizedParams?.location, 100);
  const validSpecificFocus = validateQueryComponent(sanitizedParams?.specificFocus, 200);

  // Build targeted search context from validated components
  const hasAdvanced = validContactPerson || validJobTitle || validDepartment || validLocation;
  const targetContext = hasAdvanced
    ? [validContactPerson, validJobTitle, validDepartment, validLocation].filter(Boolean).join(' ')
    : '';

  console.log(`🔍 Starting research for: ${validCompanyName || 'company'} ${hasAdvanced ? '(targeted)' : ''}`);

  // PARALLEL RESEARCH: 6 data streams
  const [websiteData, leadershipData, socialData, newsData, financialData, signalsData] =
    await Promise.allSettled([
      // 1. Website Content (already extracted)
      Promise.resolve(websiteContent.length > 0 ? websiteContent : 'No content extracted'),

      // 2. Leadership & Key People Research
      searchOrchestrator
        .search(
          validContactPerson
            ? `${validContactPerson} ${validCompanyName} LinkedIn ${validLocation} ${validJobTitle} 2025`
            : `${validCompanyName} ${targetContext} CEO founder leadership team LinkedIn 2025`,
          {
            maxResults: SEARCH_LIMITS.LEADERSHIP,
            searchDepth: 'advanced',
          }
        )
        .then((res) => {
          if (!res.results || res.results.length === 0) return 'No leadership data found';
          return res.results.map((r) => `[SOURCE: ${r.url}] ${r.title}: ${r.content}`).join('\n');
        }),

      // 3. Social Media & Personal Activity
      searchOrchestrator
        .search(
          validContactPerson
            ? `${validContactPerson} LinkedIn post ${validSpecificFocus} ${getCurrentMonths()} 2025`
            : `${validCompanyName} ${targetContext} LinkedIn post recent ${getCurrentMonths()} 2025`,
          {
            maxResults: SEARCH_LIMITS.SOCIAL_MEDIA,
            searchDepth: 'advanced',
          }
        )
        .then((res) => {
          if (!res.results || res.results.length === 0) return 'No social activity found';
          return res.results.map((r) => `[SOURCE: ${r.url}] ${r.title}: ${r.content}`).join('\n');
        }),

      // 4. Recent News & Press Releases
      searchOrchestrator
        .search(`${validCompanyName} news press release announcement 2025`, {
          maxResults: SEARCH_LIMITS.NEWS,
          searchDepth: 'advanced',
        })
        .then((res) => {
          if (!res.results || res.results.length === 0) return 'No recent news found';
          return res.results.map((r) => `[SOURCE: ${r.url}] ${r.title}: ${r.content}`).join('\n');
        }),

      // 5. Financial Results & Reports (with Swedish company optimization)
      Promise.all([
        // General financial search
        searchOrchestrator.search(`${validCompanyName} financial results quarterly earnings revenue 2024 2025`, {
          maxResults: SEARCH_LIMITS.FINANCIALS_GENERAL,
          searchDepth: 'advanced',
        }),
        // Swedish-specific: Prioritize org number search if available
        isSwedish && orgNumber
          ? searchOrchestrator.search(`${orgNumber} Allabolag årsredovisning omsättning`, {
              maxResults: SEARCH_LIMITS.FINANCIALS_SWEDISH,
              searchDepth: 'advanced',
            })
          : isSwedish
            ? searchOrchestrator.search(`${url} Allabolag omsättning`, {
                maxResults: SEARCH_LIMITS.FINANCIALS_SWEDISH,
                searchDepth: 'advanced',
              })
            : Promise.resolve(null),
      ]).then(([general, swedishSearch]) => {
        const results = [];
        if (general?.results)
          results.push(...general.results.map((r) => `[SOURCE: ${r.url}] ${r.title}: ${r.content}`));
        if (swedishSearch?.results)
          results.push(
            ...swedishSearch.results.map((r) => `[SOURCE: ${r.url}] [Allabolag] ${r.title}: ${r.content}`)
          );
        return results.length > 0 ? results.join('\n') : 'No financial data found';
      }),

      // 6. Growth Signals (Hiring, Funding, Expansion)
      searchOrchestrator
        .search(`${validCompanyName} hiring jobs funding expansion partnership 2025`, {
          maxResults: SEARCH_LIMITS.GROWTH_SIGNALS,
          searchDepth: 'advanced',
        })
        .then((res) => {
          if (!res.results || res.results.length === 0) return 'No growth signals found';
          return res.results.map((r) => `[SOURCE: ${r.url}] ${r.title}: ${r.content}`).join('\n');
        }),
    ]);

  // Check for API limit errors
  const hasApiLimitError = [websiteData, leadershipData, socialData, newsData, financialData, signalsData].some(
    (result) => result.status === 'rejected' && result.reason?.message?.includes('usage limit')
  );

  if (hasApiLimitError) {
    throw new Error(
      'Search API usage limit reached. Please try again later or contact support@tavily.com to upgrade your plan.'
    );
  }

  // Aggregate all research data
  const research: ResearchData = {
    websiteContent: websiteData.status === 'fulfilled' ? websiteData.value : 'Failed to extract',
    leadership: leadershipData.status === 'fulfilled' ? leadershipData.value : 'No data',
    socialMedia: socialData.status === 'fulfilled' ? socialData.value : 'No data',
    news: newsData.status === 'fulfilled' ? newsData.value : 'No data',
    // PUT GPT-VERIFIED DATA FIRST so it's never truncated
    financials:
      (gptFinancialData ? `=== GPT-VERIFIED SWEDISH DATA (ORG ${orgNumber}) ===\n${gptFinancialData}\n\n` : '') +
      (financialData.status === 'fulfilled' ? financialData.value : 'No data'),
    signals: signalsData.status === 'fulfilled' ? signalsData.value : 'No data',
  };

  // Validate we have enough data
  const hasAnyData =
    research.websiteContent !== 'Failed to extract' ||
    research.leadership !== 'No data' ||
    research.socialMedia !== 'No data' ||
    research.news !== 'No data';

  if (!hasAnyData) {
    throw new Error('Unable to gather sufficient data for analysis. Please check API limits and try again.');
  }

  console.log(`✅ Research complete, sending to AI...`);

  return research;
}

/**
 * Extract website content using search orchestrator
 *
 * Uses Tavily provider for content extraction (only provider that supports it).
 * Falls back to empty string if extraction fails.
 *
 * @param url - Website URL to extract
 * @returns Extracted website content or empty string
 */
export async function extractWebsiteContent(url: string): Promise<string> {
  try {
    const rawContent = await searchOrchestrator.extract(url);

    if (!rawContent) {
      console.log('⚠️ No content extracted from website');
      return '';
    }

    console.log(`✅ Website content extracted: ${rawContent.length} chars`);
    return rawContent;
  } catch (error) {
    console.error('❌ Website extraction failed:', error instanceof Error ? error.message : 'Unknown error');
    return '';
  }
}
