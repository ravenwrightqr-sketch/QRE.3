import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const file = path.join(root, "apps/api/src/services/authorMouth.ts");
const source = fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");

const mustHave = [
  "function sourceLabels(beat: MouthCandidateBeat, envelope: RealityEnvelope): string[] {",
  "function compactCreativeJob(beat: MouthCandidateBeat, envelope: RealityEnvelope) {",
  "function unsupportedConcreteRisk(text: string, envelope: RealityEnvelope, beat: MouthCandidateBeat): number {",
  "function evaluateCandidate(text: string, beat: MouthCandidateBeat, envelope: RealityEnvelope, priorTexts: readonly string[], recovery = false): MouthCandidate {",
  "function buildSystemPrompt(): string {",
  "export function buildMouthCandidateMessages(input: MouthCandidateGenerationInput) {",
  "export function completeMouthPools(input: { envelope: RealityEnvelope; beats: readonly MouthCandidateBeat[]; generated?: MouthCandidateBatch }): MouthCandidatePool[] {",
];
for (const marker of mustHave) {
  if (!source.includes(marker)) throw new Error(`Missing source anchor: ${marker}`);
}

let next = source;

const replaceOnce = (oldText, newText, label) => {
  const hits = next.split(oldText).length - 1;
  if (hits !== 1) throw new Error(`${label} anchor count mismatch: ${hits}`);
  next = next.replace(oldText, newText);
};

replaceOnce(
`function sourceLabels(beat: MouthCandidateBeat, envelope: RealityEnvelope): string[] {
  return uniqueStrings((beat.eventIds ?? []).map((id) => envelope.events.find((event) => event.id === id)?.label ?? ""));
}`,
`function scopedEventIds(beat: MouthCandidateBeat): string[] {
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
}`,
"sourceLabels");

replaceOnce(
`  const s = semantic(beat);
  const eventIds = uniqueStrings(beat.eventIds ?? []);`,
`  const s = semantic(beat);
  const eventIds = scopedEventIds(beat);`,
"compact job scope");

replaceOnce(
`    realityVocabulary: {
      entities: envelope.suppliedEntities.slice(0, 24), actions: envelope.suppliedActions.slice(0, 24), states: envelope.suppliedStates.slice(0, 24), phrases: envelope.suppliedPhrases.slice(0, 24),
    },`,
`    scope: {
      rule: "This beat may realize ONLY these supplied event details plus the canonical semantic contract. Do not borrow a concrete fact merely because it exists elsewhere in the experience.",
      entities: uniqueStrings(eventDetails.flatMap((event) => event.entities)),
      eventIds,
      subject: clean(envelope.subject),
      place: clean(envelope.place),
    },`,
"global vocabulary");

replaceOnce(
`    creativeJob: "REALIZE THE EXPERIENCE, not the source sentence. Make the approved semantic change FELT. Prefer the smallest line that creates a perceptual or emotional click. Use implication, contrast, compression, status, irony, juxtaposition, callback, or consequence when authorized. Do not explain the thesis.",`,
`    identityRule: beat.order === 1
      ? \`OPENING IDENTITY: explicitly name the supplied subject "${clean(envelope.subject)}" somewhere in the line.\`
      : "Identity is already established; do not repeat the subject unless the line benefits from it.",
    creativeJob: "REALIZE THE APPROVED MEANING, not the source sentence. Each beat must stand alone as a complete utterance. Make the approved semantic change FELT. Prefer the smallest line that creates a perceptual or emotional click. Use implication, contrast, compression, status, irony, juxtaposition, callback, or consequence when authorized. Never rely on another beat to finish the grammar or supply a missing fact. Do not explain the thesis.",`,
"creative job");

replaceOnce(
`      reality: {
        subject: input.envelope.subject,
        entities: input.envelope.suppliedEntities.slice(0, 16),
        actions: input.envelope.suppliedActions.slice(0, 16),
        states: input.envelope.suppliedStates.slice(0, 16),
        phrases: input.envelope.suppliedPhrases.slice(0, 20),
        events: input.envelope.events.slice(0, 24).map((event) => ({ id: event.id, label: event.label })),
      },`,
`      reality: {
        subject: input.envelope.subject,
        place: input.envelope.place,
        rule: "Global reality exists for truth safety. Concrete realization authority is beat-scoped below; do not import facts from another beat.",
      },`,
"reality payload");

