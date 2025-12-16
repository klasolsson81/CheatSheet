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
 */

import type { ResearchData } from '@/lib/types/analysis';

// Configuration constants
const MAX_LEADERSHIP_RESULTS = 4;
const MAX_SOCIAL_MEDIA_RESULTS = 5;
const MAX_NEWS_RESULTS = 5;
const MAX_FINANCIAL_RESULTS_GENERAL = 2;
const MAX_FINANCIAL_RESULTS_SWEDISH = 3;
const MAX_GROWTH_SIGNALS_RESULTS = 4;

/**
 * Get current month names for social media search
 *
 * @returns Space-separated month names for current half of year
 */
function getCurrentMonths(): string {
  const currentMonth = new Date().getMonth();
  return currentMonth < 6
    ? 'January February March April May'
    : 'June July August September October November December';
}

/**
 * Execute multi-source parallel research
 *
 * Performs 6 parallel searches to gather comprehensive company intelligence.
 *
 * @param tavilyClient - Tavily search client
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
  tavilyClient: any,
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
  // Build targeted search context
  const hasAdvanced = sanitizedParams && Object.keys(sanitizedParams).length > 0;
  const targetContext = hasAdvanced
    ? [
        sanitizedParams.contactPerson,
        sanitizedParams.jobTitle,
        sanitizedParams.department,
        sanitizedParams.location,
      ].filter(Boolean).join(' ')
    : '';

  console.log(`🔍 Starting research for: ${companyName} ${hasAdvanced ? '(targeted)' : ''}`);

  // PARALLEL RESEARCH: 6 data streams
  const [websiteData, leadershipData, socialData, newsData, financialData, signalsData] =
    await Promise.allSettled([
      // 1. Website Content (already extracted)
      Promise.resolve(websiteContent.length > 0 ? websiteContent : 'No content extracted'),

      // 2. Leadership & Key People Research
      tavilyClient
        .search(
          hasAdvanced && sanitizedParams.contactPerson
            ? `${sanitizedParams.contactPerson} ${companyName} LinkedIn ${sanitizedParams.location || ''} ${sanitizedParams.jobTitle || ''} 2025`
            : `${companyName} ${targetContext} CEO founder leadership team LinkedIn 2025`,
          {
            maxResults: MAX_LEADERSHIP_RESULTS,
            searchDepth: 'advanced',
          }
        )
        .then((res: any) => {
          if (!res.results || res.results.length === 0) return 'No leadership data found';
          return res.results.map((r: any) => `[SOURCE: ${r.url}] ${r.title}: ${r.content}`).join('\n');
        }),

      // 3. Social Media & Personal Activity
      tavilyClient
        .search(
          hasAdvanced && sanitizedParams.contactPerson
            ? `${sanitizedParams.contactPerson} LinkedIn post ${sanitizedParams.specificFocus || ''} ${getCurrentMonths()} 2025`
            : `${companyName} ${targetContext} LinkedIn post recent ${getCurrentMonths()} 2025`,
          {
            maxResults: MAX_SOCIAL_MEDIA_RESULTS,
            searchDepth: 'advanced',
          }
        )
        .then((res: any) => {
          if (!res.results || res.results.length === 0) return 'No social activity found';
          return res.results.map((r: any) => `[SOURCE: ${r.url}] ${r.title}: ${r.content}`).join('\n');
        }),

      // 4. Recent News & Press Releases
      tavilyClient
        .search(`${companyName} news press release announcement 2025`, {
          maxResults: MAX_NEWS_RESULTS,
          searchDepth: 'advanced',
        })
        .then((res: any) => {
          if (!res.results || res.results.length === 0) return 'No recent news found';
          return res.results.map((r: any) => `[SOURCE: ${r.url}] ${r.title}: ${r.content}`).join('\n');
        }),

      // 5. Financial Results & Reports (with Swedish company optimization)
      Promise.all([
        // General financial search
        tavilyClient.search(`${companyName} financial results quarterly earnings revenue 2024 2025`, {
          maxResults: MAX_FINANCIAL_RESULTS_GENERAL,
          searchDepth: 'advanced',
        }),
        // Swedish-specific: Prioritize org number search if available
        isSwedish && orgNumber
          ? tavilyClient.search(`${orgNumber} Allabolag årsredovisning omsättning`, {
              maxResults: MAX_FINANCIAL_RESULTS_SWEDISH,
              searchDepth: 'advanced',
            })
          : isSwedish
            ? tavilyClient.search(`${url} Allabolag omsättning`, {
                maxResults: MAX_FINANCIAL_RESULTS_SWEDISH,
                searchDepth: 'advanced',
              })
            : Promise.resolve(null),
      ]).then(([general, swedishSearch]) => {
        const results = [];
        if (general?.results)
          results.push(...general.results.map((r: any) => `[SOURCE: ${r.url}] ${r.title}: ${r.content}`));
        if (swedishSearch?.results)
          results.push(
            ...swedishSearch.results.map((r: any) => `[SOURCE: ${r.url}] [Allabolag] ${r.title}: ${r.content}`)
          );
        return results.length > 0 ? results.join('\n') : 'No financial data found';
      }),

      // 6. Growth Signals (Hiring, Funding, Expansion)
      tavilyClient
        .search(`${companyName} hiring jobs funding expansion partnership 2025`, {
          maxResults: MAX_GROWTH_SIGNALS_RESULTS,
          searchDepth: 'advanced',
        })
        .then((res: any) => {
          if (!res.results || res.results.length === 0) return 'No growth signals found';
          return res.results.map((r: any) => `[SOURCE: ${r.url}] ${r.title}: ${r.content}`).join('\n');
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
 * Extract website content using Tavily
 *
 * @param tavilyClient - Tavily search client
 * @param url - Website URL to extract
 * @returns Extracted website content or empty string
 */
export async function extractWebsiteContent(tavilyClient: any, url: string): Promise<string> {
  try {
    const extractResult = await tavilyClient.extract([url]);
    const rawContent = extractResult.results?.[0]?.rawContent || '';

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
