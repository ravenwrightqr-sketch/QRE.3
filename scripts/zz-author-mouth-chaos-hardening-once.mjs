import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const file = path.join(root, "apps/api/src/services/authorMouth.ts");
const source = fs.readFileSync(file, "utf8");

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

const oldSourceLabels = `function sourceLabels(beat: MouthCandidateBeat, envelope: RealityEnvelope): string[] {
  return uniqueStrings((beat.eventIds ?? []).map((id) => envelope.events.find((event) => event.id === id)?.label ?? ""));
}`;
const newSourceLabels = `function scopedEventIds(beat: MouthCandidateBeat): string[] {
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
}`;
if (next.split(oldSourceLabels).length !== 2) throw new Error("sourceLabels anchor count mismatch");
next = next.replace(oldSourceLabels, newSourceLabels);

const oldJobScope = `  const s = semantic(beat);
  const eventIds = uniqueStrings(beat.eventIds ?? []);`;
const newJobScope = `  const s = semantic(beat);
  const eventIds = scopedEventIds(beat);`;
if (next.split(oldJobScope).length !== 2) throw new Error("compact job scope anchor count mismatch");
next = next.replace(oldJobScope, newJobScope);

const oldVocabulary = `    realityVocabulary: {
      entities: envelope.suppliedEntities.slice(0, 24), actions: envelope.suppliedActions.slice(0, 24), states: envelope.suppliedStates.slice(0, 24), phrases: envelope.suppliedPhrases.slice(0, 24),
    },`;
const newVocabulary = `    scope: {
      rule: "This beat may realize ONLY these supplied event details plus the canonical semantic contract. Do not borrow a concrete fact merely because it exists elsewhere in the experience.",
      entities: uniqueStrings(eventDetails.flatMap((event) => event.entities)),
      eventIds,
      subject: clean(envelope.subject),
      place: clean(envelope.place),
    },`;
if (next.split(oldVocabulary).length !== 2) throw new Error("global vocabulary anchor count mismatch");
next = next.replace(oldVocabulary, newVocabulary);

const oldCreativeJob = `    creativeJob: "REALIZE THE EXPERIENCE, not the source sentence. Make the approved semantic change FELT. Prefer the smallest line that creates a perceptual or emotional click. Use implication, contrast, compression, status, irony, juxtaposition, callback, or consequence when authorized. Do not explain the thesis.",`;
const newCreativeJob = `    identityRule: beat.order === 1
      ? \`OPENING IDENTITY: explicitly name the supplied subject \"${clean(envelope.subject)}\" somewhere in the line.\`
      : "Identity is already established; do not repeat the subject unless the line benefits from it.",
    creativeJob: "REALIZE THE APPROVED MEANING, not the source sentence. Each beat must stand alone as a complete utterance. Make the approved semantic change FELT. Prefer the smallest line that creates a perceptual or emotional click. Use implication, contrast, compression, status, irony, juxtaposition, callback, or consequence when authorized. Never rely on another beat to finish the grammar or supply a missing fact. Do not explain the thesis.",`;
if (next.split(oldCreativeJob).length !== 2) throw new Error("creative job anchor count mismatch");
next = next.replace(oldCreativeJob, newCreativeJob);

const oldRealityPayload = `      reality: {
        subject: input.envelope.subject,
        entities: input.envelope.suppliedEntities.slice(0, 16),
        actions: input.envelope.suppliedActions.slice(0, 16),
        states: input.envelope.suppliedStates.slice(0, 16),
        phrases: input.envelope.suppliedPhrases.slice(0, 20),
        events: input.envelope.events.slice(0, 24).map((event) => ({ id: event.id, label: event.label })),
      },`;
const newRealityPayload = `      reality: {
        subject: input.envelope.subject,
        place: input.envelope.place,
        rule: "Global reality exists for truth safety. Concrete realization authority is beat-scoped below; do not import facts from another beat.",
      },`;
if (next.split(oldRealityPayload).length !== 2) throw new Error("reality payload anchor count mismatch");
next = next.replace(oldRealityPayload, newRealityPayload);

