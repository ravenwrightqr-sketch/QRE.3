import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const file = path.join(root, "apps/api/src/services/authorMouth.ts");
const source = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");

function replaceFunction(text, name, replacement) {
  const pattern = new RegExp(
    `function ${name}\\([^]*?\\n\\}\\n(?=function |export function |const |$)`,
  );
  const match = text.match(pattern);
  if (!match) throw new Error(`Could not locate function: ${name}`);
  return text.replace(pattern, `${replacement}\n`);
}

function replaceOnce(text, needle, replacement, label) {
  const index = text.indexOf(needle);
  if (index < 0) throw new Error(`Could not locate ${label}`);
  return text.slice(0, index) + replacement + text.slice(index + needle.length);
}

for (const marker of [
  "function sourceLabels(",
  "function compactCreativeJob(",
  "function unsupportedConcreteRisk(",
  "function evaluateCandidate(",
  "function buildSystemPrompt(): string {",
  "export function buildMouthCandidateMessages(",
  "export function completeMouthPools(",
]) {
  if (!source.includes(marker)) throw new Error(`Missing source anchor: ${marker}`);
}

let next = source;

next = replaceFunction(next, "sourceLabels", `function scopedEventIds(beat: MouthCandidateBeat): string[] {
  const s = semantic(beat);
  const beatIds = uniqueStrings(beat.eventIds ?? []);
  if (!s) return beatIds;
  const approved = uniqueStrings([
    ...(s.evidenceEventIds ?? []),
    ...(s.beforeEventIds ?? []),
    ...(s.afterEventIds ?? []),
    ...(s.callback?.eventIds ?? []),
  ]).filter((id) => beatIds.includes(id));
  return approved.length ? approved : beatIds;
}

function sourceLabels(beat: MouthCandidateBeat, envelope: RealityEnvelope): string[] {
  return uniqueStrings(scopedEventIds(beat).map((id) => envelope.events.find((event) => event.id === id)?.label ?? ""));
}`);

next = next.replace(
  /  const s = semantic\(beat\);\n  const eventIds = uniqueStrings\(beat\.eventIds \?\? \[\]\);/,
  `  const s = semantic(beat);\n  const eventIds = scopedEventIds(beat);`,
);

next = replaceOnce(
  next,
  `    realityVocabulary: {\n      entities: envelope.suppliedEntities.slice(0, 24), actions: envelope.suppliedActions.slice(0, 24), states: envelope.suppliedStates.slice(0, 24), phrases: envelope.suppliedPhrases.slice(0, 24),\n    },`,
  `    scope: {\n      rule: "This beat may realize ONLY these supplied event details plus the canonical semantic contract. Do not borrow a concrete fact merely because it exists elsewhere in the experience.",\n      entities: uniqueStrings(eventDetails.flatMap((event) => event.entities)),\n      eventIds,\n      subject: clean(envelope.subject),\n      place: clean(envelope.place),\n    },`,
  "beat-scoped vocabulary",
);

next = replaceOnce(
  next,
  `    creativeJob: "REALIZE THE EXPERIENCE, not the source sentence. Make the approved semantic change FELT. Prefer the smallest line that creates a perceptual or emotional click. Use implication, contrast, compression, status, irony, juxtaposition, callback, or consequence when authorized. Do not explain the thesis.",`,
  `    identityRule: beat.order === 1\n      ? "OPENING IDENTITY: explicitly name the supplied subject somewhere in the line."\n      : "Identity is already established; do not repeat the subject unless the line benefits from it.",\n    creativeJob: "REALIZE THE APPROVED MEANING, not the source sentence. Each beat must stand alone as a complete utterance. Make the approved semantic change FELT. Prefer the smallest line that creates a perceptual or emotional click. Use implication, contrast, compression, status, irony, juxtaposition, callback, or consequence when authorized. Never rely on another beat to finish the grammar or supply a missing fact. Do not explain the thesis.",`,
  "creative job",
);

next = replaceOnce(
  next,
  `      reality: {\n        subject: input.envelope.subject,\n        entities: input.envelope.suppliedEntities.slice(0, 16),\n        actions: input.envelope.suppliedActions.slice(0, 16),\n        states: input.envelope.suppliedStates.slice(0, 16),\n        phrases: input.envelope.suppliedPhrases.slice(0, 20),\n        events: input.envelope.events.slice(0, 24).map((event) => ({ id: event.id, label: event.label })),\n      },`,
  `      reality: {\n        subject: input.envelope.subject,\n        place: input.envelope.place,\n        rule: "Global reality exists for truth safety. Concrete realization authority is beat-scoped below; do not import facts from another beat.",\n      },`,
  "global reality payload",
);

