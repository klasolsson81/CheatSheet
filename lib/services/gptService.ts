/**
 * GPT analysis service
 *
 * Handles all OpenAI GPT interactions for analyzing company research data.
 * Generates sales intelligence including ice breakers, pain points, sales hooks, and financial signals.
 */

import OpenAI from 'openai';
import type { ResearchData, AnalysisResult } from '@/lib/types/analysis';

/**
 * Build language instruction for GPT
 *
 * @param language - Target language ('sv' or 'en')
 * @returns Language instruction for system prompt
 */
function getLanguageInstruction(language: 'sv' | 'en'): string {
  if (language === 'sv') {
    return `SPRÅK: Generera ALLA texter (summary, ice_breaker, pain_points, sales_hooks, financial_signals, company_tone) på SVENSKA. Använd naturlig svensk text, inte översättningar.`;
  }
  return `LANGUAGE: Generate ALL text content in ENGLISH.`;
}

/**
 * Build system prompt for GPT analysis
 *
 * @param language - Target language
 * @returns Complete system prompt
 */
function buildSystemPrompt(language: 'sv' | 'en'): string {
  const languageInstruction = getLanguageInstruction(language);

  return `SAFETY FIRST: Check the content. If it is Pornographic, Gambling, or Hate Speech -> Return JSON ONLY: { "error": "NSFW_CONTENT" }. Do not analyze.

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
- SOURCE LINKING (MANDATORY):
  * The research data includes [SOURCE: url] tags
  * You MUST use the specific URL from the [SOURCE: ...] tag that corresponds to the fact/post you mention
  * Do NOT default to the main website if a specific deep link is available
  * IMPORTANT: Only create ice breakers where you can find a specific [SOURCE: url] tag
  * If you only find 1-2 entries with [SOURCE: ...] tags, only generate 1-2 ice breakers (better quality over quantity)
  * Never create an ice breaker about a fact if you cannot find its [SOURCE: ...] tag

- PERSONAL SITES / PORTFOLIOS / CONSULTANTS (SPECIAL HANDLING):
  * If website is a personal portfolio/consultant site (not a company), you MUST still generate at least 1 ice breaker
  * Look for: LinkedIn profile links on the website, LinkedIn posts in research, projects/case studies mentioned
  * Example ice breakers for personal sites:
    - "Såg din LinkedIn-profil och imponerades av ditt arbete med [skill/technology]" (use LinkedIn profile URL as source)
    - "Intressant projekt med [project name] som du visar på din sida" (use website URL as source)
    - "Din erfarenhet med [expertise area] verkar imponerande baserat på din portfolio" (use website URL as source)
  * At MINIMUM generate 1 ice breaker - use website URL as source_url if no specific LinkedIn posts found
  * Better to have 1 generic ice breaker than an empty array

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
2. **Ice Breakers** (Array of 2-3 objects with text + source_url): Ultra-specific, recent, personal hooks from different angles (social posts, company news, growth signals)
   - CRITICAL SOURCE URL EXTRACTION:
     * Every research entry starts with [SOURCE: url]
     * When you mention a fact/post in an ice breaker, you MUST extract and use the EXACT URL from that entry's [SOURCE: ...] tag
     * Example: If research shows "[SOURCE: https://linkedin.com/posts/abc123] CEO posted about AI strategy", then source_url MUST be "https://linkedin.com/posts/abc123"
     * DO NOT use the company's main website URL as source_url - use the specific article/post URL
     * If you cannot find a [SOURCE: ...] tag for the specific fact you mention, set source_url: null
   - Format: { "text": "The ice breaker text", "source_url": "https://linkedin.com/posts/..." }
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
  "ice_breaker": [
    {
      "text": "Opener 1 based on specific fact/post",
      "source_url": "EXACT URL from [SOURCE: ...] tag where you found this fact"
    },
    {
      "text": "Opener 2 from different source/angle",
      "source_url": "EXACT URL from [SOURCE: ...] tag - NOT the company homepage"
    },
    {
      "text": "Opener 3 if no specific source found",
      "source_url": null
    }
  ],
  "pain_points": ["Challenge 1", "Challenge 2", "Challenge 3"],
  "sales_hooks": ["Hook 1", "Hook 2"],
  "financial_signals": "Brief growth/financial status",
  "company_tone": "Brand characterization"
}

Use the multi-source research below. Prioritize RECENT, SPECIFIC insights over generic observations.`;
}

/**
 * Build user prompt with research data
 *
 * @param companyName - Company name
 * @param url - Company URL
 * @param research - Research data from all sources
 * @param isSwedish - Whether company is Swedish
 * @param sanitizedParams - Advanced search parameters
 * @returns Complete user prompt
 */
