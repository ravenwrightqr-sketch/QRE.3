import type {
  AuthorCharacterProfile,
  AuthorLensKind,
  AuthorLensProfile,
} from "@qre/contracts";
import type { RealityEnvelope } from "./authorRealityEnvelope.js";

/**
 * Canonical QRE creative-treatment registry.
 *
 * A lens is a controlled amplification vocabulary, not a story template.
 * It may change framing, rhythm, implication, status, escalation, recurrence,
 * and payoff. It never grants permission to invent concrete reality.
 */
const LENSES: Record<string, AuthorLensProfile> = {
  comedy: { kind: "comedy", label: "comedy", framingBias: ["status contradiction", "understatement", "unexpected specificity", "reversal", "social collision"], realizationPreferences: ["contrast", "status_inversion", "understatement", "double_meaning", "reversal"], forbiddenRealityMoves: ["invented punchline event", "literalized metaphor"], intensity: 0.72 },
  romance: { kind: "romance", label: "romance", framingBias: ["recurrence", "restraint", "private significance", "emotional consequence", "intimacy"], realizationPreferences: ["callback", "implication", "understatement", "recontextualization"], forbiddenRealityMoves: ["invented confession", "invented physical intimacy"], intensity: 0.62 },
  horror: { kind: "horror", label: "horror", framingBias: ["ordinary wrongness", "watching", "escalating uncertainty", "unresolved signal", "absence"], realizationPreferences: ["implication", "recontextualization", "reversal", "understatement", "callback"], forbiddenRealityMoves: ["invented violence", "invented supernatural event"], intensity: 0.82 },
  tenderness: { kind: "tenderness", label: "tenderness", framingBias: ["specific detail", "restraint", "care", "quiet consequence", "private significance"], realizationPreferences: ["understatement", "callback", "implication", "recontextualization"], forbiddenRealityMoves: ["generic sentiment", "invented affection"], intensity: 0.48 },
  nostalgia: { kind: "nostalgia", label: "nostalgia", framingBias: ["recurrence", "memory echo", "changed meaning", "specific sensory detail", "distance"], realizationPreferences: ["callback", "recontextualization", "understatement", "compression"], forbiddenRealityMoves: ["invented past detail", "invented chronology"], intensity: 0.56 },
  chaos: { kind: "chaos", label: "chaos", framingBias: ["juxtaposition", "speed", "status reversal", "unexpected collision", "volatility"], realizationPreferences: ["contrast", "reversal", "double_meaning", "compression", "implication"], forbiddenRealityMoves: ["invented event", "invented object interaction"], intensity: 0.9 },
  fierce: { kind: "fierce", label: "fierce", framingBias: ["status", "defiance", "attitude", "controlled escalation", "self-possession"], realizationPreferences: ["status_inversion", "contrast", "understatement", "reversal"], forbiddenRealityMoves: ["invented threat", "invented aggression"], intensity: 0.84 },
  absurd: { kind: "absurd", label: "absurd", framingBias: ["mismatch", "deadpan juxtaposition", "double meaning", "specificity", "incongruity"], realizationPreferences: ["double_meaning", "contrast", "understatement", "personification", "reversal"], forbiddenRealityMoves: ["literalized joke premise", "invented props"], intensity: 0.86 },
  dramatic: { kind: "dramatic", label: "dramatic", framingBias: ["stakes", "consequence", "reversal", "earned payoff", "pressure"], realizationPreferences: ["recontextualization", "reversal", "contrast", "callback", "compression"], forbiddenRealityMoves: ["invented stakes", "invented crisis"], intensity: 0.74 },
  quiet: { kind: "quiet", label: "quiet", framingBias: ["restraint", "specificity", "implication", "absence", "afterimage"], realizationPreferences: ["understatement", "implication", "callback", "compression"], forbiddenRealityMoves: ["dramatic embellishment", "generic emotion"], intensity: 0.32 },
  game: { kind: "custom", label: "game", framingBias: ["progression", "threshold", "level", "round", "score", "completion", "retry", "upgrade", "win condition", "status change"], realizationPreferences: ["reversal", "status_inversion", "compression", "consequence", "callback"], forbiddenRealityMoves: ["invented level", "invented score", "invented game object", "invented opponent"], intensity: 0.86 },
  spy: { kind: "custom", label: "spy", framingBias: ["observation", "evidence", "surveillance", "uncertainty", "target", "concealment", "signal", "verification"], realizationPreferences: ["implication", "understatement", "recontextualization", "double_meaning", "callback"], forbiddenRealityMoves: ["invented handler", "invented weapon", "invented surveillance device", "invented mission"], intensity: 0.84 },
  heist: { kind: "custom", label: "heist", framingBias: ["acquisition", "evidence", "securing", "disappearance", "operation", "timing", "exit", "stakes", "payoff"], realizationPreferences: ["consequence", "compression", "reversal", "status_inversion", "callback"], forbiddenRealityMoves: ["invented theft", "invented accomplice", "invented security system", "invented escape"], intensity: 0.86 },
  courtroom: { kind: "custom", label: "courtroom", framingBias: ["evidence", "accusation", "contradiction", "judgment", "verdict", "approval", "denial", "case", "testimony"], realizationPreferences: ["contrast", "recontextualization", "status_inversion", "reversal", "implication"], forbiddenRealityMoves: ["invented lawyer", "invented judge", "invented testimony", "invented hearing"], intensity: 0.83 },
  noir: { kind: "custom", label: "noir", framingBias: ["suspicion", "implication", "evidence", "missing piece", "moral ambiguity", "watching", "quiet pressure", "return"], realizationPreferences: ["implication", "understatement", "recontextualization", "callback", "double_meaning"], forbiddenRealityMoves: ["invented detective", "invented crime", "invented weapon", "invented night scene"], intensity: 0.8 },
  documentary: { kind: "custom", label: "documentary", framingBias: ["specificity", "sequence", "record", "measurement", "observation", "context", "trace", "evidence"], realizationPreferences: ["understatement", "compression", "callback", "implication"], forbiddenRealityMoves: ["invented statistic", "invented quotation", "invented chronology"], intensity: 0.54 },
  mockumentary: { kind: "custom", label: "mockumentary", framingBias: ["deadpan seriousness", "mundane specificity", "status absurdity", "official tone", "contrast"], realizationPreferences: ["understatement", "double_meaning", "contrast", "status_inversion", "compression"], forbiddenRealityMoves: ["invented interview", "invented camera event", "invented witness"], intensity: 0.82 },
  military: { kind: "custom", label: "military", framingBias: ["mission", "sector", "clearance", "readiness", "progression", "command", "operation", "objective"], realizationPreferences: ["status_inversion", "compression", "consequence", "reversal", "understatement"], forbiddenRealityMoves: ["invented command", "invented weapon", "invented combat", "invented casualty"], intensity: 0.84 },
  western: { kind: "custom", label: "western", framingBias: ["standoff", "territory", "reputation", "arrival", "departure", "defiance", "finality", "dust"], realizationPreferences: ["status_inversion", "understatement", "reversal", "compression", "callback"], forbiddenRealityMoves: ["invented gunfight", "invented horse", "invented saloon", "invented threat"], intensity: 0.79 },
  detective: { kind: "custom", label: "detective", framingBias: ["clue", "pattern", "observation", "inference", "contradiction", "missing piece", "reveal", "recognition"], realizationPreferences: ["implication", "recontextualization", "callback", "contrast", "reversal"], forbiddenRealityMoves: ["invented detective", "invented clue", "invented investigation event"], intensity: 0.88 },
  thriller: { kind: "custom", label: "thriller", framingBias: ["pressure", "uncertainty", "escalation", "time pressure", "danger signal", "reversal", "consequence"], realizationPreferences: ["reversal", "consequence", "implication", "compression", "recontextualization"], forbiddenRealityMoves: ["invented danger", "invented deadline", "invented threat", "invented chase"], intensity: 0.9 },
  survival: { kind: "custom", label: "survival", framingBias: ["persistence", "obstacle", "resourcefulness", "recovery", "threshold", "endurance", "relief"], realizationPreferences: ["consequence", "reversal", "compression", "status_inversion", "callback"], forbiddenRealityMoves: ["invented hazard", "invented injury", "invented resource", "invented rescue"], intensity: 0.8 },
  expedition: { kind: "custom", label: "expedition", framingBias: ["discovery", "terrain", "progress", "distance", "destination", "trace", "arrival", "departure"], realizationPreferences: ["recontextualization", "callback", "compression", "implication", "consequence"], forbiddenRealityMoves: ["invented destination", "invented terrain", "invented obstacle", "invented discovery"], intensity: 0.68 },
  royal: { kind: "custom", label: "royal", framingBias: ["status", "ceremony", "judgment", "presentation", "court", "approval", "arrival", "departure"], realizationPreferences: ["status_inversion", "understatement", "reversal", "compression", "callback"], forbiddenRealityMoves: ["invented crown", "invented court", "invented ceremony", "invented title"], intensity: 0.74 },
  competition: { kind: "custom", label: "competition", framingBias: ["rivalry", "challenge", "ranking", "win", "loss", "comparison", "threshold", "final"], realizationPreferences: ["status_inversion", "contrast", "reversal", "compression", "consequence"], forbiddenRealityMoves: ["invented competitor", "invented score", "invented contest event"], intensity: 0.84 },
  procedural: { kind: "custom", label: "procedural", framingBias: ["process", "inspection", "sequence", "verification", "clearance", "completion", "status"], realizationPreferences: ["compression", "understatement", "consequence", "recontextualization", "callback"], forbiddenRealityMoves: ["invented procedure", "invented inspection", "invented checklist event"], intensity: 0.64 },
  fairytale: { kind: "custom", label: "fairytale", framingBias: ["transformation", "symbolic recurrence", "threshold", "wonder", "status", "curse", "release"], realizationPreferences: ["personification", "recontextualization", "callback", "understatement", "reversal"], forbiddenRealityMoves: ["invented magic", "invented creature", "invented spell", "invented supernatural outcome"], intensity: 0.76 },
  deadpan: { kind: "custom", label: "deadpan", framingBias: ["flat delivery", "specificity", "understatement", "mismatch", "official seriousness"], realizationPreferences: ["understatement", "compression", "contrast", "double_meaning", "status_inversion"], forbiddenRealityMoves: ["invented event", "invented reaction", "invented explanation"], intensity: 0.7 },
  service: { kind: "custom", label: "service", framingBias: ["service ritual", "careful execution", "before and after", "status change", "customer handoff"], realizationPreferences: ["compression", "consequence", "callback", "understatement", "recontextualization"], forbiddenRealityMoves: ["invented service action", "invented customer reaction", "invented outcome"], intensity: 0.6 },
  hospitality: { kind: "custom", label: "hospitality", framingBias: ["welcome", "arrival", "care", "comfort", "place", "departure"], realizationPreferences: ["callback", "understatement", "implication", "recontextualization", "compression"], forbiddenRealityMoves: ["invented welcome", "invented amenity", "invented guest reaction"], intensity: 0.58 },
  craft: { kind: "custom", label: "craft", framingBias: ["precision", "material detail", "process", "finish", "transformation"], realizationPreferences: ["compression", "recontextualization", "consequence", "understatement", "callback"], forbiddenRealityMoves: ["invented material", "invented process step", "invented finished result"], intensity: 0.7 },
  concierge: { kind: "custom", label: "concierge", framingBias: ["guidance", "choice", "access", "timing", "preparation", "handoff"], realizationPreferences: ["implication", "compression", "consequence", "callback", "recontextualization"], forbiddenRealityMoves: ["invented recommendation", "invented reservation", "invented access"], intensity: 0.64 },
  ritual: { kind: "custom", label: "ritual", framingBias: ["repetition", "routine", "sequence", "familiarity", "return", "signature"], realizationPreferences: ["callback", "understatement", "compression", "recontextualization", "implication"], forbiddenRealityMoves: ["invented tradition", "invented routine", "invented recurrence"], intensity: 0.62 },
  transformation: { kind: "custom", label: "transformation", framingBias: ["before", "after", "change", "reveal", "finish", "renewal"], realizationPreferences: ["recontextualization", "reversal", "consequence", "compression", "callback"], forbiddenRealityMoves: ["invented before-state", "invented transformation", "invented finished state"], intensity: 0.78 },
};

