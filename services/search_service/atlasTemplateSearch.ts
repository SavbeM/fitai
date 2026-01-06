import { prisma } from "@/services/database_service/databaseService";
import {
  TemplateSearchInput,
  TemplateSearchResult,
} from "@/services/search_service/searchServiceTypes";
import { z } from "zod";

// Prisma expects `aggregateRaw` pipeline to be JSON-like values.
// We keep a small local JSON type to satisfy TS without falling back to `any`.
type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
type JsonObject = { [key: string]: JsonValue };

/**
 * Atlas Search implementation for ConfigTemplate lookup.
 *
 * Requires an Atlas Search index on the `ConfigTemplate` collection.
 * Default index name is "configTemplate_text" (overridable).
 *
 * Intended to be used as a strategy in SearchService.
 */
export class AtlasTemplateSearch {
  constructor(
    private readonly opts: {
      indexName?: string;
      limit?: number;
      minScore?: number;
    } = {}
  ) {}

  async searchConfigTemplates(input: TemplateSearchInput): Promise<TemplateSearchResult> {
    const indexName = this.opts.indexName ?? "configTemplate_text";
    const limit = this.opts.limit ?? 5;

    const start = Date.now();

    // Search contract:
    // - ConfigTemplate.tags  <- input.title (unformatted)
    // - ConfigTemplate.description <- input.description
    const titleQuery = input.title.trim();
    const descriptionQuery = input.description.trim();

    const should: JsonObject[] = [
      {
        text: {
          query: titleQuery,
          path: "tags",
          score: { boost: { value: 8 } },
        },
      },
      {
        text: {
          query: descriptionQuery,
          path: "description",
          score: { boost: { value: 4 } },
        },
      },
      // Small extra signal: allow title tokens to match description too.
      {
        text: {
          query: titleQuery,
          path: "description",
          score: { boost: { value: 2 } },
        },
      },
    ];

    const RawHitSchema = z.object({
      _id: z.union([z.string(), z.object({}).passthrough()]),
      score: z.number().optional(),
      highlights: z.unknown().optional(),
    });

    const RawHitsSchema = z.array(RawHitSchema);

    // Prisma Mongo: use aggregateRaw to run $search.
    const pipeline: JsonObject[] = [
      {
        $search: {
          index: indexName,
          compound: {
            should,
            minimumShouldMatch: 1,
          },
          highlight: {
            path: ["description", "tags"],
          },
        },
      },
      {
        $project: {
          _id: 1,
          score: { $meta: "searchScore" },
          highlights: { $meta: "searchHighlights" },
        },
      },
      { $sort: { score: -1 } },
      { $limit: limit },
    ];

    const rawUnknown: unknown = await prisma.configTemplate.aggregateRaw({
      pipeline,
    });

    // aggregateRaw may return an array directly or an object wrapper depending on Prisma version/runtime.
    const rawDocsUnknown: unknown = Array.isArray(rawUnknown)
      ? rawUnknown
      : (rawUnknown as { result?: unknown } | null | undefined)?.result ?? [];

    const docs = RawHitsSchema.parse(rawDocsUnknown);

    const minScore = this.opts.minScore;
    const hits = docs
      .map((d) => ({
        templateId: typeof d._id === "string" ? d._id : JSON.stringify(d._id),
        score: d.score,
        // Atlas highlight meta format is not strongly typed; keep it as unknown in parsing,
        // but expose as the declared `Record<string, string[]> | undefined` only when it matches.
        highlights:
          d.highlights && typeof d.highlights === "object" && !Array.isArray(d.highlights)
            ? (d.highlights as Record<string, string[]>)
            : undefined,
      }))
      .filter((h) => (minScore == null ? true : (h.score ?? 0) >= minScore));

    return {
      hits,
      meta: {
        strategy: "atlas_text",
        indexName,
        executionMs: Date.now() - start,
      },
    };
  }
}
