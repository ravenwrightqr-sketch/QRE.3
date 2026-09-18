import type {
  LatentMovieCandidate,
} from "@qre/contracts";
import type { RealityEnvelope } from "./authorRealityEnvelope.js";
import { classifyLens } from "./authorCharacterLensEngine.js";

/**
 * Canonical treatment boundary.
 *
 * Author/Cognition discovers the metamorphic relation first.
 * Lens pressure never discovers, replaces, or upgrades that relation into fact.
 * It only changes how the already-approved relation may feel in realization.
 */
export type CreativeLensBrief = {
  lens: {
    label: string;
    intensity: number;
    framingBias: string[];
    realizationPreferences: string[];
  };
  metamorphic: {
    mechanism: string;
    relationKind: string;
    before: string;
    after: string;
    creativeOpportunity: string;
    realizationMove: string;
    feltEffect: string;
    viewerShift: string;
    languageAim: string;
    evidenceEventIds: string[];
  };
  treatmentMoves: string[];
  forbiddenRealityMoves: string[];
  realityInvariants: string[];
};

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const unique = (values: readonly unknown[] = []): string[] =>
  [...new Set(values.map(clean).filter(Boolean))];

export function buildCreativeLensBrief(input: {
  lens?: string;
  movie: LatentMovieCandidate;
  envelope: RealityEnvelope;
}): CreativeLensBrief {
  const profile = classifyLens(input.lens);
  const semantic = input.movie.storyThesis?.semanticRealization;

  const evidenceEventIds = unique([
    ...(semantic?.evidenceEventIds ?? []),
    ...(input.movie.storyThesis?.beforeEventIds ?? []),
    ...(input.movie.storyThesis?.afterEventIds ?? []),
  ]).filter((id) => input.envelope.events.some((event) => event.id === id));

  return {
    lens: {
      label: clean(profile.label) || "NONE",
      intensity: Number(profile.intensity ?? 0),
      framingBias: unique(profile.framingBias ?? []).slice(0, 12),
      realizationPreferences: unique(profile.realizationPreferences ?? []).slice(0, 12),
    },
    metamorphic: {
      mechanism: clean(semantic?.mechanism),
      relationKind: clean(
        semantic?.relation?.kind ??
        input.movie.storyThesis?.relationKind,
      ),
      before: clean(semantic?.before),
      after: clean(semantic?.after),
      creativeOpportunity: clean(semantic?.creativeOpportunity),
      realizationMove: clean(semantic?.realizationMove),
      feltEffect: clean(semantic?.feltEffect),
      viewerShift: clean(semantic?.viewerShift),
      languageAim: clean(semantic?.languageAim),
      evidenceEventIds,
    },
    treatmentMoves: unique([
      ...(profile.realizationPreferences ?? []),
      ...(profile.framingBias ?? []),
    ]).slice(0, 18),
    forbiddenRealityMoves: unique([
      ...(profile.forbiddenRealityMoves ?? []),
      "invent a new event",
      "invent a new entity",
      "invent a new object",
      "invent physical behavior",
      "invent sensory detail",
      "invent chronology",
      "literalize metaphor or genre framing as an occurrence",
    ]),
    realityInvariants: [
      "RealityGraph remains the only concrete-world authority.",
      "The metamorphic relation is discovered upstream of the lens.",
      "Lens pressure may change perception, framing, attitude, implication, metaphor, status, rhythm, or emotional pressure.",
      "Lens pressure may never create a concrete fact, event, entity, object, place, action, sensory detail, motive, or chronology.",
      "Mouth may realize only the supplied reality plus the approved metamorphic relation under this treatment pressure.",
    ],
  };
}
