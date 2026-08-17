/**
 * QRE UNIVERSAL AUTHOR BRAIN · CANONICAL
 *
 * truth → reality graph → cognition → latent movie → beat discovery → magnet → mouth → cut policy
 *
 * A beat is a sentence cut / moving message: one perceivable moment, then the
 * player advances. The discovered beat plan is the only source for SequencePlay.
 * Cognitive machinery is never allowed to become viewer-facing content.
 */
import type {
  AuthorBrainTruth,
  AuthorCreativeBrief,
  AuthorScene,
  InformationFrontier,
  MagnetCircle,
  SequenceCut,
  SequencePlay,
  SubjectContinuity,
  ViewerAttentionRole,
  ViewerMomentum,
} from "@qre/contracts";
import { buildAuthorCognitivePlan } from "./authorCognition.js";
import { buildAuthorRealityGraph } from "./authorRealityGraph.js";
import { evaluateCut, type CutWorld } from "./authorCutPolicy.js";
import { localModelGenerate } from "./localModelRuntime.js";
import { normalizeLatentMovieBeatPlan } from "./authorLatentMovieBeatAdapter.js";
import { recoverBeatPlanFromLatentMovie } from "./authorBeatPlanRecovery.js";

const ROLES: readonly ViewerAttentionRole[] = [
  "arrival", "hook", "question", "pressure", "reframe", "escalation",
  "discovery", "consequence", "release", "payoff", "callback", "continuation",
];

const ROLE_ALIASES: Record<string, ViewerAttentionRole> = {
  setup: "arrival", opening: "arrival", introduction: "arrival",
  development: "pressure", hypothesis: "pressure", turn: "reframe",
  reveal: "discovery", complication: "escalation", resolution: "payoff",
  coda: "continuation", contrast: "reframe", status_inversion: "reframe",
  personification: "reframe", sensory_hook: "hook", meaning_shift: "reframe",
  callback: "callback", payoff: "payoff", escalation: "escalation", arrival: "arrival",
};

const GAIN_ALIASES: Record<string, NonNullable<SequenceCut["gainKind"]>> = {
  novelty: "new_fact", context: "new_fact", emotional_state: "new_fact",
  sensory: "new_fact", information: "new_fact", personality: "reframe",
  trait: "new_fact", humor: "surprise", comic_turn: "surprise", status: "reframe",
  emotional: "reframe", memory: "callback", private_meaning: "reframe",
  satisfaction: "payoff", resolution: "payoff", reveal: "discovery",
  anticipation: "question", uncertainty: "question", escalation: "escalation",
  information_value: "discovery", contrast: "reframe", replay: "callback",
  role: "reframe", afterglow: "payoff", meaning_shift: "reframe",
};

const BAD_INTERNAL = /\b(?:attention strategy|operator(?: mix|s)?|build from beat|round\s*\d|cognitive(?: plan| brain)?|cognition|preserve forward|land the chosen|find subtle tension|contradictions?:\s*none|why this beat|viewer-facing|writing process|information frontier|narrative engagement)\b/i;
const BAD_SUMMARY = /\b(?:discover .*backstory|build (?:the |viewer|character)|provide closure|highlight the theme|journey from .* to|transformation from .* to|true character|eventual happiness|viewers?['’] interest|customer satisfaction|cleaning process|closing remarks|thank you for choosing)\b/i;
const BAD_VAGUE = /^(?:the unexpected|the unknown|unseen chaos|hidden intentions|coco['’]s feelings?|coco['’]s reaction|the next step|what happens next|more to come|details? of .*|the end|closure|a new identity|viewer interest|information seeking)$/i;

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const uniq = (values: readonly unknown[] | undefined, limit = 24): string[] =>
  [...new Set((values ?? []).map(clean).filter(Boolean))].slice(0, limit);
const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));
const metric = (value: number): number => Number(clamp01(value).toFixed(3));

function parseJson<T>(raw: string): T | null {
  const text = clean(raw).replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  if (!text) return null;
  try { return JSON.parse(text) as T; } catch { return null; }
}

function debug(label: string, raw: string): void {
  if (process.env.QRE_AUTHOR_DEBUG_RAW !== "true") return;
  console.log(`\n--- QRE RAW MODEL OUTPUT · ${label} ---\n${raw}\n--- END RAW MODEL OUTPUT ---\n`);
}

function normalizeRole(value: unknown): ViewerAttentionRole {
  const normalized = clean(value).toLowerCase().replace(/\s+/g, "_");
  const role = ROLE_ALIASES[normalized] ?? normalized;
  return ROLES.includes(role as ViewerAttentionRole) ? role as ViewerAttentionRole : "discovery";
}

