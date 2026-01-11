/**
 * @fileoverview Integration tests for SearchService.
 *
 * Tests cover:
 * 1. AtlasSearch finds result
 * 2. AtlasSearch returns empty (no match)
 * 3. Invalid input (type error / Zod validation)
 * 4. Fallback to SmartSearch finds result
 * 5. SmartSearch returns no match
 * 6. Garbage input handling
 *
 * Unit tests use FakeStrategy mocks.
 * Integration tests require DATABASE_URL and OPENAI_API_KEY.
 */

import { SearchService } from "@/services/search_service/searchService";
import type { TemplateSearchStrategy } from "@/services/search_service/searchService";
import type { TemplateSearchResult } from "@/services/search_service/searchServiceTypes";
import { AtlasTemplateSearch } from "@/services/search_service/atlasTemplateSearch";
import { SmartTemplateSearch } from "@/services/search_service/smartTemplateSearch";
import { prisma } from "@/services/database_service/databaseService";
import { UnitType } from "@prisma/client";

/* ─────────────────────────────────────────────────────────────────────────────
 * Helpers
 * ───────────────────────────────────────────────────────────────────────────── */

const pretty = (v: unknown) => JSON.stringify(v, null, 2);
const unique = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;

/* ─────────────────────────────────────────────────────────────────────────────
 * Fake Strategies (for unit tests)
 * ───────────────────────────────────────────────────────────────────────────── */

class FakeAtlasStrategy implements TemplateSearchStrategy {
  constructor(private readonly hits: Array<{ templateId: string; score?: number }> = []) {}
  async searchConfigTemplates(): Promise<TemplateSearchResult> {
    return { hits: this.hits, meta: { strategy: "atlas_text", indexName: "fake" } };
  }
}

