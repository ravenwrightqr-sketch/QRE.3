import type {
  AuthorBrainTruth,
  AuthorCreativeBrief,
  AuthorScene,
  CutNecessity,
  SequenceCut,
  SequencePlay,
  SequenceTransition,
  SubjectTruth,
  ViewerAttentionRole,
  ViewerMomentum,
  ViewerState,
} from "@qre/contracts";
import { localModelGenerate } from "./localModelRuntime.js";

const ROLES: readonly ViewerAttentionRole[] = ["arrival", "hook", "question", "pressure", "reframe", "escalation", "discovery", "consequence", "release", "payoff", "callback", "continuation"];
const GAINS = new Set(["new_fact", "surprise", "question", "escalation", "reframe", "discovery", "consequence", "callback", "payoff"]);
const GENERIC = /\b(?:beautiful transformation|magical moment|unforgettable experience|incredible journey|new routine|eyes sparkle|heart softens|happy now|power of love|symbol of love)\b/i;
const META = /\b(?:qre|prompt|compiler|cognition|metadata|language model|writing process)\b/i;
const CAMERA = /\b(?:camera|zoom|close-up|cut to|final shot|scene opens|we see)\b/i;
const PROVIDER = /\b(?:groomer|cleaner|technician|barber|stylist|mechanic|plumber|employee|worker|staff|owner|customer|client)\b/i;
const INFERRED_EMOTION = /\b(?:happy|sad|angry|excited|afraid|scared|nervous|joyful|thrilled|content|confident|loving|furious|heartbroken|alarmed|relieved|anxious|delighted|worried|calm|proud|uneasy)\b/i;
const NAMED_ENTITY = /\b(?:Mr\.?|Mrs\.?|Ms\.?|Dr\.?)?\s*[A-Z][A-Za-z'’-]+(?:\s+[A-Z][A-Za-z'’-]+)+\b/g;

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const uniq = (values: readonly unknown[] | undefined, limit = 20): string[] => [...new Set((values ?? []).map(clean).filter(Boolean))].slice(0, limit);

function parseJson<T>(raw: string): T | null {
  const text = clean(raw).replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try { return JSON.parse(text) as T; } catch { return null; }
}

function debug(label: string, raw: string): void {
  if (process.env.QRE_AUTHOR_DEBUG_RAW !== "true") return;
  console.log(`\n--- QRE RAW MODEL OUTPUT · ${label} ---\n${raw}\n--- END RAW MODEL OUTPUT ---\n`);
}

function normalizeState(raw: unknown): ViewerState {
  if (!raw || typeof raw !== "object") return { known: [] };
  const value = raw as Partial<ViewerState>;
  return { known: uniq(value.known, 8), expected: clean(value.expected) || undefined, unresolved: clean(value.unresolved) || undefined, currentWant: clean(value.currentWant) || undefined, recentChange: clean(value.recentChange) || undefined };
}

function normalizeMomentum(raw: unknown): ViewerMomentum | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const value = raw as Partial<ViewerMomentum>;
  return {
    known: uniq(value.known, 8),
    expected: clean(value.expected) || undefined,
    activeQuestion: clean(value.activeQuestion) || undefined,
    curiosityGap: clean(value.curiosityGap) || undefined,
    predictionShift: clean(value.predictionShift) || undefined,
    currentWant: clean(value.currentWant) || undefined,
    unresolved: clean(value.unresolved) || undefined,
    forwardPull: clean(value.forwardPull) || undefined,
    payoffDebt: clean(value.payoffDebt) || undefined,
  };
}

function normalizeNecessity(raw: unknown): CutNecessity | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const value = raw as Partial<CutNecessity>;
  if (typeof value.necessary !== "boolean") return undefined;
  return { necessary: value.necessary, reason: clean(value.reason), removalDamage: clean(value.removalDamage) || undefined };
}

