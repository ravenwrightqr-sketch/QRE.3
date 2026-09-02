/**
 * UNIVERSAL LENS POLICY
 *
 * A lens is a perceptual policy over supplied reality. It never creates facts.
 * It changes which grounded relationships, operations, observer effects, and
 * environmental treatments are worth privileging when constructing a movie.
 *
 * Satanico remains the inference authority: the lens selects a search space;
 * Satanico decides which grounded opportunity has the strongest observer-read.
 */
import type { LatentMovieTrajectoryStep, RealityRelation } from "@qre/contracts";
import type { SatanicoInferenceOpportunity } from "./authorSatanicoEvidenceSearch.js";
import type { RealityEnvelope } from "./authorRealityEnvelope.js";

export type LensPolicy = {
  name: string;
  terms: string[];
  relationWeights: Partial<Record<RealityRelation["kind"], number>>;
  operationWeights: Partial<Record<LatentMovieTrajectoryStep["operation"], number>>;
  opportunityWeights: Partial<Record<SatanicoInferenceOpportunity["kind"], number>>;
  observerMode: "discovery" | "tension" | "wonder" | "intimacy" | "comedy" | "stakes";
  personification: "none" | "light" | "strong";
  explanationPressure: number;

  /** Rich realization controls. These are policy, not source truth. */
  humanSpine: "preserve" | "prioritize" | "shared";
  worldOrbit: string[];
  environmentalOperators: string[];
  observerTarget: string[];
  realizationMoves: string[];
  forbiddenRealityMoves: string[];
  intensity: number;
};

type LensSeed = Omit<LensPolicy, "name" | "humanSpine" | "worldOrbit" | "environmentalOperators" | "observerTarget" | "realizationMoves" | "forbiddenRealityMoves" | "intensity"> & {
  name: string;
  aliases?: string[];
};

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
  { name: "romance", aliases: ["love", "relationship", "intimate"], terms: ["close", "together", "stay", "return", "touch", "look", "wait", "miss", "home", "again"], relationWeights: { converges: 1, recontextualizes: .98, repeats: .96, causes: .7 }, operationWeights: { converge: 1, reframe: .98, recur: .95, consequence: .68 }, opportunityWeights: { relational_role: 1, callback: .98, heterogeneous_convergence: .96, preference_constellation: .86, invariant: .84 }, observerMode: "intimacy", personification: "light", explanationPressure: .01 },
  { name: "sentimental", aliases: ["nostalgic", "memory", "heartfelt"], terms: ["still", "remember", "back", "home", "again", "kept", "years", "first", "old", "return"], relationWeights: { repeats: 1, recontextualizes: 1, converges: .9, changes: .7 }, operationWeights: { recur: 1, reframe: 1, converge: .9, reveal: .7 }, opportunityWeights: { invariant: 1, callback: 1, origin_outcome: .94, heterogeneous_convergence: .9 }, observerMode: "intimacy", personification: "none", explanationPressure: .01 },
  { name: "mystery", aliases: ["enigmatic", "puzzle", "secret"], terms: ["unknown", "clue", "evidence", "trace", "secret", "missing", "return", "why", "watching", "case"], relationWeights: { recontextualizes: 1, contrasts: .98, converges: .94, causes: .82 }, operationWeights: { reframe: 1, contrast: .98, converge: .94, consequence: .82 }, opportunityWeights: { callback: 1, heterogeneous_convergence: 1, relational_role: .94, invariant: .88 }, observerMode: "tension", personification: "light", explanationPressure: .01 },
  { name: "adventure", aliases: ["action", "journey", "quest", "epic"], terms: ["road", "journey", "mission", "arrive", "leave", "return", "challenge", "cross", "discover", "finish"], relationWeights: { causes: 1, changes: .96, converges: .82, contrasts: .72 }, operationWeights: { consequence: 1, reveal: .96, converge: .82, contrast: .72 }, opportunityWeights: { state_transformation: 1, origin_outcome: .96, contrast: .8, heterogeneous_convergence: .78 }, observerMode: "stakes", personification: "light", explanationPressure: .04 },
];

