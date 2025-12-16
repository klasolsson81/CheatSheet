/**
 * Zod schemas for runtime type validation
 *
 * These schemas provide runtime validation for API responses and user inputs.
 * They complement the TypeScript types in lib/types/analysis.ts with runtime checks.
 */

import { z } from 'zod';

/**
 * Schema for ice breaker object
 */
export const IceBreakerSchema = z.object({
  text: z.string().min(1, 'Ice breaker text cannot be empty').max(200, 'Ice breaker text too long'),
  source_url: z.string().url().optional().nullable(),
});

/**
 * Schema for analysis result from GPT
 *
 * Validates the complete structure returned by GPT analysis
 */
export const AnalysisResultSchema = z.object({
  summary: z.string().min(1, 'Summary is required').max(1000, 'Summary too long'),
  ice_breaker: z
    .array(IceBreakerSchema)
    .min(1, 'At least one ice breaker required')
    .max(5, 'Too many ice breakers'),
  pain_points: z
    .array(z.string().min(1).max(200))
    .min(1, 'At least one pain point required')
    .max(10, 'Too many pain points'),
  sales_hooks: z
    .array(z.string().min(1).max(200))
    .min(1, 'At least one sales hook required')
    .max(10, 'Too many sales hooks'),
  financial_signals: z.string().min(1, 'Financial signals are required').max(1000, 'Financial signals too long'),
  company_tone: z.string().min(1, 'Company tone is required').max(100, 'Company tone too long'),
  error: z.string().optional(),
});

/**
 * Schema for NSFW content error response
 */
export const NSFWErrorSchema = z.object({
  error: z.literal('NSFW_CONTENT'),
  summary: z.string().optional(),
  ice_breaker: z.array(IceBreakerSchema).optional(),
  pain_points: z.array(z.string()).optional(),
  sales_hooks: z.array(z.string()).optional(),
  financial_signals: z.string().optional(),
  company_tone: z.string().optional(),
});

/**
 * Union schema for analysis result or NSFW error
 */
export const AnalysisResponseSchema = z.union([AnalysisResultSchema, NSFWErrorSchema]);

/**
 * Schema for advanced search parameters
 */
export const AdvancedSearchParamsSchema = z.object({
  contactPerson: z.string().max(150).optional(),
  department: z.string().max(100).optional(),
  location: z.string().max(100).optional(),
  jobTitle: z.string().max(100).optional(),
  specificFocus: z.string().max(300).optional(),
});

/**
 * Schema for URL input validation
 */
export const UrlInputSchema = z
  .string()
  .min(1, 'URL cannot be empty')
  .max(500, 'URL too long')
  .refine((url) => {
    // Check if URL contains dangerous patterns
    const dangerousPatterns = [
      /javascript:/i,
      /data:/i,
      /vbscript:/i,
      /file:/i,
      /about:/i,
      /<script/i,
      /on\w+=/i,
    ];
    return !dangerousPatterns.some((pattern) => pattern.test(url));
  }, 'URL contains invalid or dangerous patterns');

/**
 * Schema for research data
 */
export const ResearchDataSchema = z.object({
  websiteContent: z.string(),
  leadership: z.string(),
  socialMedia: z.string(),
  news: z.string(),
  financials: z.string(),
  signals: z.string(),
});

/**
 * Schema for Swedish company data
 */
export const SwedishCompanyDataSchema = z.object({
  orgNumber: z.string(),
  financialData: z.string(),
});

/**
 * Type inference helpers
 * These allow TypeScript to infer types from Zod schemas
 */
export type IceBreakerInput = z.infer<typeof IceBreakerSchema>;
export type AnalysisResultInput = z.infer<typeof AnalysisResultSchema>;
export type AnalysisResponseInput = z.infer<typeof AnalysisResponseSchema>;
export type AdvancedSearchParamsInput = z.infer<typeof AdvancedSearchParamsSchema>;
export type UrlInputInput = z.infer<typeof UrlInputSchema>;
export type ResearchDataInput = z.infer<typeof ResearchDataSchema>;
export type SwedishCompanyDataInput = z.infer<typeof SwedishCompanyDataSchema>;
