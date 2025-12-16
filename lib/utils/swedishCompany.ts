/**
 * Swedish company utilities
 *
 * Handles detection and data retrieval for Swedish companies (.se domains).
 * Uses GPT-driven search to find organisationsnummer and financial data from Allabolag.
 */

import OpenAI from 'openai';
import type { SwedishCompanyData } from '@/lib/types/analysis';

// Configuration constants
const MAX_GPT_ITERATIONS = 5; // Maximum GPT search iterations
const GPT_TOOL_CHOICE_THRESHOLD = 4; // When to force 'none' tool_choice

/**
 * Detect if URL belongs to a Swedish company
 *
 * @param url - Company website URL
 * @returns true if Swedish company (.se domain)
 */
export function isSwedishCompany(url: string): boolean {
  return url.includes('.se');
}

/**
 * GPT-driven search for Swedish company data
 *
 * Uses OpenAI function calling to search for:
 * 1. Organisationsnummer (Swedish company ID)
 * 2. Financial data from Allabolag (revenue, profit, equity ratio, etc.)
 *
 * @param companyName - Company name extracted from URL
 * @param url - Company website URL
 * @param tavilyClient - Tavily search client
 * @param openai - OpenAI client
 * @returns Object with org number and financial data
 */
export async function searchSwedishCompanyData(
  companyName: string,
  url: string,
  tavilyClient: any,
  openai: OpenAI
): Promise<SwedishCompanyData> {
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

You have up to 4 search_web calls. Be efficient - stop when you have both org number AND financial data.`,
    },
    {
      role: 'user',
      content: `Find BOTH org number AND financial data (omsättning, resultat) for: ${companyName} (${url})

Remember: Don't finish until you've searched for financials with the org number!`,
    },
  ];

  let iterations = 0;
  let orgNumber = '';
  let financialData = '';

  while (iterations < MAX_GPT_ITERATIONS) {
    iterations++;

    const response = await openai.chat.completions.create({
      model: 'gpt-5.2',
      messages,
      tools,
      tool_choice: iterations < GPT_TOOL_CHOICE_THRESHOLD ? 'auto' : 'none',
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
