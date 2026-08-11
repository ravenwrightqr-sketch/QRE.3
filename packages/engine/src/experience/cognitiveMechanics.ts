import type {
  CognitiveExperiencePlan,
  CognitivePremise,
  CognitivePremiseRole,
  ExperienceTone,
} from "@qre/contracts";
import { COGNITIVE_VOCABULARY } from "./cognitiveVocabulary.js";

/**
 * COGNITIVE MECHANICS
 *
 * Universal behavioral forces. Mechanics describe HOW an experience behaves,
 * never WHAT noun or industry it belongs to. No dog/spa/restaurant/haunted
 * house branches belong here.
 */

export type ExperienceMechanic =
  | "accumulation" | "escalation" | "transformation" | "reveal" | "discovery"
  | "contrast" | "participation" | "competition" | "contribution" | "uncertainty"
  | "excess" | "pampering" | "memory" | "continuation" | "adaptation"
  | "anticipation" | "suspense" | "surprise" | "agency" | "mastery" | "novelty"
  | "spectacle" | "indulgence" | "delight" | "euphoria" | "celebration" | "prestige"
  | "ritual" | "authorship" | "reciprocity" | "resonance" | "intimacy" | "catharsis"
  | "relief" | "reversal" | "momentum" | "scarcity" | "curation" | "embodiment"
  | "immersion" | "ownership" | "consequence" | "recognition" | "legacy" | "wonder" | "awe";

export type MechanicSignal = {
  mechanic: ExperienceMechanic;
  confidence: number;
  evidence: string[];
};

type Score = { score: number; evidence: string[] };

type Rule = {
  mechanic: ExperienceMechanic;
  score: number;
  pattern: RegExp;
  evidence: string;
};

const clean = (value: unknown): string =>
  typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
const lower = (value: unknown): string => clean(value).toLowerCase();
const unique = (values: readonly unknown[]): string[] => [...new Set(values.map(clean).filter(Boolean))];

function planValues(plan?: CognitiveExperiencePlan): string[] {
  if (!plan) return [];
  return unique([
    plan.centralSubject,
    plan.purpose,
    plan.direction,
    ...plan.audience,
    ...plan.emotionalIntent,
    ...plan.interactionModel,
    ...plan.storyStructure,
    ...plan.memoryModel,
    ...plan.socialModel,
    ...plan.discoveryModel,
    ...plan.rewardModel,
    ...plan.progressionModel,
    ...plan.contentModel,
    ...plan.dynamicBehavior,
    ...plan.futureEvolution,
    ...plan.creativePossibilities,
  ]);
}

function premiseValues(premise: CognitivePremise | undefined, role?: CognitivePremiseRole): string[] {
  return unique(premise?.slots.filter((slot) => !role || slot.role === role).flatMap((slot) => slot.values) ?? []);
}

function addScore(scores: Map<ExperienceMechanic, Score>, mechanic: ExperienceMechanic, score: number, evidence: string): void {
  const current = scores.get(mechanic) ?? { score: 0, evidence: [] };
  current.score += score;
  current.evidence.push(evidence);
  scores.set(mechanic, current);
}

function addPattern(
  corpus: string,
  scores: Map<ExperienceMechanic, Score>,
  mechanic: ExperienceMechanic,
  score: number,
  pattern: RegExp,
  evidence: string,
): void {
  if (pattern.test(corpus)) addScore(scores, mechanic, score, evidence);
}