function normalizeTransition(raw: unknown): SequenceTransition | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const value = raw as Partial<SequenceTransition>;
  const before = normalizeMomentum(value.before);
  const after = normalizeMomentum(value.after);
  if (!before || !after) return undefined;
  return { before, change: clean(value.change), after, nextPressure: clean(value.nextPressure) || undefined, necessity: normalizeNecessity(value.necessity) };
}

function normalizeSequence(raw: unknown, subject: string): SequencePlay | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const value = raw as Partial<SequencePlay> & { cuts?: unknown; baselineFacts?: unknown };
  if (!Array.isArray(value.cuts)) return undefined;
  const cuts: SequenceCut[] = value.cuts.map((item, index) => {
    const cut = (item && typeof item === "object" ? item : {}) as Partial<SequenceCut>;
    const role = ROLES.includes(cut.role as ViewerAttentionRole) ? cut.role as ViewerAttentionRole : index === 0 ? "hook" : "continuation";
    const gainKind = typeof cut.gainKind === "string" && GAINS.has(cut.gainKind) ? cut.gainKind as SequenceCut["gainKind"] : undefined;
    return {
      id: clean(cut.id) || `cut-${index + 1}`,
      order: Number.isFinite(cut.order) ? Number(cut.order) : index + 1,
      role,
      gainKind,
      sourceIds: uniq(cut.sourceIds, 8),
      informationGain: clean(cut.informationGain),
      attentionDelta: clean(cut.attentionDelta),
      viewerBefore: normalizeState(cut.viewerBefore),
      viewerAfter: normalizeState(cut.viewerAfter),
      momentum: normalizeTransition(cut.momentum),
      necessity: normalizeNecessity(cut.necessity),
      nextPromise: clean(cut.nextPromise) || undefined,
      payoffConnection: clean(cut.payoffConnection) || undefined,
      noveltyScore: typeof cut.noveltyScore === "number" ? cut.noveltyScore : undefined,
      confidence: typeof cut.confidence === "number" ? cut.confidence : 0.8,
    };
  }).filter((cut) => GAINS.has(String(cut.gainKind)) && Boolean(cut.informationGain || cut.attentionDelta));
  return {
    subject: clean(value.subject) || subject,
    premise: clean(value.premise),
    openingState: normalizeState(value.openingState),
    baselineFacts: uniq(value.baselineFacts as unknown[] | undefined, 10),
    openingMomentum: normalizeMomentum(value.openingMomentum),
    cuts,
    closingMomentum: normalizeMomentum(value.closingMomentum),
    closingState: value.closingState ? normalizeState(value.closingState) : undefined,
    continuity: uniq(value.continuity, 6),
    antiCrutch: uniq(value.antiCrutch, 6),
    continuation: clean(value.continuation) || undefined,
  };
}

function worldText(input: AuthorBrainTruth): string {
  return [input.prompt, input.subject, input.place, ...input.facts, ...input.sourceMoments, ...(input.memoryContext ?? []), ...(input.trajectory ?? []), ...(input.presenceSummary ?? [])].filter(Boolean).join(" ");
}

function pronounsAllowed(text: string, input: AuthorBrainTruth, truth?: SubjectTruth): boolean {
  if (!/\b(?:he|him|his|she|her|hers|they|them|their|themselves|themself)\b/i.test(text)) return true;
  const world = worldText(input).toLowerCase();
  if (/\b(?:he|him|his)\b/i.test(text) && /\b(?:male|boy|man|he|him|his)\b/i.test(world)) return true;
  if (/\b(?:she|her|hers)\b/i.test(text) && /\b(?:female|girl|woman|she|her|hers)\b/i.test(world)) return true;
  if (/\b(?:they|them|their|themselves|themself)\b/i.test(text)) return true;
  return Boolean(truth?.pronouns && ["explicit", "memory", "runtime"].includes(truth.provenance));
}

