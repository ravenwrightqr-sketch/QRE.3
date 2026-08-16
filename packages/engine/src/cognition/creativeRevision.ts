import type { CreativeCandidate } from "./creativePolicy.js";
import type { WorldEvent } from "./worldModel.js";

export type RevisionMove = "trim" | "foreground" | "contrast" | "reverse" | "compress";

type RevisionDraft = { text: string; move: RevisionMove; details: string[] };

const clean = (v: string) => v.replace(/\s+/g, " ").trim().replace(/[.!?]+$/, "");
const lower = (v: string) => clean(v).toLowerCase();

function splitSentences(text: string): string[] {
  return clean(text).split(/(?<=[.!?])\s+/).map(clean).filter(Boolean);
}

function revise(candidate: CreativeCandidate, event: WorldEvent): RevisionDraft[] {
  const source = clean(candidate.text);
  const parts = splitSentences(source);
  const drafts: RevisionDraft[] = [];
  const primary = clean(event.object || event.details[0] || event.place || "");
  const secondary = clean(event.details.find((detail) => lower(detail) !== lower(primary)) || event.time || "");

  if (parts.length >= 2) {
    const trimmed = parts.filter((part) => !/^(?:on paper|then|somehow|apparently|at first|naturally),?$/i.test(part)).join(". ");
    if (trimmed && lower(trimmed) !== lower(source)) drafts.push({ text: `${trimmed}.`, move: "trim", details: ["removed weak transition"] });
  }

  if (primary && !lower(parts[0] ?? "").startsWith(lower(primary))) {
    drafts.push({ text: `${primary}. ${source}`, move: "foreground", details: ["foregrounded salient detail"] });
  }

  if (primary && secondary && source.toLowerCase().includes(lower(primary)) && source.toLowerCase().includes(lower(secondary))) {
    const compact = source.replace(new RegExp(`\\b${primary.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i"), primary);
    if (compact) drafts.push({ text: `${secondary} gave the moment its second meaning. ${compact}`, move: "contrast", details: ["foreground/background contrast"] });
  }

  if (parts.length >= 2) {
    const reversed = [...parts].reverse().join(". ");
    if (lower(reversed) !== lower(source)) drafts.push({ text: `${reversed}.`, move: "reverse", details: ["reordered emphasis"] });
  }

  const compressed = source.replace(/\b(?:that|which|really|very|just|suddenly|finally)\b/gi, "").replace(/\s{2,}/g, " ");
  if (compressed && lower(compressed) !== lower(source) && compressed.length + 8 < source.length) drafts.push({ text: `${clean(compressed)}.`, move: "compress", details: ["compressed filler"] });

  return drafts.filter((draft, index, values) => index === values.findIndex((value) => lower(value.text) === lower(draft.text)));
}

export function reviseCreativeCandidate(candidate: CreativeCandidate, event: WorldEvent): CreativeCandidate[] {
  return revise(candidate, event).map((draft, index) => ({
    ...candidate,
    text: draft.text,
    creativity: Math.min(10, candidate.creativity + 0.25 + index * 0.1),
    novelty: Math.min(1, candidate.novelty + 0.04),
    score: candidate.score + 1.5 + draft.details.length * 0.5,
    creativeDetails: [...candidate.creativeDetails, `revision:${draft.move}`, ...draft.details],
  }));
}
