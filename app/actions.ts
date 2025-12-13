'use server';

import OpenAI from 'openai';
import { TavilyClient } from '@tavily/core';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const tavily = new TavilyClient({
  apiKey: process.env.TAVILY_API_KEY || '',
});

interface AnalysisResult {
  summary: string;
  ice_breaker: string;
  pain_points: string[];
  sales_hooks: string[];
  financial_signals: string;
  company_tone: string;
}

export async function analyzeUrl(url: string): Promise<AnalysisResult> {
  try {
    // Step 1: Extract content from the URL using Tavily
    const extractResult = await tavily.extract([url]);

    if (!extractResult || !extractResult.results || extractResult.results.length === 0) {
      throw new Error('Failed to extract content from URL');
    }

    let content = extractResult.results[0].rawContent || '';

    // Extract company name from URL or content
    const urlMatch = url.match(/(?:https?:\/\/)?(?:www\.)?([^\/\.]+)/);
    const companyName = urlMatch ? urlMatch[1] : 'the company';

    // Step 2: If content is sparse, enhance with Tavily search for news/updates
    let additionalContext = '';
    if (content.length < 500) {
      try {
        const searchQuery = `${companyName} recent news updates 2025`;
        const searchResult = await tavily.search(searchQuery, {
          maxResults: 3,
          searchDepth: 'advanced',
        });

        if (searchResult && searchResult.results && searchResult.results.length > 0) {
          additionalContext = '\n\nRecent News and Updates:\n' +
            searchResult.results
              .map(r => `- ${r.title}: ${r.content}`)
              .join('\n');
        }
      } catch (searchError) {
        console.error('Search enhancement failed:', searchError);
      }
    }

    const fullContent = content + additionalContext;

    // Step 3: Advanced AI Analysis with GPT-4
    const systemPrompt = `You are an elite B2B sales intelligence analyst with deep expertise in enterprise sales strategy and company analysis.

Your mission: Analyze the provided company information and extract actionable sales intelligence that will help a B2B sales professional engage this prospect effectively.

Key Analysis Areas:
1. **Company Summary**: Distill what the company DOES (not who they are) - focus on their core value proposition and business model.
2. **Ice Breaker**: Craft a highly personalized, recent, and specific opening line based on latest news, blog posts, product launches, or company updates. Make it feel current and researched.
3. **Pain Points**: Identify 3 specific business challenges or operational hurdles this company likely faces based on their industry, growth stage, and market position.
4. **Sales Hooks**: Provide 2 compelling angles for how a sales professional could position value - tie these to the pain points and company goals.
5. **Financial Signals**: Detect any indicators of growth (hiring, funding, expansion), cost pressures, or investment priorities.
6. **Company Tone**: Characterize their brand voice and culture (e.g., "Formal/Conservative", "Innovative/Tech-forward", "Customer-centric/Friendly").

Output Format: Return ONLY valid JSON matching this exact structure:
{
  "summary": "Concise description of what the company does and their core business",
  "ice_breaker": "Personalized, timely opening line based on recent developments",
  "pain_points": ["Challenge 1", "Challenge 2", "Challenge 3"],
  "sales_hooks": ["Sales angle 1", "Sales angle 2"],
  "financial_signals": "Indicators of financial health, growth, or investment focus",
  "company_tone": "Brand voice and cultural characterization"
}

Be specific, actionable, and insightful. Avoid generic observations.`;

    const userPrompt = `Analyze this company and provide sales intelligence:\n\nURL: ${url}\n\nContent:\n${fullContent}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const responseContent = completion.choices[0]?.message?.content;

    if (!responseContent) {
      throw new Error('No response from AI');
    }

    const analysis: AnalysisResult = JSON.parse(responseContent);

    // Validate the structure
    if (!analysis.summary || !analysis.ice_breaker || !analysis.pain_points ||
        !analysis.sales_hooks || !analysis.financial_signals || !analysis.company_tone) {
      throw new Error('Invalid analysis structure');
    }

    return analysis;

  } catch (error) {
    console.error('Analysis error:', error);
    throw new Error(error instanceof Error ? error.message : 'Analysis failed');
  }
}