function unknownNamedEntity(text: string, input: AuthorBrainTruth): boolean {
  const world = worldText(input).toLowerCase();
  const subject = clean(input.subject).toLowerCase();
  for (const match of text.matchAll(NAMED_ENTITY)) {
    const candidate = clean(match[0]);
    if (!candidate || candidate.toLowerCase() === subject) continue;
    if (!world.includes(candidate.toLowerCase())) return true;
  }
  return false;
}

function invalidCut(text: string, input: AuthorBrainTruth): boolean {
  if (!text || text.split(/\s+/).length > 14) return true;
  if (GENERIC.test(text) || META.test(text) || CAMERA.test(text)) return true;
  if (/[;,]/.test(text)) return true;
  if (unknownNamedEntity(text, input)) return true;
  if (INFERRED_EMOTION.test(text) && !INFERRED_EMOTION.test(worldText(input))) return true;
  if (PROVIDER.test(text) && !PROVIDER.test(worldText(input))) return true;
  if (!pronounsAllowed(text, input, input.subjectTruth)) return true;
  return false;
}

function normalizeScenes(raw: unknown): AuthorScene[] {
  if (Array.isArray(raw)) return raw.flatMap((item) => {
    if (typeof item === "string") return [{ text: item, kind: "line" as const }];
    if (item && typeof item === "object" && typeof (item as AuthorScene).text === "string") return [item as AuthorScene];
    return [];
  });
  if (!raw || typeof raw !== "object") return [];
  const value = raw as { scenes?: unknown; lines?: unknown[]; text?: unknown };
  if (Array.isArray(value.scenes)) return normalizeScenes(value.scenes);
  if (Array.isArray(value.lines)) return value.lines.map((line) => ({ text: clean(line), kind: "line" as const }));
  if (typeof value.text === "string") return value.text.split(/\n+/).filter(Boolean).map((line) => ({ text: clean(line), kind: "line" as const }));
  return [];
}

function recoverScenes(raw: string): AuthorScene[] {
  const out: AuthorScene[] = [];
  const pattern = /"text"\s*:\s*"((?:\\.|[^"\\])*)"/g;
  for (const match of raw.matchAll(pattern)) {
    try { out.push({ text: clean(JSON.parse(`"${match[1]}"`)), kind: "line" }); } catch { /* ignore */ }
  }
  return out;
}

function finalizeScenes(input: AuthorBrainTruth, raw: AuthorScene[]): AuthorScene[] {
  const out: AuthorScene[] = [];
  const seen = new Set<string>();
  for (const scene of raw) {
    const text = clean(scene.text);
    const key = text.toLowerCase();
    if (!text || seen.has(key) || invalidCut(text, input)) continue;
    seen.add(key);
    out.push({ text, kind: scene.kind ?? "line" });
  }
  return out.slice(0, 6);
}

function fallbackBrief(input: AuthorBrainTruth): AuthorCreativeBrief {
  const plan = input.cognitivePlan;
  return {
    angle: clean(plan?.creativePossibilities?.[0]) || "the most specific contradiction or relationship in the world",
    engine: clean(plan?.purpose) || "subject-centered significance",
    question: clean(plan?.whyInteract?.[0]) || "what is unexpectedly interesting here?",
    strongestImage: input.facts[0] ?? input.sourceMoments[0] ?? "the strongest supplied detail",
    tension: clean(plan?.emotionalIntent?.[0]) || "the pressure created by the subject's circumstances",
    payoff: clean(plan?.futureEvolution?.[0]) || "a character-specific consequence or reframe",
    callback: input.memoryContext?.[0] ?? input.trajectory?.[0] ?? "none yet",
    rhythm: ["hit", "short", "variable", "hit"],
    avoid: ["fact parade", "chronology without movement", "invented reality", "generic emotional arc", "subject-name repetition", "database-role narration", "padding", "explanation where implication works"],
  };
}

