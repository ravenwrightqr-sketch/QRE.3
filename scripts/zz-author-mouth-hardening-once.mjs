import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.join(root, "apps/api/src/services/authorMouth.ts");
let source = fs.readFileSync(target, "utf8");

const assertOnce = (needle, label) => {
  const count = source.split(needle).length - 1;
  if (count !== 1) throw new Error(`Expected exactly one ${label}; found ${count}`);
};

assertOnce('function unsupportedConcreteRisk(', "unsupportedConcreteRisk anchor");
assertOnce('function evaluateCandidate(', "evaluateCandidate anchor");
assertOnce('function buildSystemPrompt(): string {', "buildSystemPrompt anchor");
assertOnce('export function buildMouthCandidateMessages(input: MouthCandidateGenerationInput) {', "buildMouthCandidateMessages anchor");
assertOnce('export function isAuthorizedMouthCandidate(candidate: MouthCandidate): boolean {', "authorization anchor");
assertOnce('function completeMouthPools(', "completeMouthPools anchor");

const fragmentFn = `function fragmentContinuationRisk(text: string): number {
  const value = clean(text);
  if (!value) return 1;
  // Reject sentence tails accidentally split across beat boundaries while
  // preserving complete poetic fragments such as "A flash of red.".
  if (/^[a-z]/.test(value)) return 1;
  if (/[,:;]$/.test(value)) return 0.7;
  if (/^(?:and|or|but|so|because|which|that|who|whose|while|when|where)\\b/i.test(value)) return 1;
  return 0;
}
\n`;
source = source.replace(
  'function unsupportedConcreteRisk(text: string, envelope: RealityEnvelope, beat: MouthCandidateBeat): number {',
  fragmentFn + 'function unsupportedConcreteRisk(text: string, envelope: RealityEnvelope, beat: MouthCandidateBeat): number {'
);

source = source.replace(
  '  const explanation = explanationRisk(value);\n  const lift = realizationLift(value, beat, envelope);',
  '  const explanation = explanationRisk(value);\n  const fragmentRisk = fragmentContinuationRisk(value);\n  const lift = realizationLift(value, beat, envelope);'
);

source = source.replace(
  '    grounding * 0.18 + lift * 0.22 + (hasRelationalMove ? 0.24 : 0) + priorNovelty * 0.06 + (compressed ? 0.06 : 0) + (feltAuthority ? 0.12 : 0) +',
  '    grounding * 0.17 + lift * 0.22 + (hasRelationalMove ? 0.24 : 0) + priorNovelty * 0.06 + (compressed ? 0.06 : 0) + (feltAuthority ? 0.14 : 0) +'
);
source = source.replace(
  ' - explanationPenalty * 0.4 - generic * 0.55 - process * 0.55,',
  ' - explanationPenalty * 0.4 - generic * 0.55 - process * 0.55 - fragmentRisk * 0.5,'
);
source = source.replace(
  '    forbiddenMoveRisk: metric(Math.max(invention, explanationPenalty, generic, process)),',
  '    forbiddenMoveRisk: metric(Math.max(invention, explanationPenalty, generic, process, fragmentRisk)),'
);
source = source.replace(
  '  if (invention >= 0.9) reasons.push("unsupported-concrete-risk");',
  '  if (fragmentRisk > 0) reasons.push("fragment-continuation-risk");\n  if (invention >= 0.9) reasons.push("unsupported-concrete-risk");'
);
source = source.replace(
  '  if (!text || candidate.inventionRisk >= 0.9) return false;',
  '  if (!text || candidate.inventionRisk >= 0.9) return false;\n  if (candidate.reasons.includes("fragment-continuation-risk")) return false;'
);

