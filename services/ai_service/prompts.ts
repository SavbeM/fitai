/**
 * @fileoverview Prompt templates for OpenAI chat completions.
 *
 * Contains system and user prompts used by semantic_search module
 * to instruct the model how to pick the best ConfigTemplate.
 */

/* ───────────────────────────────────────────────────────────────────────────
 * System Prompt
 * ─────────────────────────────────────────────────────────────────────────── */

/**
 * System-level instructions for the template selection model.
 *
 * Instructs the model to:
 * - Return strictly valid JSON (no markdown).
 * - Pick only from provided candidate list.
 * - Return "inconsistent" if user input is contradictory.
 * - Return "not_found" if no candidate fits.
 */
export const PICK_CONFIG_TEMPLATE_SYSTEM = `You select the best existing ConfigTemplate for a fitness project.

Rules:
- Return ONLY valid JSON.
- No markdown.
- Choose ONLY from the provided candidates.
- If title/description is contradictory or too ambiguous, return status: "inconsistent".
- If none fits, return status: "not_found".
`;

/* ───────────────────────────────────────────────────────────────────────────
 * User Prompt Builder
 * ─────────────────────────────────────────────────────────────────────────── */

/**
 * Candidate template info passed to the user prompt.
 *
 * @property id - ConfigTemplate ID.
 * @property templateName - Template display name.
 * @property tags - Array of relevant fitness tags.
 * @property description - Optional template description.
 */
export interface PickPromptCandidate {
  id: string;
  templateName: string;
  tags: string[];
  description?: string | null;
}

/**
 * Arguments for building the user prompt.
 *
 * @property title - User's project title/goal.
 * @property description - User's project description.
 * @property candidates - List of ConfigTemplate candidates from DB.
 */
export interface PickConfigTemplateUserPromptArgs {
  title: string;
  description: string;
  candidates: PickPromptCandidate[];
}

/**
 * Builds a user prompt for template selection.
 *
 * @param args - Project info and candidate templates.
 * @returns Formatted prompt string with candidates list and expected JSON schema.
 *
 * @example
 * ```ts
 * const prompt = pickConfigTemplateUserPrompt({
 *   title: "Strength training",
 *   description: "I want to increase my bench press",
 *   candidates: [{ id: "abc", templateName: "Strength", tags: ["strength"], description: "..." }],
 * });
 * ```
 */
export function pickConfigTemplateUserPrompt(args: PickConfigTemplateUserPromptArgs): string {
  const candidatesBlock = args.candidates
    .map(
      (c) =>
        `- id: ${c.id}\n  templateName: ${c.templateName}\n  tags: ${JSON.stringify(
          c.tags
        )}\n  description: ${c.description ?? ""}`
    )
    .join("\n");

  return `Project input:\n- title: ${args.title}\n- description: ${args.description}\n\nCandidates:\n${candidatesBlock}\n\nReturn JSON with shape:\n{\n  \"status\": \"ok\" | \"not_found\" | \"inconsistent\",\n  \"templateId\"?: string,\n  \"confidence\"?: number,\n  \"reason\"?: string\n}`;
}