/** Explicit behavioral vocabulary. */
const RULES: readonly Rule[] = [
  { mechanic: "accumulation", score: 0.95, pattern: /\b(?:add|adding|added|contribut|accumulat|collect|gather|grow|growing|build|versions?|entries|layers?|archive|folklore|mythology|history)\b/, evidence: "material can compound or accumulate" },
  { mechanic: "contribution", score: 0.9, pattern: /\b(?:contribut|add|share|participat|author|create|submit|upload|leave|append|respond)\w*\b/, evidence: "participants can add material" },
  { mechanic: "escalation", score: 0.98, pattern: /\b(?:escalat|increasingly|more and more|keeps? getting|keeps? building|wilder|wild|ridiculous|bigger|worse|extreme|intense|over the top|unhinged|out of control|more dangerous|more intense|higher stakes)\b/, evidence: "intensity is explicitly increasing" },
  { mechanic: "transformation", score: 0.98, pattern: /\b(?:transform|change|changed|changing|before and after|becomes?|became|turn\w*\s+.+\s+into|restore|restored|makeover|reinvent|upgrade|renew|clean(?:s|ed|ing)?)\b/, evidence: "a meaningful state change is central" },
  { mechanic: "reveal", score: 0.97, pattern: /\b(?:reveal|revealed|hidden|secret|uncover|uncovered|expose|exposed|forgotten|truth|answer|identity|what really|finally learn|find out)\b/, evidence: "information is withheld and later exposed" },
  { mechanic: "discovery", score: 0.97, pattern: /\b(?:discover|discovered|explore|exploring|find|found|hunt|hunting|clue|clues|mystery|mysterious|portal|encounter|investigate|investigation|search|searching|quest)\b/, evidence: "exploration or finding drives the experience" },
  { mechanic: "contrast", score: 0.86, pattern: /\b(?:boring|ordinary|routine|mundane|before|after|unexpected|surprise|opposite|contrast|normal|usual|typical)\b/, evidence: "a baseline or reversal creates contrast" },
  { mechanic: "participation", score: 0.92, pattern: /\b(?:scan|participate|join|play|interact|touch|choose|vote|share|do|try|tap|enter|pick|decide|respond|submit|unlock)\b/, evidence: "participant action can change the experience" },
  { mechanic: "competition", score: 0.96, pattern: /\b(?:compete|competition|race|versus|vs\.?|winner|challenge|score|leaderboard|beat|defeat|champion|contest)\b/, evidence: "participants face comparative challenge" },
  { mechanic: "uncertainty", score: 0.98, pattern: /\b(?:terror|terrifying|haunted|horror|dread|fear|threat|danger|dangerous|creepy|unknown|uncertain|mystery|mysterious|what is happening|who is there)\b/, evidence: "uncertainty or threat drives intensity" },
  { mechanic: "suspense", score: 0.95, pattern: /\b(?:suspense|uncertain|unknown|threat|danger|what happens next|keeps? guessing|waiting|countdown|before it is revealed|not knowing)\b/, evidence: "uncertainty is sustained across time" },
  { mechanic: "anticipation", score: 0.92, pattern: /\b(?:anticipat|coming soon|coming next|wait for|waiting for|countdown|build(?:ing)? toward|leading up to|can't wait|cannot wait|next reveal)\b/, evidence: "expectation is deliberately built before payoff" },
  { mechanic: "excess", score: 0.98, pattern: /\b(?:absurd|luxury|lavish|opulent|ridiculous|excess|indulgent|extravagant|decadent|over the top|insane|ridiculously|no expense spared)\b/, evidence: "disproportion is part of the experience" },
  { mechanic: "pampering", score: 0.94, pattern: /\b(?:pamper|pampering|care|comfort|groom|grooming|treatment|treatments|spoil|spoiled|massage|relax|relaxing|spa|salon|royal treatment)\b/, evidence: "care is realized as active experiential behavior" },
  { mechanic: "indulgence", score: 0.94, pattern: /\b(?:luxury|lavish|opulent|indulgent|extravagant|decadent|no expense spared|treat yourself|first class|premium)\b/, evidence: "luxury is expressed as active indulgence" },
  { mechanic: "memory", score: 0.98, pattern: /\b(?:memory|memories|remember|remembered|remembers|history|historical|legacy|photograph|photos|folklore|nostalgia|keepsake|memorial|reminds?|familiar|again|return|returned|came back|previous visit|last time|this time|before)\b/, evidence: "past experience affects present meaning" },
  { mechanic: "continuation", score: 0.96, pattern: /\b(?:again|return|returns|returned|come back|came back|next time|future|later|continues?|continue|keeps? going|grows?|evolv|revisit|over time|chapter|ongoing|each visit|every time)\b/, evidence: "the experience has a future state" },
  { mechanic: "adaptation", score: 0.98, pattern: /\b(?:adaptive|adapt|adapts|adapted|preference|preferred|previous|remembered|changes based|learns?|learning|personalize|personalized|tailored|responds? to|knows what you like|based on last time|gets better at)\b/, evidence: "prior state changes future experience" },
  { mechanic: "surprise", score: 0.95, pattern: /\b(?:surprise|surprised|unexpected|suddenly|twist|strange|weird|absurd|ridiculous|didn't expect|did not expect|out of nowhere|secretly)\b/, evidence: "expectation is deliberately disrupted" },
  { mechanic: "novelty", score: 0.9, pattern: /\b(?:novel|brand[- ]new|never seen before|first[- ]ever|fresh|new twist|new experience|something new|never done before|original|inventive)\b/, evidence: "newness is part of the experience" },
  { mechanic: "spectacle", score: 0.96, pattern: /\b(?:spectacle|spectacular|showstopper|grand finale|jaw[- ]dropping|showcase|epic|massive|grand|dramatic|show|performance)\b/, evidence: "the experience should become impressive" },
  { mechanic: "delight", score: 0.94, pattern: /\b(?:delight|joy|thrill|pleasure|fun|funny|hilarious|playful|enjoy|enjoyable|charming|cute|whimsical)\b/, evidence: "active pleasure is an intended effect" },
  { mechanic: "euphoria", score: 0.96, pattern: /\b(?:euphoria|ecstatic|bliss|high point|over the moon|elated|exhilarat|pure joy)\b/, evidence: "payoff reaches unusually intense positive affect" },
  { mechanic: "celebration", score: 0.9, pattern: /\b(?:celebrate|celebration|party|toast|festive|commemorate|birthday|anniversary|wedding|milestone|victory|graduation)\b/, evidence: "the experience converts an event into celebration" },
  { mechanic: "prestige", score: 0.92, pattern: /\b(?:prestige|exclusive|elite|VIP|high[- ]status|first class|private|members only|exclusive access|luxury clientele|billionaire)\b/i, evidence: "distinction and status shape the experience" },
  { mechanic: "ritual", score: 0.9, pattern: /\b(?:ritual|ceremony|tradition|annual|ceremonial|every visit|each visit|custom)\b/, evidence: "repetition or ceremony structures participation" },
  { mechanic: "authorship", score: 0.94, pattern: /\b(?:author|create their own|write their own|make their own|shape|design|invent|compose|build their own|leave their mark)\b/, evidence: "participants create part of the evolving experience" },
  { mechanic: "reciprocity", score: 0.9, pattern: /\b(?:reciprocity|give and take|give back|in return|responds? to|rewards? for|reacts? to|answers? back)\b/, evidence: "one action produces a meaningful response" },
  { mechanic: "resonance", score: 0.9, pattern: /\b(?:resonance|resonat|meaningful connection|sticks with you|hits home|deeply personal|stays with you|meaningful|matters|special)\b/, evidence: "the experience reverberates beyond the moment" },
  { mechanic: "intimacy", score: 0.88, pattern: /\b(?:intimacy|intimate|personal moment|one[- ]on[- ]one|private|close[- ]knit|just between us|quiet moment|personal)\b/, evidence: "closeness gives the experience force" },
  { mechanic: "catharsis", score: 0.94, pattern: /\b(?:catharsis|cathartic|let it out|finally release|release the tension|tearjerker|emotional release|closure)\b/, evidence: "accumulated tension resolves in release" },
  { mechanic: "relief", score: 0.9, pattern: /\b(?:relief|relieved|weight off|finally safe|breathe again|stress disappears|escape|rest|finally over)\b/, evidence: "pressure drops into release" },
  { mechanic: "reversal", score: 0.96, pattern: /\b(?:reversal|turns? the tables|opposite of what|not what it seemed|plot twist|flips? the script|everything changes|things turn around)\b/, evidence: "interpretation or direction deliberately flips" },
  { mechanic: "momentum", score: 0.92, pattern: /\b(?:momentum|keeps? going|keeps? building|one thing leads to another|can't stop|cannot stop|snowball|builds? on|then another|next thing)\b/, evidence: "each state creates energy for the next" },
  { mechanic: "scarcity", score: 0.9, pattern: /\b(?:scarce|scarcity|limited|only \d+|one[- ]time|rare|hard to get|exclusive slot|last chance|while supplies last)\b/, evidence: "limited availability creates urgency" },
  { mechanic: "curation", score: 0.94, pattern: /\b(?:curate|curated|hand[- ]picked|selected just for|tailored|personalized|chosen for you|custom[- ]picked|specially selected)\b/, evidence: "selection itself is part of the experience" },
  { mechanic: "embodiment", score: 0.88, pattern: /\b(?:physical|touch|walk through|hold|wear|hands[- ]on|taste|smell|listen|dance|move|sit|stand|carry|touchscreen)\b/, evidence: "physical presence or action matters" },
  { mechanic: "immersion", score: 0.94, pattern: /\b(?:immerse|immersive|lost in|fully inside|surround|transported|step into|enter a world|feels real|becomes the world|escape into)\b/, evidence: "attention is absorbed by the experience" },
  { mechanic: "ownership", score: 0.9, pattern: /\b(?:ownership|mine|my own|personal artifact|keep forever|belongs to|take home|keepsake|souvenir|claim)\b/, evidence: "the participant gains durable possession or authorship" },
  { mechanic: "consequence", score: 0.98, pattern: /\b(?:consequence|has an effect|changes the outcome|what happens depends on|changes what comes next|affects the next|your choice matters|choice changes)\b/, evidence: "actions persist as consequences" },
  { mechanic: "recognition", score: 0.9, pattern: /\b(?:recognize|recognized|seen|remembered by|gets credit|spotlight|featured|named|acknowledged|personal shout[- ]out)\b/, evidence: "a participant or contribution becomes visible" },
  { mechanic: "legacy", score: 0.94, pattern: /\b(?:legacy|lives on|passed down|for generations|remembered for years|future generations|family history|leaves a mark)\b/, evidence: "the experience persists beyond the interaction" },
  { mechanic: "wonder", score: 0.94, pattern: /\b(?:wonder|magical|marvel|mesmerize|spellbind|enchanted|astonish|astonishing|miracle)\b/, evidence: "the experience invites astonishment" },
  { mechanic: "awe", score: 0.94, pattern: /\b(?:awe|majestic|epic|monumental|sublime|overwhelming|breathtaking|vast|grand scale)\b/, evidence: "scale or significance produces awe" },
  { mechanic: "agency", score: 0.94, pattern: /\b(?:choose|choice|decide|decision|control|your call|you decide|up to you|branch|path|option|options)\b/, evidence: "participant decisions have meaningful agency" },
  { mechanic: "mastery", score: 0.9, pattern: /\b(?:master|mastery|skill|practice|improve|level up|expert|learn|training|challenge yourself|beat your best)\b/, evidence: "capability grows through successful interaction" },
];

function toneMechanics(tone: ExperienceTone[]): ExperienceMechanic[] {
  const result: ExperienceMechanic[] = [];
  if (tone.includes("playful")) result.push("contrast", "escalation", "participation", "surprise", "delight");
  if (tone.includes("energetic")) result.push("escalation", "participation", "momentum", "euphoria");
  if (tone.includes("mysterious")) result.push("uncertainty", "discovery", "reveal", "suspense", "anticipation", "wonder");
  if (tone.includes("emotional")) result.push("memory", "continuation", "resonance", "catharsis", "intimacy");
  return result;
}

function applyRules(corpus: string, scores: Map<ExperienceMechanic, Score>): void {
  for (const rule of RULES) addPattern(corpus, scores, rule.mechanic, rule.score, rule.pattern, rule.evidence);
}

function inferCare(corpus: string, scores: Map<ExperienceMechanic, Score>): void {
  if (!/\b(?:spa|groom|grooming|massage|treatment|care|pamper|salon|housekeeper|service|cleaning)\b/.test(corpus)) return;
  addScore(scores, "pampering", 0.75, "care/service context implies active attention and treatment");
  addScore(scores, "transformation", 0.42, "care-oriented experiences naturally contain visible state change");
  addScore(scores, "delight", 0.22, "care can become felt pleasure");
}

function inferMystery(corpus: string, scores: Map<ExperienceMechanic, Score>): void {
  if (!/\b(?:mystery|mysterious|detective|investigation|secret|hidden|clue|case)\b/.test(corpus)) return;
  addScore(scores, "discovery", 0.7, "mystery implies active investigation or finding");
  addScore(scores, "uncertainty", 0.7, "mystery withholds certainty");
  addScore(scores, "reveal", 0.68, "mystery implies eventual information release");
  addScore(scores, "suspense", 0.55, "withheld answers create sustained suspense");
  addScore(scores, "anticipation", 0.42, "unresolved mystery creates expectation for the next reveal");
}

function inferReturning(corpus: string, scores: Map<ExperienceMechanic, Score>): void {
  if (/\b(?:again|returned|returning|comes? back|came back|goes? back|went back|back to the same|last time|previous visit|this time|next time)\b/.test(corpus)) {
    addScore(scores, "memory", 0.92, "returning or revisiting implies remembered prior experience");
    addScore(scores, "continuation", 0.72, "returning establishes continuity across experiences");
  }
  if (/\b(?:same|previous|earlier|before|already|familiar|known|remembered)\b/.test(corpus)) {
    addScore(scores, "memory", 0.52, "continuity language implies retained prior context");
  }
  if (/\b(?:even more|better this time|different this time|improved|progressed|learned|gets better|keeps improving)\b/.test(corpus)) {
    addScore(scores, "adaptation", 0.58, "change across time implies the experience can learn or evolve");
  }
}

function inferEscalation(corpus: string, scores: Map<ExperienceMechanic, Score>): void {
  const intensifier = /\b(?:more dangerous|more intense|more frightening|more absurd|more ridiculous|increasingly|more and more|keeps? getting|keeps? building|wilder|bigger|worse|higher stakes|out of control|over the top)\b/;
  const repeatedState = /\b(?:every|each|another|next|following|later)\b/;
  const threat = /\b(?:threat|danger|dangerous|terror|fear|haunted|horror|stakes|risk)\b/;

  if (intensifier.test(corpus)) addScore(scores, "escalation", 0.82, "intensity is explicitly increasing across the experience");
  if (repeatedState.test(corpus) && intensifier.test(corpus)) addScore(scores, "momentum", 0.42, "repeated state progression creates forward pressure");
  if (repeatedState.test(corpus) && threat.test(corpus) && /\b(?:less certain|more dangerous|worse|increasing)\b/.test(corpus)) {
    addScore(scores, "escalation", 0.72, "repeated states make the active threat more dangerous or difficult to predict");
    addScore(scores, "suspense", 0.35, "each state leaves the next threat unresolved");
  }
}

function inferBundles(plan: CognitiveExperiencePlan | undefined, premise: CognitivePremise | undefined, corpus: string, scores: Map<ExperienceMechanic, Score>): void {
  inferCare(corpus, scores);
  inferMystery(corpus, scores);
  inferReturning(corpus, scores);
  inferEscalation(corpus, scores);

  const transformation = lower(premiseValues(premise, "transformation").join(" "));
  const outcome = lower(premiseValues(premise, "outcome").join(" "));
  const affordance = lower(premiseValues(premise, "affordance").join(" "));
  const temporal = lower(premiseValues(premise, "temporal").join(" "));
  const social = lower(premiseValues(premise, "social").join(" "));

  if (transformation) addScore(scores, "transformation", 0.5, "premise preserves transformation evidence");
  if (outcome) addScore(scores, "consequence", 0.25, "premise contains an outcome state");
  if (affordance) addScore(scores, "participation", 0.25, "premise contains participant affordances");
  if (social) addScore(scores, "participation", 0.2, "premise contains social participation");
  if (temporal) {
    addScore(scores, "continuation", 0.28, "premise contains temporal continuity");
    if (/\b(?:again|return|previous|past|history|before|same|later)\b/.test(temporal)) addScore(scores, "memory", 0.44, "temporal evidence implies retained prior context");
  }

  if (plan?.direction === "memory") addScore(scores, "memory", 0.88, "selected direction explicitly targets memory");
  if (plan?.dynamicBehavior?.length) addPattern(plan.dynamicBehavior.join(" "), scores, "adaptation", 0.78, /\b(?:adapt|change|previous|history|accumulat|progress|state|preference|context|learn|personal)\b/, "dynamic behavior changes future state");
  if (plan?.futureEvolution?.length) addPattern(plan.futureEvolution.join(" "), scores, "continuation", 0.82, /\b(?:continue|future|again|return|later|new|evolv|grow|accumulat|chapter|event)\b/, "future evolution preserves continuity");
  if (plan?.memoryModel?.length) addScore(scores, "memory", 0.72, "memory model explicitly preserves prior experience");
  if (plan?.progressionModel?.length) addScore(scores, "momentum", 0.52, "progression model creates forward movement");

  if (scores.has("excess") && scores.has("pampering")) addScore(scores, "escalation", 0.86, "excessive treatment should intensify through progressively disproportionate experience");
  if (scores.has("uncertainty") && /\b(?:danger|dangerous|threat|terror|haunted|horror)\b/.test(corpus)) addScore(scores, "suspense", 0.62, "active threat sustains unresolved uncertainty");
  if (scores.has("accumulation") && scores.has("contribution") && (scores.has("memory") || scores.has("continuation"))) addScore(scores, "escalation", 0.82, "repeated contributions compound accumulated state");
  if (scores.has("agency") && scores.has("consequence")) addScore(scores, "participation", 0.28, "agency becomes experiential when choices produce consequences");
}

export function inferExperienceMechanics(args: {
  plan?: CognitiveExperiencePlan;
  premise?: CognitivePremise;
  prompt?: string;
  tone?: ExperienceTone[];
}): MechanicSignal[] {
  const { plan, premise = plan?.premise, prompt = "", tone = [] } = args;
  const corpus = lower([prompt, ...planValues(plan), ...premiseValues(premise), ...tone].join(" "));
  const scores = new Map<ExperienceMechanic, Score>();

  applyRules(corpus, scores);
  inferBundles(plan, premise, corpus, scores);

  for (const entry of COGNITIVE_VOCABULARY) {
    if (!entry.patterns.some((pattern) => pattern.test(corpus))) continue;
    addScore(scores, entry.mechanic as ExperienceMechanic, entry.score * 0.65, entry.evidence);
  }

  for (const mechanic of toneMechanics(tone)) addScore(scores, mechanic, 0.45, `tone implies ${mechanic} behavior`);

  return [...scores.entries()]
    .map(([mechanic, value]) => ({ mechanic, confidence: Math.min(1, value.score), evidence: unique(value.evidence) }))
    .sort((a, b) => b.confidence - a.confidence || a.mechanic.localeCompare(b.mechanic));
}

export function mechanicBrief(signals: MechanicSignal[]): ExperienceMechanic[] {
  return signals.filter((signal) => signal.confidence >= 0.7).map((signal) => signal.mechanic);
}
