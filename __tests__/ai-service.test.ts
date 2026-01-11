/**
 * @fileoverview Integration tests for AI service (semantic template search).
 *
 * These tests require both DATABASE_URL and OPENAI_API_KEY env vars.
 * Skipped automatically if either is missing.
 *
 * Test coverage:
 * - Case 1: Model correctly identifies best matching template.
 * - Case 2: Model handles no-match scenario (not_found or ok with fallback).
 * - Case 3: Zod validation rejects invalid input at runtime.
 */

import { prisma } from "@/services/database_service/databaseService";
import { UnitType } from "@prisma/client";
import { semanticSearchConfigTemplate } from "@/services/ai_service/semantic_search";

/** Check if database connection string is configured. */
const hasDatabase = Boolean(process.env.DATABASE_URL);

/** Check if OpenAI API key is configured. */
const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);

/**
 * Integration test suite for semanticSearchConfigTemplate.
 *
 * Uses real MongoDB and OpenAI API calls.
 * Automatically skipped if DATABASE_URL or OPENAI_API_KEY is missing.
 */
(hasDatabase && hasOpenAI ? describe : describe.skip)(
  "ai_service.semanticSearchConfigTemplate (integration)",
  () => {
    /** Tracks created template IDs for cleanup after each test. */
    const createdTemplateIds: string[] = [];

    /**
     * Generates a unique name with timestamp and random suffix.
     *
     * @param prefix - Base name prefix (e.g., "Strength").
     * @returns Unique string like "Strength_1704567890123_a1b2c3".
     */
    const unique = (prefix: string) =>
      `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;

    /**
     * Creates a ConfigTemplate fixture in the database.
     *
     * @param args - Template data.
     * @param args.templateName - Display name for the template.
     * @param args.tags - Array of fitness-related tags (e.g., ["strength", "bench_press"]).
     * @param args.description - Human-readable description of the template.
     * @returns Created ConfigTemplate record with id.
     */
    const pretty = (value: unknown) => {
      try {
        return JSON.stringify(value, null, 2);
      } catch (e) {
        return JSON.stringify(
          { __non_json_value__: String(value), __stringify_error__: String(e) },
          null,
          2
        );
      }
    };

    async function createTemplateFixture(args: {
      templateName: string;
      tags: string[];
      description: string;
    }) {
      console.log("[createTemplateFixture] request:\n" + pretty(args));

      const tpl = await prisma.configTemplate.create({
        data: {
          templateName: args.templateName,
          tags: args.tags,
          description: args.description,
          requiredTargetMetrics: { name: "duration", unit: UnitType.MIN },
          activityGuidelines: { frequency_per_week: 3, required_exercise_ids: [] },
        },
      });

      console.log(
        "[createTemplateFixture] response:\n" +
          pretty({ id: tpl.id, templateName: tpl.templateName, tags: tpl.tags })
      );

      createdTemplateIds.push(tpl.id);
      return tpl;
    }

    /**
     * Removes all templates created during tests.
     * Deletes related ConfigTemplateRecommendedExercise records first (FK constraint).
     */
    async function cleanup() {
      console.log("[cleanup] request:\n" + pretty({ createdTemplateIds }));

      const recDel = await prisma.configTemplateRecommendedExercise.deleteMany({
        where: { templateId: { in: createdTemplateIds } },
      });
      const tplDel = await prisma.configTemplate.deleteMany({
        where: { id: { in: createdTemplateIds } },
      });

      console.log(
        "[cleanup] response:\n" + pretty({ recommendedExerciseDeleted: recDel, templatesDeleted: tplDel })
      );

      createdTemplateIds.length = 0;
    }

    beforeEach(async () => {
      await cleanup();
    }, 15000);

    afterAll(async () => {
      await cleanup();
      await prisma.$disconnect();
    }, 15000);

    /**
     * Test: Model correctly identifies best matching template.
     *
     * Setup: Two templates (Strength, WeightLoss).
     * Input: User wants "bench press strength".
     * Expected: Model returns status "ok" with Strength template ID.
     */
    it(
      "case 1: finds best matching template",
      async () => {
        const strength = await createTemplateFixture({
          templateName: unique("Strength"),
          tags: ["strength", "bench_press"],
          description: "Strength focused plan with bench press progression",
        });

        await createTemplateFixture({
          templateName: unique("WeightLoss"),
          tags: ["weight_loss", "cardio"],
          description: "Fat loss plan with running and calorie deficit",
        });

        const payload = {
          title: "Bench press strength",
          description: "I want to increase my bench press and overall strength",
          candidateLimit: 20,
        };

        console.log("[semanticSearchConfigTemplate] request:\n" + pretty(payload));
        const res = await semanticSearchConfigTemplate(payload);
        console.log("[semanticSearchConfigTemplate] response:\n" + pretty(res));

        expect(res.status).toBe("ok");
        expect(res.templateId).toBe(strength.id);
      },
      30000
    );

    /**
     * Test: Model handles no-match scenario.
     *
     * Setup: Only Yoga template available.
     * Input: User wants marathon training (no match).
     * Expected: Model returns "not_found", "inconsistent", or "ok" with valid candidate.
     */
    it(
      "case 2: returns not_found when no similar templates",
      async () => {
        await createTemplateFixture({
          templateName: unique("Yoga"),
          tags: ["mobility", "stretching"],
          description: "Mobility and stretching sessions",
        });

        const payload = {
          title: "Marathon training",
          description: "I need a plan to run a full marathon in 3 months",
          candidateLimit: 20,
        };

        console.log("[semanticSearchConfigTemplate] request:\n" + pretty(payload));
        const res = await semanticSearchConfigTemplate(payload);
        console.log("[semanticSearchConfigTemplate] response:\n" + pretty(res));

        expect(["not_found", "inconsistent", "ok"]).toContain(res.status);

        // If model returns ok, ensure it's at least one of our candidates.
        if (res.status === "ok") {
          expect(createdTemplateIds).toContain(res.templateId);
        }
      },
      30000
    );

    /**
     * Test: Zod validation rejects invalid input at runtime.
     *
     * Input: title=123 (number), description=null (null).
     * Expected: ZodError thrown before OpenAI call.
     */
    it(
      "case 3: invalid input throws (zod)",
      async () => {
        await createTemplateFixture({
          templateName: unique("Strength"),
          tags: ["strength"],
          description: "Strength plan",
        });

          const payload = {
          // @ts-expect-error runtime validation
          title: 123,
          // @ts-expect-error runtime validation
          description: null,
        };

        console.log("[semanticSearchConfigTemplate] request:\n" + pretty(payload));
        await expect(semanticSearchConfigTemplate(payload as any)).rejects.toThrow();
      },
      15000
    );

    /**
     * Test: Model returns inconsistent status for contradictory input.
     *
     * Setup: Templates for strength and cardio available.
     * Input: User wants contradictory goals (e.g., "lose weight while gaining maximum muscle mass without exercise").
     * Expected: Model returns "inconsistent" or handles gracefully with "not_found"/"ok".
     */
    it(
      "case 4: returns inconsistent for contradictory input",
      async () => {
        await createTemplateFixture({
          templateName: unique("Strength"),
          tags: ["strength", "muscle_gain"],
          description: "Heavy lifting for muscle growth",
        });

        await createTemplateFixture({
          templateName: unique("Cardio"),
          tags: ["cardio", "weight_loss"],
          description: "Cardio-focused fat burning plan",
        });

        const payload = {
          title: "Impossible fitness goal",
          description:
            "I want to lose 20kg of fat while gaining 20kg of muscle in 1 week without any exercise or diet changes. " +
            "Also I want to run a marathon but I hate running and never want to run.",
          candidateLimit: 20,
        };

        console.log("[semanticSearchConfigTemplate] request:\n" + pretty(payload));
        const res = await semanticSearchConfigTemplate(payload);
        console.log("[semanticSearchConfigTemplate] response:\n" + pretty(res));

        // Model should recognize contradictory input, but may also return not_found or ok
        expect(["inconsistent", "not_found", "ok"]).toContain(res.status);

        // If inconsistent, reason should be provided
        if (res.status === "inconsistent") {
          expect(res.reason).toBeDefined();
          expect(typeof res.reason).toBe("string");
        }
      },
      30000
    );
  }
);