const oldPromptBlock = `    "Use only supplied reality. You may invent phrasing, syntax, attitude, metaphor, personification, wordplay, understatement, status language, comic timing, juxtaposition, and implication.",
    "Treat every creator-supplied assertion as authoritative world reality, even when it is absurd, impossible, contradictory, or unexpected. Never normalize it.",
    "Never invent a new concrete event, object, person, setting, sound, reaction, dialogue, chronology, or outcome.",`;
const newPromptBlock = `    "Use only the supplied reality that is authorized for the CURRENT BEAT. The beat packet contains the concrete evidence corridor; do not borrow facts from another beat simply because they are true elsewhere.",
    "Treat every creator-supplied assertion as authoritative world reality, even when it is absurd, impossible, contradictory, or unexpected. Never normalize it.",
    "You may invent language: phrasing, syntax, attitude, metaphor, personification, wordplay, understatement, status language, comic timing, juxtaposition, implication, and compressed figurative expression.",
    "Never invent a new concrete event, object, person, setting, sound, reaction, dialogue, chronology, or outcome. A newly coined concrete detail is not allowed merely because it would sound creative.",
    "Every beat is a standalone utterance. Never write a grammatical tail that requires the previous beat. Do not begin with a lowercase continuation. Do not leave a clause unfinished across beats.",`;
if (next.split(oldPromptBlock).length !== 2) throw new Error("system prompt authority anchor count mismatch");
next = next.replace(oldPromptBlock, newPromptBlock);

const oldUnsupported = `function unsupportedConcreteRisk(text: string, envelope: RealityEnvelope, beat: MouthCandidateBeat): number {
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
}`;
const newUnsupported = `function unsupportedConcreteRisk(text: string, envelope: RealityEnvelope, beat: MouthCandidateBeat): number {
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

  // A concrete token that exists elsewhere in the experience is not licensed
  // merely because it is true. It must belong to this beat's evidence corridor.
  const foreignRealityTokens = [...candidate].filter((token) => globalReality.has(token) && !localSource.has(token));
  if (foreignRealityTokens.length) return 0.95;

  // Novel figurative language remains allowed: semantic authority can license
  // new wording without granting permission to create new concrete facts.
  if (s && (semanticGrounding >= 0.05 || clean(s.feltEffect) || clean(s.viewerShift) || clean(s.languageAim))) return 0;
  if (observer && (clean(observer.feltEffect) || clean(observer.viewerShift) || clean(observer.realizationDirection))) return 0;
  return grounding >= 0.12 ? 0 : 0.95;
}`;
if (next.split(oldUnsupported).length !== 2) throw new Error("unsupportedConcreteRisk anchor count mismatch");
next = next.replace(oldUnsupported, newUnsupported);

const fragmentFn = `function fragmentContinuationRisk(text: string): number {
  const value = clean(text);
  if (!value) return 1;
  if (/^[a-z]/.test(value)) return 1;
  if (/^(?:which|that|because|although|while|when|since|if)\\b/i.test(value)) return 0.95;
  if (/(?:,|:|;)\\s*$/.test(value)) return 0.95;
  return 0;
}
`;
const fragmentAnchor = `function evaluateCandidate(text: string, beat: MouthCandidateBeat, envelope: RealityEnvelope, priorTexts: readonly string[], recovery = false): MouthCandidate {`;
if (next.includes(fragmentFn)) throw new Error("fragmentContinuuationRisk already present");
next = next.replace(fragmentAnchor, `${fragmentFn}\n${fragmentAnchor}`);

const oldEvalMetrics = `  const invention = metric(unsupportedConcreteRisk(value, envelope, beat));
  const generic = genericRisk(value);`;
const newEvalMetrics = `  const invention = metric(unsupportedConcreteRisk(value, envelope, beat));
  const fragment = metric(fragmentContinuationRisk(value));
  const generic = genericRisk(value);`;
if (next.split(oldEvalMetrics).length !== 2) throw new Error("evaluation metric anchor count mismatch");
next = next.replace(oldEvalMetrics, newEvalMetrics);