next = replaceOnce(
  next,
  `    "Use only supplied reality. You may invent phrasing, syntax, attitude, metaphor, personification, wordplay, understatement, status language, comic timing, juxtaposition, and implication.",\n    "Treat every creator-supplied assertion as authoritative world reality, even when it is absurd, impossible, contradictory, or unexpected. Never normalize it.",\n    "Never invent a new concrete event, object, person, setting, sound, reaction, dialogue, chronology, or outcome.",`,
  `    "Use only the supplied reality that is authorized for the CURRENT BEAT. The beat packet contains the concrete evidence corridor; do not borrow facts from another beat simply because they are true elsewhere.",\n    "Treat every creator-supplied assertion as authoritative world reality, even when it is absurd, impossible, contradictory, or unexpected. Never normalize it.",\n    "You may invent language: phrasing, syntax, attitude, metaphor, personification, wordplay, understatement, status language, comic timing, juxtaposition, implication, and compressed figurative expression.",\n    "Never invent a new concrete event, object, person, setting, sound, reaction, dialogue, chronology, or outcome. A newly coined concrete detail is not allowed merely because it would sound creative.",\n    "Every beat is a standalone utterance. Never write a grammatical tail that requires the previous beat. Do not begin with a lowercase continuation. Do not leave a clause unfinished across beats.",`,
  "system prompt boundary",
);

next = replaceFunction(next, "unsupportedConcreteRisk", `function unsupportedConcreteRisk(text: string, envelope: RealityEnvelope, beat: MouthCandidateBeat): number {
  const value = clean(text);
  if (!value) return 1;
  if (processRisk(value)) return 1;
  const s = semantic(beat);
  const observer = beat.observerExperience;
  const localEventIds = scopedEventIds(beat);
  const localEvents = envelope.events.filter((event) => localEventIds.includes(event.id));
  const localStructures = envelope.eventStructure.filter((structure) => localEventIds.includes(structure.eventId));
  const localSource = meaningful([
    envelope.subject,
    envelope.place,
    ...localEvents.map((event) => event.label),
    ...localEvents.flatMap((event) => event.entities ?? []),
    ...localStructures.flatMap((structure) => [
      ...structure.subjects,
      ...structure.actions,
      ...structure.objects,
      ...structure.states,
      ...structure.temporalMarkers,
      ...structure.sensoryMarkers,
      ...structure.semanticTags,
    ]),
    s?.subject,
    s?.before,
    s?.after,
    s?.callback?.detail,
  ].join(" "));
  const globalReality = meaningful([
    ...envelope.events.map((event) => event.label),
    ...envelope.suppliedEntities,
    ...envelope.suppliedActions,
    ...envelope.suppliedStates,
    ...envelope.suppliedPhrases,
  ].join(" "));
  const candidate = meaningful(value);
  const grounding = overlap(candidate, localSource);
  const semanticGrounding = overlap(candidate, meaningful(semanticAuthorityText(beat)));
  const foreignRealityTokens = [...candidate].filter((token) => globalReality.has(token) && !localSource.has(token));
  if (foreignRealityTokens.length) return 0.95;
  if (s && (semanticGrounding >= 0.05 || clean(s.feltEffect) || clean(s.viewerShift) || clean(s.languageAim))) return 0;
  if (observer && (clean(observer.feltEffect) || clean(observer.viewerShift) || clean(observer.realizationDirection))) return 0;
  return grounding >= 0.12 ? 0 : 0.95;
}`);

next = replaceOnce(
  next,
  `function evaluateCandidate(text: string, beat: MouthCandidateBeat, envelope: RealityEnvelope, priorTexts: readonly string[], recovery = false): MouthCandidate {`,
  `function fragmentContinuationRisk(text: string): number {\n  const value = clean(text);\n  if (!value) return 1;\n  if (/^[a-z]/.test(value)) return 1;\n  if (/^(?:which|that|because|although|while|when|since|if)\\b/i.test(value)) return 0.95;\n  if (/(?:,|:|;)\\s*$/.test(value)) return 0.95;\n  return 0;\n}\n\nfunction evaluateCandidate(text: string, beat: MouthCandidateBeat, envelope: RealityEnvelope, priorTexts: readonly string[], recovery = false): MouthCandidate {`,
  "fragment guard",
);

