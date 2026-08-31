import { buildWorldModel, type WorldModel } from "./worldModel.js";

/**
 * Canonical fast-input normalization.
 * Human shorthand is an intake format, never the persisted reality model.
 */
export function normalizeFastInput(input: string): string {
  return input
    .replace(/\s*[\/|]\s*/g, ".\n")
    .replace(/\s*[•·]\s*/g, ".\n")
    .replace(/\s*;\s*/g, ".\n")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

export function buildWorldModelFromFastInput(
  input: string,
  options: Parameters<typeof buildWorldModel>[1] = {},
): WorldModel {
  return buildWorldModel(normalizeFastInput(input), options);
}
