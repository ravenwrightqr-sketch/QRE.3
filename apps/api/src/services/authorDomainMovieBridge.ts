import type { AuthorBrainTruth } from "@qre/contracts";
import { buildMovieCognition, type MovieCognition, type MovieHypothesis } from "./authorMovieCognition.js";
import { buildDomainCognition, type AuthorDomainMode, type DomainCognitionProfile } from "./authorDomainCognition.js";

export type DomainDrivenMovie = {
  profile: DomainCognitionProfile;
  cognition: MovieCognition;
  selected: MovieHypothesis;
  domainLift: number;
  rationale: string[];
};

const clamp = (value: number): number => Math.max(0, Math.min(1, value));
const round = (value: number): number => Number(clamp(value).toFixed(3));
const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();

function fitFor(hypothesis: MovieHypothesis, profile: DomainCognitionProfile): number {
  let score = 0;
  const trajectory = hypothesis.trajectory.map((value) => value.toLowerCase()).join(" ");
  for (const opportunity of profile.opportunities.slice(0, 6)) {
    const overlap = opportunity.sources.reduce((best, source) => Math.max(best, source && trajectory.includes(source.toLowerCase()) ? 1 : 0), 0);
    score += overlap * opportunity.strength;
  }
  if (profile.tensions.length) {
    const tensionText = profile.tensions.slice(0, 4).flatMap((item) => [item.left, item.right]).join(" ").toLowerCase();
    if (tensionText && trajectory.includes(tensionText.split(" ")[0]!)) score += 0.12;
  }
  if (profile.mode === "memory" && hypothesis.operation === "echo") score += 0.16;
  if (profile.mode === "pet_social" && (hypothesis.operation === "reframe" || hypothesis.operation === "amplification")) score += 0.14;
  if (profile.mode === "service" && (hypothesis.operation === "contrast" || hypothesis.operation === "reversal")) score += 0.1;
  if (profile.mode === "business_media" && (hypothesis.operation === "implication" || hypothesis.operation === "contrast")) score += 0.1;
  return round(Math.min(0.42, score));
}

function rationaleFor(profile: DomainCognitionProfile, selected: MovieHypothesis, lift: number): string[] {
  const reasons: string[] = [];
  const topTension = profile.tensions[0];
  const topOpportunity = profile.opportunities[0];
  if (topTension) reasons.push(`domain tension: ${topTension.left} ↔ ${topTension.right}`);
  if (topOpportunity) reasons.push(`domain opportunity: ${topOpportunity.text}`);
  reasons.push(`selected operation: ${selected.operation}`);
  reasons.push(`domain lift: ${lift}`);
  return reasons;
}

export function selectDomainDrivenMovie(input: AuthorBrainTruth, ending: string, mode?: AuthorDomainMode): DomainDrivenMovie {
  const facts = [
    ...input.facts,
    ...input.sourceMoments,
    ...(input.memoryContext ?? []),
    ...(input.trajectory ?? []),
    ...(input.presenceSummary ?? []),
  ].map(clean).filter(Boolean);
  const profile = buildDomainCognition(facts, input.subject, mode ?? "generic");
  const cognition = buildMovieCognition(input, ending);
  const ranked = cognition.hypotheses
    .map((hypothesis) => ({ hypothesis, lift: fitFor(hypothesis, profile) }))
    .sort((a, b) => (b.hypothesis.score + b.lift) - (a.hypothesis.score + a.lift));
  const best = ranked[0]?.hypothesis ?? cognition.selected;
  const baseline = cognition.selected.score;
  const selectedLift = ranked[0]?.lift ?? 0;
  const selected = best.score + selectedLift >= baseline ? best : cognition.selected;
  const domainLift = round(selected === best ? selectedLift : 0);
  return { profile, cognition, selected, domainLift, rationale: rationaleFor(profile, selected, domainLift) };
}