const LENS_ALIASES: Record<string, string> = {
  funny: "comedy", comedic: "comedy", love: "romance", romantic: "romance",
  scary: "horror", spooky: "horror", mystery: "detective", investigation: "detective",
  army: "military", caper: "heist", surveillance: "spy", espionage: "spy",
  sports: "competition", sportsmovie: "competition", fairy: "fairytale", fairy_tale: "fairytale",
  hospitality: "hospitality", hotel: "hospitality", guest: "hospitality", concierge: "concierge",
  service: "service", servicing: "service", craft: "craft", handmade: "craft",
  routine: "ritual", tradition: "ritual", transform: "transformation", transformed: "transformation",
};

const RELATION_AFFINITY: Record<string, readonly string[]> = {
  contrasts: ["comedy", "absurd", "courtroom", "competition", "western", "deadpan", "fierce", "horror", "service", "craft", "hospitality"],
  recontextualizes: ["detective", "noir", "horror", "spy", "romance", "fairytale", "documentary", "service", "craft", "concierge", "transformation"],
  changes: ["game", "dramatic", "military", "competition", "survival", "romance", "fierce", "service", "craft", "transformation"],
  repeats: ["romance", "nostalgia", "horror", "detective", "noir", "fairytale", "game", "service", "hospitality", "ritual"],
  converges: ["detective", "courtroom", "competition", "romance", "game", "expedition", "concierge", "craft", "transformation"],
  causes: ["heist", "thriller", "dramatic", "game", "military", "survival", "competition", "service", "craft", "concierge", "transformation"],
  before: ["documentary", "spy", "detective", "noir", "procedural", "thriller", "service", "craft", "hospitality", "transformation"],
  after: ["documentary", "spy", "detective", "noir", "procedural", "thriller", "service", "craft", "hospitality", "transformation"],
  involves: ["procedural", "documentary", "spy", "courtroom", "detective", "service", "hospitality", "craft", "concierge"],
  belongs_to: ["royal", "procedural", "documentary", "romance", "service", "hospitality", "craft", "concierge", "ritual"],
};