const oldCreativeLine = `    grounding * 0.18 + lift * 0.22 + (hasRelationalMove ? 0.24 : 0) + priorNovelty * 0.06 + (compressed ? 0.06 : 0) + (feltAuthority ? 0.12 : 0) + (forbidden && explanation === 0 ? 0.05 : 0) + (anchorPreserved ? 0.04 : -0.18) + (subjectAnchorPreserved ? 0.03 : -0.25) - explanationPenalty * 0.4 - generic * 0.55 - process * 0.55,`;
const newCreativeLine = `    grounding * 0.18 + lift * 0.22 + (hasRelationalMove ? 0.24 : 0) + priorNovelty * 0.06 + (compressed ? 0.06 : 0) + (feltAuthority ? 0.12 : 0) + (forbidden && explanation === 0 ? 0.05 : 0) + (anchorPreserved ? 0.04 : -0.18) + (subjectAnchorPreserved ? 0.03 : -0.25) - explanationPenalty * 0.4 - generic * 0.55 - process * 0.55 - fragment * 0.22,`;
if (next.split(oldCreativeLine).length !== 2) throw new Error("creative score anchor count mismatch");
next = next.replace(oldCreativeLine, newCreativeLine);

const oldReasonBlock = `  if (generic) reasons.push("generic-summary-risk");
  if (process) reasons.push("process-language-risk");
  if (invention >= 0.9) reasons.push("unsupported-concrete-risk");`;
const newReasonBlock = `  if (generic) reasons.push("generic-summary-risk");
  if (process) reasons.push("process-language-risk");
  if (fragment >= 0.9) reasons.push("fragment-continuation-risk");
  if (invention >= 0.9) reasons.push("unsupported-concrete-risk");`;
if (next.split(oldReasonBlock).length !== 2) throw new Error("reason block anchor count mismatch");
next = next.replace(oldReasonBlock, newReasonBlock);

const oldForbidden = `    forbiddenMoveRisk: metric(Math.max(invention, explanationPenalty, generic, process)),`;
const newForbidden = `    forbiddenMoveRisk: metric(Math.max(invention, explanationPenalty, generic, process, fragment)),`;
if (next.split(oldForbidden).length !== 2) throw new Error("forbidden risk anchor count mismatch");
next = next.replace(oldForbidden, newForbidden);

const oldAuth = `  if (!text || candidate.inventionRisk >= 0.9) return false;
  if (candidate.reasons.includes("generic-summary-risk") || candidate.reasons.includes("process-language-risk")) return false;`;
const newAuth = `  if (!text || candidate.inventionRisk >= 0.9) return false;
  if (candidate.reasons.includes("generic-summary-risk") || candidate.reasons.includes("process-language-risk") || candidate.reasons.includes("fragment-continuation-risk")) return false;`;
if (next.split(oldAuth).length !== 2) throw new Error("authorization anchor count mismatch");
next = next.replace(oldAuth, newAuth);

const oldGenerated = `    const generated = input.generated?.variantsByBeat.find((item) => item.order === beat.order)?.variants ?? [];
    const generatedCandidates = generated.map((text) => scoreMouthCandidate({ text, beat, envelope: input.envelope }));`;
const newGenerated = `    const generated = input.generated?.variantsByBeat.find((item) => item.order === beat.order)?.variants ?? [];
    const generatedCandidates = generated.map((text) => {
      const anchored = beat.order === 1 && clean(input.envelope.subject) && !new RegExp(\\`\\\\b\\${clean(input.envelope.subject).replace(/[.*+?^\\${}()|[\\]\\\\]/g, "\\\\\\$&")}\\\\b\\`, "i").test(clean(text))
        ? \\`${clean(input.envelope.subject)}: ${clean(text)}\\`
        : clean(text);
      return scoreMouthCandidate({ text: anchored, beat, envelope: input.envelope });
    });`;
if (next.split(oldGenerated).length !== 2) throw new Error("generated candidate anchor count mismatch");
next = next.replace(oldGenerated, newGenerated);

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
