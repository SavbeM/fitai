import {
  TemplateSearchInput,
  TemplateSearchResult,
  TemplateSearchError,
  AiSelectionStatus,
} from "@/services/search_service/searchServiceTypes";
import { semanticSearchConfigTemplate } from "@/services/ai_service/semantic_search";

/**
 * Creates an empty result with optional error for AI strategy.
 *
 * @param executionMs - Query execution time in ms
 * @param error - Optional error descriptor
 * @param aiStatus - AI selection status (default: "not_found")
 * @param aiReason - AI explanation for the status
 */
function emptyResult(
  executionMs: number,
  error?: TemplateSearchError,
  aiStatus?: AiSelectionStatus,
  aiReason?: string
): TemplateSearchResult {
  return {
    hits: [],
    meta: {
      strategy: "ai_semantic",
      indexName: "openai",
      executionMs,
      aiStatus,
      aiReason,
    },
    error,
  };
}

/**
 * Smart Template Search — AI-powered template selection using OpenAI.
 *
 * Implements TemplateSearchStrategy interface for use in SearchService.
 * Uses semantic search via OpenAI to find the best matching ConfigTemplate.
 *
 * Best-effort layer: validates input, catches errors, never throws.
 *
 * @param opts.candidateLimit - Max templates to pass to AI (default: 30)
 */
export class SmartTemplateSearch {
  constructor(
    private readonly opts: {
      candidateLimit?: number;
    } = {}
  ) {}

  /**
   * Searches ConfigTemplates via OpenAI semantic search. Never throws.
   *
   * Process:
   * 1. Validates input (empty check)
   * 2. Calls semanticSearchConfigTemplate with title + description
   * 3. Maps AI response to TemplateSearchResult format
   * 4. Catches errors and returns safe result
   *
   * @param input.title - Project title, sent to AI for semantic matching
   * @param input.description - Project description, sent to AI for semantic matching
   *
   * @returns TemplateSearchResult
   *   - hits[].templateId - Selected ConfigTemplate ID (only 1 or 0 hits)
   *   - hits[].confidence - AI model confidence (0-1)
   *   - hits[].reason - AI explanation for selection
   *   - meta.strategy - Always "ai_semantic"
   *   - meta.indexName - Always "openai"
   *   - meta.executionMs - Query execution time in ms
   *   - meta.aiStatus - AI selection status: "ok" | "not_found" | "inconsistent"
   *   - meta.aiReason - AI explanation (especially for failures)
   *   - error - Present only on failure (code: VALIDATION_ERROR | SEARCH_ERROR)
   */
  async searchConfigTemplates(input: TemplateSearchInput): Promise<TemplateSearchResult> {
    const start = Date.now();

    // Input validation
    const titleQuery = input.title?.trim() ?? "";
    const descriptionQuery = input.description?.trim() ?? "";

    if (!titleQuery && !descriptionQuery) {
      return emptyResult(
        Date.now() - start,
        {
          code: "VALIDATION_ERROR",
          message: "Both title and description are empty. Search skipped.",
        },
        "not_found",
        "Empty input"
      );
    }

    try {
      // Call AI semantic search
      const aiResult = await semanticSearchConfigTemplate({
        title: titleQuery,
        description: descriptionQuery,
        candidateLimit: this.opts.candidateLimit ?? 30,
      });

      const executionMs = Date.now() - start;
      const aiStatus = aiResult.status as AiSelectionStatus;

      // Map AI result to TemplateSearchResult
      if (aiResult.status === "ok" && aiResult.templateId) {
        return {
          hits: [
            {
              templateId: aiResult.templateId,
              confidence: aiResult.confidence,
              reason: aiResult.reason,
            },
          ],
          meta: {
            strategy: "ai_semantic",
            indexName: "openai",
            executionMs,
            aiStatus,
            aiReason: aiResult.reason,
          },
        };
      }

      // No match or inconsistent — return empty hits with AI status
      return emptyResult(executionMs, undefined, aiStatus, aiResult.reason);
    } catch (err) {
      console.error("[SmartTemplateSearch] Search failed:", err);

      const error: TemplateSearchError = {
        code: "SEARCH_ERROR",
        message: err instanceof Error ? err.message : "Unknown AI search error",
        cause: err,
      };

      return emptyResult(Date.now() - start, error, "not_found", "Search failed");
    }
  }
}

