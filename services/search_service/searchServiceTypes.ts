import {z} from "zod";

/** Input validation schema for template search */
export const TemplateSearchInputSchema = z.object({
    title: z.string().min(1),
    description: z.string().min(1),
});

/**
 * Input for template search.
 * @property title - Project title, used to match ConfigTemplate.tags
 * @property description - Project description, used to match ConfigTemplate.description
 */
export type TemplateSearchInput = z.infer<typeof TemplateSearchInputSchema>;

/**
 * Single search hit.
 * @property templateId - ConfigTemplate ID from database
 * @property score - Relevance score from search engine (higher = better match)
 * @property highlights - Text fragments with matched terms (for UI highlighting)
 * @property confidence - AI model confidence (0-1), only for ai_semantic strategy
 * @property reason - AI explanation for selection, only for ai_semantic strategy
 */
export type TemplateSearchHit = {
    templateId: string;
    score?: number;
    highlights?: Record<string, string[]>;
    confidence?: number;
    reason?: string;
};

/**
 * Error returned when search fails gracefully (best-effort layer).
 * @property code - Error type: VALIDATION_ERROR (bad input/response), SEARCH_ERROR (DB/network), UNKNOWN_ERROR
 * @property message - Human-readable error description
 * @property cause - Original error object for debugging
 */
export type TemplateSearchError = {
    code: "VALIDATION_ERROR" | "SEARCH_ERROR" | "UNKNOWN_ERROR";
    message: string;
    cause?: unknown;
};

/**
 * AI selection status from semantic search.
 * - ok: template found
 * - not_found: no suitable template
 * - inconsistent: user input is contradictory
 */
export type AiSelectionStatus = "ok" | "not_found" | "inconsistent";

/**
 * Result of a template search. Always returned, never throws.
 * @property hits - Matched templates sorted by relevance (empty on error or no matches)
 * @property meta.strategy - Search strategy used: "atlas_text" or "ai_semantic"
 * @property meta.indexName - Atlas Search index name (or "openai" for AI)
 * @property meta.executionMs - Query execution time in milliseconds
 * @property meta.aiStatus - AI selection status, only for ai_semantic strategy
 * @property meta.aiReason - AI explanation, only for ai_semantic when no match
 * @property error - Present only on failure, hits will be empty
 */
export type TemplateSearchResult = {
    hits: TemplateSearchHit[];
    meta: {
        strategy: "atlas_text" | "ai_semantic";
        indexName: string;
        executionMs?: number;
        aiStatus?: AiSelectionStatus;
        aiReason?: string;
    };
    error?: TemplateSearchError;
};


// JSON types for Prisma aggregateRaw pipeline
export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
export type JsonObject = { [key: string]: JsonValue };

// Zod schema for raw aggregation result
export const RawHitSchema = z.object({
    _id: z.unknown(),
    score: z.number().optional(),
    highlights: z.unknown().optional(),
});

/**
 * Zod schema for array of raw aggregation results
 *
 */
export const RawHitsSchema = z.array(RawHitSchema);
