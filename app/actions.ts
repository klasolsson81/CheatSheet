'use server';

import OpenAI from 'openai';
import { tavily } from '@tavily/core';

interface AnalysisResult {
  summary: string;
  ice_breaker: string;
  pain_points: string[];
  sales_hooks: string[];
  financial_signals: string;
  company_tone: string;
  error?: string;
}

interface ResearchData {
  websiteContent: string;
  leadership: string;
  socialMedia: string;
  news: string;
  financials: string;
  signals: string;
}

// URL Normalization - adds https:// if missing
function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '';

  // Check if URL already has a protocol
  if (trimmed.match(/^https?:\/\//i)) {
    return trimmed;
  }

  // Add https:// prefix
  return `https://${trimmed}`;
}

// Detect if Swedish company (.se domain)
function isSwedishCompany(url: string): boolean {
  return url.includes('.se');
}

export async function analyzeUrl(inputUrl: string): Promise<AnalysisResult> {
  // Validate API keys
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured. Please add it to your environment variables.');
  }

  if (!process.env.TAVILY_API_KEY) {
    throw new Error('TAVILY_API_KEY is not configured. Please add it to your environment variables.');
  }

  // Normalize URL (add https:// if missing)
  const url = normalizeUrl(inputUrl);

  if (!url) {
    throw new Error('Please enter a valid URL.');
  }

  // Initialize clients
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const tavilyClient = tavily({
    apiKey: process.env.TAVILY_API_KEY,
  });

  try {
    // Extract company name from URL
    const urlMatch = url.match(/(?:https?:\/\/)?(?:www\.)?([^\/\.]+)/);
    const companyName = urlMatch ? urlMatch[1] : 'the company';
    const isSwedish = isSwedishCompany(url);

    console.log(`🔍 Starting SMART research for: ${companyName} (${url}) ${isSwedish ? '🇸🇪' : ''}`);

    // STEP 1: FAST - Extract website content (needed for both analysis and org number)
    let websiteContent = '';
    try {
      const extractResult = await tavilyClient.extract([url]);
      websiteContent = extractResult?.results?.[0]?.rawContent || '';
    } catch (error) {
      console.error('Website extraction failed:', error);
    }

    // STEP 2: Extract Swedish org number (if Swedish company)
    // PRIORITY 1: Check website content first (fastest and most reliable)
    // PRIORITY 2: If not found, search web with multiple strategies
    let orgNumber = '';
    if (isSwedish) {
      // Try to find org number directly in website content (footer, about page, etc.)
      const orgRegex = /\b(5\d{5}[-]?\d{4})\b/g;
      const websiteMatches = websiteContent.match(orgRegex);

      if (websiteMatches && websiteMatches.length > 0) {
        orgNumber = websiteMatches[0];
        console.log(`✅ Found org number on website: ${orgNumber}`);
      } else {
        // Fallback: Search web if not found on website
        console.log(`🔍 Org number not on website, searching web...`);
        try {
          const [urlSearch, nameSearch, bolagsverketSearch, allabolagSearch, hittaSearch, ratsitSearch] = await Promise.allSettled([
            tavilyClient.search(`${url} organisationsnummer`, { maxResults: 3, searchDepth: 'advanced' }),
            tavilyClient.search(`"${companyName} AB" 556 559`, { maxResults: 3, searchDepth: 'advanced' }),
            tavilyClient.search(`${url} bolagsverket`, { maxResults: 3, searchDepth: 'advanced' }),
            tavilyClient.search(`allabolag.se ${companyName}`, { maxResults: 3, searchDepth: 'advanced' }),
            tavilyClient.search(`hitta.se ${companyName} organisationsnummer`, { maxResults: 3, searchDepth: 'advanced' }),
            tavilyClient.search(`${companyName} ${url.replace('https://', '').replace('www.', '').split('/')[0]} orgnr`, { maxResults: 2, searchDepth: 'advanced' }),
          ]);

          // Combine all search results
          const allResults = [
            ...(urlSearch.status === 'fulfilled' && urlSearch.value.results ? urlSearch.value.results : []),
            ...(nameSearch.status === 'fulfilled' && nameSearch.value.results ? nameSearch.value.results : []),
            ...(bolagsverketSearch.status === 'fulfilled' && bolagsverketSearch.value.results ? bolagsverketSearch.value.results : []),
            ...(allabolagSearch.status === 'fulfilled' && allabolagSearch.value.results ? allabolagSearch.value.results : []),
            ...(hittaSearch.status === 'fulfilled' && hittaSearch.value.results ? hittaSearch.value.results : []),
            ...(ratsitSearch.status === 'fulfilled' && ratsitSearch.value.results ? ratsitSearch.value.results : []),
          ];

          const searchText = allResults.map(r => `${r.title} ${r.content}`).join(' ');
          const matches = searchText.match(orgRegex);

          if (matches && matches.length > 0) {
            // Take the most common org number
            const orgCounts = matches.reduce((acc: any, num: string) => {
              acc[num] = (acc[num] || 0) + 1;
              return acc;
            }, {});
            orgNumber = Object.entries(orgCounts).sort((a: any, b: any) => b[1] - a[1])[0][0] as string;
            console.log(`✅ Found org number via web search: ${orgNumber}`);
          } else {
            console.log(`⚠️ No org number found for ${companyName}`);
          }
        } catch (error) {
          console.error('Org number web search failed:', error);
        }
      }
    }

    // STEP 3: MULTI-SOURCE PARALLEL RESEARCH ENGINE
    const [websiteData, leadershipData, socialData, newsData, financialData, signalsData] = await Promise.allSettled([
      // 1. Website Content (already extracted above, just return it)
      Promise.resolve(websiteContent.length > 0 ? websiteContent : 'No content extracted'),

      // 2. Leadership & Key People Research
      tavilyClient.search(`${companyName} CEO founder leadership team LinkedIn 2025`, {
        maxResults: 4,
        searchDepth: 'advanced',
      }).then(res => {
        if (!res.results || res.results.length === 0) return 'No leadership data found';
        return res.results.map(r => `${r.title}: ${r.content}`).join('\n');
      }),

      // 3. Social Media & Personal Activity (ENHANCED for recent, personal posts)
      tavilyClient.search(`${companyName} LinkedIn post recent ${new Date().getMonth() < 6 ? 'January February March April May' : 'June July August September October November December'} 2025`, {
        maxResults: 5,
        searchDepth: 'advanced',
      }).then(res => {
        if (!res.results || res.results.length === 0) return 'No social activity found';
        return res.results.map(r => `${r.title}: ${r.content}`).join('\n');
      }),

      // 4. Recent News & Press Releases
      tavilyClient.search(`${companyName} news press release announcement 2025`, {
        maxResults: 4,
        searchDepth: 'advanced',
      }).then(res => {
        if (!res.results || res.results.length === 0) return 'No recent news found';
        return res.results.map(r => `${r.title}: ${r.content}`).join('\n');
      }),

      // 5. Financial Results & Reports (ENHANCED for Swedish companies)
      Promise.all([
        // General financial search
        tavilyClient.search(`${companyName} financial results quarterly earnings revenue 2024 2025`, {
          maxResults: 2,
          searchDepth: 'advanced',
        }),
        // Swedish-specific sources - Multiple targeted searches for better accuracy
        // PRIORITY 1: If we have org number, search with it (100% accurate)
        isSwedish && orgNumber ? tavilyClient.search(`${orgNumber} Allabolag årsredovisning omsättning`, {
          maxResults: 5,
          searchDepth: 'advanced',
        }) : Promise.resolve(null),
        // PRIORITY 2: Search by URL to find Allabolag page
        isSwedish ? tavilyClient.search(`${url} Allabolag`, {
          maxResults: 5,
          searchDepth: 'advanced',
        }) : Promise.resolve(null),
        // FALLBACK 3: Company name searches
        isSwedish ? tavilyClient.search(`"${companyName} AB" Allabolag omsättning vinst 2024`, {
          maxResults: 3,
          searchDepth: 'advanced',
        }) : Promise.resolve(null),
        isSwedish ? tavilyClient.search(`${companyName} site:allabolag.se årsredovisning`, {
          maxResults: 3,
          searchDepth: 'advanced',
        }) : Promise.resolve(null),
      ]).then(([general, orgSearch, urlSearch, allabolag1, allabolag2]) => {
        const results = [];
        if (general?.results) results.push(...general.results.map((r: any) => `${r.title}: ${r.content}`));
        if (orgSearch?.results) results.push(...orgSearch.results.map((r: any) => `[Allabolag-OrgNr-${orgNumber}] ${r.title}: ${r.content}`));
        if (urlSearch?.results) results.push(...urlSearch.results.map((r: any) => `[Allabolag-URL] ${r.title}: ${r.content}`));
        if (allabolag1?.results) results.push(...allabolag1.results.map((r: any) => `[Allabolag] ${r.title}: ${r.content}`));
        if (allabolag2?.results) results.push(...allabolag2.results.map((r: any) => `[Allabolag] ${r.title}: ${r.content}`));
        return results.length > 0 ? results.join('\n') : 'No financial data found';
      }),

      // 6. Growth Signals (Hiring, Funding, Expansion)
      tavilyClient.search(`${companyName} hiring jobs funding expansion partnership 2025`, {
        maxResults: 3,
        searchDepth: 'advanced',
      }).then(res => {
        if (!res.results || res.results.length === 0) return 'No growth signals found';
        return res.results.map(r => `${r.title}: ${r.content}`).join('\n');
      }),
    ]);

    // Aggregate all research data
    const research: ResearchData = {
      websiteContent: websiteData.status === 'fulfilled' ? websiteData.value : 'Failed to extract',
      leadership: leadershipData.status === 'fulfilled' ? leadershipData.value : 'No data',
      socialMedia: socialData.status === 'fulfilled' ? socialData.value : 'No data',
      news: newsData.status === 'fulfilled' ? newsData.value : 'No data',
      financials: financialData.status === 'fulfilled' ? financialData.value : 'No data',
      signals: signalsData.status === 'fulfilled' ? signalsData.value : 'No data',
    };

    console.log('✅ Research complete, sending to AI...');

    // ADVANCED AI ANALYSIS with GPT-5.2 + SAFETY & GROUNDING
    const systemPrompt = `SAFETY FIRST: Check the content. If it is Pornographic, Gambling, or Hate Speech -> Return JSON ONLY: { "error": "NSFW_CONTENT" }. Do not analyze.

CRITICAL GROUNDING: You are analyzing the SPECIFIC URL provided.
- Do NOT assume a similar-sounding name is a famous brand (e.g. 'klasolsson.se' is likely a personal site, NOT 'Clas Ohlson').
- If the extracted website content is personal/sparse, trust that over the search results.
- If content contradicts search results, prioritize website content.
- Base your analysis on what the ACTUAL website says, not assumptions.

You are an elite B2B sales intelligence analyst. Your mission: Extract CONCISE, ACTIONABLE sales intelligence.

🎯 CRITICAL: Keep ALL responses SHORT and PUNCHY. No fluff, no generic statements.

🎯 ICE BREAKER RULES (CRITICAL - READ CAREFULLY):
- MAX LENGTH: 15-20 words. Be ruthlessly concise.
- TONE: Conversational peer, not stalker. Sound natural, not like you copied LinkedIn.
- RECENCY: Use MOST RECENT activity (2-4 weeks max, current month preferred)
- SKIP: Generic PR, corporate announcements, promotional fluff
- FOCUS: Personal insights, opinions, thought leadership, specific company developments
- PRIORITY: Founder/CEO LinkedIn post from this month about specific topic → USE IT
- FALLBACK: If no recent personal posts → mention recent company news instead
- AUTHENTICITY > RECENCY: 6-week personal insight beats yesterday's generic PR

GOOD EXAMPLES:
✅ "Caught Nemanja's post on balancing speed vs. learning—how's that playing out in real sprints?"
✅ "Saw the Dec HQ session in Gothenburg—curious how you measure impact beyond code output?"
✅ "Noticed your team's take on psych safety in dev teams—resonates with what we're seeing too."

BAD EXAMPLES (DO NOT USE):
❌ "Saw Nemanja M.'s LinkedIn note about the Dec 13–14, 2025 weekend session at InFiNet Code HQ in Sisjön (Gothenburg)..." (too long, too detailed, sounds creepy)
❌ "Congratulations on your recent announcement!" (generic, no substance)
❌ "I read on your website that..." (boring, not social)

Analysis Framework:
1. **Summary** (1-2 sentences max): What they DO and their value prop
2. **Ice Breaker** (1 sentence): Ultra-specific, recent, personal hook based on CEO/leadership social posts, news, or events
3. **Pain Points** (3 bullet points, 5-10 words each): Specific operational/strategic challenges
4. **Sales Hooks** (2 bullet points, 8-12 words each): Direct value propositions tied to pain points
5. **Financial Signals** (1-2 sentences): Growth indicators, hiring, funding, or cost pressures.
   CRITICAL FOR SWEDISH COMPANIES: Data tagged [Allabolag-OrgNr-XXXXXX] is 100% VERIFIED (matched by org number) - ALWAYS USE IT.
   Data tagged [Allabolag-URL] or [Allabolag] is also reliable for .se domains - trust it.
6. **Company Tone** (2-4 words): Brand voice (e.g., "Formal Enterprise", "Innovative Startup")

Output ONLY valid JSON:
{
  "summary": "Brief, punchy summary",
  "ice_breaker": "Specific, personal opener referencing recent activity",
  "pain_points": ["Challenge 1", "Challenge 2", "Challenge 3"],
  "sales_hooks": ["Hook 1", "Hook 2"],
  "financial_signals": "Brief growth/financial status",
  "company_tone": "Brand characterization"
}

Use the multi-source research below. Prioritize RECENT, SPECIFIC insights over generic observations.`;

    const userPrompt = `Company: ${companyName} (${url})${isSwedish ? ' [Swedish Company - Allabolag/Bolagsverket data included]' : ''}

=== WEBSITE (PRIMARY SOURCE - TRUST THIS) ===
${research.websiteContent.slice(0, 3000)}

=== LEADERSHIP & KEY PEOPLE ===
${research.leadership.slice(0, 2000)}

=== SOCIAL MEDIA ACTIVITY (Prioritize recent, personal posts!) ===
${research.socialMedia.slice(0, 2000)}

=== RECENT NEWS & PRESS ===
${research.news.slice(0, 2500)}

=== FINANCIAL RESULTS ${isSwedish ? '(Including Allabolag/Bolagsverket)' : ''} ===
${research.financials.slice(0, 2000)}

=== GROWTH SIGNALS ===
${research.signals.slice(0, 1500)}

Analyze and provide sales intelligence.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-5.2',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const responseContent = completion.choices[0]?.message?.content;

    if (!responseContent) {
      throw new Error('No response from AI. Please try again.');
    }

    const analysis: AnalysisResult = JSON.parse(responseContent);

    // Check for NSFW content flag
    if (analysis.error === 'NSFW_CONTENT') {
      return {
        error: 'NSFW_CONTENT',
        summary: '',
        ice_breaker: '',
        pain_points: [],
        sales_hooks: [],
        financial_signals: '',
        company_tone: '',
      };
    }

    // Validate structure
    if (!analysis.summary || !analysis.ice_breaker || !analysis.pain_points ||
        !analysis.sales_hooks || !analysis.financial_signals || !analysis.company_tone) {
      throw new Error('AI returned incomplete analysis. Please try again.');
    }

    console.log('🎉 Analysis complete!');
    return analysis;

  } catch (error) {
    console.error('❌ Analysis error:', error);

    if (error instanceof Error) {
      // User-friendly errors
      if (error.message.includes('API_KEY') ||
          error.message.includes('extract') ||
          error.message.includes('content') ||
          error.message.includes('AI')) {
        throw error;
      }

      // API errors
      if (error.message.includes('401') || error.message.includes('unauthorized')) {
        throw new Error('Invalid API key. Please check your OPENAI_API_KEY or TAVILY_API_KEY.');
      }

      if (error.message.includes('429') || error.message.includes('rate limit')) {
        throw new Error('API rate limit exceeded. Please try again in a few moments.');
      }

      if (error.message.includes('timeout')) {
        throw new Error('Request timed out. Please try again.');
      }

      // Handle model not found error (if gpt-5.2 doesn't exist yet)
      if (error.message.includes('model') && error.message.includes('does not exist')) {
        throw new Error('GPT-5.2 is not available yet. Please contact support to update the model.');
      }

      throw new Error(`Analysis failed: ${error.message}`);
    }

    throw new Error('An unexpected error occurred. Please try again.');
  }
}