replaceOnce(
`    "Use only supplied reality. You may invent phrasing, syntax, attitude, metaphor, personification, wordplay, understatement, status language, comic timing, juxtaposition, and implication.",
    "Treat every creator-supplied assertion as authoritative world reality, even when it is absurd, impossible, contradictory, or unexpected. Never normalize it.",
    "Never invent a new concrete event, object, person, setting, sound, reaction, dialogue, chronology, or outcome.",`,
`    "Use only the supplied reality that is authorized for the CURRENT BEAT. The beat packet contains the concrete evidence corridor; do not borrow facts from another beat simply because they are true elsewhere.",
    "Treat every creator-supplied assertion as authoritative world reality, even when it is absurd, impossible, contradictory, or unexpected. Never normalize it.",
    "You may invent language: phrasing, syntax, attitude, metaphor, personification, wordplay, understatement, status language, comic timing, juxtaposition, implication, and compressed figurative expression.",
    "Never invent a new concrete event, object, person, setting, sound, reaction, dialogue, chronology, or outcome. A newly coined concrete detail is not allowed merely because it would sound creative.",
    "Every beat is a standalone utterance. Never write a grammatical tail that requires the previous beat. Do not begin with a lowercase continuation. Do not leave a clause unfinished across beats.",`,
"system prompt");

replaceOnce(
`function unsupportedConcreteRisk(text: string, envelope: RealityEnvelope, beat: MouthCandidateBeat): number {
  const value = clean(text);
  if (!value) return 1;
  if (processRisk(value)) return 1;
  const s = semantic(beat);
  const observer = beat.observerExperience;
  const source = meaningful([
    envelope.subject,
    ...envelope.events.map((event) => event.label),
    ...envelope.suppliedEntities,
    ...envelope.suppliedActions,
    ...envelope.suppliedStates,
    ...envelope.suppliedPhrases,
  ].join(" "));
  const candidate = meaningful(value);
  const grounding = overlap(candidate, source);
  const semanticGrounding = overlap(candidate, meaningful(semanticAuthorityText(beat)));

  // A semantically authorized line may use vocabulary absent from source prose.
  // Safety is still bounded by an approved semantic contract, not an English verb list.
  if (s && (semanticGrounding >= 0.05 || clean(s.feltEffect) || clean(s.viewerShift) || clean(s.languageAim))) return 0;
  if (observer && (clean(observer.feltEffect) || clean(observer.viewerShift) || clean(observer.realizationDirection))) return 0;
  return grounding >= 0.12 ? 0 : 0.95;
}`,
`function unsupportedConcreteRisk(text: string, envelope: RealityEnvelope, beat: MouthCandidateBeat): number {
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
}`,
"unsupported concrete risk");

const fragmentFn = `function fragmentContinuationRisk(text: string): number {
  const value = clean(text);
  if (!value) return 1;
  if (/^[a-z]/.test(value)) return 1;
  if (/^(?:which|that|because|although|while|when|since|if)\\b/i.test(value)) return 0.95;
  if (/(?:,|:|;)\\s*$/.test(value)) return 0.95;
  return 0;
}
`;
replaceOnce(
`function evaluateCandidate(text: string, beat: MouthCandidateBeat, envelope: RealityEnvelope, priorTexts: readonly string[], recovery = false): MouthCandidate {`,
`${fragmentFn}
function evaluateCandidate(text: string, beat: MouthCandidateBeat, envelope: RealityEnvelope, priorTexts: readonly string[], recovery = false): MouthCandidate {`,
"fragment function insertion");

replaceOnce(
`  const invention = metric(unsupportedConcreteRisk(value, envelope, beat));
  const generic = genericRisk(value);`,
`  const invention = metric(unsupportedConcreteRisk(value, envelope, beat));
  const fragment = metric(fragmentContinuationRisk(value));
  const generic = genericRisk(value);`,
"evaluation metric");