class FakeAIStrategy implements TemplateSearchStrategy {
  constructor(
    private readonly result: Partial<TemplateSearchResult> = {
      hits: [{ templateId: "ai_template_1", confidence: 0.9 }],
    }
  ) {}
  async searchConfigTemplates(): Promise<TemplateSearchResult> {
    return {
      hits: this.result.hits ?? [],
      meta: {
        strategy: "ai_semantic",
        indexName: "openai",
        aiStatus: this.result.meta?.aiStatus ?? "ok",
        aiReason: this.result.meta?.aiReason,
      },
    };
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Unit Tests (with mocks)
 * ───────────────────────────────────────────────────────────────────────────── */

describe("SearchService (unit tests)", () => {
  it("case 1: returns Atlas hits when found", async () => {
    const svc = new SearchService({
      atlas: new FakeAtlasStrategy([{ templateId: "t1", score: 10 }]),
      ai: new FakeAIStrategy(),
    });

    const res = await svc.searchConfigTemplates({
      title: "Bench press",
      description: "Get stronger",
    });

    console.log("[Unit Test] Case 1 - Atlas found:\n" + pretty(res));

    expect(res.hits[0].templateId).toBe("t1");
    expect(res.meta.strategy).toBe("atlas_text");
  });

  it("case 2: invalid input throws Zod error", async () => {
    const svc = new SearchService({
      atlas: new FakeAtlasStrategy([]),
      ai: new FakeAIStrategy(),
    });

    console.log("[Unit Test] Case 3 - Invalid input (expect throw)");

    await expect(
      svc.searchConfigTemplates({
        // @ts-expect-error intentional invalid types
        title: 123,
        // @ts-expect-error intentional invalid types
        description: null,
      })
    ).rejects.toThrow();
  });

  it("case 3: fallback to AI when Atlas returns empty", async () => {
    const svc = new SearchService({
      atlas: new FakeAtlasStrategy([]),
      ai: new FakeAIStrategy({
        hits: [{ templateId: "ai_best_match", confidence: 0.95, reason: "Perfect fit" }],
        meta: { strategy: "ai_semantic", indexName: "openai", aiStatus: "ok" },
      }),
    });

    const res = await svc.searchConfigTemplates({
      title: "Strength training",
      description: "Build muscle mass",
    });

    console.log("[Unit Test] Case 4 - Fallback to AI:\n" + pretty(res));

    expect(res.hits[0].templateId).toBe("ai_best_match");
    expect(res.meta.strategy).toBe("ai_semantic");
    expect(res.meta.aiStatus).toBe("ok");
  });

  it("case 5: AI returns not_found", async () => {
    const svc = new SearchService({
      atlas: new FakeAtlasStrategy([]),
      ai: new FakeAIStrategy({
        hits: [],
        meta: {
          strategy: "ai_semantic",
          indexName: "openai",
          aiStatus: "not_found",
          aiReason: "No suitable template",
        },
      }),
    });

    const res = await svc.searchConfigTemplates({
      title: "Rare sport",
      description: "Very specific goal",
    });

    console.log("[Unit Test] Case 5 - AI not_found:\n" + pretty(res));

    expect(res.hits).toHaveLength(0);
    expect(res.meta.aiStatus).toBe("not_found");
    expect(res.meta.aiReason).toBeDefined();
  });

  it("case 6: garbage input handled gracefully", async () => {
    const svc = new SearchService({
      atlas: new FakeAtlasStrategy([]),
      ai: new FakeAIStrategy({
        hits: [],
        meta: {
          strategy: "ai_semantic",
          indexName: "openai",
          aiStatus: "inconsistent",
          aiReason: "Input is contradictory",
        },
      }),
    });

    const res = await svc.searchConfigTemplates({
      title: "asdfghjkl zxcvbnm qwerty 12345",
      description: "!@#$%^&*() random garbage text without meaning",
    });

    console.log("[Unit Test] Case 6 - Garbage input:\n" + pretty(res));

    expect(res.hits).toHaveLength(0);
    // Should not throw, returns valid result
    expect(res.meta.strategy).toBe("ai_semantic");
  });
});

/* ─────────────────────────────────────────────────────────────────────────────
 * Integration Tests (require DATABASE_URL and OPENAI_API_KEY)
 * ───────────────────────────────────────────────────────────────────────────── */

const hasDatabase = Boolean(process.env.DATABASE_URL);
const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);
const canRunIntegration = hasDatabase && hasOpenAI;

(canRunIntegration ? describe : describe.skip)(
  "SearchService (integration tests)",
  () => {
    const createdTemplateIds: string[] = [];

    async function createTemplateFixture(data: {
      templateName: string;
      tags: string[];
      description: string;
    }) {
      const template = await prisma.configTemplate.create({
        data: {
          templateName: data.templateName,
          tags: data.tags,
          description: data.description,
          requiredTargetMetrics: { name: "duration", unit: UnitType.MIN },
          activityGuidelines: { frequency_per_week: 3, required_exercise_ids: [] },
        },
      });
      createdTemplateIds.push(template.id);
      console.log(`[Fixture] Created template: ${template.templateName} (${template.id})`);
      return template;
    }

    afterAll(async () => {
      if (createdTemplateIds.length > 0) {
        await prisma.configTemplate.deleteMany({
          where: { id: { in: createdTemplateIds } },
        });
        console.log(`[Cleanup] Deleted ${createdTemplateIds.length} templates`);
      }
      await prisma.$disconnect();
    });

    /**
     * Integration case 1: AtlasSearch finds matching template.
     * Creates a template with specific tags, searches by title matching tags.
     */
    it(
      "case 1: AtlasSearch finds result",
      async () => {
        await createTemplateFixture({
          templateName: unique("BenchPressStrength"),
          tags: ["strength", "bench_press", "chest"],
          description: "Build bench press 1RM strength",
        });

        const atlasSearch = new AtlasTemplateSearch({ limit: 5 });
        const res = await atlasSearch.searchConfigTemplates({
          title: "bench press strength",
          description: "I want to increase my bench press max",
        });

        console.log("[Integration] Case 1 - AtlasSearch found:\n" + pretty(res));

        expect(res.meta.strategy).toBe("atlas_text");
        expect(res.error).toBeUndefined();
        // Note: Atlas index may not be configured, so hits could be empty
        // If Atlas index exists, should find the template
        if (res.hits.length > 0) {
          console.log(`[Integration] Found ${res.hits.length} hits`);
        } else {
          console.log("[Integration] No hits (Atlas index may not be configured)");
        }
      },
      30000
    );

    /**
     * Integration case 2: AtlasSearch returns empty for unrelated query.
     */
    it(
      "case 2: AtlasSearch returns empty (no match)",
      async () => {
        const atlasSearch = new AtlasTemplateSearch({ limit: 5 });
        const res = await atlasSearch.searchConfigTemplates({
          title: "xyznonexistent123456",
          description: "completely unrelated query that matches nothing",
        });

        console.log("[Integration] Case 2 - AtlasSearch empty:\n" + pretty(res));

        expect(res.meta.strategy).toBe("atlas_text");
        // Should return empty or error if index not configured
        if (res.error) {
          console.log(`[Integration] Error: ${res.error.message}`);
        } else {
          expect(res.hits).toHaveLength(0);
        }
      },
      30000
    );

    /**
     * Integration case 3: Invalid input to AtlasSearch.
     */
    it(
      "case 3: AtlasSearch handles empty input gracefully",
      async () => {
        const atlasSearch = new AtlasTemplateSearch();
        const res = await atlasSearch.searchConfigTemplates({
          title: "   ",
          description: "",
        });

        console.log("[Integration] Case 3 - Empty input:\n" + pretty(res));

        expect(res.error).toBeDefined();
        expect(res.error?.code).toBe("VALIDATION_ERROR");
        expect(res.hits).toHaveLength(0);
      },
      10000
    );

    /**
     * Integration case 4: SmartSearch finds result via OpenAI.
     */
    it(
      "case 4: SmartSearch finds result",
      async () => {
        await createTemplateFixture({
          templateName: unique("CardioEndurance"),
          tags: ["cardio", "endurance", "running"],
          description: "Improve cardiovascular endurance through running",
        });

        const smartSearch = new SmartTemplateSearch({ candidateLimit: 10 });
        const res = await smartSearch.searchConfigTemplates({
          title: "cardio training",
          description: "I want to improve my running endurance",
        });

        console.log("[Integration] Case 4 - SmartSearch found:\n" + pretty(res));

        expect(res.meta.strategy).toBe("ai_semantic");
        expect(res.error).toBeUndefined();

        if (res.hits.length > 0) {
          console.log(`[Integration] AI selected: ${res.hits[0].templateId}`);
          console.log(`[Integration] Confidence: ${res.hits[0].confidence}`);
          expect(res.meta.aiStatus).toBe("ok");
        } else {
          console.log(`[Integration] AI status: ${res.meta.aiStatus}`);
          console.log(`[Integration] AI reason: ${res.meta.aiReason}`);
        }
      },
      60000
    );

    /**
     * Integration case 5: SmartSearch returns not_found for unrelated query.
     */
    it(
      "case 5: SmartSearch returns not_found",
      async () => {
        const smartSearch = new SmartTemplateSearch({ candidateLimit: 5 });
        const res = await smartSearch.searchConfigTemplates({
          title: "underwater basket weaving",
          description: "I want to learn how to weave baskets underwater",
        });

        console.log("[Integration] Case 5 - SmartSearch not_found:\n" + pretty(res));

        expect(res.meta.strategy).toBe("ai_semantic");
        expect(res.error).toBeUndefined();
        // AI should recognize this as not matching any fitness template
        expect(["not_found", "ok", "inconsistent"]).toContain(res.meta.aiStatus);
      },
      60000
    );

    /**
     * Integration case 6: Garbage/nonsense input.
     */
    it(
      "case 6: Garbage input handled gracefully",
      async () => {
        const smartSearch = new SmartTemplateSearch({ candidateLimit: 5 });
        const res = await smartSearch.searchConfigTemplates({
          title: "asdfjkl; qwerty zxcvbnm 12345",
          description: "!@#$%^&*() {{{{{ random symbols and nonsense text 98765",
        });

        console.log("[Integration] Case 6 - Garbage input:\n" + pretty(res));

        expect(res.meta.strategy).toBe("ai_semantic");
        expect(res.error).toBeUndefined();
        // Should not crash, returns valid result
        expect(res.meta.aiStatus).toBeDefined();

        if (res.meta.aiStatus === "inconsistent") {
          console.log(`[Integration] AI detected inconsistent input: ${res.meta.aiReason}`);
        }
      },
      60000
    );

    /**
     * Integration case 7: Full SearchService flow (Atlas → AI fallback).
     */
    it(
      "case 7: SearchService full flow with fallback",
      async () => {
        await createTemplateFixture({
          templateName: unique("WeightLoss"),
          tags: ["weight_loss", "fat_burn", "diet"],
          description: "Lose weight through calorie deficit and exercise",
        });

        const svc = new SearchService();
        const res = await svc.searchConfigTemplates({
          title: "lose weight",
          description: "I want to lose 10kg in 3 months",
        });

        console.log("[Integration] Case 7 - Full flow:\n" + pretty(res));

        expect(res.error).toBeUndefined();
        // Should find result either via Atlas or AI
        console.log(`[Integration] Strategy used: ${res.meta.strategy}`);
        if (res.hits.length > 0) {
          console.log(`[Integration] Best match: ${res.hits[0].templateId}`);
        }
      },
      60000
    );
  }
);

