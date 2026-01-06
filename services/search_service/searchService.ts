import {
  TemplateSearchInput,
  TemplateSearchInputSchema,
  TemplateSearchResult,
} from "@/services/search_service/searchServiceTypes";
import { AtlasTemplateSearch } from "@/services/search_service/atlasTemplateSearch";

export interface TemplateSearchStrategy {
  searchConfigTemplates(input: TemplateSearchInput): Promise<TemplateSearchResult>;
}

/**
 * SearchService (extensible)
 *
 * Today: Atlas Search text matching.
 * Future: plug an AI semantic strategy as a fallback (ai_service).
 */
export class SearchService {
  private readonly atlas: TemplateSearchStrategy;
  // placeholder for future injection
  private readonly ai?: TemplateSearchStrategy;

  constructor(opts?: {
    atlas?: TemplateSearchStrategy;
    ai?: TemplateSearchStrategy;
  }) {
    this.atlas = opts?.atlas ?? new AtlasTemplateSearch();
    this.ai = opts?.ai;
  }

  /**
   * Primary entrypoint.
   *
   * Contract:
   * - Validates input.
   * - Runs Atlas text search.
   * - If no hits and AI strategy is provided, uses AI fallback.
   */
  async searchConfigTemplates(rawInput: TemplateSearchInput): Promise<TemplateSearchResult> {
    const input = TemplateSearchInputSchema.parse(rawInput);

    const atlasRes = await this.atlas.searchConfigTemplates(input);
    if (atlasRes.hits.length > 0) return atlasRes;

    if (this.ai) {
      return this.ai.searchConfigTemplates(input);
    }

    return atlasRes;
  }
}

