/**
 * Unit tests for Swedish company utilities
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isSwedishCompany, searchSwedishCompanyData } from '@/lib/utils/swedishCompany';

describe('isSwedishCompany', () => {
  it('should return true for .se domains', () => {
    expect(isSwedishCompany('https://example.se')).toBe(true);
  });

  it('should return true for .se domains without protocol', () => {
    expect(isSwedishCompany('example.se')).toBe(true);
  });

  it('should return true for .se domains with paths', () => {
    expect(isSwedishCompany('https://www.example.se/about')).toBe(true);
  });

  it('should return true for .se domains with subdomains', () => {
    expect(isSwedishCompany('https://www.example.se')).toBe(true);
  });

  it('should return false for non-.se domains', () => {
    expect(isSwedishCompany('https://example.com')).toBe(false);
  });

  it('should return false for .com domains', () => {
    expect(isSwedishCompany('example.com')).toBe(false);
  });

  it('should return false for .co.uk domains', () => {
    expect(isSwedishCompany('https://example.co.uk')).toBe(false);
  });

  it('should return false for .de domains', () => {
    expect(isSwedishCompany('https://example.de')).toBe(false);
  });

  it('should be case-sensitive (lowercase .se)', () => {
    expect(isSwedishCompany('https://example.SE')).toBe(false);
  });

  it('should handle edge case with .se in path (false positive)', () => {
    // This is a known limitation - it checks for .se anywhere in URL
    expect(isSwedishCompany('https://example.com/use.se')).toBe(true);
  });
});

describe('searchSwedishCompanyData', () => {
  let mockOpenAI: any;
  let mockTavilyClient: any;

  beforeEach(() => {
    // Reset mocks before each test
    mockTavilyClient = {
      search: vi.fn(),
    };

    mockOpenAI = {
      chat: {
        completions: {
          create: vi.fn(),
        },
      },
    };
  });

  it('should find org number from GPT response', async () => {
    // Mock GPT response with org number and financial data
    mockOpenAI.chat.completions.create.mockResolvedValueOnce({
      choices: [
        {
          message: {
            role: 'assistant',
            content:
              'The company InFiNet Code HB has organisationsnummer 559365-2604. Financial data shows omsättning 3,503 tkr and resultat 363 tkr for 2024.',
            tool_calls: undefined,
          },
        },
      ],
    });

    const result = await searchSwedishCompanyData(
      'InFiNet Code',
      'https://infinetcode.se',
      mockTavilyClient,
      mockOpenAI
    );

    expect(result.orgNumber).toBe('559365-2604');
    expect(result.financialData).toContain('omsättning');
    expect(result.financialData).toContain('3,503');
    expect(mockOpenAI.chat.completions.create).toHaveBeenCalledTimes(1);
  });

  it('should handle org number without hyphen', async () => {
    mockOpenAI.chat.completions.create.mockResolvedValueOnce({
      choices: [
        {
          message: {
            role: 'assistant',
            content: 'Organisationsnummer: 5593652604',
            tool_calls: undefined,
          },
        },
      ],
    });

    const result = await searchSwedishCompanyData(
      'Test Company',
      'https://test.se',
      mockTavilyClient,
      mockOpenAI
    );

    expect(result.orgNumber).toBe('5593652604');
  });

  it('should execute function calls when GPT requests searches', async () => {
    // Mock GPT requesting a search
    mockOpenAI.chat.completions.create
      .mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: 'assistant',
              content: null,
              tool_calls: [
                {
                  id: 'call_1',
                  type: 'function',
                  function: {
                    name: 'search_web',
                    arguments: JSON.stringify({ query: 'infinetcode.se organisationsnummer' }),
                  },
                },
              ],
            },
          },
        ],
      })
      // Mock GPT final response after search
      .mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'Found organisationsnummer: 559365-2604',
              tool_calls: undefined,
            },
          },
        ],
      });

    // Mock Tavily search result
    mockTavilyClient.search.mockResolvedValueOnce({
      results: [
        {
          title: 'InFiNet Code HB - Allabolag',
          content: 'InFiNet Code HB, organisationsnummer 559365-2604',
        },
      ],
    });

    const result = await searchSwedishCompanyData(
      'InFiNet Code',
      'https://infinetcode.se',
      mockTavilyClient,
      mockOpenAI
    );

    expect(mockTavilyClient.search).toHaveBeenCalledWith('infinetcode.se organisationsnummer', {
      maxResults: 5,
      searchDepth: 'advanced',
    });
    expect(result.orgNumber).toBe('559365-2604');
  });

  it('should handle Tavily search failure gracefully', async () => {
    mockOpenAI.chat.completions.create
      .mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: 'assistant',
              content: null,
              tool_calls: [
                {
                  id: 'call_1',
                  type: 'function',
                  function: {
                    name: 'search_web',
                    arguments: JSON.stringify({ query: 'test search' }),
                  },
                },
              ],
            },
          },
        ],
      })
      .mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'Could not find org number',
              tool_calls: undefined,
            },
          },
        ],
      });

    // Mock Tavily search throwing error
    mockTavilyClient.search.mockRejectedValueOnce(new Error('Tavily API error'));

    const result = await searchSwedishCompanyData(
      'Test Company',
      'https://test.se',
      mockTavilyClient,
      mockOpenAI
    );

    // Should still return result even if search fails
    expect(result.orgNumber).toBe('');
    expect(result.financialData).toBe('Could not find org number');
  });

  it('should limit iterations to prevent infinite loops', async () => {
    // Mock GPT always requesting more function calls
    mockOpenAI.chat.completions.create.mockResolvedValue({
      choices: [
        {
          message: {
            role: 'assistant',
            content: null,
            tool_calls: [
              {
                id: 'call_1',
                type: 'function',
                function: {
                  name: 'search_web',
                  arguments: JSON.stringify({ query: 'test' }),
                },
              },
            ],
          },
        },
      ],
    });

    mockTavilyClient.search.mockResolvedValue({
      results: [{ title: 'Test', content: 'No org number' }],
    });

    const result = await searchSwedishCompanyData(
      'Test Company',
      'https://test.se',
      mockTavilyClient,
      mockOpenAI
    );

    // Should stop after MAX_GPT_ITERATIONS (5)
    expect(mockOpenAI.chat.completions.create).toHaveBeenCalledTimes(5);
    expect(result.orgNumber).toBe('');
  });

  it('should extract org number when no financial data is found', async () => {
    mockOpenAI.chat.completions.create.mockResolvedValueOnce({
      choices: [
        {
          message: {
            role: 'assistant',
            content: 'Only found org number: 559365-2604. No financial data available.',
            tool_calls: undefined,
          },
        },
      ],
    });

    const result = await searchSwedishCompanyData(
      'Test Company',
      'https://test.se',
      mockTavilyClient,
      mockOpenAI
    );

    expect(result.orgNumber).toBe('559365-2604');
    expect(result.financialData).toContain('No financial data available');
  });

  it('should handle empty results from Tavily', async () => {
    mockOpenAI.chat.completions.create
      .mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: 'assistant',
              content: null,
              tool_calls: [
                {
                  id: 'call_1',
                  type: 'function',
                  function: {
                    name: 'search_web',
                    arguments: JSON.stringify({ query: 'test search' }),
                  },
                },
              ],
            },
          },
        ],
      })
      .mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'No results found',
              tool_calls: undefined,
            },
          },
        ],
      });

    // Mock Tavily returning empty results
    mockTavilyClient.search.mockResolvedValueOnce({
      results: [],
    });

    const result = await searchSwedishCompanyData(
      'Test Company',
      'https://test.se',
      mockTavilyClient,
      mockOpenAI
    );

    expect(result.orgNumber).toBe('');
    expect(result.financialData).toBe('No results found');
  });

  it('should truncate long Tavily results to 3000 chars', async () => {
    const longContent = 'a'.repeat(5000);

    mockOpenAI.chat.completions.create
      .mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: 'assistant',
              content: null,
              tool_calls: [
                {
                  id: 'call_1',
                  type: 'function',
                  function: {
                    name: 'search_web',
                    arguments: JSON.stringify({ query: 'test' }),
                  },
                },
              ],
            },
          },
        ],
      })
      .mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'Processed results',
              tool_calls: undefined,
            },
          },
        ],
      });

    mockTavilyClient.search.mockResolvedValueOnce({
      results: [
        {
          title: 'Test',
          content: longContent,
        },
      ],
    });

    await searchSwedishCompanyData('Test Company', 'https://test.se', mockTavilyClient, mockOpenAI);

    // Check that the second message (tool response) has truncated content
    const calls = mockOpenAI.chat.completions.create.mock.calls;
    const secondCallMessages = calls[1][0].messages;
    const toolMessage = secondCallMessages.find((m: any) => m.role === 'tool');

    expect(toolMessage.content.length).toBeLessThanOrEqual(3000);
  });
});