next = replaceOnce(
  next,
  `  const invention = metric(unsupportedConcreteRisk(value, envelope, beat));\n  const generic = genericRisk(value);`,
  `  const invention = metric(unsupportedConcreteRisk(value, envelope, beat));\n  const fragment = metric(fragmentContinuationRisk(value));\n  const generic = genericRisk(value);`,
  "fragment metric",
);

next = replaceOnce(
  next,
  `    grounding * 0.18 + lift * 0.22 + (hasRelationalMove ? 0.24 : 0) + priorNovelty * 0.06 + (compressed ? 0.06 : 0) + (feltAuthority ? 0.12 : 0) + (forbidden && explanation === 0 ? 0.05 : 0) + (anchorPreserved ? 0.04 : -0.18) + (subjectAnchorPreserved ? 0.03 : -0.25) - explanationPenalty * 0.4 - generic * 0.55 - process * 0.55,`,
  `    grounding * 0.18 + lift * 0.22 + (hasRelationalMove ? 0.24 : 0) + priorNovelty * 0.06 + (compressed ? 0.06 : 0) + (feltAuthority ? 0.12 : 0) + (forbidden && explanation === 0 ? 0.05 : 0) + (anchorPreserved ? 0.04 : -0.18) + (subjectAnchorPreserved ? 0.03 : -0.25) - explanationPenalty * 0.4 - generic * 0.55 - process * 0.55 - fragment * 0.22,`,
  "creative score",
);

next = replaceOnce(
  next,
  `  if (generic) reasons.push("generic-summary-risk");\n  if (process) reasons.push("process-language-risk");\n  if (invention >= 0.9) reasons.push("unsupported-concrete-risk");`,
  `  if (generic) reasons.push("generic-summary-risk");\n  if (process) reasons.push("process-language-risk");\n  if (fragment >= 0.9) reasons.push("fragment-continuation-risk");\n  if (invention >= 0.9) reasons.push("unsupported-concrete-risk");`,
  "candidate reasons",
);

next = replaceOnce(
  next,
  `    forbiddenMoveRisk: metric(Math.max(invention, explanationPenalty, generic, process)),`,
  `    forbiddenMoveRisk: metric(Math.max(invention, explanationPenalty, generic, process, fragment)),`,
  "forbidden risk",
);

next = replaceOnce(
  next,
  `  if (!text || candidate.inventionRisk >= 0.9) return false;\n  if (candidate.reasons.includes("generic-summary-risk") || candidate.reasons.includes("process-language-risk")) return false;`,
  `  if (!text || candidate.inventionRisk >= 0.9) return false;\n  if (candidate.reasons.includes("generic-summary-risk") || candidate.reasons.includes("process-language-risk") || candidate.reasons.includes("fragment-continuation-risk")) return false;`,
  "authorization guard",
);

next = replaceOnce(
  next,
  `    const generated = input.generated?.variantsByBeat.find((item) => item.order === beat.order)?.variants ?? [];\n    const generatedCandidates = generated.map((text) => scoreMouthCandidate({ text, beat, envelope: input.envelope }));`,
  `    const generated = input.generated?.variantsByBeat.find((item) => item.order === beat.order)?.variants ?? [];\n    const generatedCandidates = generated.map((text) => {\n      const value = clean(text);\n      const subject = clean(input.envelope.subject);\n      const missingSubject = beat.order === 1 && subject.length > 0 && !value.toLowerCase().includes(subject.toLowerCase());\n      const candidateText = missingSubject ? subject + ": " + value : value;\n      return scoreMouthCandidate({ text: candidateText, beat, envelope: input.envelope });\n    });`,
  "generated candidate",
);

const required = [
  "function scopedEventIds(beat: MouthCandidateBeat): string[] {",
  "scope: {",
  "identityRule: beat.order === 1",
  "Global reality exists for truth safety",
  "function fragmentContinuationRisk(text: string): number {",
  "foreignRealityTokens",
  "candidate.inventionRisk >= 0.9",
];
for (const marker of required) {
  if (!next.includes(marker)) throw new Error(`Post-patch verification failed: ${marker}`);
}

fs.writeFileSync(file, next, "utf8");
fs.unlinkSync(new URL(import.meta.url));
console.log("QRE AUTHOR MOUTH CHAOS HARDENING: PATCHED + SELF-DESTRUCTED");
console.log("- beat-scoped evidence corridor");
console.log("- foreign concrete fact guard");
console.log("- standalone beat guard");
console.log("- opening subject anchor");
console.log("- compact model payload");