const oldSystemStart = source.indexOf('function buildSystemPrompt(): string {');
const oldSystemEnd = source.indexOf('\n}\n\nexport function buildMouthCandidateMessages', oldSystemStart);
if (oldSystemStart < 0 || oldSystemEnd < 0) throw new Error("Could not locate system prompt block");
const newSystem = `function buildSystemPrompt(): string {\n  return [\n    "You are QRE's ONE MOUTH: an expert human copywriter operating inside an absolute reality boundary.",\n    "The sequence, semantic meaning, beat role, and approved evidence are already decided. You ONLY realize this one beat as language.",\n    "EVERY BEAT IS AN INDEPENDENT CUT. Never continue, complete, or borrow a sentence, phrase, noun phrase, or grammatical tail from another beat.",\n    "EVERY VARIANT MUST STAND ALONE. A fragment is allowed only when it is intentionally complete and independently meaningful.",\n    "Never output a lowercase continuation fragment such as 'small dog.' or 'wears a tag.' A candidate must be a complete line, even when it is terse, poetic, elliptical, or fragmentary.",\n    "The aesthetic target is FELT MEANING: create a perceptible click, turn, tension, recognition, irony, tenderness, surprise, status shift, callback, or consequence instead of explaining it.",\n    "feltEffect, viewerShift, and languageAim are primary creative direction. Translate them into language; do not restate those fields.",\n    "SOURCE FACTS ARE RAW MATERIAL, NOT PROSE TO COPY.",\n    "Use only supplied reality. You may create phrasing, syntax, rhythm, attitude, metaphor, personification, wordplay, understatement, implication, juxtaposition, and status language when those expressions remain grounded in approved reality.",\n    "Creator-supplied assertions are authoritative even when absurd, impossible, contradictory, or unexpected. Never normalize them.",\n    "Never invent a concrete event, object, person, place, sound, reaction, dialogue, chronology, or outcome.",\n    "Never mention viewers, audiences, beats, strategies, evidence, cognition, movies, planning, or storytelling.",\n    "Never write generic emotional summaries or trailer language.",\n    "Prefer the smallest memorable line that expresses the approved change. Two to eight words is often ideal, but clarity and force outrank an arbitrary word count.",\n    "Opening cut: explicitly preserve subject identity. Later cuts may omit the subject after identity is established.",\n    "Payoff cut: land the supplied endpoint and accumulated meaning. Do not append another event.",\n    "When explanationForbidden is true, do not state the thesis, significance, relationship, lesson, or conclusion. Make it felt.",\n    "Candidate A = strongest realization. Candidate B = materially different angle. Candidate C = boldest approved angle.",\n    "Do not split one idea across candidates or beats. Think each beat through completely before returning its three independent lines.",\n    "The only job is to make this exact approved beat feel inevitable, surprising, alive, and specific.",\n  ].join(" ");\n}`;
source = source.slice(0, oldSystemStart) + newSystem + source.slice(oldSystemEnd + 2);

const oldMessagesStart = source.indexOf('export function buildMouthCandidateMessages(input: MouthCandidateGenerationInput) {');
const oldMessagesEnd = source.indexOf('\n}\n\nfunction cleanVariant', oldMessagesStart);
if (oldMessagesStart < 0 || oldMessagesEnd < 0) throw new Error("Could not locate Mouth message block");
const newMessages = `export function buildMouthCandidateMessages(input: MouthCandidateGenerationInput) {\n  const lens = classifyLens(input.lens);\n  const jobs = input.beats.map((beat) => compactCreativeJob(beat, input.envelope));\n  return [\n    { role: "system" as const, content: buildSystemPrompt() },\n    {\n      role: "user" as const,\n      content: JSON.stringify({\n        task: "REALIZE_EACH_BEAT_INDEPENDENTLY",\n        lens: input.lens || "AUTO",\n        lensProfile: lens,\n        contract: {\n          independentBeats: true,\n          selfContainedVariants: true,\n          noCrossBeatContinuation: true,\n          noConcreteInvention: true,\n        },\n        jobs,\n        priorTexts: input.priorTexts ?? [],\n        output: { variantsByBeat: jobs.map((job) => ({ order: job.order, variants: ["A", "B", "C"] })) },\n      }, null, 2),\n    },\n  ];\n}`;
source = source.slice(0, oldMessagesStart) + newMessages + source.slice(oldMessagesEnd + 2);