replaceOnce(
`    grounding * 0.18 + lift * 0.22 + (hasRelationalMove ? 0.24 : 0) + priorNovelty * 0.06 + (compressed ? 0.06 : 0) + (feltAuthority ? 0.12 : 0) + (forbidden && explanation === 0 ? 0.05 : 0) + (anchorPreserved ? 0.04 : -0.18) + (subjectAnchorPreserved ? 0.03 : -0.25) - explanationPenalty * 0.4 - generic * 0.55 - process * 0.55,`,
`    grounding * 0.18 + lift * 0.22 + (hasRelationalMove ? 0.24 : 0) + priorNovelty * 0.06 + (compressed ? 0.06 : 0) + (feltAuthority ? 0.12 : 0) + (forbidden && explanation === 0 ? 0.05 : 0) + (anchorPreserved ? 0.04 : -0.18) + (subjectAnchorPreserved ? 0.03 : -0.25) - explanationPenalty * 0.4 - generic * 0.55 - process * 0.55 - fragment * 0.22,`,
"creative score");

replaceOnce(
`  if (generic) reasons.push("generic-summary-risk");
  if (process) reasons.push("process-language-risk");
  if (invention >= 0.9) reasons.push("unsupported-concrete-risk");`,
`  if (generic) reasons.push("generic-summary-risk");
  if (process) reasons.push("process-language-risk");
  if (fragment >= 0.9) reasons.push("fragment-continuation-risk");
  if (invention >= 0.9) reasons.push("unsupported-concrete-risk");`,
"reason block");

replaceOnce(
`    forbiddenMoveRisk: metric(Math.max(invention, explanationPenalty, generic, process)),`,
`    forbiddenMoveRisk: metric(Math.max(invention, explanationPenalty, generic, process, fragment)),`,
"forbidden risk");

replaceOnce(
`  if (!text || candidate.inventionRisk >= 0.9) return false;
  if (candidate.reasons.includes("generic-summary-risk") || candidate.reasons.includes("process-language-risk")) return false;`,
`  if (!text || candidate.inventionRisk >= 0.9) return false;
  if (candidate.reasons.includes("generic-summary-risk") || candidate.reasons.includes("process-language-risk") || candidate.reasons.includes("fragment-continuation-risk")) return false;`,
"authorization");

replaceOnce(
`    const generated = input.generated?.variantsByBeat.find((item) => item.order === beat.order)?.variants ?? [];
    const generatedCandidates = generated.map((text) => scoreMouthCandidate({ text, beat, envelope: input.envelope }));`,
`    const generated = input.generated?.variantsByBeat.find((item) => item.order === beat.order)?.variants ?? [];
    const generatedCandidates = generated.map((text) => {
      const value = clean(text);
      const subject = clean(input.envelope.subject);
      const subjectMissing = beat.order === 1 && subject.length > 0 && !value.toLowerCase().includes(subject.toLowerCase());
      const candidateText = subjectMissing ? \`${subject}: ${value}\` : value;
      return scoreMouthCandidate({ text: candidateText, beat, envelope: input.envelope });
    });`,
"generated candidate");

if (next === source) throw new Error("No changes applied");
fs.writeFileSync(file, next, "utf8");

const remaining = [
  "realityVocabulary:",
  "function fragmentContinuationRisk",
  "Global reality exists for truth safety",
  "foreignRealityTokens",
];
for (const marker of remaining) {
  if (marker === "realityVocabulary:" && next.includes(marker)) throw new Error("Global reality vocabulary still present in Mouth payload");
  if (marker !== "realityVocabulary:" && !next.includes(marker)) throw new Error(`Post-write verification failed: ${marker}`);
}

fs.unlinkSync(new URL(import.meta.url));
console.log("QRE AUTHOR MOUTH CHAOS HARDENING: PATCHED + SELF-DESTRUCTED");
console.log("- beat-scoped reality corridor");
console.log("- foreign concrete token guard");
console.log("- standalone beat guard");
console.log("- opening subject anchor");
console.log("- self-destructing patch script");
