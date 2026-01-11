import { prisma } from "@/services/database_service/databaseService";
import {
  TemplateSearchInput,
  TemplateSearchResult,
  TemplateSearchError, JsonObject, RawHitsSchema,
} from "@/services/search_service/searchServiceTypes";
import { z } from "zod";


/** Creates an empty result with optional error */
function emptyResult(
  indexName: string,
  executionMs: number,
  error?: TemplateSearchError
): TemplateSearchResult {
  return {
    hits: [],
    meta: { strategy: "atlas_text", indexName, executionMs },
    error,
  };
}


/**
 * Atlas Search implementation for ConfigTemplate lookup.
 * Best-effort layer: validates input, catches errors, never throws.
 *
 * @param opts.indexName - Atlas Search index name (default: "configTemplate_text")
 * @param opts.limit - Max results to return (default: 5)
 * @param opts.minScore - Minimum score threshold, results below are filtered out
 */
export class AtlasTemplateSearch {
  constructor(
    private readonly opts: {
      indexName?: string;
      limit?: number;
      minScore?: number;
    } = {}
  ) {}

  /**
   * Searches ConfigTemplates via Atlas Search. Never throws.
   *
   * @param input.title - Project title, matched against ConfigTemplate.tags (boost 8x) and description (boost 2x)
   * @param input.description - Project description, matched against ConfigTemplate.description (boost 4x)
   *
   * @returns TemplateSearchResult
   *   - hits[].templateId - Matched ConfigTemplate ID
   *   - hits[].score - Atlas Search relevance score
   *   - hits[].highlights - Matched text fragments (for UI display)
   *   - meta.strategy - Always "atlas_text"
   *   - meta.indexName - Used Atlas index name
   *   - meta.executionMs - Query execution time in ms
   *   - error - Present only on failure (code: VALIDATION_ERROR | SEARCH_ERROR)
   */
  async searchConfigTemplates(input: TemplateSearchInput): Promise<TemplateSearchResult> {
    const indexName = this.opts.indexName ?? "configTemplate_text";
    const limit = this.opts.limit ?? 5;
    const start = Date.now();

    const titleQuery = input.title?.trim() ?? "";
    const descriptionQuery = input.description?.trim() ?? "";

    if (!titleQuery && !descriptionQuery) {
      return emptyResult(indexName, Date.now() - start, {
        code: "VALIDATION_ERROR",
        message: "Both title and description are empty. Search skipped.",
      });
    }

    try {
      const should: JsonObject[] = [];

      if (titleQuery) {
        should.push(
          { text: { query: titleQuery, path: "tags", score: { boost: { value: 8 } } } },
          { text: { query: titleQuery, path: "description", score: { boost: { value: 2 } } } }
        );
      }

      if (descriptionQuery) {
        should.push({
          text: { query: descriptionQuery, path: "description", score: { boost: { value: 4 } } },
        });
      }

      const pipeline: JsonObject[] = [
        {
          $search: {
            index: indexName,
            compound: { should, minimumShouldMatch: 1 },
            highlight: { path: ["description", "tags"] },
          },
        },
        { $project: { _id: 1, score: { $meta: "searchScore" }, highlights: { $meta: "searchHighlights" } } },
        { $sort: { score: -1 } },
        { $limit: limit },
      ];

      const rawUnknown: unknown = await prisma.configTemplate.aggregateRaw({ pipeline });

      const rawDocs: unknown = Array.isArray(rawUnknown)
        ? rawUnknown
        : (rawUnknown as { result?: unknown } | null)?.result ?? [];

      const docs = RawHitsSchema.parse(rawDocs);

      const minScore = this.opts.minScore;
      const hits = docs
        .map((d) => ({
          templateId: String(d._id),
          score: d.score,
          highlights: d.highlights && typeof d.highlights === "object" && !Array.isArray(d.highlights)
            ? (d.highlights as Record<string, string[]>)
            : undefined,
        }))
        .filter((h) => minScore == null || (h.score ?? 0) >= minScore);

      return {
        hits,
        meta: { strategy: "atlas_text", indexName, executionMs: Date.now() - start },
      };
    } catch (err) {
      console.error("[AtlasTemplateSearch] Search failed:", err);

      const error: TemplateSearchError = err instanceof z.ZodError
        ? { code: "VALIDATION_ERROR", message: "Response validation failed", cause: err.errors }
        : { code: "SEARCH_ERROR", message: err instanceof Error ? err.message : "Unknown error", cause: err };

      return emptyResult(indexName, Date.now() - start, error);
    }
  }
}
