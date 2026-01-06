import { z } from "zod";

// What we search against.
export const TemplateSearchInputSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
});

export type TemplateSearchInput = z.infer<typeof TemplateSearchInputSchema>;

export type TemplateSearchHit = {
  templateId: string;
  score?: number;
  highlights?: Record<string, string[]>;
};

export type TemplateSearchResult = {
  hits: TemplateSearchHit[];
  meta: {
    strategy: "atlas_text" | "ai_semantic";
    indexName: string;
    executionMs?: number;
  };
};
