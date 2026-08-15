/**
 * QRE UNIVERSAL AUTHOR BRAIN · MOMENTUM V2 · LIVING INTELLIGENCE CORE
 *
 * CANONICAL EXPANSION SURFACE — EXPAND OR TUNE THIS BRAIN AS GENERAL
 * CREATIVE LAWS ARE DISCOVERED. Do not freeze it to protect weaker
 * implementations. Generalize lessons across domains instead of adding
 * subject-specific hacks.
 *
 * Core question:
 * Given everything the viewer currently believes, what is the strongest
 * valid change QRE can make to that mental model that makes the next cut
 * desirable, surprising, or necessary?
 *
 * General operations must transfer across domains: recurrence, contradiction,
 * implication, image, status shift, callback, consequence, withholding.
 */
import type {
  AuthorBrainTruth,
  AuthorCreativeBrief,
  AuthorScene,
  SequenceCut,
  SequencePlay,
  ViewerAttentionRole,
  ViewerMomentum,
  ViewerState,
} from "@qre/contracts";
import { localModelGenerate } from "./localModelRuntime.js";

const ROLES: readonly ViewerAttentionRole[] = [
  "arrival", "hook", "question", "pressure", "reframe", "escalation",
  "discovery", "consequence", "release", "payoff", "callback", "continuation",
];
const GAINS = new Set([
  "new_fact", "surprise", "question", "escalation", "reframe",
  "discovery", "consequence", "callback", "payoff",
]);
const META = /\b(?:qre|prompt|compiler|cognition|metadata|language model|writing process)\b/i;
const CAMERA = /\b(?:camera|zoom|close-up|cut to|final shot|scene opens|we see|fade to)\b/i;
const GENERIC = /\b(?:beautiful transformation|magical moment|unforgettable experience|incredible journey|new routine|power of love|symbol of love|quirky personality|grooming journey)\b/i;
const LITERAL_QUESTION = /^(?:what|why|how|when|where|who|will|did|is|can|could|should)\b[^.?!]*\?$/i;
const UNSUPPORTED_PROVIDER = /\b(?:groomer|cleaner|technician|barber|stylist|mechanic|plumber|employee|worker|staff|owner|customer|client)\b/i;
const EMOTION_WORD = /\b(?:happy|sad|angry|excited|afraid|scared|nervous|joyful|thrilled|content|confident|loving|furious|heartbroken|alarmed|relieved|anxious|delighted|worried|calm|proud|uneasy|gleeful|happiness)\b/i;
const INVENTED_ACTION = /\b(?:trembles|trembling|shakes|shaking|leaps|jumped|jumps|hides|hiding|cries|crying|smiles|smiling|wags|wagging|runs|running|grabs|grabbed|throws|threw|places|placed|removes|removed|approaches|approached|walks|walked|laughs|laughed|chews|chewed|licks|licked|bites|bit|drops|dropped)\b/i;
const SUBJECT_REPEAT = /\b(coco|maria)\b/gi;

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const uniq = (values: readonly unknown[] | undefined, limit = 20): string[] => [...new Set((values ?? []).map(clean).filter(Boolean))].slice(0, limit);

function parseJson<T>(raw: string): T | null {
  const text = String(raw ?? "").replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try { return JSON.parse(text) as T; } catch { return null; }
}

function debug(raw: string): void {
  if (process.env.QRE_AUTHOR_DEBUG_RAW !== "true") return;
  console.log(`\n--- QRE RAW MODEL OUTPUT · AUTHOR-BRAIN-MOMENTUM-V2 ---\n${raw}\n--- END RAW MODEL OUTPUT ---\n`);
}

function worldText(input: AuthorBrainTruth): string {
  return [
    input.prompt,
    input.subject,
    input.place,
    ...input.facts,
    ...input.sourceMoments,
    ...(input.memoryContext ?? []),
    ...(input.trajectory ?? []),
    ...(input.presenceSummary ?? []),
  ].filter(Boolean).join(" ");
}

function sourceText(input: AuthorBrainTruth): string[] {
  return [
    ...input.facts,
    ...input.sourceMoments,
    ...(input.memoryContext ?? []),
    ...(input.trajectory ?? []),
    ...(input.presenceSummary ?? []),
  ].map(clean).filter(Boolean);
}