export const CANONICAL_LENS_NAMES = SEEDS.map((seed) => seed.name) as readonly string[];

const normalize = (value: string): string[] => [...new Set(value.toLowerCase().replace(/[^a-z0-9'’-]+/g, " ").split(/\s+/).filter((token) => token.length >= 3))];

const BEHAVIOR_DEFAULTS = {
  NONE: {
    humanSpine: "preserve" as const,
    worldOrbit: ["supplied world only"],
    environmentalOperators: ["recurrence", "contrast", "recontextualization"],
    observerTarget: ["recognition", "curiosity", "natural attention"],
    realizationMoves: ["understatement", "implication", "recognition"],
    forbiddenRealityMoves: ["invented concrete event", "invented reaction", "invented object"],
    intensity: .18,
  },
};

const BEHAVIORS: Record<string, Omit<LensPolicy, "name" | "terms" | "relationWeights" | "operationWeights" | "opportunityWeights" | "observerMode" | "personification" | "explanationPressure">> = {
  game: { humanSpine: "preserve", worldOrbit: ["progression", "thresholds", "room state", "status states", "environmental rewards", "unexpected state changes"], environmentalOperators: ["unlock", "clear", "escalate", "reorder", "recur", "environmental-state-change"], observerTarget: ["momentum", "anticipation", "win-condition recognition", "surprise"], realizationMoves: ["compression", "status_inversion", "consequence", "reversal", "callback"], forbiddenRealityMoves: ["invented score", "invented opponent", "invented level object", "invented concrete event"], intensity: .86 },
  spy: { humanSpine: "preserve", worldOrbit: ["surveillance", "signals", "evidence", "concealment", "spatial inconsistency", "object repositioning", "environmental verification"], environmentalOperators: ["watch", "signal", "misalign", "reposition", "repeat", "withhold", "cross-check"], observerTarget: ["suspicion", "curiosity", "double-awareness", "pattern detection"], realizationMoves: ["implication", "understatement", "recontextualization", "double_meaning", "callback"], forbiddenRealityMoves: ["invented handler", "invented weapon", "invented surveillance device", "invented mission", "invented character reaction"], intensity: .84 },
  heist: { humanSpine: "preserve", worldOrbit: ["acquisition", "absence", "securing", "timing", "evidence", "exit state", "object status"], environmentalOperators: ["acquire", "remove", "secure", "reposition", "hide", "reveal", "escape-pressure"], observerTarget: ["anticipation", "tracking", "consequence", "payoff"], realizationMoves: ["compression", "consequence", "reversal", "status_inversion", "callback"], forbiddenRealityMoves: ["invented theft", "invented accomplice", "invented security system", "invented escape"], intensity: .86 },
  courtroom: { humanSpine: "preserve", worldOrbit: ["evidence", "record", "contradiction", "approval", "denial", "judgment", "status"], environmentalOperators: ["enter-evidence", "contrast", "reclassify", "surface", "seal", "return"], observerTarget: ["comparison", "judgment", "recognition", "verdict anticipation"], realizationMoves: ["contrast", "recontextualization", "status_inversion", "implication", "reversal"], forbiddenRealityMoves: ["invented judge", "invented lawyer", "invented testimony", "invented hearing"], intensity: .83 },
  military: { humanSpine: "preserve", worldOrbit: ["sector state", "clearance", "readiness", "progress", "command status", "site condition"], environmentalOperators: ["clear", "secure", "advance", "hold", "recheck", "report-state"], observerTarget: ["stakes", "progress", "completion", "status"], realizationMoves: ["compression", "consequence", "reversal", "understatement", "status_inversion"], forbiddenRealityMoves: ["invented combat", "invented weapon", "invented casualty", "invented command"], intensity: .84 },
  horror: { humanSpine: "preserve", worldOrbit: ["ordinary wrongness", "watching", "absence", "spatial disturbance", "sound disturbance", "object displacement", "recurrence"], environmentalOperators: ["displace", "invert", "repeat", "silence", "interrupt", "echo", "withhold", "escalate"], observerTarget: ["dread", "uncertainty", "prediction", "double-awareness", "unease without character reaction"], realizationMoves: ["implication", "recontextualization", "understatement", "reversal", "callback"], forbiddenRealityMoves: ["invented violence", "invented supernatural event", "invented character fear", "invented reaction"], intensity: .92 },
  noir: { humanSpine: "preserve", worldOrbit: ["evidence", "absence", "suspicion", "objects carrying implication", "quiet pressure", "returning detail"], environmentalOperators: ["withhold", "reframe", "reposition", "echo", "contrast", "surface"], observerTarget: ["suspicion", "inference", "recognition", "moral ambiguity"], realizationMoves: ["implication", "understatement", "recontextualization", "callback", "double_meaning"], forbiddenRealityMoves: ["invented crime", "invented detective", "invented weapon", "invented reaction"], intensity: .8 },
  "rom-com": { humanSpine: "prioritize", worldOrbit: ["timing", "awkward coincidence", "social collision", "repetition", "misread signals"], environmentalOperators: ["interrupt", "coincide", "recur", "contrast", "echo"], observerTarget: ["affection", "anticipation", "delight", "recognition"], realizationMoves: ["understatement", "callback", "recontextualization", "double_meaning", "reversal"], forbiddenRealityMoves: ["invented confession", "invented physical intimacy", "invented reaction"], intensity: .72 },
  romance: { humanSpine: "prioritize", worldOrbit: ["recurrence", "place memory", "quiet coincidence", "specific objects", "shared space"], environmentalOperators: ["echo", "recur", "hold", "reframe", "return"], observerTarget: ["intimacy", "recognition", "tender anticipation"], realizationMoves: ["understatement", "implication", "callback", "recontextualization", "compression"], forbiddenRealityMoves: ["invented confession", "invented physical intimacy", "invented affection"], intensity: .62 },
  sentimental: { humanSpine: "prioritize", worldOrbit: ["memory carriers", "persistence", "before-after distance", "returning places", "specific sensory traces"], environmentalOperators: ["return", "echo", "hold", "contrast", "recontextualize"], observerTarget: ["recognition", "nostalgia", "emotional afterimage"], realizationMoves: ["understatement", "callback", "recontextualization", "compression", "implication"], forbiddenRealityMoves: ["invented past detail", "invented chronology", "generic sentiment"], intensity: .56 },
  absurd: { humanSpine: "preserve", worldOrbit: ["incongruity", "impossible arrangement", "deadpan escalation", "normality under strain", "unexpected recurrence"], environmentalOperators: ["juxtapose", "invert", "reposition", "repeat", "escalate", "underplay"], observerTarget: ["surprise", "delight", "double-take", "incongruity recognition"], realizationMoves: ["double_meaning", "understatement", "contrast", "personification", "reversal"], forbiddenRealityMoves: ["invented event", "invented prop", "literalized joke premise", "invented reaction"], intensity: .88 },
  cyberpunk: { humanSpine: "preserve", worldOrbit: ["system state", "signals", "protocols", "glitches", "status overlays", "network behavior", "spatial interface"], environmentalOperators: ["glitch", "signal", "reclassify", "flicker", "route", "recur", "status-shift"], observerTarget: ["system awareness", "discovery", "anticipation", "status change"], realizationMoves: ["compression", "reframe", "consequence", "contrast", "callback"], forbiddenRealityMoves: ["invented device", "invented network fact", "invented dialogue", "invented concrete event"], intensity: .88 },
  documentary: { humanSpine: "preserve", worldOrbit: ["process", "detail", "trace", "measure", "before-after", "ordinary specificity"], environmentalOperators: ["observe", "sequence", "return", "compare", "surface"], observerTarget: ["notice", "understand", "recognize pattern"], realizationMoves: ["specificity", "understatement", "compression", "callback", "implication"], forbiddenRealityMoves: ["invented statistic", "invented chronology", "invented quote"], intensity: .5 },
  service: { humanSpine: "preserve", worldOrbit: ["service ritual", "process", "before-after", "handoff", "status completion"], environmentalOperators: ["progress", "clear", "transform-state", "recur", "handoff"], observerTarget: ["satisfaction", "recognition", "completion"], realizationMoves: ["compression", "consequence", "understatement", "callback", "recontextualization"], forbiddenRealityMoves: ["invented service action", "invented customer reaction", "invented outcome"], intensity: .62 },
  hospitality: { humanSpine: "prioritize", worldOrbit: ["welcome", "comfort", "place", "ritual", "departure", "specific amenity"], environmentalOperators: ["open", "settle", "echo", "prepare", "restore"], observerTarget: ["comfort", "belonging", "recognition"], realizationMoves: ["understatement", "callback", "implication", "recontextualization"], forbiddenRealityMoves: ["invented amenity", "invented guest reaction", "invented welcome"], intensity: .58 },
  transformation: { humanSpine: "preserve", worldOrbit: ["before-state", "change", "after-state", "material result", "status shift"], environmentalOperators: ["reveal", "contrast", "reframe", "complete", "return"], observerTarget: ["recognition", "surprise", "satisfaction"], realizationMoves: ["recontextualization", "consequence", "compression", "callback", "understatement"], forbiddenRealityMoves: ["invented before-state", "invented transformation", "invented finished state"], intensity: .78 },
};

function behaviorFor(name: string) {
  return BEHAVIORS[name] ?? {
    ...BEHAVIOR_DEFAULTS.NONE,
    humanSpine: "preserve" as const,
    worldOrbit: ["grounded supplied environment", "relationship structure", "sequence state"],
    environmentalOperators: ["contrast", "reframe", "recur", "consequence"],
    observerTarget: ["discovery", "curiosity", "recognition"],
    realizationMoves: ["implication", "understatement", "recontextualization"],
    forbiddenRealityMoves: ["invented concrete event", "invented reaction", "invented object"],
    intensity: .62,
  };
}

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
      explanationPressure: .2,
      ...BEHAVIOR_DEFAULTS.NONE,
    };
  }

  const inputTokens = normalize(raw);
  let best: LensSeed | undefined;
  let bestScore = 0;
  for (const seed of SEEDS) {
    const aliases = new Set(normalize(seed.name).concat((seed.aliases ?? []).flatMap(normalize)));
    const hits = inputTokens.filter((token) => aliases.has(token));
    const score = hits.length / Math.max(1, inputTokens.length);
    if (score > bestScore) { best = seed; bestScore = score; }
  }

  if (!best) {
    const behavior = behaviorFor(raw.toLowerCase());
    return {
      name: raw,
      terms: inputTokens,
      relationWeights: {},
      operationWeights: { reveal: .45, reframe: .4, converge: .35, recur: .3 },
      opportunityWeights: { heterogeneous_convergence: .55, relational_role: .5, contrast: .45, callback: .42 },
      observerMode: "discovery",
      personification: "light",
      explanationPressure: .03,
      ...behavior,
    };
  }

  const behavior = behaviorFor(best.name);
  return {
    name: best.name,
    terms: [...new Set([...best.terms, ...inputTokens])],
    relationWeights: { ...best.relationWeights },
    operationWeights: { ...best.operationWeights },
    opportunityWeights: { ...best.opportunityWeights },
    observerMode: best.observerMode,
    personification: best.personification,
    explanationPressure: best.explanationPressure,
    ...behavior,
  };
}

export function lensOpportunityAffinity(opportunity: SatanicoInferenceOpportunity, lens: LensPolicy): number { return lens.opportunityWeights[opportunity.kind] ?? 0; }
export function lensRelationAffinity(relation: RealityRelation, lens: LensPolicy): number { return lens.relationWeights[relation.kind] ?? 0; }
export function lensOperationAffinity(operation: LatentMovieTrajectoryStep["operation"], lens: LensPolicy): number { return lens.operationWeights[operation] ?? 0; }
