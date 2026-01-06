import { SearchService } from "@/services/search_service/searchService";
import type { TemplateSearchStrategy } from "@/services/search_service/searchService";
import type { TemplateSearchResult } from "@/services/search_service/searchServiceTypes";

class FakeStrategy implements TemplateSearchStrategy {
  constructor(private readonly hits: Array<{ templateId: string; score?: number }> = []) {}
  async searchConfigTemplates(): Promise<TemplateSearchResult> {
    return { hits: this.hits, meta: { strategy: "atlas_text", indexName: "fake" } };
  }
}

class FakeAIStrategy implements TemplateSearchStrategy {
  async searchConfigTemplates(): Promise<TemplateSearchResult> {
    return {
      hits: [{ templateId: "ai_template_1", score: 0.9 }],
      meta: { strategy: "ai_semantic", indexName: "n/a" },
    };
  }
}

describe("SearchService", () => {
  it("returns Atlas hits when found", async () => {
    const svc = new SearchService({ atlas: new FakeStrategy([{ templateId: "t1", score: 10 }]) });
    const res = await svc.searchConfigTemplates({
      title: "Bench press",
      description: "Get stronger",
    });

    expect(res.hits[0].templateId).toBe("t1");
    expect(res.meta.strategy).toBe("atlas_text");
  });

  it("falls back to AI when Atlas returns empty and AI provided", async () => {
    const svc = new SearchService({ atlas: new FakeStrategy([]), ai: new FakeAIStrategy() });
    const res = await svc.searchConfigTemplates({
      title: "Bench press",
      description: "Get stronger",
    });

    expect(res.hits[0].templateId).toBe("ai_template_1");
    expect(res.meta.strategy).toBe("ai_semantic");
  });

  it("validates input (empty strings throw)", async () => {
    const svc = new SearchService({ atlas: new FakeStrategy([]) });
    await expect(
      svc.searchConfigTemplates({
        // @ts-expect-error intentional invalid types to ensure runtime Zod validation is hit
        title: 123,
        // @ts-expect-error intentional invalid types to ensure runtime Zod validation is hit
        description: null,
      })
    ).rejects.toThrow();
  });
});
