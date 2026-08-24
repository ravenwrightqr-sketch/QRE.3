import fs from "node:fs";

const path = "apps/api/src/services/authorMouthCandidateSearch.ts";
const text = fs.readFileSync(path, "utf8");

const old = `  const source = tokenSet(sourceForBeat(input.beat, input.envelope).join(" "));
  const current = tokenSet(text);
  const required = unique(input.beat.eventIds ?? []);
  const supportedEventIds = input.envelope.events
    .filter((event) => current.size && overlap(current, tokenSet(event.label)) >= 0.25)
    .map((event) => event.id)
    .filter((id) => required.length === 0 || required.includes(id));

  const supportedRelationPairs = input.envelope.relations
`;

const replacement = `  const sourceLabels = sourceForBeat(input.beat, input.envelope);
  const source = tokenSet(sourceLabels.join(" "));
  const current = tokenSet(text);
  const required = unique(input.beat.eventIds ?? []);

  const phraseSupported = (candidateText, label) => {
    const candidate = clean(candidateText).toLowerCase();
    const phrase = clean(label).toLowerCase();
    return Boolean(phrase && candidate.includes(phrase));
  };

  const eventSupported = (event) => {
    if (!current.size) return false;
    if (phraseSupported(text, event.label)) return true;
    const labelTokens = tokenSet(event.label);
    if (!labelTokens.size) return false;
    const hitRatio = overlap(current, labelTokens);
    return hitRatio >= 0.2;
  };

  const supportedEventIds = input.envelope.events
    .filter((event) => eventSupported(event))
    .map((event) => event.id)
    .filter((id) => required.length === 0 || required.includes(id));

  const requiredSupportedCount = required.filter((id) => {
    const label = eventLabel(input.envelope, id);
    return phraseSupported(text, label) || eventSupported({ id, label });
  }).length;

  const supportedRelationPairs = input.envelope.relations
`;

if (!text.includes(old)) throw new Error("PATCH FAILED: Mouth required-event grounding block");

let next = text.replace(old, replacement);

const oldGrounding = `  const groundingScore = Math.max(0.35, overlap(current, source) * 0.7 + (supportedEventIds.length ? 0.3 : 0));
`;
const newGrounding = `  const directSourceMatch = overlap(current, source);
  const requiredCoverage = required.length
    ? requiredSupportedCount / required.length
    : supportedEventIds.length
      ? 1
      : 0;
  const groundingScore = Math.max(
    0.35,
    Math.min(1, directSourceMatch * 0.7 + requiredCoverage * 0.4 + (supportedEventIds.length ? 0.15 : 0)),
  );
`;

if (!next.includes(oldGrounding)) throw new Error("PATCH FAILED: Mouth grounding score");
next = next.replace(oldGrounding, newGrounding);

fs.writeFileSync(path, next, "utf8");
console.log("PATCHED: authorMouthCandidateSearch.ts · required-event grounding");
console.log("AUTHOR MOUTH GROUNDING V1 COMPLETE");
