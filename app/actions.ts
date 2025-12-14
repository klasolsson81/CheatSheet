'use server';

import OpenAI from 'openai';
import { tavily } from '@tavily/core';

interface AnalysisResult {
  summary: string;
  ice_breaker: string[];
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

// GPT-driven search for Swedish company data (org number + financials)
async function searchSwedishCompanyData(
  companyName: string,
  url: string,
  tavilyClient: any,
  openai: OpenAI
): Promise<{ orgNumber: string; financialData: string }> {
  console.log(`🤖 GPT-driven search for Swedish company: ${companyName}`);

  const tools = [
    {
      type: 'function' as const,
      function: {
        name: 'search_web',
        description: 'Search the web for specific information about Swedish companies. Use this to find org numbers, financial data from Allabolag, Ratsit, Bolagsverket, etc.',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'The search query to execute',
            },
          },
          required: ['query'],
        },
      },
    },
  ];

  const messages: any[] = [
    {
      role: 'system',
      content: `You are a Swedish company research assistant.

CRITICAL: You MUST complete BOTH tasks below. Do NOT stop after finding the org number!

TASK 1: Find organisationsnummer (org number)
- Search: "${url} organisationsnummer" or "${companyName} AB org nummer"
- Try: Allabolag, Bolagsverket, Ratsit, hitta.se
- Format: 5XXXXX-XXXX or 5XXXXXXXXX

TASK 2 (MANDATORY): Once you have org number → Search for financial data
- Search: "[org number] Allabolag" AND "[org number] bokslut omsättning"
- Find: omsättning (revenue), resultat (profit), soliditet, tillgångar
- Example: "559365-2604 allabolag bokslut 2024"

You have up to 7 search_web calls. After finding org number, you MUST search for financials before finishing.`,
    },
    {
      role: 'user',
      content: `Find BOTH org number AND financial data (omsättning, resultat) for: ${companyName} (${url})

Remember: Don't finish until you've searched for financials with the org number!`,
    },
  ];

  let iterations = 0;
  const maxIterations = 8;
  let orgNumber = '';
  let financialData = '';

  while (iterations < maxIterations) {
    iterations++;

    const response = await openai.chat.completions.create({
      model: 'gpt-5.2',
      messages,
      tools,
      tool_choice: iterations < 7 ? 'auto' : 'none', // Allow tools for first 6 iterations, then force completion
    });

    const assistantMessage = response.choices[0].message;
    messages.push(assistantMessage);

    // Check if GPT wants to call a function
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      // Execute all function calls
      for (const toolCall of assistantMessage.tool_calls) {
        if (toolCall.type === 'function' && toolCall.function.name === 'search_web') {
          const args = JSON.parse(toolCall.function.arguments);
          const searchQuery = args.query;

          console.log(`🔍 GPT requested search: "${searchQuery}"`);

          // Execute Tavily search
          try {
            const searchResult = await tavilyClient.search(searchQuery, {
              maxResults: 5,
              searchDepth: 'advanced',
            });

            const resultText = searchResult.results
              ?.map((r: any) => `${r.title}\n${r.content}`)
              .join('\n\n') || 'No results found';

            // Return results to GPT
            messages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: resultText.slice(0, 3000), // Limit length
            });
          } catch (error) {
            messages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: 'Search failed',
            });
          }
        }
      }
    } else {
      // GPT is done, extract final answer
      const finalAnswer = assistantMessage.content || '';
      console.log(`📝 GPT final answer (${finalAnswer.length} chars): ${finalAnswer.slice(0, 300)}...`);

      // Extract org number from GPT's response
      const orgRegex = /\b(5\d{5}[-]?\d{4})\b/g;
      const orgMatches = finalAnswer.match(orgRegex);
      if (orgMatches) {
        orgNumber = orgMatches[0];
        console.log(`🔢 Extracted org number from GPT response: ${orgNumber}`);
      }

      financialData = finalAnswer;
      break;
    }
  }

  console.log(`✅ GPT search complete. Org number: ${orgNumber || 'not found'}`);
  console.log(`✅ Financial data collected: ${financialData.length} chars`);
  return { orgNumber, financialData };
}

interface AdvancedSearchParams {
  contactPerson?: string;
  department?: string;
  location?: string;
  jobTitle?: string;
  specificFocus?: string;
}