const LEXICAL_CUES: Record<string, readonly RegExp[]> = {
  game: [/\b(?:level|round|score|boost|power|stage|cleared|complete|completed|next|upgrade|win|winner)\b/i],
  spy: [/\b(?:watched|watching|observed|tracked|logged|target|evidence|location|geo|signal)\b/i],
  heist: [/\b(?:stole|stolen|secured|evidence|operation|exit|disappeared|cleaned|missing)\b/i],
  courtroom: [/\b(?:case|defense|judge|evidence|verdict|approved|denied|guilty|innocent|proof)\b/i],
  horror: [/\b(?:watching|shadow|dark|haunted|ghost|blood|quiet|missing|disappeared|wrong)\b/i],
  noir: [/\b(?:case|evidence|quiet|dark|watched|secret|missing|returned|suspicious)\b/i],
  mockumentary: [/\b(?:officially|technically|apparently|record|status|report)\b/i],
  military: [/\b(?:sector|cleared|mission|operation|ready|objective|command)\b/i],
  western: [/\b(?:arrived|left|territory|ready|standoff|defiant|dust|final)\b/i],
  detective: [/\b(?:clue|pattern|noticed|observed|figured|realized|evidence|missing)\b/i],
  thriller: [/\b(?:pressure|urgent|danger|deadline|before|after|suddenly|still|waiting)\b/i],
  survival: [/\b(?:survived|kept|still|recovered|made it|endured|finished|back)\b/i],
  expedition: [/\b(?:arrived|traveled|miles|distance|destination|found|discovered|returned)\b/i],
  royal: [/\b(?:approved|judged|presented|ceremony|kingdom|queen|royal|worthy)\b/i],
  competition: [/\b(?:win|won|lost|score|best|first|second|challenge|race|compete)\b/i],
  procedural: [/\b(?:cleaned|finished|checked|verified|inspected|completed|started|next)\b/i],
  fairytale: [/\b(?:once|wonder|transformed|changed|beautiful|curse|magic|enchanted)\b/i],
  deadpan: [/\b(?:apparently|anyway|technically|officially|normal|fine|perfectly)\b/i],
  service: [/\b(?:service|appointment|booked|receipt|customer|client|cleaned|groomed|repaired|delivered|installed|picked up|finished)\b/i],
  hospitality: [/\b(?:hotel|guest|stay|check-in|check out|room|welcome|reservation|lobby|breakfast|host)\b/i],
  craft: [/\b(?:made|built|repaired|polished|shaped|cut|dyed|groomed|tailored|finished|handmade|crafted)\b/i],
  concierge: [/\b(?:reserved|recommended|arranged|booked|guided|selected|itinerary|reservation|available|access)\b/i],
  ritual: [/\b(?:every|always|weekly|daily|routine|tradition|again|return|same|regular)\b/i],
  transformation: [/\b(?:before|after|changed|new|restored|repaired|cleaned|transformed|finished|upgrade|renewed)\b/i],
};