function buildUserPrompt(
  companyName: string,
  url: string,
  research: ResearchData,
  isSwedish: boolean,
  sanitizedParams?: {
    contactPerson?: string;
    department?: string;
    location?: string;
    jobTitle?: string;
    specificFocus?: string;
  }
): string {
  // Build advanced context if provided
  const hasAdvanced = sanitizedParams && Object.keys(sanitizedParams).length > 0;
  const advancedContext = hasAdvanced
    ? `\n\n🎯 TARGETED SEARCH - Focus your analysis on:
${sanitizedParams.contactPerson ? `- Contact Person: ${sanitizedParams.contactPerson}` : ''}
${sanitizedParams.jobTitle ? `- Job Title: ${sanitizedParams.jobTitle}` : ''}
${sanitizedParams.department ? `- Department: ${sanitizedParams.department}` : ''}
${sanitizedParams.location ? `- Location: ${sanitizedParams.location}` : ''}
${sanitizedParams.specificFocus ? `- Focus Area: ${sanitizedParams.specificFocus}` : ''}

IMPORTANT: Tailor the ice breaker, pain points, and sales hooks specifically for this person/department/location within the larger organization.`
    : '';

  return `Company: ${companyName} (${url})${isSwedish ? ' [🇸🇪 Swedish Company - GPT-verified Allabolag data included below]' : ''}${advancedContext}

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
}

/**
 * Validate analysis result structure
 *
 * @param analysis - Analysis result to validate
 * @param url - Company URL (for fallback)
 * @param language - Language for fallback message
 * @returns Validated analysis result
 */
function validateAndFixAnalysis(
  analysis: AnalysisResult,
  url: string,
  language: 'sv' | 'en'
): AnalysisResult {
  const validationErrors: string[] = [];

  if (!analysis.summary) validationErrors.push('summary');
  if (!analysis.ice_breaker) validationErrors.push('ice_breaker');
  if (analysis.ice_breaker && !Array.isArray(analysis.ice_breaker))
    validationErrors.push('ice_breaker not array');

  // Handle empty ice_breaker array with intelligent fallback (for personal sites/portfolios)
  if (analysis.ice_breaker && Array.isArray(analysis.ice_breaker) && analysis.ice_breaker.length === 0) {
    console.log('⚠️ Empty ice_breaker array detected, generating fallback...');

    const fallbackText =
      language === 'sv' ? `Imponerad av din profil och erfarenhet` : `Impressed by your profile and experience`;

    analysis.ice_breaker = [
      {
        text: fallbackText,
        source_url: url,
      },
    ];

    console.log('✅ Generated fallback ice breaker for personal site/portfolio');
  }

  if (!analysis.pain_points) validationErrors.push('pain_points');
  if (!analysis.sales_hooks) validationErrors.push('sales_hooks');
  if (!analysis.financial_signals) validationErrors.push('financial_signals');
  if (!analysis.company_tone) validationErrors.push('company_tone');

  if (validationErrors.length > 0) {
    console.error('❌ Validation failed. Missing/invalid fields:', validationErrors.join(', '));
    console.error('❌ Analysis object:', JSON.stringify(analysis, null, 2));
    throw new Error(`AI returned incomplete analysis. Missing: ${validationErrors.join(', ')}`);
  }

  return analysis;
}

/**
 * Analyze company research data using GPT
 *
 * @param openai - OpenAI client
 * @param companyName - Company name
 * @param url - Company URL
 * @param research - Research data from all sources
 * @param isSwedish - Whether company is Swedish
 * @param language - Target language for analysis
 * @param sanitizedParams - Advanced search parameters
 * @returns Analysis result with sales intelligence
 */
export async function analyzeCompanyWithGPT(
  openai: OpenAI,
  companyName: string,
  url: string,
  research: ResearchData,
  isSwedish: boolean,
  language: 'sv' | 'en',
  sanitizedParams?: {
    contactPerson?: string;
    department?: string;
    location?: string;
    jobTitle?: string;
    specificFocus?: string;
  }
): Promise<AnalysisResult> {
  const systemPrompt = buildSystemPrompt(language);
  const userPrompt = buildUserPrompt(companyName, url, research, isSwedish, sanitizedParams);

  const completion = await openai.chat.completions.create({
    model: 'gpt-5.2',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    response_format: { type: 'json_object' },
  });

  const responseContent = completion.choices[0]?.message?.content;

  if (!responseContent) {
    throw new Error('No response from AI. Please try again.');
  }

  // Log GPT response for debugging
  console.log('📝 GPT response length:', responseContent.length);
  console.log('📝 GPT response preview:', responseContent.slice(0, 500));

  let analysis: AnalysisResult;
  try {
    analysis = JSON.parse(responseContent);
  } catch (parseError) {
    console.error('❌ JSON parse error:', parseError);
    console.error('❌ Raw response:', responseContent);
    throw new Error('Failed to parse AI response. The response may be malformed.');
  }

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

  // Validate and fix analysis
  analysis = validateAndFixAnalysis(analysis, url, language);

  console.log('🎉 Analysis complete!');
  return analysis;
}