export async function authorBrain(input: AuthorBrainTruth): Promise<{ brief: AuthorCreativeBrief; scenes: AuthorScene[]; sequence?: SequencePlay; field: Record<string, unknown> }> {
  const brief = fallbackBrief(input);
  const field = {
    truth: input.subjectTruth ?? null,
    current: uniq([...input.facts, ...input.sourceMoments], 12),
    history: uniq([...(input.memoryContext ?? []), ...(input.trajectory ?? [])], 8),
    learning: uniq(input.creativeLearningContext, 8),
    returning: input.returning ?? false,
    visit: input.visitNumber ?? null,
    presence: uniq(input.presenceSummary, 6),
  };

  const result = await localModelGenerate([
    {
      role: "system",
      content: [
        "You are QRE's universal creative author and sequence director.",
        "Your primary objective is to discover the strongest valid sequence hidden inside the supplied reality. You are not summarizing the input.",
        "Before every cut privately answer: what does the viewer already know; what do they expect; what is the strongest unresolved question or curiosity gap; what surprising but coherent change can happen; why does it matter specifically to the subject; what does the viewer want after it; what should remain unrevealed; what becomes possible next; would removing this cut weaken the movie; can the same mental-model change be expressed with fewer words or stronger implication?",
        "A cut earns existence when it materially changes the viewer's mental model: knowledge, expectation, question, desire, interpretation, tension, or payoff potential.",
        "Information is not attention. Identity is baseline. Chronology is not sequence. An emotion arc is not automatically a movie.",
        "Seek a balanced combination of curiosity, prediction change, surprise, forward pressure, subject relevance, coherence, and payoff. Do not reduce creativity to one score.",
        "Use counterfactual necessity. A cut is strong when removing it damages setup, curiosity, coherence, escalation, reframe, or payoff.",
        "Compress aggressively when context permits. A two-word implication can carry more cognitive weight than a paragraph explanation. Shortness itself is not the goal.",
        "The subject is the temporary star. Services and database roles are usually the world around the subject.",
        "REALITY IS SACRED. Use only supplied facts, source moments, memory, trajectory, and presence. Reorder, juxtapose, compress, reframe, escalate, and imply from known material. Never invent people, names, relationships, physical events, actions, locations, placements, dialogue, or outcomes.",
        "Do not turn inference into fact. Observable behavior is safer than narrated internal emotion.",
        "Every actual cut uses a non-baseline gainKind. Put established identity in baselineFacts/openingState instead.",
        "Do not use actor names or role labels in the sequence role field. The role field is the viewer-attention job.",
        "No commas or semicolons in finished cut text. Avoid multi-shot sentence chains.",
        "Never pad. The movie earns its own length.",
        "Return compact JSON with exactly two top-level keys: sequence and scenes.",
        "sequence: subject, premise, openingState, baselineFacts, openingMomentum, cuts, closingMomentum, closingState, continuity, antiCrutch, continuation.",
        "Each cut: id, order, role, gainKind, sourceIds, informationGain, attentionDelta, viewerBefore, viewerAfter, momentum, necessity, nextPromise, payoffConnection, noveltyScore, confidence.",
        "Momentum tracks known, expected, activeQuestion, curiosityGap, predictionShift, currentWant, unresolved, forwardPull, payoffDebt.",
        "Necessity tracks necessary, reason, removalDamage.",
        "scenes contains only finished cut text and must realize the selected sequence. Do not explain the plan in scenes.",
      ].join("\n"),
    },
    { role: "user", content: JSON.stringify({ prompt: input.prompt, lens: input.lens ?? "", subject: input.subject ?? "", place: input.place ?? "", truth: input.subjectTruth ?? null, world: field }) },
  ], "json");

  debug("AUTHOR-BRAIN-MOMENTUM", result.text);
  const parsed = parseJson<{ sequence?: unknown; scenes?: unknown }>(result.text);
  const sequence = normalizeSequence(parsed?.sequence, input.subject);
  const rawScenes = parsed?.scenes !== undefined ? normalizeScenes(parsed.scenes) : recoverScenes(result.text);
  return { brief, scenes: finalizeScenes(input, rawScenes), sequence, field };
}
