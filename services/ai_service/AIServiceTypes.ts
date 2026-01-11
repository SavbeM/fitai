/**
 * @fileoverview Type definitions and Zod schemas for AI service layer.
 *
 * Contains input/output contracts for semantic template search and
 * AI-driven template selection functionality.
 */

import { z } from "zod";

/* ───────────────────────────────────────────────────────────────────────────
 * Semantic Search Input
 * ─────────────────────────────────────────────────────────────────────────── */

/**
 * Input DTO for semantic search of ConfigTemplates.
 *
 * @property title - Short project goal/name (e.g. "Bench press strength").
 * @property description - Detailed project description with user intent.
 * @property candidateLimit - Max templates to pass to AI model as RAG context (default ~30).
 */
export interface SemanticSearchInput {
  /** Short project goal or name (1+ chars). */
  title: string;
  /** Detailed description of the fitness goal (1+ chars). */
  description: string;
  /** Max templates to pass to AI model (1–200). Limits context window usage. */
  candidateLimit?: number;
}

/**
 * Zod schema for validating SemanticSearchInput at runtime.
 *
 * @example
 * ```ts
 * const parsed = SemanticSearchInputSchema.parse({
 *   title: "Strength training",
 *   description: "I want to increase my bench press 1RM",
 *   candidateLimit: 20,
 * });
 * ```
 */
export const SemanticSearchInputSchema = z.object({
  /** Non-empty project title string. */
  title: z.string().min(1),
  /** Non-empty project description string. */
  description: z.string().min(1),
  /** Optional limit for DB template candidates (1–200). */
  candidateLimit: z.number().int().min(1).max(200).optional(),
});

/* ───────────────────────────────────────────────────────────────────────────
 * AI Template Pick (Output)
 * ─────────────────────────────────────────────────────────────────────────── */

/**
 * Zod schema for AI model's template selection response.
 *
 * Possible statuses:
 * - `ok` — model found a matching template, `templateId` is populated.
 * - `not_found` — no suitable template in candidates.
 * - `inconsistent` — user input is contradictory or too ambiguous.
 *
 * @example
 * ```ts
 * const pick = AiTemplatePickSchema.parse({
 *   status: "ok",
 *   templateId: "65abc123def456",
 *   confidence: 0.92,
 * });
 * ```
 */
export const AiTemplatePickSchema = z.object({
  /** Selection outcome: "ok" | "not_found" | "inconsistent". */
  status: z.enum(["ok", "not_found", "inconsistent"]),
  /** Selected ConfigTemplate ID (present when status is "ok"). */
  templateId: z.string().min(1).optional(),
  /** Model confidence score (0–1), higher is better. */
  confidence: z.number().min(0).max(1).optional(),
  /** Human-readable explanation (e.g. why not_found or inconsistent). */
  reason: z.string().optional(),
});

/**
 * Output DTO representing AI model's template selection decision.
 *
 * @property status - Selection outcome ("ok", "not_found", "inconsistent").
 * @property templateId - Selected ConfigTemplate ID (only when status is "ok").
 * @property confidence - Model confidence score (0–1).
 * @property reason - Explanation for the decision (especially for failures).
 */
export type AiTemplatePick = z.infer<typeof AiTemplatePickSchema>;
