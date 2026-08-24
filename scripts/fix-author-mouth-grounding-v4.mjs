import fs from "node:fs";

const path = "apps/api/src/services/authorMouthCandidateSearch.ts";
const text = fs.readFileSync(path, "utf8");

const start = text.indexOf('  const source = tokenSet(sourceForBeat(input.beat, input.envelope).join(" "));');
const end = text.indexOf('  const interpretive = ', start);

if (start < 0 || end < 0 || end <= start) {
  throw new Error("PATCH FAILED: could not locate canonical Mouth grounding section");
}

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
    return overlap(current, labelTokens) >= 0.2;
  };

  const supportedEventIds = input.envelope.events
    .filter((event) => eventSupported(event))
    .map((event) => event.id)
    .filter((id) => required.length === 0 || required.includes(id));

  const requiredSupportedCount = required.filter((id) => {
    const label = eventLabel(input.envelope, id);
    return Boolean(label && (phraseSupported(text, label) || eventSupported({ id, label })));
  }).length;

  const supportedRelationPairs = input.envelope.relations
    .filter((relation) => supportedEventIds.includes(relation.from) && supportedEventIds.includes(relation.to))
    .map((relation) => \`\${relation.from}->\${relation.to}\`);

  const directSourceMatch = overlap(current, source);
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

const next = text.slice(0, start) + replacement + text.slice(end);
fs.writeFileSync(path, next, "utf8");
console.log("PATCHED: authorMouthCandidateSearch.ts · complete structure-based required-event grounding");
console.log("AUTHOR MOUTH GROUNDING V4 COMPLETE");
