/**
 * UNIVERSAL LENS POLICY
 *
 * A lens is a perceptual policy over supplied reality. It never creates facts.
 * It changes which grounded relationships, operations, and observer effects are
 * worth privileging when constructing a movie.
 *
 * Satanico remains the inference authority: the lens selects a search space;
 * Satanico decides which grounded opportunity has the strongest observer-read.
 */
import type { LatentMovieTrajectoryStep, RealityRelation } from "@qre/contracts";
import type { SatanicoInferenceOpportunity } from "./authorSatanicoEvidenceSearch.js";

export type LensPolicy = {
  name: string;
  terms: string[];
  relationWeights: Partial<Record<RealityRelation["kind"], number>>;
  operationWeights: Partial<Record<LatentMovieTrajectoryStep["operation"], number>>;
  opportunityWeights: Partial<Record<SatanicoInferenceOpportunity["kind"], number>>;
  observerMode: "discovery" | "tension" | "wonder" | "intimacy" | "comedy" | "stakes";
  personification: "none" | "light" | "strong";
  explanationPressure: number;
};

type LensSeed = Omit<LensPolicy, "name"> & { name: string; aliases?: string[] };

const SEEDS: LensSeed[] = [
  { name: "game", aliases: ["gaming", "competition", "challenge"], terms: ["level", "boss", "clear", "score", "win", "play", "challenge", "mission", "unlock"], relationWeights: { contrasts: 1, changes: .95, converges: .9, repeats: .78 }, operationWeights: { contrast: 1, reveal: .95, converge: .9, recur: .75 }, opportunityWeights: { contrast: 1, state_transformation: .95, heterogeneous_convergence: .9, relational_role: .88, preference_constellation: .82 }, observerMode: "stakes", personification: "light", explanationPressure: .05 },
  { name: "spy", aliases: ["espionage", "surveillance"], terms: ["operation", "agent", "watch", "watched", "signal", "cover", "target", "classified", "surveillance", "contact", "negotiation"], relationWeights: { contrasts: .98, recontextualizes: 1, converges: .9, causes: .82 }, operationWeights: { reframe: 1, contrast: .96, converge: .9, consequence: .82 }, opportunityWeights: { relational_role: 1, heterogeneous_convergence: .96, callback: .9, contrast: .86, invariant: .8 }, observerMode: "tension", personification: "light", explanationPressure: .02 },
  { name: "heist", aliases: ["robbery", "capers"], terms: ["operation", "evidence", "target", "secured", "missing", "disappeared", "acquired", "escape", "clean", "crew"], relationWeights: { causes: 1, changes: .96, contrasts: .9, recontextualizes: .86 }, operationWeights: { consequence: 1, reveal: .96, contrast: .9, reframe: .84 }, opportunityWeights: { origin_outcome: .9, state_transformation: 1, heterogeneous_convergence: .92, contrast: .9, relational_role: .8 }, observerMode: "stakes", personification: "light", explanationPressure: .03 },
  { name: "courtroom", aliases: ["court", "trial", "legal"], terms: ["case", "evidence", "judged", "verdict", "argument", "testimony", "objection", "ruling", "appeal", "record"], relationWeights: { contrasts: 1, recontextualizes: 1, converges: .92, causes: .82 }, operationWeights: { contrast: 1, reframe: 1, converge: .9, consequence: .82 }, opportunityWeights: { relational_role: 1, heterogeneous_convergence: .98, callback: .94, contrast: 1, invariant: .86 }, observerMode: "stakes", personification: "light", explanationPressure: .04 },
  { name: "military", aliases: ["tactical", "combat"], terms: ["sector", "mission", "clear", "secure", "command", "unit", "target", "deployment", "status", "operation"], relationWeights: { causes: 1, changes: 1, contrasts: .9, converges: .82 }, operationWeights: { consequence: 1, reveal: .95, contrast: .9, converge: .82 }, opportunityWeights: { state_transformation: 1, origin_outcome: .92, contrast: .86, heterogeneous_convergence: .82 }, observerMode: "stakes", personification: "light", explanationPressure: .03 },
  { name: "horror", aliases: ["scary", "thriller", "creepy", "dread"], terms: ["watched", "quiet", "dark", "presence", "shadow", "still", "missing", "empty", "silence", "unknown", "return"], relationWeights: { changes: 1, causes: .96, contrasts: .94, recontextualizes: .9, repeats: .86 }, operationWeights: { consequence: 1, reveal: 1, contrast: .95, reframe: .92, recur: .9 }, opportunityWeights: { invariant: 1, callback: .98, contrast: 1, heterogeneous_convergence: .94, relational_role: .9 }, observerMode: "tension", personification: "light", explanationPressure: .01 },
  { name: "noir", aliases: ["detective", "mystery-noir"], terms: ["evidence", "watching", "shadow", "truth", "lie", "signal", "quiet", "case", "night", "trace", "again"], relationWeights: { recontextualizes: 1, contrasts: .96, repeats: .9, converges: .88 }, operationWeights: { reframe: 1, contrast: .95, recur: .9, converge: .86 }, opportunityWeights: { callback: 1, relational_role: .96, heterogeneous_convergence: .94, invariant: .9, contrast: .9 }, observerMode: "tension", personification: "light", explanationPressure: .01 },
  { name: "rom-com", aliases: ["romcom", "romantic comedy"], terms: ["meet", "chemistry", "awkward", "timing", "again", "together", "date", "smile", "close", "left", "returned"], relationWeights: { converges: 1, recontextualizes: .96, repeats: .9, contrasts: .82 }, operationWeights: { converge: 1, reframe: .96, recur: .9, contrast: .8 }, opportunityWeights: { preference_constellation: .9, relational_role: 1, callback: .96, heterogeneous_convergence: .94, contrast: .82 }, observerMode: "intimacy", personification: "light", explanationPressure: .03 },
  { name: "royal", aliases: ["kingdom", "courtly"], terms: ["kingdom", "throne", "court", "royal", "crown", "returned", "restored", "realm", "guard", "ceremony"], relationWeights: { recontextualizes: .95, converges: .92, changes: 1, contrasts: .84 }, operationWeights: { reframe: .96, converge: .9, reveal: 1, contrast: .82 }, opportunityWeights: { invariant: .94, state_transformation: 1, origin_outcome: .92, relational_role: .9 }, observerMode: "wonder", personification: "strong", explanationPressure: .05 },
  { name: "documentary", aliases: ["observational", "doc"], terms: ["observed", "recorded", "documented", "process", "before", "after", "detail", "ordinary", "real", "evidence"], relationWeights: { converges: .9, recontextualizes: .84, changes: .86, repeats: .78 }, operationWeights: { reveal: .95, converge: .9, reframe: .84, recur: .78 }, opportunityWeights: { heterogeneous_convergence: 1, relational_role: .9, invariant: .88, origin_outcome: .84 }, observerMode: "discovery", personification: "none", explanationPressure: .08 },
  { name: "western", aliases: ["cowboy", "frontier"], terms: ["dust", "town", "frontier", "faceoff", "standoff", "horse", "road", "law", "wanted", "arrival"], relationWeights: { contrasts: 1, causes: .94, changes: .9, recontextualizes: .8 }, operationWeights: { contrast: 1, consequence: .94, reveal: .9, reframe: .8 }, opportunityWeights: { contrast: 1, state_transformation: .96, relational_role: .88, origin_outcome: .84 }, observerMode: "stakes", personification: "light", explanationPressure: .04 },
  { name: "cyberpunk", aliases: ["cyber", "futuristic"], terms: ["system", "status", "signal", "network", "protocol", "access", "glitch", "online", "offline", "clear"], relationWeights: { changes: 1, converges: .96, contrasts: .9, causes: .88 }, operationWeights: { reveal: 1, converge: .96, contrast: .9, consequence: .86 }, opportunityWeights: { state_transformation: 1, heterogeneous_convergence: .94, contrast: .9, relational_role: .84 }, observerMode: "stakes", personification: "light", explanationPressure: .04 },
  { name: "absurd", aliases: ["weird", "surreal"], terms: ["absurd", "strange", "unexpected", "ridiculous", "serious", "wrong", "normal", "sudden", "impossible"], relationWeights: { contrasts: 1, recontextualizes: 1, converges: .96, changes: .82 }, operationWeights: { contrast: 1, reframe: 1, converge: .95, reveal: .82 }, opportunityWeights: { heterogeneous_convergence: 1, relational_role: .96, contrast: 1, callback: .9 }, observerMode: "comedy", personification: "strong", explanationPressure: .01 },
  { name: "comedy", aliases: ["funny", "humor", "humour", "comic", "playful"], terms: ["funny", "awkward", "ridiculous", "serious", "wrong", "again", "unexpected", "approved", "denied", "negotiation"], relationWeights: { contrasts: 1, recontextualizes: .98, converges: .94, repeats: .86 }, operationWeights: { contrast: 1, reframe: .98, converge: .94, recur: .84 }, opportunityWeights: { heterogeneous_convergence: 1, relational_role: .98, preference_constellation: .9, contrast: .96, callback: .9 }, observerMode: "comedy", personification: "strong", explanationPressure: .01 },
  { name: "romance", aliases: ["love", "relationship", "intimate"], terms: ["close", "together", "stay", "return", "touch", "look", "wait", "miss", "home", "again"], relationWeights: { converges: 1, recontextualizes: .98, repeats: .96, causes: .7 }, operationWeights: { converge: 1, reframe: .98, recur: .95, consequence: .68 }, opportunityWeights: { relational_role: 1, callback: .98, convergence: .96, preference_constellation: .86, invariant: .84 }, observerMode: "intimacy", personification: "light", explanationPressure: .01 },
  { name: "sentimental", aliases: ["nostalgic", "memory", "heartfelt"], terms: ["still", "remember", "back", "home", "again", "kept", "years", "first", "old", "return"], relationWeights: { repeats: 1, recontextualizes: 1, converges: .9, changes: .7 }, operationWeights: { recur: 1, reframe: 1, converge: .9, reveal: .7 }, opportunityWeights: { invariant: 1, callback: 1, origin_outcome: .94, heterogeneous_convergence: .9 }, observerMode: "intimacy", personification: "none", explanationPressure: .01 },
  { name: "mystery", aliases: ["enigmatic", "puzzle", "secret"], terms: ["unknown", "clue", "evidence", "trace", "secret", "missing", "return", "why", "watching", "case"], relationWeights: { recontextualizes: 1, contrasts: .98, converges: .94, causes: .82 }, operationWeights: { reframe: 1, contrast: .98, converge: .94, consequence: .82 }, opportunityWeights: { callback: 1, heterogeneous_convergence: 1, relational_role: .94, invariant: .88 }, observerMode: "tension", personification: "light", explanationPressure: .01 },
  { name: "adventure", aliases: ["action", "journey", "quest", "epic"], terms: ["road", "journey", "mission", "arrive", "leave", "return", "challenge", "cross", "discover", "finish"], relationWeights: { causes: 1, changes: .96, converges: .82, contrasts: .72 }, operationWeights: { consequence: 1, reveal: .96, converge: .82, contrast: .72 }, opportunityWeights: { state_transformation: 1, origin_outcome: .96, contrast: .8, heterogeneous_convergence: .78 }, observerMode: "stakes", personification: "light", explanationPressure: .04 },
];

