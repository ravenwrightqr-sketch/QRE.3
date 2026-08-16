import type { WorldEvent } from "./worldModel.js";

const clean = (value: string) => value.replace(/\s+/g, " ").trim();
const lower = (value: string) => clean(value).toLowerCase();
const sentenceParts = (value: string) => clean(value).split(/(?<=[.!?])\s+/).map((part) => clean(part)).filter(Boolean);
const FRAGMENT_START_RE = /^(?:in|at|on|to|from|with|by|and|but|then|before|after|until|re)\s+/i;
const INTERNAL_META_RE = /\b(?:second meaning|obvious detail|looked incidental|gave the moment its shape|made the larger moment stay|landed differently|reads like setup|next beat was|this was the hinge|background detail|co-conspirator)\b/i;
const BROKEN_PHRASE_RE = /\b(?:in nervous|re again|we there again|we the|home to a spotless house|out the final plate|t midnight|re through|it there through)\b/i;

function wordCount(value: string): number { return value.split(/\s+/).filter(Boolean).length; }
function anchorsFor(event: WorldEvent): string[] {
  return [event.raw, ...event.participants, event.object ?? "", event.place ?? "", event.time ?? ""].filter(Boolean).map(clean);
}
function isSourceSentence(text: string, event: WorldEvent): boolean {
  const body = lower(text).replace(/[.!?]+$/, "");
  return lower(event.raw).replace(/[.!?]+$/, "") === body || anchorsFor(event).slice(1).some((anchor) => body === lower(anchor).replace(/[.!?]+$/, ""));
}
function overlap(a: string, b: string): number {
  const left = new Set(lower(a).split(/\W+/).filter((w) => w.length >= 4));
  const right = new Set(lower(b).split(/\W+/).filter((w) => w.length >= 4));
  if (!left.size || !right.size) return 0;
  return [...left].filter((w) => right.has(w)).length / Math.max(1, Math.min(left.size, right.size));
}

export function surfaceCreativeText(text: string, event: WorldEvent): string {
  const source = event.raw.trim();
  const rawSentences = sentenceParts(text);
  const kept: string[] = [];

  for (const part of rawSentences) {
    const normalized = part.replace(/^[-–—•]\s*/, "").trim();
    if (!normalized) continue;
    const sourceSentence = isSourceSentence(normalized, event);
    const words = wordCount(normalized);
    if (!sourceSentence && words < 4) continue;
    if (!sourceSentence && FRAGMENT_START_RE.test(normalized)) continue;
    if (!sourceSentence && BROKEN_PHRASE_RE.test(normalized)) continue;
    if (!sourceSentence && /^(?:bath|dryer|ordinary|fabulous|nervous|pier|midnight|laughing|from|singing|inviting them|quiet for a second|re again)\.?$/i.test(normalized)) continue;
    if (kept.some((existing) => lower(existing) === lower(normalized))) continue;
    if (!sourceSentence && kept.length && overlap(existingLast(kept), normalized) >= 0.82) continue;
    if (!sourceSentence && INTERNAL_META_RE.test(normalized) && !/[,:;—]/.test(normalized) && words < 9) continue;
    kept.push(normalized);
  }

  const result = kept.join(" ").replace(/\s+([,.!?;:])/g, "$1").trim();
  if (!result) return source;
  if (source && result.length < Math.max(24, Math.floor(source.length * 0.7))) return source;
  return result;
}

function existingLast(values: readonly string[]): string { return values[values.length - 1] ?? ""; }