function normalizeGain(value: unknown): NonNullable<SequenceCut["gainKind"]> {
  const normalized = clean(value).toLowerCase().replace(/\s+/g, "_");
  const gain = GAIN_ALIASES[normalized] ?? normalized;
  const allowed = new Set<NonNullable<SequenceCut["gainKind"]>>([
    "new_fact", "surprise", "question", "escalation", "reframe", "discovery",
    "consequence", "callback", "payoff",
  ]);
  return allowed.has(gain as NonNullable<SequenceCut["gainKind"]>)
    ? gain as NonNullable<SequenceCut["gainKind"]>
    : "discovery";
}

function normalizeFacts(value: unknown): string[] {
  if (Array.isArray(value)) return uniq(value, 16);
  if (!value || typeof value !== "object") return [];
  return uniq(Object.entries(value as Record<string, unknown>).filter(([, state]) => Boolean(state)).map(([fact]) => fact), 16);
}

function world(input: AuthorBrainTruth): CutWorld {
  return {
    prompt: clean(input.prompt),
    subject: clean(input.subject),
    place: clean(input.place),
    identity: input.subjectTruth?.identityFacts ?? [],
    facts: input.facts,
    moments: input.sourceMoments,
    memory: input.memoryContext ?? [],
    trajectory: input.trajectory ?? [],
    presence: input.presenceSummary ?? [],
  };
}

