import fs from "node:fs";
import path from "node:path";

const file = path.join(process.cwd(), "apps/api/src/services/authorMouth.ts");
const source = fs.readFileSync(file, "utf8");

const start = source.indexOf("function compactCreativeJob(");
const end = source.indexOf("\nfunction genericRisk(", start);
if (start < 0 || end < 0) throw new Error("PATCH FAILED: compactCreativeJob boundary not found");

const replacement = String.raw`function compactCreativeJob(
  beat: MouthCandidateBeat,
  envelope: RealityEnvelope,
) {
  const s = semantic(beat);
  const eventIds = uniqueStrings(beat.eventIds ?? []);
  const eventDetails = eventIds.map((id) => {
    const event = envelope.events.find((item) => item.id === id);
    const structure = envelope.eventStructure.find((item) => item.eventId === id);
    return {
      id,
      label: clean(event?.label),
      entities: uniqueStrings(event?.entities ?? []),
      sourceIds: uniqueStrings(event?.sourceIds ?? []),
      structure: structure
        ? {
            subjects: uniqueStrings(structure.subjects),
            actions: uniqueStrings(structure.actions),
            objects: uniqueStrings(structure.objects),
            states: uniqueStrings(structure.states),
            temporalMarkers: uniqueStrings(structure.temporalMarkers),
            sensoryMarkers: uniqueStrings(structure.sensoryMarkers),
            semanticTags: uniqueStrings(structure.semanticTags),
            recurrenceScore: structure.recurrenceScore,
            transitionScore: structure.transitionScore,
            anomalyScore: structure.anomalyScore,
            salienceScore: structure.salienceScore,
          }
        : null,
    };
  });

  const eventSet = new Set(eventIds);
  const relations = envelope.relations.filter(
    (relation) => eventSet.has(relation.from) || eventSet.has(relation.to),
  );
  const continuity = envelope.entityContinuity.filter((entity) =>
    entity.eventIds.some((id) => eventSet.has(id)),
  );
  const patterns = envelope.patterns.filter((pattern) =>
    pattern.eventIds.some((id) => eventSet.has(id)),
  );

  return {
    order: beat.order,
    role: clean(beat.role),
    subject: clean(envelope.subject),
    eventIds,
    events: eventDetails,
    continuity,
    relations,
    patterns,
    realityVocabulary: {
      entities: envelope.suppliedEntities.slice(0, 24),
      actions: envelope.suppliedActions.slice(0, 24),
      states: envelope.suppliedStates.slice(0, 24),
      phrases: envelope.suppliedPhrases.slice(0, 24),
    },
    semanticRealization: s
      ? {
          mechanism: clean(s.mechanism),
          relation: s.relation
            ? {
                kind: clean(s.relation.kind),
                fromEventId: clean(s.relation.fromEventId),
                toEventId: clean(s.relation.toEventId),
              }
            : null,
          before: clean(s.before),
          after: clean(s.after),
          subject: clean(s.subject || envelope.subject),
          realizationMove: clean(s.realizationMove),
          creativeOpportunity: clean(s.creativeOpportunity),
          evidenceEventIds: uniqueStrings(s.evidenceEventIds ?? []),
          beforeEventIds: uniqueStrings(s.beforeEventIds ?? []),
          afterEventIds: uniqueStrings(s.afterEventIds ?? []),
          callback: s.callback
            ? {
                detail: clean(s.callback.detail),
                eventIds: uniqueStrings(s.callback.eventIds ?? []),
                role: clean(s.callback.role),
              }
            : null,
          confidence: s.confidence,
        }
      : null,
    observerExperience: beat.observerExperience
      ? {
          objective: clean(beat.observerExperience.objective),
          surprise: clean(beat.observerExperience.surprise),
          curiosity: clean(beat.observerExperience.curiosity),
          attention: uniqueStrings(beat.observerExperience.attention),
          landing: clean(beat.observerExperience.landing),
          explanationForbidden: beat.observerExperience.explanationForbidden === true,
        }
      : null,
    viewerState: beat.viewerState
      ? {
          beforeState: clean(beat.viewerState.beforeState),
          afterState: clean(beat.viewerState.afterState),
          attentionMove: clean(beat.viewerState.attentionMove),
          curiosityPressure: beat.viewerState.curiosityPressure,
          contrast: beat.viewerState.contrast,
          interruption: beat.viewerState.interruption,
          accumulation: beat.viewerState.accumulation,
          tempo: beat.viewerState.tempo,
          payoffPressure: beat.viewerState.payoffPressure,
          stateShift: beat.viewerState.stateShift,
          predictionError: beat.viewerState.predictionError,
          evidenceEventIds: uniqueStrings(beat.viewerState.evidenceEventIds ?? []),
        }
      : null,
    change: clean(beat.change),
    next: clean(beat.next),
    frontier: clean(beat.frontier),
    strategies: creativeStrategies(beat),
    obligations: uniqueStrings(beat.obligations ?? []),
    forbidden: uniqueStrings(beat.forbiddenMoves ?? []),
    creativeJob:
      "REALIZE THE EXPERIENCE, not the source sentence. Find the sharpest, most memorable language that lets the approved semantic change be felt. Prefer implication, image, attitude, status, tension, irony, juxtaposition, compression, or comic pressure when supported. Do not flatten a rich semantic opportunity into a literal summary.",
  };
}`;

const next = source.slice(0, start) + replacement + source.slice(end);

const promptNeedle = '    "SOURCE FACTS ARE RAW MATERIAL, NOT PROSE TO COPY.",';
const promptInsert = String.raw`    "SOURCE FACTS ARE RAW MATERIAL, NOT PROSE TO COPY.",

    "Optimize for killer human language: memorable, specific, surprising, emotionally legible, image-rich, rhythmically sharp, and alive. Safety is the boundary, not the aesthetic target.",

    "Use the full semantic contract you receive. The mechanism, relationship, before/after meaning, realization move, creative opportunity, observer surprise, curiosity, landing, event structure, continuity, patterns, and viewer-state dynamics are deliberate authorial signals. Do not collapse them back into a factual caption.",

    "When the contract supports a strong implication, status turn, irony, collision, callback, or recontextualization, prefer that over merely describing what happened.",

    "Candidate A should be the strongest overall realization. Candidate B should take a materially different angle. Candidate C should take the boldest approved angle. Do not make all three variants cautious paraphrases of the same source sentence.",`;

if (next.includes(promptNeedle) && !next.includes('"Optimize for killer human language')) {
  const withPrompt = next.replace(promptNeedle, promptInsert);
  fs.writeFileSync(file, withPrompt, "utf8");
} else {
  fs.writeFileSync(file, next, "utf8");
}

console.log("AUTHOR MOUTH RICH CONTRACT: APPLIED");
console.log("Mouth now receives structured semantic, event, continuity, pattern, and viewer-state context.");