export async function analyzeUrl(
  inputUrl: string,
  advancedParams?: AdvancedSearchParams,
  language: 'sv' | 'en' = 'en'
): Promise<AnalysisResult> {
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

    // STEP 2: GPT-driven search for Swedish companies (org number + financial data)
    let orgNumber = '';
    let gptFinancialData = '';
    if (isSwedish) {
      console.log(`🇸🇪 Swedish company detected, using GPT-driven search...`);

      // First check website content for org number (quick check)
      const orgRegex = /\b(5\d{5}[-]?\d{4})\b/g;
      const websiteMatches = websiteContent.match(orgRegex);

      if (websiteMatches && websiteMatches.length > 0) {
        orgNumber = websiteMatches[0];
        console.log(`✅ Found org number on website: ${orgNumber}`);
      }

      // Use GPT-driven search for comprehensive data (always run, even if we found org number)
      try {
        const gptResult = await searchSwedishCompanyData(companyName, url, tavilyClient, openai);

        // If GPT found an org number and we didn't have one, use it
        if (gptResult.orgNumber && !orgNumber) {
          orgNumber = gptResult.orgNumber;
          console.log(`✅ GPT found org number: ${orgNumber}`);
        }

        // Store GPT's financial findings
        gptFinancialData = gptResult.financialData;
        console.log(`📊 GPT financial data length: ${gptFinancialData.length} characters`);
        if (gptFinancialData) {
          console.log(`📊 GPT financial data preview: ${gptFinancialData.slice(0, 200)}...`);
        }
      } catch (error) {
        console.error('❌ GPT-driven search failed:', error);
        if (error instanceof Error) {
          console.error('Error details:', error.message);
        }
      }
    }

    // Build targeted search queries based on advanced parameters
    const hasAdvanced = advancedParams && Object.keys(advancedParams).length > 0;
    const targetContext = hasAdvanced ? [
      advancedParams.contactPerson,
      advancedParams.jobTitle,
      advancedParams.department,
      advancedParams.location,
    ].filter(Boolean).join(' ') : '';

    // STEP 3: MULTI-SOURCE PARALLEL RESEARCH ENGINE
    const [websiteData, leadershipData, socialData, newsData, financialData, signalsData] = await Promise.allSettled([
      // 1. Website Content (already extracted above, just return it)
      Promise.resolve(websiteContent.length > 0 ? websiteContent : 'No content extracted'),

      // 2. Leadership & Key People Research (ENHANCED with advanced params)
      tavilyClient.search(
        hasAdvanced && advancedParams.contactPerson
          ? `${advancedParams.contactPerson} ${companyName} LinkedIn ${advancedParams.location || ''} ${advancedParams.jobTitle || ''} 2025`
          : `${companyName} ${targetContext} CEO founder leadership team LinkedIn 2025`,
        {
          maxResults: 4,
          searchDepth: 'advanced',
        }
      ).then(res => {
        if (!res.results || res.results.length === 0) return 'No leadership data found';
        return res.results.map(r => `${r.title}: ${r.content}`).join('\n');
      }),

      // 3. Social Media & Personal Activity (ENHANCED for targeted search)
      tavilyClient.search(
        hasAdvanced && advancedParams.contactPerson
          ? `${advancedParams.contactPerson} LinkedIn post ${advancedParams.specificFocus || ''} ${new Date().getMonth() < 6 ? 'January February March April May' : 'June July August September October November December'} 2025`
          : `${companyName} ${targetContext} LinkedIn post recent ${new Date().getMonth() < 6 ? 'January February March April May' : 'June July August September October November December'} 2025`,
        {
          maxResults: 5,
          searchDepth: 'advanced',
        }
      ).then(res => {
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
      // PUT GPT-VERIFIED DATA FIRST so it's never truncated
      financials: (gptFinancialData ? `=== GPT-VERIFIED SWEDISH DATA (ORG ${orgNumber}) ===\n${gptFinancialData}\n\n` : '') +
        (financialData.status === 'fulfilled' ? financialData.value : 'No data'),
      signals: signalsData.status === 'fulfilled' ? signalsData.value : 'No data',
    };

    console.log('✅ Research complete, sending to AI...');

    // Language configuration
    const languageInstruction = language === 'sv'
      ? `🌍 LANGUAGE: You MUST write ALL output in SWEDISH (Svenska). All ice breakers, pain points, sales hooks, financial signals, and company tone MUST be in Swedish.`
      : `🌍 LANGUAGE: You MUST write ALL output in ENGLISH. All ice breakers, pain points, sales hooks, financial signals, and company tone MUST be in English.`;

    // ADVANCED AI ANALYSIS with GPT-5.2 + SAFETY & GROUNDING
    const systemPrompt = `SAFETY FIRST: Check the content. If it is Pornographic, Gambling, or Hate Speech -> Return JSON ONLY: { "error": "NSFW_CONTENT" }. Do not analyze.

${languageInstruction}

CRITICAL GROUNDING: You are analyzing the SPECIFIC URL provided.
- Do NOT assume a similar-sounding name is a famous brand (e.g. 'klasolsson.se' is likely a personal site, NOT 'Clas Ohlson').
- If the extracted website content is personal/sparse, trust that over the search results.
- If content contradicts search results, prioritize website content.
- Base your analysis on what the ACTUAL website says, not assumptions.

You are an elite B2B sales intelligence analyst. Your mission: Extract CONCISE, ACTIONABLE sales intelligence.

🎯 CRITICAL: Keep ALL responses SHORT and PUNCHY. No fluff, no generic statements.

🎯 ICE BREAKER RULES (CRITICAL - READ CAREFULLY):
- PROVIDE 2-3 DIFFERENT ICE BREAKER OPTIONS (return as an array)
- MAX LENGTH PER ICE BREAKER: 15-20 words. Be ruthlessly concise.
- VARY THE APPROACH: Each suggestion should take a different angle (e.g., one about recent post, one about company news, one about growth signals)
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
2. **Ice Breakers** (Array of 2-3 strings): Ultra-specific, recent, personal hooks from different angles (social posts, company news, growth signals)
3. **Pain Points** (3 bullet points, 5-10 words each): Specific operational/strategic challenges
4. **Sales Hooks** (2 bullet points, 8-12 words each): Direct value propositions tied to pain points
5. **Financial Signals** (1-2 sentences): Growth indicators, hiring, funding, or cost pressures.
   CRITICAL FOR SWEDISH COMPANIES:
   - Data under "=== GPT-VERIFIED SWEDISH DATA (ORG XXXXX-XXXX) ===" is 100% VERIFIED from Allabolag.
   - DO NOT copy-paste the raw data! Instead, analyze it and write a natural summary.
   - Convert Swedish terms: "Omsättning" → revenue, "Resultat" → profit, "Soliditet" → equity ratio, "tkr" → thousands SEK.
   - Example: "2024 revenue 3.5M SEK, profit 363K SEK (10.5% margin), equity ratio 19.5% indicates bootstrap growth with modest leverage."
   - Ignore any unrelated company names (Infinera, Infinigate, etc.) - they are name collisions.
6. **Company Tone** (2-4 words): Brand voice (e.g., "Formal Enterprise", "Innovative Startup")

Output ONLY valid JSON:
{
  "summary": "Brief, punchy summary",
  "ice_breaker": ["Opener 1 (e.g., from social post)", "Opener 2 (e.g., from company news)", "Opener 3 (e.g., from growth signals)"],
  "pain_points": ["Challenge 1", "Challenge 2", "Challenge 3"],
  "sales_hooks": ["Hook 1", "Hook 2"],
  "financial_signals": "Brief growth/financial status",
  "company_tone": "Brand characterization"
}

Use the multi-source research below. Prioritize RECENT, SPECIFIC insights over generic observations.`;

    // Build advanced search context for prompt
    const advancedContext = hasAdvanced
      ? `\n\n🎯 TARGETED SEARCH - Focus your analysis on:
${advancedParams.contactPerson ? `- Contact Person: ${advancedParams.contactPerson}` : ''}
${advancedParams.jobTitle ? `- Job Title: ${advancedParams.jobTitle}` : ''}
${advancedParams.department ? `- Department: ${advancedParams.department}` : ''}
${advancedParams.location ? `- Location: ${advancedParams.location}` : ''}
${advancedParams.specificFocus ? `- Focus Area: ${advancedParams.specificFocus}` : ''}

IMPORTANT: Tailor the ice breaker, pain points, and sales hooks specifically for this person/department/location within the larger organization.`
      : '';

    const userPrompt = `Company: ${companyName} (${url})${isSwedish ? ' [🇸🇪 Swedish Company - GPT-verified Allabolag data included below]' : ''}${advancedContext}

=== WEBSITE (PRIMARY SOURCE - TRUST THIS) ===
${research.websiteContent.slice(0, 3000)}

=== LEADERSHIP & KEY PEOPLE ===
${research.leadership.slice(0, 2000)}

=== SOCIAL MEDIA ACTIVITY (Prioritize recent, personal posts!) ===
${research.socialMedia.slice(0, 2000)}

=== RECENT NEWS & PRESS ===
${research.news.slice(0, 2500)}

=== FINANCIAL RESULTS ${isSwedish ? '(INCLUDES GPT-VERIFIED ALLABOLAG DATA BELOW)' : ''} ===
${research.financials.slice(0, 4000)}

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
        ice_breaker: [],
        pain_points: [],
        sales_hooks: [],
        financial_signals: '',
        company_tone: '',
      };
    }

    // Validate structure
    if (!analysis.summary || !analysis.ice_breaker || !Array.isArray(analysis.ice_breaker) ||
        analysis.ice_breaker.length === 0 || !analysis.pain_points ||
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