function sourceSupports(text: string, input: AuthorBrainTruth): boolean {
  const lower = text.toLowerCase();
  const sources = sourceText(input).map((x) => x.toLowerCase());
  const contentWords = lower.split(/[^a-z0-9'-]+/i).filter((x) => x.length >= 4);
  if (!contentWords.length) return true;
  const groundedWords = contentWords.filter((word) => sources.some((source) => source.includes(word)));
  return groundedWords.length >= Math.max(1, Math.ceil(contentWords.length * 0.28));
}

function normalizeScenes(raw: unknown): AuthorScene[] {
  if (Array.isArray(raw)) {
    return raw.flatMap((item) => {
      if (typeof item === "string") return [{ text: clean(item), kind: "line" as const }];
      if (item && typeof item === "object" && typeof (item as AuthorScene).text === "string") return [{ text: clean((item as AuthorScene).text), kind: "line" as const }];
      return [];
    });
  }
  if (typeof raw === "string") return raw.split(/\n+/).map(clean).filter(Boolean).map((text) => ({ text, kind: "line" as const }));
  if (!raw || typeof raw !== "object") return [];
  const value = raw as { scenes?: unknown; text?: unknown };
  if (Array.isArray(value.scenes)) return normalizeScenes(value.scenes);
  if (typeof value.text === "string") return normalizeScenes(value.text);
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

function hasUnsupportedProvider(text: string, input: AuthorBrainTruth): boolean {
  if (!UNSUPPORTED_PROVIDER.test(text)) return false;
  const world = worldText(input);
  return !UNSUPPORTED_PROVIDER.test(world);
}

function hasUnsupportedEmotion(text: string, input: AuthorBrainTruth): boolean {
  if (!EMOTION_WORD.test(text)) return false;
  return !EMOTION_WORD.test(worldText(input));
}

function hasUnsupportedAction(text: string, input: AuthorBrainTruth): boolean {
  if (!INVENTED_ACTION.test(text)) return false;
  const world = worldText(input);
  return !INVENTED_ACTION.test(world);
}

function validCut(text: string, input: AuthorBrainTruth): boolean {
  if (!text) return false;
  if (text.split(/\s+/).length > 14) return false;
  if (META.test(text) || CAMERA.test(text) || GENERIC.test(text)) return false;
  if (LITERAL_QUESTION.test(text)) return false;
  if (hasUnsupportedProvider(text, input)) return false;
  if (hasUnsupportedEmotion(text, input)) return false;
  if (hasUnsupportedAction(text, input)) return false;
  if (!sourceSupports(text, input) && text.split(/\s+/).length > 3) return false;
  return true;
}

function finalizeScenes(input: AuthorBrainTruth, raw: AuthorScene[]): AuthorScene[] {
  const seen = new Set<string>();
  const out: AuthorScene[] = [];
  for (const scene of raw) {
    const text = clean(scene.text);
    if (!validCut(text, input)) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ text, kind: "line" });
  }
  return out.slice(0, 6);
}

function normalizeMomentum(value: unknown, fallbackKnown: string[]): ViewerMomentum {
  if (!value || typeof value !== "object") return { known: fallbackKnown };
  const v = value as Partial<ViewerMomentum>;
  return {
    known: uniq(v.known, 8),
    expected: clean(v.expected) || undefined,
    activeQuestion: clean(v.activeQuestion) || undefined,
    curiosityGap: clean(v.curiosityGap) || undefined,
    predictionShift: clean(v.predictionShift) || undefined,
    currentWant: clean(v.currentWant) || undefined,
    unresolved: clean(v.unresolved) || undefined,
    forwardPull: clean(v.forwardPull) || undefined,
    payoffDebt: clean(v.payoffDebt) || undefined,
  };
}

function buildSequence(subject: string, raw: unknown): SequencePlay | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const value = raw as { premise?: unknown; baselineFacts?: unknown; cuts?: unknown; continuation?: unknown };
  if (!Array.isArray(value.cuts)) return undefined;
  const baselineFacts = uniq(value.baselineFacts as unknown[] | undefined, 10);
  let momentum = normalizeMomentum(undefined, baselineFacts);
  const cuts: SequenceCut[] = [];

  for (const [index, item] of value.cuts.entries()) {
    if (!item || typeof item !== "object") continue;
    const cut = item as Record<string, unknown>;
    const role = clean(cut.role);
    const gainKind = clean(cut.gainKind);
    if (!ROLES.includes(role as ViewerAttentionRole) || !GAINS.has(gainKind)) continue;
    const change = clean(cut.change);
    const next = clean(cut.next);
    const after = normalizeMomentum({
      known: momentum.known,
      expected: next,
      activeQuestion: gainKind === "question" ? change : momentum.activeQuestion,
      curiosityGap: next || momentum.curiosityGap,
      predictionShift: change,
      currentWant: next,
      unresolved: next || change,
      forwardPull: next,
      payoffDebt: momentum.payoffDebt,
    }, baselineFacts);
    cuts.push({
      id: `cut-${index + 1}`,
      order: index + 1,
      role: role as ViewerAttentionRole,
      gainKind: gainKind as SequenceCut["gainKind"],
      sourceIds: [],
      informationGain: change,
      attentionDelta: next,
      viewerBefore: { known: momentum.known, expected: momentum.expected, unresolved: momentum.unresolved, currentWant: momentum.currentWant, recentChange: momentum.predictionShift } satisfies ViewerState,
      viewerAfter: { known: after.known, expected: after.expected, unresolved: after.unresolved, currentWant: after.currentWant, recentChange: after.predictionShift } satisfies ViewerState,
      momentum: { before: momentum, change, after, nextPressure: next },
      necessity: { necessary: true, reason: next || change },
      nextPromise: next || undefined,
      confidence: 0.8,
    });
    momentum = after;
  }

  if (!cuts.length) return undefined;
  return {
    subject,
    premise: clean(value.premise).replace(/[.?!]$/, ""),
    openingState: { known: baselineFacts },
    baselineFacts,
    openingMomentum: { known: baselineFacts },
    cuts,
    closingMomentum: momentum,
    continuity: [],
    antiCrutch: [],
    continuation: clean(value.continuation) || undefined,
  };
}

