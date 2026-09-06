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

function subjectPrefixPattern(subject?: string): RegExp | undefined {
  const names = clean(subject)
    .split(/\s*(?:\+|&|,|\/|\band\b)\s*/i)
    .map((value) => clean(value))
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)
    .map((value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (!names.length) return undefined;

  if (names.length === 1) {
    return new RegExp(`^${names[0]}(?:\\s+|[:,–—-]+\\s*)`, "i");
  }

  const pair = names.join("(?:\\s+(?:and|&)\\s+)?");
  return new RegExp(`^(?:${pair}|${names.join("\\s+(?:and|&)\\s+")})(?:\\s+|[:,–—-]+\\s*)`, "i");
}

function stripSubjectPrefix(label: string, subject?: string): string {
  const text = clean(label);
  const pattern = subjectPrefixPattern(subject);
  if (!pattern) return text;
  return clean(text.replace(pattern, ""));
}

export function buildAuthorReadout(input: { graph: RealityGraph; subject?: string }): AuthorReadout {
  const lines = input.graph.events
    .map((event) => {
      const prefix = [clean(event.time), clean(event.place)].filter(Boolean);
      const label = stripSubjectPrefix(event.label, input.subject);
      if (!label) return "";
      return prefix.length ? `${prefix.join(" — ")} — ${label}` : label;
    })
    .filter(Boolean);

  return {
    subject: clean(input.subject) || undefined,
    lines,
    text: lines.join("\n"),
    eventIds: input.graph.events.map((event) => event.id),
  };
}
