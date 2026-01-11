/**
 * @fileoverview Semantic search module for ConfigTemplate selection.
 *
 * Implements a RAG-ish (Retrieval Augmented Generation) approach:
 * 1. Fetches candidate templates from MongoDB via Prisma.
 * 2. Sends candidates + user query to OpenAI for structured selection.
 * 3. Validates response with Zod and ensures picked ID exists in candidates.
 */

import OpenAI from "openai";
import { databaseService } from "@/services/database_service/databaseService";
import {
  PICK_CONFIG_TEMPLATE_SYSTEM,
  pickConfigTemplateUserPrompt,
} from "@/services/ai_service/prompts";
import {
  AiTemplatePick,
  AiTemplatePickSchema,
  SemanticSearchInput,
  SemanticSearchInputSchema,
} from "@/services/ai_service/AIServiceTypes";

/* ───────────────────────────────────────────────────────────────────────────
 * OpenAI Client Factory
 * ─────────────────────────────────────────────────────────────────────────── */

/**
 * Creates and returns an OpenAI client instance.
 *
 * Reads `OPENAI_API_KEY` from process.env.
 *
 * @returns Configured OpenAI client.
 * @throws If OPENAI_API_KEY is missing (OpenAI SDK throws).
 */
function getOpenAIClient(): OpenAI {
  const env = process.env;
  return new OpenAI({ apiKey: env.OPENAI_API_KEY });
}

/* ───────────────────────────────────────────────────────────────────────────
 * Semantic Search Function
 * ─────────────────────────────────────────────────────────────────────────── */

/**
 * Performs semantic search to find the best matching ConfigTemplate.
 *
 * **Algorithm (RAG-ish baseline):**
 * 1. Validate input with Zod schema.
 * 2. Fetch all ConfigTemplates from DB (limited by `candidateLimit`).
 * 3. Build a user prompt with project info and candidate list.
 * 4. Call OpenAI (gpt-5-nano) with JSON response mode.
 * 5. Parse and validate response with `AiTemplatePickSchema`.
 * 6. Extra guard: ensure picked templateId exists in candidates.
 *
 * @param input - Search parameters containing title, description, and optional candidateLimit.
 *
 * @returns AI selection result with status, templateId (if found), confidence, and reason.
 *
 * @throws {ZodError} If input validation fails.
 *
 * @example
 * ```ts
 * const result = await semanticSearchConfigTemplate({
 *   title: "Bench press strength",
 *   description: "I want to increase my 1RM bench press",
 *   candidateLimit: 20,
 * });
 *
 * if (result.status === "ok") {
 *   console.log("Best template:", result.templateId);
 * }
 * ```
 */
export async function semanticSearchConfigTemplate(
  input: SemanticSearchInput
): Promise<AiTemplatePick> {
  const parsedInput = SemanticSearchInputSchema.parse(input);

  const candidates = await databaseService.getAllConfigTemplates();

  const candidateLimit = parsedInput.candidateLimit ?? 30;
  const compactCandidates = (candidates ?? []).slice(0, candidateLimit).map((t) => ({
    id: t.id,
    templateName: t.templateName,
    tags: t.tags,
    description: t.description ?? null,
  }));

  if (compactCandidates.length === 0) {
    return { status: "not_found", reason: "No templates in database" };
  }

  const client = getOpenAIClient();

  const userPrompt = pickConfigTemplateUserPrompt({
    title: parsedInput.title,
    description: parsedInput.description,
    candidates: compactCandidates,
  });

  const resp = await client.chat.completions.create({
    model: "gpt-5-nano",
    messages: [
      { role: "system", content: PICK_CONFIG_TEMPLATE_SYSTEM },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
  });

  const content = resp.choices[0]?.message?.content;
  if (!content) {
    return { status: "not_found", reason: "Empty model response" };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return { status: "not_found", reason: "Model returned non-JSON" };
  }

  const pick = AiTemplatePickSchema.parse(parsed);

  if (pick.status === "ok") {
    const ok = pick.templateId && compactCandidates.some((c) => c.id === pick.templateId);
    if (!ok) {
      return { status: "not_found", reason: "Picked templateId not in candidates" };
    }
  }


  if (pick.status === "inconsistent"){
    return { status: "inconsistent", reason: "Inconsistent input data" };
  }
  return pick;
}