function brief(input: AuthorBrainTruth): AuthorCreativeBrief {
  return {
    angle: "the most specific contradiction or relationship in the world",
    engine: "viewer-momentum sequence discovery",
    question: "what changes the viewer's mental model next?",
    strongestImage: input.facts[0] ?? input.sourceMoments[0] ?? "the strongest supplied detail",
    tension: "curiosity versus expectation",
    payoff: "a character-specific consequence or reframe",
    callback: input.memoryContext?.[0] ?? input.trajectory?.[0] ?? "none yet",
    rhythm: ["hit", "variable", "hit", "payoff"],
    avoid: ["fact parade", "generic emotion arc", "invented reality", "subject repetition", "literal viewer questions", "padding", "over-explaining"],
  };
}

export async function authorBrainMomentumV2(input: AuthorBrainTruth): Promise<{ brief: AuthorCreativeBrief; scenes: AuthorScene[]; sequence?: SequencePlay; field: Record<string, unknown> }> {
  const learned = uniq(input.creativeLearningContext, 14);
  const field = {
    identity: uniq(input.subjectTruth?.identityFacts, 8),
    facts: uniq(input.facts, 14),
    moments: uniq(input.sourceMoments, 10),
    memory: uniq(input.memoryContext, 8),
    trajectory: uniq(input.trajectory, 8),
    presence: uniq(input.presenceSummary, 6),
    learning: learned,
    lens: clean(input.lens),
    prompt: clean(input.prompt),
  };

  const result = await localModelGenerate([
    {
      role: "system",
      content: [
        "You are QRE's universal sequence intelligence and final cut author.",
        "Your job is to discover the movie hidden inside the supplied world. Do not summarize it.",
        "Think in viewer-state movement: known -> expected -> gap -> valid surprise or reframe -> new desire -> payoff.",
        "For each cut privately answer: what does the viewer know, what do they expect, what is unresolved, what can change without inventing reality, why does it matter here, what will they want next, and would the sequence weaken if this cut disappeared?",
        "Identity is baseline. Established facts should not consume cuts unless identity itself is the discovery.",
        "A creative cut may come from the relationship between known facts. You may compress, juxtapose, imply, contrast, reframe, escalate, callback, or withhold. You may not invent a new physical event to connect two facts.",
        "Abstract states are not physical actions. If the source says scared, do not invent trembling, hiding, crying, or jumping. If the source says happy, do not invent wagging, smiling, cheering, or leaping. Only use behavior explicitly supported by source evidence.",
        "Questions belong in the hidden viewer state. Do not make the narrator ask literal questions unless question language is explicitly part of the source.",
        "Never turn a provider or service role into a protagonist unless the source makes them significant.",
        "Do not invent named participants, relationships, dialogue, locations, placements, outcomes, or a transformation that is not supported.",
        "The premise must be a compact grounded contradiction, recurrence, relationship, image, or pressure already present in the world.",
        "Search behavior should avoid the obvious generic emotional arc when a more specific grounded operation exists.",
        "Use recurring details as changed-meaning callbacks. The same operation must generalize across people, pets, businesses, travel, products, weddings, horror, and other domains.",
        "One cut is one attention moment. Prefer implication over explanation. Short can be powerful but length should follow the cognitive job.",
        "Output exactly: {\"sequence\":{\"premise\":\"...\",\"baselineFacts\":[\"...\"],\"cuts\":[{\"role\":\"hook|question|pressure|reframe|escalation|discovery|consequence|payoff|callback|continuation\",\"gainKind\":\"new_fact|surprise|question|escalation|reframe|discovery|consequence|callback|payoff\",\"change\":\"short mental-model change\",\"next\":\"short forward pressure\",\"text\":\"finished cut\"}],\"continuation\":\"optional\"},\"scenes\":[\"cut\",\"cut\"]}.",
        "Use 2 to 6 cuts. Never pad.",
        "Finished cuts: no commas, no semicolons, no camera language, no theme explanations, no narrator questions, no paragraph prose.",
        learned.length ? `Accumulated author laws:\n${learned.join("\n")}` : "",
      ].filter(Boolean).join("\n"),
    },
    { role: "user", content: JSON.stringify(field) },
  ], "json");

  debug(result.text);
  const parsed = parseJson<{ sequence?: unknown; scenes?: unknown }>(result.text);
  const rawScenes = parsed?.scenes !== undefined ? normalizeScenes(parsed.scenes) : recoverScenes(result.text);
  const scenes = finalizeScenes(input, rawScenes);
  const sequence = buildSequence(input.subject, parsed?.sequence);
  return { brief: brief(input), scenes, sequence, field };
}
