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
}

interface ResearchData {
  websiteContent: string;
  leadership: string;
  socialMedia: string;
  news: string;
  financials: string;
  signals: string;
}

export async function analyzeUrl(url: string): Promise<AnalysisResult> {
  // Validate API keys
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured. Please add it to your environment variables.');
  }

  if (!process.env.TAVILY_API_KEY) {
    throw new Error('TAVILY_API_KEY is not configured. Please add it to your environment variables.');
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

    console.log(`🔍 Starting SMART research for: ${companyName}`);

    // MULTI-SOURCE PARALLEL RESEARCH ENGINE
    const [websiteData, leadershipData, socialData, newsData, financialData, signalsData] = await Promise.allSettled([
      // 1. Website Content Extraction
      tavilyClient.extract([url]).then(res => {
        const content = res?.results?.[0]?.rawContent || '';
        return content.length > 0 ? content : 'No content extracted';
      }),

      // 2. Leadership & Key People Research
      tavilyClient.search(`${companyName} CEO CTO CFO leadership team LinkedIn 2025`, {
        maxResults: 3,
        searchDepth: 'advanced',
      }).then(res => {
        if (!res.results || res.results.length === 0) return 'No leadership data found';
        return res.results.map(r => `${r.title}: ${r.content}`).join('\n');
      }),

      // 3. Social Media & Personal Activity
      tavilyClient.search(`${companyName} CEO LinkedIn Twitter post activity recent 2025`, {
        maxResults: 2,
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

      // 5. Financial Results & Reports
      tavilyClient.search(`${companyName} financial results quarterly earnings revenue 2025`, {
        maxResults: 2,
        searchDepth: 'advanced',
      }).then(res => {
        if (!res.results || res.results.length === 0) return 'No financial data found';
        return res.results.map(r => `${r.title}: ${r.content}`).join('\n');
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

    // ADVANCED AI ANALYSIS with GPT-5.2
    const systemPrompt = `You are an elite B2B sales intelligence analyst. Your mission: Extract CONCISE, ACTIONABLE sales intelligence.

🎯 CRITICAL: Keep ALL responses SHORT and PUNCHY. No fluff, no generic statements.

Analysis Framework:
1. **Summary** (1-2 sentences max): What they DO and their value prop
2. **Ice Breaker** (1 sentence): Ultra-specific, recent, personal hook based on CEO/leadership social posts, news, or events
3. **Pain Points** (3 bullet points, 5-10 words each): Specific operational/strategic challenges
4. **Sales Hooks** (2 bullet points, 8-12 words each): Direct value propositions tied to pain points
5. **Financial Signals** (1-2 sentences): Growth indicators, hiring, funding, or cost pressures
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

    const userPrompt = `Company: ${companyName} (${url})

=== WEBSITE ===
${research.websiteContent.slice(0, 3000)}

=== LEADERSHIP & KEY PEOPLE ===
${research.leadership.slice(0, 2000)}

=== SOCIAL MEDIA ACTIVITY ===
${research.socialMedia.slice(0, 1500)}

=== RECENT NEWS & PRESS ===
${research.news.slice(0, 2500)}

=== FINANCIAL RESULTS ===
${research.financials.slice(0, 1500)}

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

      throw new Error(`Analysis failed: ${error.message}`);
    }

    throw new Error('An unexpected error occurred. Please try again.');
  }
}