function clean(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function metric(value: number): number {
  return Number(Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)).toFixed(3));
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values.map(clean).filter(Boolean))];
}

function tokens(value: string): Set<string> {
  return new Set(clean(value).toLowerCase().split(/[^a-z0-9'-]+/i).filter((token) => token.length >= 3));
}

function stateSignals(envelope: RealityEnvelope): string[] {
  return unique([
    ...(envelope.recurringSignals ?? []),
    ...(envelope.unresolvedTensions ?? []),
    ...(envelope.sensorySignals ?? []),
    ...(envelope.suppliedPhrases ?? []),
  ]).slice(0, 24);
}

function relationLanguage(envelope: RealityEnvelope): string[] {
  return unique(envelope.relations.map((relation) => relation.kind));
}

export function classifyLens(value?: string): AuthorLensProfile {
  const raw = clean(value).toLowerCase();
  if (!raw) return { ...LENSES.comedy, framingBias: [...LENSES.comedy.framingBias], realizationPreferences: [...LENSES.comedy.realizationPreferences], forbiddenRealityMoves: [...LENSES.comedy.forbiddenRealityMoves] };
  const key = LENS_ALIASES[raw] ?? Object.keys(LENSES).find((item) => raw === item || raw.includes(item));
  if (key && LENSES[key]) {
    const profile = LENSES[key];
    return { ...profile, framingBias: [...profile.framingBias], realizationPreferences: [...profile.realizationPreferences], forbiddenRealityMoves: [...profile.forbiddenRealityMoves] };
  }
  return { kind: "custom", label: raw, framingBias: raw.split(/[,|]/).map(clean).filter(Boolean).slice(0, 8), realizationPreferences: ["implication", "recontextualization", "compression", "contrast"], forbiddenRealityMoves: ["invented concrete reality", "generic filler"], intensity: 0.6 };
}

function relationScore(lens: string, envelope: RealityEnvelope): number {
  const kinds = relationLanguage(envelope);
  if (!kinds.length) return 0;
  let hits = 0;
  for (const kind of kinds) if ((RELATION_AFFINITY[kind] ?? []).includes(lens)) hits += 1;
  return metric(hits / Math.max(1, kinds.length));
}

function cueScore(lens: string, envelope: RealityEnvelope): number {
  const patterns = LEXICAL_CUES[lens] ?? [];
  if (!patterns.length) return 0;
  const text = [envelope.subject, ...envelope.events.map((event) => event.label), ...stateSignals(envelope)].map(clean).filter(Boolean).join(" ");
  const hits = patterns.filter((pattern) => pattern.test(text)).length;
  return metric(hits / Math.max(1, patterns.length));
}

function strategyScore(lens: AuthorLensProfile, envelope: RealityEnvelope): number {
  const relationKinds = new Set(relationLanguage(envelope));
  let hits = 0;
  for (const strategy of lens.realizationPreferences) {
    if (
      (strategy === "contrast" && relationKinds.has("contrasts")) ||
      (strategy === "recontextualization" && relationKinds.has("recontextualizes")) ||
      (strategy === "callback" && (relationKinds.has("repeats") || envelope.recurringSignals.length > 0)) ||
      (strategy === "reversal" && (relationKinds.has("contrasts") || relationKinds.has("changes"))) ||
      (strategy === "consequence" && relationKinds.has("causes")) ||
      (strategy === "implication" && (envelope.unresolvedTensions.length > 0 || relationKinds.has("recontextualizes"))) ||
      (strategy === "personification" && envelope.events.some((event) => (event.entities?.length ?? 0) > 1)) ||
      (strategy === "status_inversion" && envelope.suppliedStates.length >= 2) ||
      (strategy === "understatement" && envelope.events.length >= 3) ||
      (strategy === "double_meaning" && (envelope.unresolvedTensions.length > 0 || relationKinds.has("contrasts"))) ||
      (strategy === "compression" && envelope.events.length >= 4)
    ) hits += 1;
  }
  return metric(hits / Math.max(1, lens.realizationPreferences.length));
}

function nativeDirectness(envelope: RealityEnvelope): number {
  if (!envelope.events.length) return 0;
  const specificity = metric(envelope.events.reduce((sum, event) => {
    const wordCount = clean(event.label).split(/\s+/).filter(Boolean).length;
    const entityCount = event.entities?.length ?? 0;
    return sum + Math.min(1, wordCount / 8 + entityCount / 8);
  }, 0) / envelope.events.length);
  const signalDensity = metric(stateSignals(envelope).length / Math.max(1, envelope.events.length * 2));
  const relationships = metric(envelope.relations.length / Math.max(1, envelope.events.length));
  return metric(specificity * 0.5 + signalDensity * 0.25 + relationships * 0.25);
}

/**
 * Rank available creative treatments from the actual supplied world.
 * Structural relationships and realization mechanisms dominate lexical cues.
 * NONE is always a first-class contender.
 */
export function rankLensOpportunities(envelope: RealityEnvelope): Array<{ frame: string; reason: string; confidence: number }> {
  const native = nativeDirectness(envelope);
  const candidates = Object.entries(LENSES).map(([key, lens]) => {
    const relation = relationScore(key, envelope);
    const strategy = strategyScore(lens, envelope);
    const cues = cueScore(key, envelope);
    const evidenceDensity = Math.min(1, stateSignals(envelope).length / 6);
    const intensityFit = metric(0.55 + (lens.intensity - 0.65) * evidenceDensity * 0.3);
    const confidence = metric(
      relation * 0.4 +
      strategy * 0.3 +
      cues * 0.15 +
      intensityFit * 0.15,
    );
    return {
      frame: lens.label,
      reason: `${lens.label} amplifies ${lens.framingBias.slice(0, 4).join(", ")} already present in the supplied world. The treatment can change framing and rhythm, never concrete reality.`,
      confidence,
    };
  });

  candidates.push({
    frame: "NONE",
    reason: "Preserve the native reality when the supplied material is already more compelling than a treatment frame.",
    confidence: native,
  });

  return candidates
    .sort((left, right) => right.confidence - left.confidence || left.frame.localeCompare(right.frame))
    .slice(0, 8);
}

export function buildCharacterProfile(
  envelope: RealityEnvelope,
): AuthorCharacterProfile {
  const subject = envelope.subject;
  const labels = envelope.events.map((event) => event.label);
  const states = envelope.suppliedStates ?? [];
  const actions = envelope.suppliedActions ?? [];
  const tensions = envelope.unresolvedTensions ?? [];
  const objectRelationships = unique([
    ...(envelope.sensorySignals ?? []),
    ...labels.filter((label) => /\b(?:object|bow|ring|gift|dress|photo|receipt|meal|place|car|home|room)\b/i.test(label)),
  ]);
  const coreTraits = unique([...states, ...labels.filter((label) => !actions.includes(label))]).slice(0, 8);
  const statusPosture = coreTraits.length >= 2 ? `${coreTraits[0]} versus ${coreTraits[1]}` : coreTraits[0] || "neutral";
  const emotionalPosture = tensions[0] || (states.length >= 2 ? `${states[0]} alongside ${states[1]}` : states[0] || "unspecified");
  const privateInterpretations = unique([
    ...tensions,
    ...relationLanguage(envelope).map((kind) => `relationship:${kind}`),
    ...stateSignals(envelope).map((signal) => `signal:${signal}`),
  ]).slice(0, 18);
  const confidence = metric(Math.min(1, 0.35 + Math.min(0.25, coreTraits.length * 0.04) + Math.min(0.2, tensions.length * 0.05) + Math.min(0.2, actions.length * 0.04)));
  return { subject, coreTraits, statusPosture, emotionalPosture, contradictions: tensions.slice(0, 8), objectRelationships: objectRelationships.slice(0, 8), privateInterpretations, confidence };
}

export function scoreLensFit(
  lens: AuthorLensProfile,
  character: AuthorCharacterProfile,
  envelope: RealityEnvelope,
): number {
  const all = tokens([
    ...lens.framingBias,
    ...character.coreTraits,
    ...character.contradictions,
    ...(envelope.suppliedPhrases ?? []),
    ...envelope.recurringSignals,
    ...envelope.sensorySignals,
  ].join(" "));
  const bias = tokens(lens.framingBias.join(" "));
  if (!bias.size || !all.size) return 0;
  let hits = 0;
  for (const token of bias) if (all.has(token)) hits += 1;
  return metric(hits / bias.size);
}
