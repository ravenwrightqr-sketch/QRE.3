/**
 * QRE CANONICAL COGNITION
 *
 * The artifact is a sequence-text film: text moving as a sequence of
 * attention-changing screens. `LatentMovieCandidate` is only a compatibility
 * name for a possible sequence-text realization.
 *
 * Cognition discovers semantic relationships and grounded sequence
 * possibilities. It does not choose the artwork. Artist chooses the central
 * proposition; Creative Realizer / Mouth makes that proposition visible.
 * Memory is additional supplied reality, never permission to invent facts.
 */
import type { LatentMovieCandidate, RealityGraph } from "@qre/contracts";
import { buildAuthorCognitivePlan as buildUniversalCognition, type AuthorCognitionInput, type AuthorCognitionPlan as UniversalPlan } from "./authorCognitionUniversal.js";
import { chooseArtistDirection, type AuthorArtistDirection } from "./authorArtistChoice.js";
import { rankCreativeLensCandidates } from "./authorCreativeLens.js";

export type { AuthorCognitionInput, AuthorCreativeInterpretation, AuthorAdaptiveQuestion } from "./authorCognitionUniversal.js";
export type AuthorCognitionPlan = UniversalPlan & { artistDirection: AuthorArtistDirection };

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const unique = (values: readonly string[]): string[] => [...new Set(values.map(clean).filter(Boolean))];

function lensCandidates(graph: RealityGraph, requestedLens: string) {
  const signals = unique(graph.events.flatMap((event) => [event.label, ...(event.entities ?? [])])).slice(0, 80);
  const strongSignals = unique([
    ...graph.relations.slice(0, 20).map((relation) => relation.kind),
    ...(graph.patterns ?? []).slice(0, 12).map((pattern) => pattern.label),
    ...graph.events.filter((event) => event.salient).slice(0, 12).map((event) => event.label),
  ]).slice(0, 40);
  return rankCreativeLensCandidates({ signals, strongSignals, requestedLens: clean(requestedLens), maxCandidates: 8 });
}

function fallbackInterpretation(sequence: LatentMovieCandidate) {
  return {
    id: "interpretation-grounded",
    thesis: sequence.hypothesis[0] ?? "Grounded relationship in supplied reality.",
    creativeOpportunity: sequence.supportingRelationKinds.length ? "supplied relationship" : "character material",
    rationale: "derived from supplied reality",
    evidenceEventIds: sequence.anchorEventIds,
    confidence: sequence.score,
  };
}

export async function buildAuthorCognitivePlan(input: AuthorCognitionInput): Promise<AuthorCognitionPlan> {
  const universal = await buildUniversalCognition(input);
  const sequences = universal.latentMovieCandidates.slice(0, 10);
  const lenses = lensCandidates(input.realityGraph, input.lens ?? "");
  const artist = await chooseArtistDirection({
    prompt: input.prompt,
    subject: clean(input.subject) || "the subject",
    graph: input.realityGraph,
    subjectMaterial: universal.subjectMaterial,
    movies: sequences,
    lensCandidates: lenses,
    domainContext: input.domainContext,
  });

  const selectedSequence = sequences[0];
  const artistDirectionLine = `ARTIST_SELECTED_DIRECTION=${JSON.stringify(artist.artistDirection)}`;
  const learning = input.creativeLearningContext ?? [];
  if (!learning.some((item) => item.startsWith("ARTIST_SELECTED_DIRECTION="))) learning.push(artistDirectionLine);

  return {
    ...universal,
    selectedLens: artist.selectedLens || "NONE",
    frame: {
      ...universal.frame,
      mode: artist.selectedLens && artist.selectedLens.toUpperCase() !== "NONE" ? "frame" : "none",
      frame: artist.selectedLens || "NONE",
    },
    latentMovieCandidates: selectedSequence ? [selectedSequence] : [],
    selectedMovie: selectedSequence,
    attentionStrategy: artist.attentionStrategy,
    artistDirection: artist.artistDirection,
    interpretations: universal.interpretations.length ? universal.interpretations : selectedSequence ? [fallbackInterpretation(selectedSequence)] : [],
    model: universal.model === "deterministic" ? artist.model : universal.model,
    modelCalls: universal.modelCalls + artist.modelCalls,
  };
}