const oldJobStart = source.indexOf('function compactCreativeJob(beat: MouthCandidateBeat, envelope: RealityEnvelope) {');
const oldJobEnd = source.indexOf('\n}\n\nfunction genericRisk', oldJobStart);
if (oldJobStart < 0 || oldJobEnd < 0) throw new Error("Could not locate compactCreativeJob block");
const newJob = `function compactCreativeJob(beat: MouthCandidateBeat, envelope: RealityEnvelope) {\n  const s = semantic(beat);\n  const eventIds = uniqueStrings(beat.eventIds ?? []);\n  const eventDetails = eventIds.map((id) => {\n    const event = envelope.events.find((item) => item.id === id);\n    const structure = envelope.eventStructure.find((item) => item.eventId === id);\n    return {\n      id,\n      label: clean(event?.label),\n      entities: uniqueStrings(event?.entities ?? []),\n      sourceIds: uniqueStrings(event?.sourceIds ?? []),\n      structure: structure ? {\n        subjects: uniqueStrings(structure.subjects),\n        actions: uniqueStrings(structure.actions),\n        objects: uniqueStrings(structure.objects),\n        states: uniqueStrings(structure.states),\n        temporalMarkers: uniqueStrings(structure.temporalMarkers),\n        sensoryMarkers: uniqueStrings(structure.sensoryMarkers),\n        semanticTags: uniqueStrings(structure.semanticTags),\n      } : null,\n    };\n  });\n  const eventSet = new Set(eventIds);\n  const opening = beat.order === 1;\n  return {\n    order: beat.order,\n    role: clean(beat.role),\n    subject: opening ? clean(envelope.subject) : "IDENTITY_ALREADY_ESTABLISHED",\n    eventIds,\n    events: eventDetails,\n    relations: envelope.relations.filter((relation) => eventSet.has(relation.from) || eventSet.has(relation.to)),\n    semanticRealization: s ? {\n      mechanism: clean(s.mechanism),\n      relation: s.relation ? { kind: clean(s.relation.kind), fromEventId: clean(s.relation.fromEventId), toEventId: clean(s.relation.toEventId) } : null,\n      before: clean(s.before),\n      after: clean(s.after),\n      subject: clean(s.subject || envelope.subject),\n      realizationMove: clean(s.realizationMove),\n      creativeOpportunity: clean(s.creativeOpportunity),\n      feltEffect: clean(s.feltEffect),\n      viewerShift: clean(s.viewerShift),\n      languageAim: clean(s.languageAim),\n      evidenceEventIds: uniqueStrings(s.evidenceEventIds ?? []),\n      beforeEventIds: uniqueStrings(s.beforeEventIds ?? []),\n      afterEventIds: uniqueStrings(s.afterEventIds ?? []),\n      callback: s.callback ? { detail: clean(s.callback.detail), eventIds: uniqueStrings(s.callback.eventIds ?? []), role: clean(s.callback.role) } : null,\n    } : null,\n    observerExperience: beat.observerExperience ? {\n      objective: clean(beat.observerExperience.objective),\n      surprise: clean(beat.observerExperience.surprise),\n      curiosity: clean(beat.observerExperience.curiosity),\n      attention: uniqueStrings(beat.observerExperience.attention),\n      landing: clean(beat.observerExperience.landing),\n      explanationForbidden: beat.observerExperience.explanationForbidden === true,\n      feltEffect: clean(beat.observerExperience.feltEffect),\n      viewerShift: clean(beat.observerExperience.viewerShift),\n      realizationDirection: clean(beat.observerExperience.realizationDirection),\n    } : null,\n    viewerState: beat.viewerState ? {\n      beforeState: clean(beat.viewerState.beforeState),\n      afterState: clean(beat.viewerState.afterState),\n      attentionMove: clean(beat.viewerState.attentionMove),\n      curiosityPressure: beat.viewerState.curiosityPressure,\n      contrast: beat.viewerState.contrast,\n      interruption: beat.viewerState.interruption,\n      accumulation: beat.viewerState.accumulation,\n      tempo: beat.viewerState.tempo,\n      payoffPressure: beat.viewerState.payoffPressure,\n      stateShift: beat.viewerState.stateShift,\n      predictionError: beat.viewerState.predictionError,\n      evidenceEventIds: uniqueStrings(beat.viewerState.evidenceEventIds ?? []),\n    } : null,\n    direction: {\n      change: clean(beat.change),\n      next: clean(beat.next),\n      frontier: clean(beat.frontier),\n      strategies: creativeStrategies(beat),\n      obligations: uniqueStrings(beat.obligations ?? []),\n      forbidden: uniqueStrings(beat.forbiddenMoves ?? []),\n    },\n    cutRule: opening\n      ? "Name the supplied subject. Make this cut independently complete."\n      : "Make this cut independently complete. Never borrow a grammatical tail from another beat.",\n    creativeJob: "REALIZE THIS ONE APPROVED CUT. Make its semantic change FELT. Use implication, contrast, recontextualization, status, callback, consequence, understatement, compression, or collision when authorized. Never explain the contract.",\n  };\n}`;
source = source.slice(0, oldJobStart) + newJob + source.slice(oldJobEnd + 2);

source = source.replace(
  'function deterministicCreativeFallback(beat: MouthCandidateBeat, envelope: RealityEnvelope): string[] {\n  return uniqueStrings(sourceLabels(beat, envelope));\n}',
  'function deterministicCreativeFallback(beat: MouthCandidateBeat, envelope: RealityEnvelope): string[] {\n  return uniqueStrings(sourceLabels(beat, envelope));\n}'
);

fs.writeFileSync(target, source, "utf8");
console.log(`Hardened ${path.relative(root, target)}`);
