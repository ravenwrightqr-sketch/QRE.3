import type { MouthCandidateBeat, ViewerStateCut } from "@qre/contracts";
import type { RealityEnvelope } from "./authorRealityEnvelope.js";

/**
 * Canonical viewer-state transition derivation.
 *
 * This is cognition metadata, not language generation.
 * It answers only: what changes for the observer when this approved beat enters?
 *
 * Source truth remains in RealityEnvelope. Creative wording remains in Mouth.
 */

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const metric = (value: number): number => Number(Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)).toFixed(3));

const STOP = new Set("the a an and or but to of in on at for with from by through after before then now still again this that it is are was were be been being as into my your our their his her its he she they them you we me what when where why how one two three four five six seven eight nine ten".split(/\s+/));

function tokens(value: string): Set<string> {
  return new Set(clean(value).toLowerCase().split(/[^a-z0-9'’-]+/g).filter((token) => token.length >= 3 && !STOP.has(token)));
}

function overlap(left: string, right: string): number {
  const a = tokens(left);
  const b = tokens(right);
  if (!a.size || !b.size) return 0;
  let hits = 0;
  for (const token of a) if (b.has(token)) hits += 1;
  return hits / Math.max(1, Math.min(a.size, b.size));
}

function sourceForBeat(beat: MouthCandidateBeat, envelope: RealityEnvelope): string[] {
  return [...new Set((beat.eventIds ?? [])
    .map((id) => envelope.events.find((event) => event.id === id)?.label ?? "")
    .map(clean)
    .filter(Boolean))];
}

function semanticText(beat: MouthCandidateBeat, envelope: RealityEnvelope): string {
  return clean(beat.change) || sourceForBeat(beat, envelope).join(" ");
}

export function deriveViewerStateCut(
  beat: MouthCandidateBeat,
  index: number,
  beats: readonly MouthCandidateBeat[],
  envelope: RealityEnvelope,
): ViewerStateCut {
  const currentIds = [...new Set(beat.eventIds ?? [])];
  const priorBeats = beats.slice(0, index);
  const priorIds = new Set(priorBeats.flatMap((item) => item.eventIds ?? []));
  const newEvents = currentIds.filter((id) => !priorIds.has(id));
  const newEventRatio = metric(newEvents.length / Math.max(1, currentIds.length));

  const currentSource = sourceForBeat(beat, envelope).join(" ");
  const priorSources = priorBeats.flatMap((item) => sourceForBeat(item, envelope)).join(" ");
  const currentMeaning = semanticText(beat, envelope);
  const priorMeanings = priorBeats.map((item) => semanticText(item, envelope)).filter(Boolean);
  const priorMeaning = priorMeanings.length > 0 ? priorMeanings[priorMeanings.length - 1]! : "";

  const continuity = currentSource && priorSources ? overlap(currentSource, priorSources) : 0;
  const semanticDifference = currentMeaning && priorMeaning ? metric(1 - overlap(currentMeaning, priorMeaning)) : index === 0 ? 0.55 : 0.35;
  const relationPresence = Boolean(beat.relationKinds?.length);

  const informationTurn = metric(
    newEventRatio * 0.46 +
    semanticDifference * 0.34 +
    (relationPresence ? 0.12 : 0) +
    (continuity < 0.35 ? 0.08 : 0),
  );

  const contrast = metric(
    informationTurn * 0.62 +
    (continuity < 0.45 ? 0.18 : 0) +
    (relationPresence ? 0.2 : 0),
  );

  const nextPressure = clean(beat.next || beat.frontier);
  const curiosityPressure = metric(
    (beat.paysOff?.length ? 0.08 : index >= beats.length - 1 ? 0.16 : 0.38) +
    (nextPressure ? 0.3 : 0) +
    informationTurn * 0.2 +
    (relationPresence ? 0.12 : 0),
  );

  const payoffPressure = metric(
    beat.paysOff?.length
      ? 1
      : index === beats.length - 2
        ? 0.82
        : Math.min(0.68, 0.22 + index * 0.09),
  );

  const interruption = metric(
    informationTurn * 0.48 +
    contrast * 0.32 +
    (continuity < 0.3 ? 0.2 : 0),
  );

  const stateShift = metric(
    informationTurn * 0.34 +
    contrast * 0.2 +
    interruption * 0.16 +
    curiosityPressure * 0.1 +
    semanticDifference * 0.1 +
    (relationPresence ? 0.1 : 0),
  );

  const predictionError = metric(
    informationTurn * 0.34 +
    interruption * 0.3 +
    contrast * 0.2 +
    (nextPressure ? 0.08 : 0) +
    (relationPresence ? 0.08 : 0),
  );

  let attentionMove: ViewerStateCut["attentionMove"];
  if (beat.paysOff?.length) attentionMove = "land";
  else if (stateShift >= 0.76 && relationPresence) attentionMove = "recontextualize";
  else if (interruption >= 0.76) attentionMove = "interrupt";
  else if (contrast >= 0.7) attentionMove = "recontextualize";
  else if (curiosityPressure >= 0.78) attentionMove = "tighten";
  else if (stateShift >= 0.6) attentionMove = "escalate";
  else if (index === 0) attentionMove = "orient";
  else attentionMove = "release";

  const beforeState = index === 0
    ? "The encounter is newly present."
    : priorMeaning
      ? priorMeaning
      : "The established meaning continues.";

  const afterState = currentMeaning || "New material enters.";

  return {
    beforeState,
    afterState,
    attentionMove,
    curiosityPressure,
    contrast,
    interruption,
    accumulation: metric(continuity * 0.48 + (1 - newEventRatio) * 0.22 + (relationPresence ? 0.16 : 0) + informationTurn * 0.14),
    tempo: metric(0.34 + interruption * 0.34 + stateShift * 0.32),
    payoffPressure,
    stateShift,
    predictionError,
    evidenceEventIds: currentIds,
  };
}
