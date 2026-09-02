import type {
  AuthorCharacterProfile,
  AuthorLensKind,
  AuthorLensProfile,
} from "@qre/contracts";
import type { RealityEnvelope } from "./authorRealityEnvelope.js";

export type { AuthorCharacterProfile, AuthorLensKind, AuthorLensProfile } from "@qre/contracts";

const LENSES: Record<string, AuthorLensProfile> = {
  comedy: { kind: "comedy", label: "comedy", framingBias: ["status contradiction", "understatement", "unexpected specificity", "reversal", "social collision"], realizationPreferences: ["contrast", "status_inversion", "understatement", "double_meaning", "reversal"], forbiddenRealityMoves: ["invented punchline event", "literalized metaphor"], intensity: .72 },
  romance: { kind: "romance", label: "romance", framingBias: ["recurrence", "restraint", "private significance", "emotional consequence", "intimacy"], realizationPreferences: ["callback", "implication", "understatement", "recontextualization"], forbiddenRealityMoves: ["invented confession", "invented physical intimacy"], intensity: .62 },
  horror: { kind: "horror", label: "horror", framingBias: ["ordinary wrongness", "watching", "escalating uncertainty", "unresolved signal", "absence"], realizationPreferences: ["implication", "recontextualization", "reversal", "understatement", "callback"], forbiddenRealityMoves: ["invented violence", "invented supernatural event"], intensity: .82 },
  tenderness: { kind: "tenderness", label: "tenderness", framingBias: ["specific detail", "restraint", "care", "quiet consequence", "private significance"], realizationPreferences: ["understatement", "callback", "implication", "recontextualization"], forbiddenRealityMoves: ["generic sentiment", "invented affection"], intensity: .48 },
  nostalgia: { kind: "nostalgia", label: "nostalgia", framingBias: ["recurrence", "memory echo", "changed meaning", "specific sensory detail", "distance"], realizationPreferences: ["callback", "recontextualization", "understatement", "compression"], forbiddenRealityMoves: ["invented past detail", "invented chronology"], intensity: .56 },
  chaos: { kind: "chaos", label: "chaos", framingBias: ["juxtaposition", "speed", "status reversal", "unexpected collision", "volatility"], realizationPreferences: ["contrast", "reversal", "double_meaning", "compression", "implication"], forbiddenRealityMoves: ["invented event", "invented object interaction"], intensity: .9 },
  fierce: { kind: "fierce", label: "fierce", framingBias: ["status", "defiance", "attitude", "controlled escalation", "self-possession"], realizationPreferences: ["status_inversion", "contrast", "understatement", "reversal"], forbiddenRealityMoves: ["invented threat", "invented aggression"], intensity: .84 },
  absurd: { kind: "absurd", label: "absurd", framingBias: ["mismatch", "deadpan juxtaposition", "double meaning", "specificity", "incongruity"], realizationPreferences: ["double_meaning", "contrast", "understatement", "personification", "reversal"], forbiddenRealityMoves: ["literalized joke premise", "invented props"], intensity: .86 },
  dramatic: { kind: "dramatic", label: "dramatic", framingBias: ["stakes", "consequence", "reversal", "earned payoff", "pressure"], realizationPreferences: ["recontextualization", "reversal", "contrast", "callback", "compression"], forbiddenRealityMoves: ["invented stakes", "invented crisis"], intensity: .74 },
  quiet: { kind: "quiet", label: "quiet", framingBias: ["restraint", "specificity", "implication", "absence", "afterimage"], realizationPreferences: ["understatement", "implication", "callback", "compression"], forbiddenRealityMoves: ["dramatic embellishment", "generic emotion"], intensity: .32 },
};

const RELATION_AFFINITY: Record<string, readonly string[]> = {
  contrasts: ["comedy", "absurd", "fierce", "horror", "dramatic", "quiet"],
  recontextualizes: ["detective", "noir", "horror", "romance", "documentary", "quiet"],
  changes: ["dramatic", "competition", "romance", "fierce", "transformation"],
  repeats: ["romance", "nostalgia", "horror", "detective", "noir", "quiet"],
  converges: ["detective", "romance", "dramatic", "quiet"],
  causes: ["dramatic", "horror", "thriller", "competition"],
};

