/**
 * Bounded perceptual treatments for Author.
 *
 * A treatment changes what the visitor notices about a grounded relationship.
 * It is not a taxonomy and it never licenses invented reality.
 * `none` is intentional: the discovered relationship itself may be strong enough
 * that no additional perceptual framing should be imposed.
 */
export type AuthorTreatmentId =
  | "none"
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
  "none",
  "horror-romance",
  "heist-comedy",
  "game-fierce",
  "noir-tenderness",
  "documentary-chaos",
] as const;