const STOP = new Set("the a an and or but for to of in on at with from this that is are was were be been being as into by through after before then now very just still again his her their its it's he she they them you we me my our your what when where why how one two three four five six seven eight nine ten a new one more".split(/\s+/));
function wordSet(value: string): Set<string> {
  return new Set(clean(value).toLowerCase().split(/[^a-z0-9'-]+/i).filter((word) => word.length >= 4 && !STOP.has(word)));
}
function overlap(a: Set<string>, b: Set<string>): number {
  if (!a.size) return 0;
  let hits = 0;
  for (const word of a) if (b.has(word)) hits += 1;
  return hits / a.size;
}

function computeMagnet(before: ViewerMomentum, change: string, next: string, gain: string): MagnetCircle {
  const known = wordSet(before.known.join(" "));
  const changeWords = wordSet(change);
  const nextWords = wordSet(next);
  const novelty = metric(1 - overlap(changeWords, known));
  const vagueNext = BAD_VAGUE.test(clean(next));
  const uncertainty = metric(
    (nextWords.size ? 0.3 : 0.02) +
    (before.unresolved || before.curiosityGap ? 0.22 : 0) +
    (["question", "surprise", "escalation"].includes(gain) ? 0.22 : 0) +
    (next.includes("?") ? 0.16 : 0) -
    (vagueNext ? 0.4 : 0),
  );
  const informationValue = metric(
    novelty * 0.4 +
    (changeWords.size ? 0.16 : 0) +
    (nextWords.size ? 0.14 : 0) +
    (["surprise", "reframe", "discovery", "consequence", "callback", "payoff"].includes(gain) ? 0.26 : 0),
  );
  const attention = metric(novelty * 0.5 + informationValue * 0.5);
  const tension = metric(uncertainty * Math.max(informationValue, 0.2));
  const informationSeeking = metric(
    (nextWords.size ? 0.26 : 0) +
    (before.unresolved ? 0.25 : 0) +
    (before.forwardPull ? 0.2 : 0) +
    (before.currentWant ? 0.1 : 0) +
    (next.includes("?") ? 0.12 : 0),
  );
  const narrativeEngagement = metric((attention + tension + informationSeeking) / 3);
  const magnetStrength = metric(
    novelty * 0.15 + uncertainty * 0.17 + informationValue * 0.2 + attention * 0.16 + tension * 0.19 + informationSeeking * 0.09 + narrativeEngagement * 0.04,
  );
  return {
    novelty,
    uncertainty,
    informationValue,
    attention,
    tension,
    informationSeeking,
    narrativeEngagement,
    magnetStrength,
    unresolved: next || change || before.unresolved,
    nextNeed: next || before.forwardPull,
  };
}

function frontier(before: ViewerMomentum, change: string, next: string, magnet: MagnetCircle): InformationFrontier {
  const candidate = clean(next || change || before.unresolved || "");
  const safe = BAD_INTERNAL.test(candidate) || BAD_VAGUE.test(candidate) ? "" : candidate;
  return {
    known: before.known,
    frontier: safe,
    novelty: magnet.novelty,
    uncertainty: magnet.uncertainty,
    informationValue: magnet.informationValue,
    tension: magnet.tension,
    nextNeed: safe || undefined,
  };
}

function subjectContinuity(subject: string, established: boolean, text: string, order: number): SubjectContinuity {
  const escaped = subject.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const explicit = Boolean(subject) && new RegExp(`\\b${escaped}\\b`, "i").test(text);
  const pronoun = /\b(?:he|she|they|it|him|her|them|his|their|its)\b/i.test(text);
  return {
    established: established || Boolean(subject),
    subject,
    referenceMode: explicit ? "name" : pronoun ? "pronoun" : "implicit",
    referenceCost: explicit && established ? 0.35 : pronoun && established ? 0.1 : 0,
    lastExplicitReference: explicit ? order : undefined,
  };
}

type AuthorBeat = { order: number; role: string; gainKind: string; change: string; next: string; frontier: string; necessity: string; eventIds?: string[] };
type BeatPlan = { premise: string; baselineFacts: string[]; beats: AuthorBeat[]; closing?: string };

function normalizeBeatPlan(value: unknown): BeatPlan | undefined {
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  const rawBeats = Array.isArray(record.beats) ? record.beats : [];
  const beats: AuthorBeat[] = [];
  for (const [index, raw] of rawBeats.entries()) {
    if (!raw || typeof raw !== "object") continue;
    const item = raw as Record<string, unknown>;
    const change = clean(item.change);
    const next = clean(item.next);
    const frontierValue = clean(item.frontier || item.informationFrontier);
    const necessity = clean(item.necessity || item.whyNext);
    if (!change) continue;
    if (BAD_INTERNAL.test(change) || BAD_SUMMARY.test(change)) continue;
    if (BAD_INTERNAL.test(next) || BAD_SUMMARY.test(next)) continue;
    if (BAD_INTERNAL.test(frontierValue) || BAD_SUMMARY.test(frontierValue)) continue;
    if (BAD_VAGUE.test(frontierValue)) continue;
    if (change.split(/\s+/).length > 14 || frontierValue.split(/\s+/).length > 10) continue;
    beats.push({
      order: index + 1,
      role: clean(item.role) || "discovery",
      gainKind: clean(item.gainKind) || "discovery",
      change,
      next,
      frontier: frontierValue || next,
      necessity: necessity || "This moment makes the next moment more interesting.",
    });
  }
  if (!beats.length) return undefined;
  return {
    premise: clean(record.premise),
    baselineFacts: normalizeFacts(record.baselineFacts),
    beats: beats.slice(0, 6),
    closing: clean(record.closing || record.continuation),
  };
}

function buildViewerMomentum(subject: string, plan: BeatPlan): SequencePlay | undefined {
  if (!plan.beats.length) return undefined;
  const baselineFacts = uniq(plan.baselineFacts, 16);
  let momentum: ViewerMomentum = {
    known: baselineFacts,
    subjectContinuity: { established: false, subject, referenceMode: "implicit", referenceCost: 0 },
    informationFrontier: { known: baselineFacts, frontier: "", novelty: 0, uncertainty: 0, informationValue: 0, tension: 0 },
  };
  const cuts: SequenceCut[] = [];
  let established = false;
  for (const beat of plan.beats) {
    const role = normalizeRole(beat.role);
    const gainKind = normalizeGain(beat.gainKind);
    const next = clean(beat.frontier || beat.next);
    const safeFrontier = BAD_INTERNAL.test(next) || BAD_VAGUE.test(next) ? "" : next;
    const magnet = computeMagnet(momentum, beat.change, safeFrontier, gainKind);
    const state = subjectContinuity(subject, established, beat.change, beat.order);
    established = established || Boolean(subject);
    const after: ViewerMomentum = {
      known: momentum.known,
      expected: safeFrontier || undefined,
      activeQuestion: gainKind === "question" ? safeFrontier || beat.change : momentum.activeQuestion,
      curiosityGap: safeFrontier || momentum.curiosityGap,
      predictionShift: beat.change,
      currentWant: safeFrontier || undefined,
      unresolved: magnet.unresolved,
      forwardPull: safeFrontier || undefined,
      payoffDebt: momentum.payoffDebt,
      magnet,
      subjectContinuity: state,
      informationFrontier: frontier(momentum, beat.change, safeFrontier, magnet),
    };
    cuts.push({
      id: `cut-${beat.order}`,
      order: beat.order,
      role,
      gainKind,
      sourceIds: beat.eventIds ?? [],
      informationGain: beat.change,
      attentionDelta: safeFrontier || beat.change,
      viewerBefore: { known: momentum.known, expected: momentum.expected, unresolved: momentum.unresolved, currentWant: momentum.currentWant, recentChange: momentum.predictionShift },
      viewerAfter: { known: after.known, expected: after.expected, unresolved: after.unresolved, currentWant: after.currentWant, recentChange: after.predictionShift },
      momentum: { before: momentum, change: beat.change, after, nextPressure: safeFrontier || undefined },
      necessity: {
        necessary: beat.order === plan.beats.length || magnet.magnetStrength >= 0.36,
        reason: beat.necessity,
        removalDamage: `Weakens the next want: ${safeFrontier || beat.change}`,
      },
      nextPromise: safeFrontier || undefined,
      noveltyScore: magnet.novelty,
      confidence: 0.95,
    });
    momentum = after;
  }
  return {
    subject,
    premise: plan.premise,
    openingState: { known: baselineFacts },
    baselineFacts,
    openingMomentum: cuts[0]?.momentum?.before,
    cuts,
    closingMomentum: momentum,
    closingState: { known: momentum.known, unresolved: momentum.unresolved, currentWant: momentum.currentWant },
    continuity: [],
    antiCrutch: [],
    continuation: plan.closing,
  };
}

function extractTexts(value: unknown): string[] {
  if (!value || typeof value !== "object") return [];

  const record = value as Record<string, unknown>;

  if (typeof record.text === "string") {
    return [clean(record.text)].filter(Boolean);
  }

  const texts = Array.isArray(record.texts)
    ? record.texts
    : Array.isArray(record.scenes)
      ? record.scenes
      : [];

  return texts
    .map(clean)
    .filter(Boolean)
    .slice(0, 6);
}

function scenesFromSequence(
  sequence: SequencePlay,
  texts: string[],
  input: AuthorBrainTruth,
  cognition: ReturnType<typeof buildAuthorCognitivePlan>,
) {
  const attempted = sequence.cuts.length;
  const scenes: AuthorScene[] = [];
  const prior: string[] = [];
  const rejectionReasons: Record<string, number> = {};
  const worldValue = world(input);
  for (let i = 0; i < attempted; i += 1) {
    const cut = sequence.cuts[i];
    const text = clean(texts[i] ?? "");
    if (!text) { rejectionReasons["missing-text"] = (rejectionReasons["missing-text"] ?? 0) + 1; continue; }
    const policy = evaluateCut(
      text,
      worldValue,
      {
        role: cut.role,
        gainKind: cut.gainKind,
        change: cut.informationGain,
        
        next: cut.nextPromise,
        text,
        subjectEstablished: Boolean(cut.momentum?.before.subjectContinuity?.established),
        informationFrontier: cut.momentum?.after.informationFrontier?.frontier,
        characterTraits: cognition.characterRead?.coreTraits ?? [],
characterContradictions: cognition.characterRead?.contradictions ?? [],
characterStatusPosture: cognition.characterRead?.statusPosture ?? "",
characterFrames: cognition.characterRead?.creativeFrames?.map((frame) => frame.frame) ?? [],
      },
      prior,
    );
    if (!policy.accepted) {
      console.log(
        `[CUT REJECTED ${i + 1}] ${text}\n` +
        `  reasons=${policy.reasons.join(", ")}\n` +
        `  metrics=${JSON.stringify(policy.metrics)}`
      );
      for (const reason of policy.reasons) rejectionReasons[reason] = (rejectionReasons[reason] ?? 0) + 1;
      continue;
    }
    scenes.push({ text, kind: cut.role === "hook" ? "hook" : cut.role === "payoff" ? "payoff" : "line" });
    prior.push(text);
  }
  return { scenes, attempted, rejected: attempted - scenes.length, rejectionReasons };
}

function brief(input: AuthorBrainTruth, strategy: string): AuthorCreativeBrief {
  return {
    angle: `attention strategy: ${strategy}`,
    engine: "latent movie discovery → beat necessity → mouth realization",
    question: "what changes the viewer's mental model next?",
    strongestImage: input.facts[0] ?? input.sourceMoments[0] ?? "the strongest supplied detail",
    tension: "novelty → uncertainty → information value → attention → tension → information seeking → narrative engagement",
    payoff: "a character-specific consequence or reframe",
    callback: input.memoryContext?.[0] ?? input.trajectory?.[0] ?? "none yet",
    rhythm: ["hit", "standard", "hit", "short"] as AuthorCreativeBrief["rhythm"],
    avoid: ["fact parade", "identity repetition", "generic emotion arc", "invented reality", "labels in viewer prose", "literal questions", "padding", "explaining the joke"],
  };
}

function inferRiskDial(input: AuthorBrainTruth, cognition: ReturnType<typeof buildAuthorCognitivePlan>): "safe" | "playful" | "bold" | "strange" | "dark" | "surreal" | "chaotic" {
  const text = `${input.prompt} ${input.lens ?? ""}`.toLowerCase();
  if (/demented|chaotic|absurd|unhinged/.test(text)) return "chaotic";
  if (/surreal|dreamlike|weird|strange/.test(text)) return "surreal";
  if (/horror|dark|creepy|knives|unsettling/.test(text)) return "dark";
  if (/bold|wild|extreme/.test(text)) return "bold";
  if (/funny|comedy|humor|romance|romantic|playful|living memory/.test(text) || cognition.mode === "living_memory") return "playful";
  if (cognition.mode === "concept") return "bold";
  return "safe";
}

function buildBeatMessages(input: AuthorBrainTruth, cognition: ReturnType<typeof buildAuthorCognitivePlan>) {
  const risk = inferRiskDial(input, cognition);
  const targetBeats = risk === "safe" ? 4 : 5;

  const compactWorld = {
    prompt: clean(input.prompt),
    lens: clean(input.lens),
    subject: clean(input.subject),
    place: clean(input.place),
    facts: uniq(input.facts, 18),
    moments: uniq(input.sourceMoments, 12),
    memory: uniq(input.memoryContext, 10),
    trajectory: uniq(input.trajectory, 10),

    realityGraph: input.realityGraph
      ? {
          events: input.realityGraph.events
            .slice(0, 12)
            .map((event) => ({
              id: event.id,
              label: event.label,
              
            })),
          tensions: input.realityGraph.unresolvedTensions.slice(0, 8),
          recurring: input.realityGraph.recurringSignals.slice(0, 8),
          sensory: input.realityGraph.sensorySignals.slice(0, 8),
        }
      : null,

    returning: Boolean(input.returning),
    visitNumber: input.visitNumber,

    cognition: {
      mode: cognition.mode,
      chosenAttentionStrategy: cognition.chosenAttentionStrategy,
      characterRead: cognition.characterRead,
      contradictions: cognition.contradictions.slice(0, 8),
      attentionCandidates: cognition.attentionCandidates.slice(0, 6),
      callbackTargets: cognition.callbackTargets.slice(0, 8),
      latentMovieCandidates: cognition.latentMovieCandidates.slice(0, 6),
      allowedMoves: cognition.characterRead?.allowedMoves ?? [],
      avoidedMoves: cognition.characterRead?.avoidedMoves ?? [],
      creativeFrames: cognition.characterRead?.creativeFrames ?? [],
      statusPosture: cognition.characterRead?.statusPosture ?? "",
      emotionalPosture: cognition.characterRead?.emotionalPosture ?? "",
      objectRelationships: cognition.characterRead?.objectRelationships ?? [],
    },
  };

  return [
    {
      role: "system" as const,
      content: [
        "You are QRE's latent-movie director and creative realization planner.",
        "You are NOT a summarizer and NOT a novelist.",
        "Find the strongest hidden movie inside the supplied reality, then break it into short moving-message / sentence-cut beats.",

        "CORE CREATIVE INVARIANT:",
        "Can this beat express a memorable interpretation whose meaning is completely recoverable from supplied reality while introducing NO new concrete event?",
        "If yes, the interpretation is allowed.",
        "If no, reject it or translate it into an interpretation that is supported by the supplied evidence.",

        "Reality is immutable.",
        "Facts, source moments, reality-graph events, and supplied subject truth are the concrete evidence.",
        "A creative interpretation may change framing, attitude, metaphor, personification, status language, implication, juxtaposition, absurdity, understatement, reversal, or rhetorical game language.",
        "A creative interpretation may NOT create a new person, object, location, date, dialogue, physical action, reaction, outcome, or event.",

        "CRITICAL DISTINCTION:",
        "Do not confuse an interpretation with an event.",
        "Example of legal interpretation: 'Coco arrived ready to negotiate.'",
        "Why legal: arrival is supplied, while 'ready to negotiate' interprets the supplied nervous + fierce + cool contradiction through a negotiation frame.",
        "Example of legal interpretation: 'The bow became evidence.'",
        "Why legal: the supplied bow theft can be reframed through the supplied rebellion relationship.",
        "Example of illegal invention: 'Coco leaped onto the grooming table.'",
        "Why illegal: no supplied evidence establishes that physical event.",
        "Example of illegal invention: 'Coco tied the bow around the groomer's neck.'",
        "Why illegal: no supplied evidence establishes that action or reaction.",

        "When a planner hypothesis contains an invented concrete event, preserve the underlying meaning if possible and rewrite it as an evidence-grounded interpretation.",
        "Do NOT throw away the creative opportunity merely because the first phrasing was too literal.",
        "Translate invented action into character implication, status posture, tension, object meaning, or recontextualization.",

        "The character read is a creative control signal, not new reality.",
        "Use the supplied contradiction and character posture to discover the movie lens.",
        "Character interpretation should emerge from the evidence rather than being pasted onto it.",

        "Prefer the strongest available latent relationship:",
        "contradiction, status reversal, recurring object, private meaning, sensory fingerprint, ritual, spatial contradiction, calm-vs-danger, callback with changed meaning, or character-specific absurdity.",

        "A beat is ONE perceivable change in the viewer's mental model.",
        "It appears briefly, then the experience advances.",
        "Think JOLT ? JOLT ? JOLT ? PAYOFF.",
        "Every beat must make the next beat more desirable.",

        "Do not spend beats stating who or what the viewer already knows.",
        "Establish identity in baseline; spend beats on what changes.",
        "Do not summarize feelings.",
        "Use concrete supplied evidence or an explicitly grounded interpretation of that evidence.",

        "Good frontier examples:",
        "'Who is actually in charge?'",
        "'What just changed?'",
        "'Why is this suddenly different?'",
        "'What does the bow mean now?'",
        "'How far does this attitude go?'",

        "Bad frontier examples:",
        "'Coco's reaction'",
        "'the unexpected'",
        "'hidden intentions'",
        "'build character'",
        "'viewer interest'",
        "'closing remarks'",

        `CREATIVE RISK: ${risk}. Push interpretation, framing, and character specificity this far, but never invent concrete reality.`,
        `Return exactly ${targetBeats} beats.`,

        "Each change should be under 12 words.",
        "Each frontier should be under 8 words.",
        "Each next should be under 12 words.",
        "Each necessity should be under 12 words.",

        "The final beat must land a consequence, reframe, image, exit, or afterglow.",
        "No moral, lesson, or summary afterward.",

        "Use canonical viewer roles such as arrival, hook, pressure, reframe, escalation, discovery, consequence, callback, release, payoff.",
        "Never put strategy names, operator names, cognition language, or planning instructions inside change, next, frontier, or necessity.",

        "IMPORTANT:",
        "A beat's change may be a memorable interpretive statement.",
        "It does not have to describe a new physical event.",
        "The best beat can reveal what the supplied reality suddenly means.",

        "Output JSON only:",
        "{premise:string,baselineFacts:string[],beats:[{role,gainKind,change,next,frontier,necessity}]}."
      ].join("\n"),
    },
    {
      role: "user" as const,
      content: JSON.stringify(compactWorld),
    },
  ];
}

function buildMouthMessages(
  input: AuthorBrainTruth,
  sequence: SequencePlay,
  plan: BeatPlan,
  cognition: ReturnType<typeof buildAuthorCognitivePlan>,
) {
  const targetCount = sequence.cuts.length;

  const beats = sequence.cuts.map((cut, index) => ({
    order: index + 1,
    role: cut.role,
    plannerHypothesis: cut.informationGain,
    frontier: cut.momentum?.after.informationFrontier?.frontier ?? "",
    nextNeed: cut.nextPromise ?? "",
    necessity: plan.beats[index]?.necessity ?? "",
  }));

  return [
  {
    role: "system" as const,
    content: [
      "You are QRE's theatrical mouth and character writer.",
  "You receive an APPROVED SEQUENCE of sentence cuts.",
  `Return exactly ${targetCount} viewer-facing lines, one line for each beat, in beat order.`,
  "Do not collapse the beats into one summary.",
  "Do not skip a beat.",
  "Do not invent a new physical event.",
  "The sequence beat is a hypothesis about the movie, not independent evidence.",
  "The supplied facts, source moments, memory, subject truth, and character signals are the concrete reality.",
  "",
  "CORE CREATIVE INVARIANT:",
  "Find a memorable interpretive statement whose meaning is completely recoverable from supplied reality, while introducing no new concrete event.",
  "",
  "Do NOT merely paraphrase the supplied event.",
  "First identify what the supplied event means inside the character's personality, contradiction, status, relationship, or situation.",
  "Then compress that meaning into a line that feels discovered rather than explained.",
  "",
  "INTERPRETATION IS ALLOWED:",
  "metaphor, personification, status language, implication, double meaning, comic framing, understatement, reversal, rhetorical game language, character-specific exaggeration, and recontextualization.",
  "These are interpretations, not new facts, when their meaning is recoverable from supplied reality.",
  "",
  "For example, if supplied reality says a nervous but fierce character came in, an interpretive line may frame that arrival as someone who 'already called her lawyer'.",
  "That does NOT mean a lawyer actually existed or was actually called.",
  "It means the supplied nervous + fierce contradiction is being expressed through status language.",
  "",
  "Likewise, a supplied theft followed by an exit can become a compressed interpretive payoff such as 'Peace, temporarily.'",
  "Do not add another event. Change the meaning of the supplied events.",
  "",
  "THE THREE TESTS FOR EVERY LINE:",
  "1. Could every concrete implication be traced back to supplied reality?",
  "2. Does the line add interpretation rather than merely repeat the fact?",
  "3. Does the line make the supplied character or moment feel more specific?",
  "",
  "If a line could appear in any generic grooming, wedding, cleaning, or service story, reject it and find a character-specific interpretation.",
  "",
  "Use contradictions aggressively when supported.",
  "A nervous + fierce character is not two adjectives to repeat; it is a relationship to exploit.",
  "A routine service + unusual character behavior is not a summary; it is a source of comic or dramatic tension.",
  "A supplied object can acquire changed meaning without acquiring new physical behavior.",
  "",
  "Prefer lines with an implicit movie behind them.",
  "The viewer should be able to think: 'Oh. THAT is what this was.'",
  "",
  "Do not explain the interpretation.",
  "Do not say what the metaphor means.",
  "Do not announce the joke.",
  "Do not summarize the character.",
  "Make the interpretation itself carry the meaning.",
  "",
  "Do not mechanically repeat the subject name.",
  "Establish identity once, then spend words on attitude, change, relationship, or consequence.",
  "",
  "Use supplied objects and moments when they carry meaning.",
  "Do not invent props, people, dialogue, locations, actions, outcomes, or physical reactions.",
  "",
  "Prefer 3-7 words per line. Maximum 7 words.",
  "The final line may be extremely compressed if the supplied sequence supports it.",
  "",
  "Do not use generic mascot language such as 'Poodle power', 'so fabulous', 'good girl', or 'what a day'.",
  "Do not use generic emotional summaries.",
  "Do not output labels such as 'the contrast' or 'the unexpected'.",
  "Do not output planning language.",
  "Do not output questions unless the supplied reality itself genuinely requires one.",
  "",
  "The goal is NOT prettier narration.",
  "The goal is a tiny interpretive movie.",
  "",
  "Return JSON only in exactly this shape:",
  `{"texts":["line 1","line 2"${targetCount >= 3 ? ', "line 3"' : ""}${targetCount >= 4 ? ', "line 4"' : ""}${targetCount >= 5 ? ', "line 5"' : ""}${targetCount >= 6 ? ', "line 6"' : ""}]}`,
].join("\n"),
    },
    {
      role: "user" as const,
      content: JSON.stringify({
        prompt: input.prompt,
        lens: input.lens,
        subject: input.subject,
        subjectTruth: input.subjectTruth ?? null,
        facts: input.facts,
        sourceMoments: input.sourceMoments,
        memory: input.memoryContext ?? [],
        trajectory: input.trajectory ?? [],
        characterRead: cognition.characterRead,
        contradictions: cognition.contradictions,
        chosenAttentionStrategy: cognition.chosenAttentionStrategy,
        latentMovieCandidates: cognition.latentMovieCandidates.slice(0, 4),
        beats,
      }),
    },
  ];
}

export async function authorBrainUniversal(input: AuthorBrainTruth): Promise<{ brief: AuthorCreativeBrief; scenes: AuthorScene[]; sequence?: SequencePlay; field: Record<string, unknown>; diagnostics: Record<string, unknown> }> {
  const subject = clean(input.subject) || "the subject";
  const realityGraph = input.realityGraph ?? buildAuthorRealityGraph({
    prompt: clean(input.prompt),
    subject,
    place: clean(input.place),
    facts: [...input.facts],
    sourceMoments: [...input.sourceMoments],
    memoryContext: [...(input.memoryContext ?? [])],
    trajectory: [...(input.trajectory ?? [])],
  });
  const cognition = buildAuthorCognitivePlan({
    prompt: clean(input.prompt), lens: clean(input.lens), subject, place: clean(input.place),
    facts: [...input.facts], sourceMoments: [...input.sourceMoments], memoryContext: [...(input.memoryContext ?? [])],
    priorScenes: [...(input.trajectory ?? [])], priorStrategies: [...(input.creativeLearningContext ?? [])], round: Math.max(1, input.trajectory?.length ? 2 : 1),
    realityGraph,
  });

  const risk = inferRiskDial(input, cognition);
  const field: Record<string, unknown> = {
    subjectTruth: input.subjectTruth ?? null,
    realityGraph,
    facts: uniq(input.facts, 24),
    moments: uniq(input.sourceMoments, 18),
    memory: uniq(input.memoryContext, 14),
    trajectory: uniq(input.trajectory, 14),
    learning: uniq(input.creativeLearningContext, 20),
    prompt: clean(input.prompt),
    lens: clean(input.lens),
    cognition: { mode: cognition.mode, chosenAttentionStrategy: cognition.chosenAttentionStrategy, characterRead: cognition.characterRead, attentionCandidates: cognition.attentionCandidates, contradictions: cognition.contradictions, operatorMix: cognition.operatorMix, callbackTargets: cognition.callbackTargets, sceneRules: cognition.sceneRules },
    creativeRisk: risk,
  };

  const beatMessages = buildBeatMessages({ ...input, realityGraph }, cognition);
  let beatPlanResult = await localModelGenerate(beatMessages, "json", { numPredict: 768, temperature: risk === "safe" ? 0.55 : 0.78 });
  debug("BEAT-DISCOVERY", beatPlanResult.text);
  let beatPlan = normalizeBeatPlan(parseJson<unknown>(beatPlanResult.text)) ?? normalizeLatentMovieBeatPlan(parseJson<unknown>(beatPlanResult.text));
  let beatPlanRetries = 0;

  if (!beatPlan) {
    beatPlanRetries = 1;
    beatPlanResult = await localModelGenerate([
      beatMessages[0],
      { role: "user", content: `${beatMessages[1].content}\nReturn ONLY JSON. Use exactly 4 beats. Keep change/frontier/next/necessity extremely short. No closing.` },
    ], "json", { numPredict: 512, temperature: 0.5 });
    debug("BEAT-DISCOVERY-RETRY", beatPlanResult.text);
    beatPlan = normalizeBeatPlan(parseJson<unknown>(beatPlanResult.text));
  }
const recoveredBeatPlan = recoverBeatPlanFromLatentMovie(
  cognition.latentMovieCandidates?.[0],
  realityGraph,
);

if (!beatPlan && recoveredBeatPlan) {
  beatPlan = normalizeBeatPlan(recoveredBeatPlan);
}

if (!beatPlan) {
  return {
    brief: brief(input, cognition.chosenAttentionStrategy),
    scenes: [],
    sequence: undefined,
    field,
    diagnostics: {
      cognitionMode: cognition.mode,
      characterRead: cognition.characterRead,
      chosenAttentionStrategy: cognition.chosenAttentionStrategy,
      attentionCandidates: cognition.attentionCandidates,
      contradictions: cognition.contradictions,
      operatorMix: cognition.operatorMix,
      creativeRisk: risk,
      realityGraphEvents: realityGraph.events.length,
      realityGraphRelations: realityGraph.relations.length,
      realityGraphTensions: realityGraph.unresolvedTensions,
      beatCount: 0,
      beatPlan: [],
      beatPlanRetries,
      beatPlanParseFailed: true,
      beatPlanRecovered: Boolean(recoveredBeatPlan),
      sequenceCutsAttempted: 0,
      sequenceCutsRejected: 0,
      finalScenes: 0,
    },
  };
}

  const sequence = buildViewerMomentum(subject, beatPlan);
  if (!sequence) {
    return { brief: brief(input, cognition.chosenAttentionStrategy), scenes: [], sequence: undefined, field, diagnostics: { cognitionMode: cognition.mode,
      characterRead: cognition.characterRead, chosenAttentionStrategy: cognition.chosenAttentionStrategy, creativeRisk: risk, realityGraphEvents: realityGraph.events.length, realityGraphRelations: realityGraph.relations.length, beatCount: 0, beatPlanRetries, finalScenes: 0 } };
  }

   debug(
    "INTERPRETIVE-MOUTH",
    JSON.stringify({
      invariant: "recoverable meaning + no new concrete event",
      characterRead: cognition.characterRead,
      contradictions: cognition.contradictions,
    }),
  );

  const realization = await localModelGenerate(
    buildMouthMessages({ ...input, realityGraph }, sequence, beatPlan, cognition),
    "json",
    { numPredict: 640, temperature: risk === "safe" ? 0.58 : 0.76 },
  );
  debug("MOUTH-REALIZATION", realization.text);
  const texts = extractTexts(parseJson<unknown>(realization.text));
  const sequenceResult = scenesFromSequence(
  sequence,
  texts,
  { ...input, realityGraph },
  cognition,
);
  const magnetValues = sequence.cuts.map((cut) => cut.momentum?.after.magnet?.magnetStrength ?? 0).filter(Number.isFinite);
  const magnetAverage = magnetValues.length ? magnetValues.reduce((a, b) => a + b, 0) / magnetValues.length : 0;
  const magnetPeak = magnetValues.length ? Math.max(...magnetValues) : 0;
  const magnetFloor = magnetValues.length ? Math.min(...magnetValues) : 0;

  return {
    brief: brief(input, cognition.chosenAttentionStrategy), scenes: sequenceResult.scenes, sequence, field,
    diagnostics: {
      cognitionMode: cognition.mode,
      characterRead: cognition.characterRead,
      chosenAttentionStrategy: cognition.chosenAttentionStrategy,
      attentionCandidates: cognition.attentionCandidates,
      contradictions: cognition.contradictions,
      operatorMix: cognition.operatorMix,
      creativeRisk: risk,
      realityGraphEvents: realityGraph.events.length,
      realityGraphRelations: realityGraph.relations.length,
      realityGraphTensions: realityGraph.unresolvedTensions,
      realityGraphRecurring: realityGraph.recurringSignals,
      realityGraphSensory: realityGraph.sensorySignals,
      beatCount: beatPlan.beats.length,
      beatPlan: beatPlan.beats,
      beatPlanRetries,
      beatPlanParseFailed: false,
      sequenceCutsAttempted: sequenceResult.attempted,
      sequenceCutsRejected: sequenceResult.rejected,
      rejectionReasons: sequenceResult.rejectionReasons,
      realizationTexts: texts,
      realizationCountMismatch: texts.length !== sequence.cuts.length,
      finalScenes: sequenceResult.scenes.length,
      magnetAverage: metric(magnetAverage),
      magnetPeak: metric(magnetPeak),
      magnetFloor: metric(magnetFloor),
      magnetCutsMeasured: magnetValues.length,
      subjectSpaceEstablished: Boolean(sequence.closingMomentum?.subjectContinuity?.established),
      informationFrontier: sequence.closingMomentum?.informationFrontier?.frontier ?? "",
    },
  };
}


