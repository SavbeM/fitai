import {
  TemplateSearchInput,
  TemplateSearchInputSchema,
  TemplateSearchResult,
} from "@/services/search_service/searchServiceTypes";
import { AtlasTemplateSearch } from "@/services/search_service/atlasTemplateSearch";
import { SmartTemplateSearch } from "@/services/search_service/smartTemplateSearch";

/**
 * Strategy interface for template search implementations.
 */
export interface TemplateSearchStrategy {
  searchConfigTemplates(input: TemplateSearchInput): Promise<TemplateSearchResult>;
}

/**
 * SearchService — extensible template search.
 * Uses Atlas Search by default, with optional AI fallback.
 *
 * @param opts.atlas - Custom Atlas strategy (default: AtlasTemplateSearch)
 * @param opts.ai - Optional AI fallback strategy, used when Atlas returns no hits
 */
export class SearchService {
  private readonly atlas: TemplateSearchStrategy;
  private readonly ai?: TemplateSearchStrategy;

  constructor(opts?: { atlas?: TemplateSearchStrategy; ai?: TemplateSearchStrategy }) {
    this.atlas = opts?.atlas ?? new AtlasTemplateSearch();
    this.ai = opts?.ai ?? new SmartTemplateSearch();
  }

  /**
   * Primary search entrypoint. Validates input, runs Atlas, falls back to AI if no hits.
   *
   * @param rawInput.title - Project title for search matching
   * @param rawInput.description - Project description for search matching
   *
   * @returns TemplateSearchResult - see searchServiceTypes.ts for structure
   * @throws ZodError if input validation fails (title/description required)
   */
  async searchConfigTemplates(rawInput: TemplateSearchInput): Promise<TemplateSearchResult> {
    const input = TemplateSearchInputSchema.parse(rawInput);

    const atlasRes = await this.atlas.searchConfigTemplates(input);
    if (atlasRes.hits.length > 0 || atlasRes.error) return atlasRes;

    if (this.ai) {
      return this.ai.searchConfigTemplates(input);
    }

    return atlasRes;
  }
}

