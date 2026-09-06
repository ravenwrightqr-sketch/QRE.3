/*
 * QRE CANONICAL AUTHOR READOUT
 *
 * Readout is the boring factual projection between RealityGraph and creative
 * cognition. It does not select a frame, discover a Movie, infer emotion, or
 * write customer-facing prose.
 */
import type { RealityGraph } from "@qre/contracts";

export type AuthorReadout = {
  subject?: string;
  lines: string[];
  text: string;
  eventIds: string[];
};

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();

export function buildAuthorReadout(input: { graph: RealityGraph; subject?: string }): AuthorReadout {
  const lines = input.graph.events.map((event) => {
    const prefix = [clean(event.time), clean(event.place)].filter(Boolean);
    const label = clean(event.label);
    return prefix.length ? `${prefix.join(" — ")} — ${label}` : label;
  }).filter(Boolean);
  return {
    subject: clean(input.subject) || undefined,
    lines,
    text: lines.join("\n"),
    eventIds: input.graph.events.map((event) => event.id),
  };
}