const STRATEGY_RELATIONS: Record<string, readonly string[]> = {
  contrast: ["contrasts"],
  recontextualization: ["recontextualizes"],
  callback: ["repeats"],
  reversal: ["contrasts", "changes"],
  consequence: ["causes", "changes"],
  implication: ["recontextualizes", "contrasts"],
  personification: ["involves", "converges"],
  status_inversion: ["contrasts", "changes"],
  understatement: ["converges", "recontextualizes"],
  double_meaning: ["contrasts", "recontextualizes"],
  compression: ["converges", "changes"],
};

function clean(value: unknown): string { return String(value ?? "").replace(/\s+/g, " ").trim(); }
function metric(value: number): number { return Number(Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)).toFixed(3)); }
function unique(values: readonly string[]): string[] { return [...new Set(values.map(clean).filter(Boolean))]; }
function tokens(value: string): Set<string> { return new Set(clean(value).toLowerCase().split(/[^a-z0-9'-]+/i).filter((token) => token.length >= 3)); }
function relationLanguage(envelope: RealityEnvelope): string[] { return unique(envelope.relations.map((relation) => relation.kind)); }
function stateSignals(envelope: RealityEnvelope): string[] { return unique([...(envelope.recurringSignals ?? []), ...(envelope.unresolvedTensions ?? []), ...(envelope.sensorySignals ?? []), ...(envelope.suppliedPhrases ?? [])]).slice(0, 24); }

export function classifyLens(value?: string): AuthorLensProfile {
  const raw = clean(value).toLowerCase();
  if (!raw || raw === "none") return { ...LENSES.quiet, kind: "custom", label: "NONE" };
  const aliases: Record<string, string> = { funny: "comedy", comedic: "comedy", love: "romance", romantic: "romance", scary: "horror", spooky: "horror", weird: "absurd", humor: "comedy", humour: "comedy" };
  const key = aliases[raw] ?? raw;
  const profile = LENSES[key];
  if (profile) return { ...profile, framingBias: [...profile.framingBias], realizationPreferences: [...profile.realizationPreferences], forbiddenRealityMoves: [...profile.forbiddenRealityMoves] };
  return { kind: "custom", label: raw, framingBias: raw.split(/[,|]/).map(clean).filter(Boolean).slice(0, 8), realizationPreferences: ["implication", "recontextualization", "compression", "contrast"], forbiddenRealityMoves: ["invented concrete reality", "generic filler"], intensity: .6 };
}

function relationScore(lens: string, envelope: RealityEnvelope): number {
  const kinds = relationLanguage(envelope);
  if (!kinds.length) return 0;
  const hits = kinds.filter((kind) => (RELATION_AFFINITY[kind] ?? []).includes(lens)).length;
  return metric(hits / Math.max(1, kinds.length));
}
function strategyScore(lens: AuthorLensProfile, envelope: RealityEnvelope): number {
  const kinds = new Set(relationLanguage(envelope));
  let hits = 0;
  for (const strategy of lens.realizationPreferences) {
    if ((STRATEGY_RELATIONS[strategy] ?? []).some((kind) => kinds.has(kind))) hits += 1;
    else if (strategy === "callback" && envelope.recurringSignals.length) hits += 1;
    else if (strategy === "implication" && envelope.unresolvedTensions.length) hits += 1;
    else if (strategy === "compression" && envelope.events.length >= 4) hits += 1;
  }
  return metric(hits / Math.max(1, lens.realizationPreferences.length));
}
function nativeDirectness(envelope: RealityEnvelope): number {
  if (!envelope.events.length) return 0;
  const specificity = envelope.events.reduce((sum, event) => sum + Math.min(1, clean(event.label).split(/\s+/).filter(Boolean).length / 8 + (event.entities?.length ?? 0) / 8), 0) / envelope.events.length;
  const relationships = Math.min(1, envelope.relations.length / Math.max(1, envelope.events.length));
  return metric(specificity * .55 + relationships * .45);
}

export function rankLensOpportunities(envelope: RealityEnvelope): Array<{ frame: string; reason: string; confidence: number }> {
  const native = nativeDirectness(envelope);
  const scored = Object.entries(LENSES).map(([key, lens]) => ({
    frame: lens.label,
    reason: `${lens.label} changes perception only; it amplifies relationships and realization moves already supported by the supplied world.`,
    confidence: metric(relationScore(key, envelope) * .45 + strategyScore(lens, envelope) * .35 + native * .20),
  }));
  scored.push({ frame: "NONE", reason: "Preserve native reality when no treatment improves the discovered opportunity.", confidence: native });
  return scored.sort((a, b) => b.confidence - a.confidence || a.frame.localeCompare(b.frame)).slice(0, 8);
}

export function buildCharacterProfile(envelope: RealityEnvelope): AuthorCharacterProfile {
  const labels = envelope.events.map((event) => event.label);
  const states = envelope.suppliedStates ?? [];
  const tensions = envelope.unresolvedTensions ?? [];
  const traits = unique([...states, ...labels.filter((label) => !/\b(?:cleaned|opened|closed|walked|watched|arrived|left|made|repaired|groomed)\b/i.test(label))]).slice(0, 8);
  const objectRelationships = unique([...envelope.sensorySignals, ...labels.filter((label) => /\b(?:bow|ring|gift|photo|receipt|meal|place|car|home|room)\b/i.test(label))]).slice(0, 8);
  return {
    subject: envelope.subject,
    coreTraits: traits,
    statusPosture: traits.length >= 2 ? `${traits[0]} versus ${traits[1]}` : traits[0] || "neutral",
    emotionalPosture: tensions[0] || states[0] || "unspecified",
    contradictions: tensions.slice(0, 8),
    objectRelationships,
    privateInterpretations: unique([...tensions, ...relationLanguage(envelope).map((kind) => `relationship:${kind}`), ...stateSignals(envelope).map((signal) => `signal:${signal}`)]).slice(0, 18),
    confidence: metric(.35 + Math.min(.25, traits.length * .04) + Math.min(.2, tensions.length * .05)),
  };
}

export function scoreLensFit(lens: AuthorLensProfile, character: AuthorCharacterProfile, envelope: RealityEnvelope): number {
  const all = tokens([...lens.framingBias, ...character.coreTraits, ...character.contradictions, ...envelope.suppliedPhrases, ...envelope.recurringSignals, ...envelope.sensorySignals].join(" "));
  const bias = tokens(lens.framingBias.join(" "));
  if (!bias.size) return 0;
  let hits = 0;
  for (const token of bias) if (all.has(token)) hits += 1;
  return metric(hits / bias.size);
}

export function rankMovieCandidatesByLens(
  candidates: readonly LatentMovieCandidate[],
  lensName: string,
): LatentMovieCandidate[] {
  const raw = clean(lensName);
  if (!candidates.length || !raw || raw.toLowerCase() === "none") return [...candidates];
  const lens = classifyLens(raw);
  const wantedRelations = new Set(lens.realizationPreferences.flatMap((strategy) => STRATEGY_RELATIONS[strategy] ?? []));
  const wantedOperations = new Set(lens.realizationPreferences);
  return candidates
    .map((candidate) => {
      const operations = new Set(candidate.trajectory.map((step) => clean(step.operation)).filter(Boolean));
      const relations = new Set(candidate.supportingRelationKinds ?? []);
      const operationFit = [...operations].filter((operation) => wantedOperations.has(operation)).length / Math.max(1, operations.size);
      const relationFit = [...relations].filter((relation) => wantedRelations.has(relation)).length / Math.max(1, relations.size);
      const thesisFit = candidate.storyThesis?.relationKind && wantedRelations.has(candidate.storyThesis.relationKind) ? 1 : 0;
      const lensStrength = metric(operationFit * .35 + relationFit * .35 + thesisFit * .18 + metric(candidate.attentionPotential) * .06 + metric(candidate.consequencePotential) * .06);
      return { candidate, lensScore: metric(candidate.score * .80 + lensStrength * .20) };
    })
    .sort((a, b) => b.lensScore - a.lensScore || b.candidate.score - a.candidate.score)
    .map(({ candidate }) => candidate);
}
