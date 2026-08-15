import type { AuthorBrainTruth } from "@qre/contracts";
import { authorBrain } from "./authorBrain.js";

export async function authorFast(input: AuthorBrainTruth) {
  return authorBrain(input, { fast: true });
}