const normalize = (value: string): string[] =>
  [...new Set(value.toLowerCase().replace(/[^a-z0-9'’-]+/g, " ").split(/\s+/).filter((token) => token.length >= 3))];

export function resolveLensPolicy(lens?: string): LensPolicy {
  const raw = String(lens ?? "").trim();
  if (!raw) {
    return {
      name: "NONE",
      terms: [],
      relationWeights: {},
      operationWeights: {},
      opportunityWeights: {},
      observerMode: "discovery",
      personification: "none",
      explanationPressure: 0.2,
    };
  }

  const inputTokens = normalize(raw);
  let best: LensSeed | undefined;
  let bestScore = 0;

  for (const seed of SEEDS) {
    const aliasTokens = new Set(normalize(seed.name).concat((seed.aliases ?? []).flatMap(normalize)));
    const hits = inputTokens.filter((token) => aliasTokens.has(token));
    const score = hits.length / Math.max(1, inputTokens.length);
    if (score > bestScore) {
      best = seed;
      bestScore = score;
    }
  }

  if (!best) {
    return {
      name: raw,
      terms: inputTokens,
      relationWeights: {},
      operationWeights: { reveal: .45, reframe: .4, converge: .35, recur: .3 },
      opportunityWeights: { heterogeneous_convergence: .55, relational_role: .5, contrast: .45, callback: .42 },
      observerMode: "discovery",
      personification: "light",
      explanationPressure: .03,
    };
  }

  return {
    name: best.name,
    terms: uniqueStrings([...best.terms, ...inputTokens]),
    relationWeights: { ...best.relationWeights },
    operationWeights: { ...best.operationWeights },
    opportunityWeights: { ...best.opportunityWeights },
    observerMode: best.observerMode,
    personification: best.personification,
    explanationPressure: best.explanationPressure,
  };
}

export function lensOpportunityAffinity(opportunity: SatanicoInferenceOpportunity, lens: LensPolicy): number {
  return lens.opportunityWeights[opportunity.kind] ?? 0;
}

export function lensRelationAffinity(relation: RealityRelation, lens: LensPolicy): number {
  return lens.relationWeights[relation.kind] ?? 0;
}

export function lensOperationAffinity(operation: LatentMovieTrajectoryStep["operation"], lens: LensPolicy): number {
  return lens.operationWeights[operation] ?? 0;
}

export function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => String(value).trim()).filter(Boolean))];
}
