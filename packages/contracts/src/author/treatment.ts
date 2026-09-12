/**
 * Bounded perceptual treatments for Author.
 *
 * These are not a genre system. A treatment changes what the viewer notices
 * about an already grounded relationship. The catalog is intentionally small
 * so the Author learns a language of perception rather than a taxonomy.
 */
export type AuthorTreatmentId =
  | "horror-romance"
  | "heist-comedy"
  | "game-fierce"
  | "noir-tenderness"
  | "documentary-chaos";

export type AuthorTreatment = {
  id: AuthorTreatmentId;
  primary: string;
  secondary: string;
  rule: string;
  reason: string;
  score: number;
};

export const AUTHOR_TREATMENTS: readonly AuthorTreatmentId[] = [
  "horror-romance",
  "heist-comedy",
  "game-fierce",
  "noir-tenderness",
  "documentary-chaos",
] as const;
