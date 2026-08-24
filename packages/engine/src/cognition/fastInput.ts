import { buildWorldModel, type WorldModel } from "./worldModel.js";

/**
 * Canonical fast-input normalization.
 * Human shorthand is an intake format, never the persisted reality model.
 * Delimiters become sentence boundaries for the existing world parser.
 */
export function normalizeFastInput(input: string): string {
  return input
    .replace(/\s*[\/|]\s*/g, ". ")
    .replace(/\s*[•·]\s*/g, ". ")
    .replace(/\s*;\s*/g, ". ")
    .replace(/\.{2,}/g, ".")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildWorldModelFromFastInput(
  input: string,
  options: Parameters<typeof buildWorldModel>[1] = {},
): WorldModel {
  return buildWorldModel(normalizeFastInput(input), options);
}
