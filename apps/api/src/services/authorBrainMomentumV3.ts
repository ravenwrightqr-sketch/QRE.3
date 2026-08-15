/**
 * QRE UNIVERSAL AUTHOR BRAIN · MOMENTUM V3 · LIVING INTELLIGENCE CORE
 *
 * CANONICAL EXPANSION SURFACE.
 * Expand or tune this brain only when the improvement generalizes across
 * domains. Never turn a benchmark trick into permanent subject-specific code.
 *
 * Primary law:
 * A source state is evidence about the world. It is NOT a story instruction.
 * In particular, emotion labels must not automatically become the plot arc.
 * The brain must discover the most specific contradiction, implication,
 * recurrence, image, status shift, callback, or consequence available in the
 * supplied reality.
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
const GENERIC = /\b(?:beautiful transformation|magical moment|unforgettable experience|incredible journey|new routine|power of love|symbol of love|quirky personality|grooming journey|positive transformation|emotional journey)\b/i;
const LITERAL_QUESTION = /^(?:what|why|how|when|where|who|will|did|is|can|could|should)\b[^.?!]*\?$/i;
const PROVIDER_WORD = /\b(?:groomer|cleaner|technician|barber|stylist|mechanic|plumber|employee|worker|staff|owner|customer|client)\b/i;
const ACTION_WORD = /\b(?:trembles|trembling|shakes|shaking|leaps|jumped|jumps|hides|hiding|cries|crying|smiles|smiling|wags|wagging|runs|running|grabs|grabbed|throws|threw|places|placed|removes|removed|approaches|approached|walks|walked|laughs|laughed|chews|chewed|licks|licked|bites|bit|drops|dropped)\b/i;
const EMOTION_WORD = /\b(?:happy|sad|angry|excited|afraid|scared|nervous|joyful|thrilled|content|confident|loving|furious|heartbroken|alarmed|relieved|anxious|delighted|worried|calm|proud|uneasy|gleeful|happiness)\b/i;
const STOP = new Set("the a an and or but for to of in on at with from this that is are was were be been being as into by through after before then now very just still again his her their its it's he she they them you we me my our your what when where why how one two three four five six seven eight nine ten".split(/\s+/));

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const uniq = (values: readonly unknown[] | undefined, limit = 20): string[] => [...new Set((values ?? []).map(clean).filter(Boolean))].slice(0, limit);

function parseJson<T>(raw: string): T | null {
  const text = String(raw ?? "").replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try { return JSON.parse(text) as T; } catch { return null; }
}

function debug(raw: string): void {
  if (process.env.QRE_AUTHOR_DEBUG_RAW !== "true") return;
  console.log(`\n--- QRE RAW MODEL OUTPUT · AUTHOR-BRAIN-MOMENTUM-V3 ---\n${raw}\n--- END RAW MODEL OUTPUT ---\n`);
}

function worldText(input: AuthorBrainTruth): string {
  return [
    input.prompt,
    input.subject,
    input.place,
    ...(input.subjectTruth?.identityFacts ?? []),
    ...input.facts,
    ...input.sourceMoments,
    ...(input.memoryContext ?? []),
    ...(input.trajectory ?? []),
    ...(input.presenceSummary ?? []),
  ].filter(Boolean).join(" ");
}

function sourceFragments(input: AuthorBrainTruth): string[] {
  return [
    ...(input.subjectTruth?.identityFacts ?? []),
    ...input.facts,
    ...input.sourceMoments,
    ...(input.memoryContext ?? []),
    ...(input.trajectory ?? []),
    ...(input.presenceSummary ?? []),
  ].map(clean).filter(Boolean);
}

function groundedEnough(text: string, input: AuthorBrainTruth): boolean {
  const words = text.toLowerCase().split(/[^a-z0-9'-]+/i).filter((x) => x.length >= 4 && !STOP.has(x));
  if (!words.length) return true;
  const sources = sourceFragments(input).map((x) => x.toLowerCase());
  const hits = words.filter((word) => sources.some((source) => source.includes(word)));
  return hits.length >= Math.max(1, Math.ceil(words.length * 0.25));
}

function unsupportedProvider(text: string, input: AuthorBrainTruth): boolean {
  return PROVIDER_WORD.test(text) && !PROVIDER_WORD.test(worldText(input));
}

function unsupportedAction(text: string, input: AuthorBrainTruth): boolean {
  return ACTION_WORD.test(text) && !ACTION_WORD.test(worldText(input));
}

function unsupportedEmotion(text: string, input: AuthorBrainTruth): boolean {
  return EMOTION_WORD.test(text) && !EMOTION_WORD.test(worldText(input));
}

function validCut(text: string, input: AuthorBrainTruth): boolean {
  if (!text || text.split(/\s+/).length > 14) return false;
  if (META.test(text) || CAMERA.test(text) || GENERIC.test(text)) return false;
  if (LITERAL_QUESTION.test(text)) return false;
  if (unsupportedProvider(text, input) || unsupportedAction(text, input) || unsupportedEmotion(text, input)) return false;
  if (text.split(/\s+/).length > 3 && !groundedEnough(text, input)) return false;
  return true;
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

function recoverTexts(raw: string): string[] {
  const out: string[] = [];
  const pattern = /"text"\s*:\s*"((?:\\.|[^"\\])*)"/g;
  for (const match of raw.matchAll(pattern)) {
    try { out.push(clean(JSON.parse(`"${match[1]}"`))); } catch { /* ignore */ }
  }
  return out;
}

function buildSequence(subject: string, raw: unknown): SequencePlay | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const value = raw as { premise?: unknown; baselineFacts?: unknown; cuts?: unknown; continuation?: unknown };
  if (!Array.isArray(value.cuts)) return undefined;
  const baselineFacts = uniq(value.baselineFacts as unknown[] | undefined, 10);
  let momentum: ViewerMomentum = { known: baselineFacts };
  const cuts: SequenceCut[] = [];

  for (const [index, item] of value.cuts.entries()) {
    if (!item || typeof item !== "object") continue;
    const c = item as Record<string, unknown>;
    const role = clean(c.role);
    const gain = clean(c.gainKind);
    const text = clean(c.text);
    if (!ROLES.includes(role as ViewerAttentionRole) || !GAINS.has(gain)) continue;
    const change = clean(c.change);
    const next = clean(c.next);
    const after: ViewerMomentum = {
      known: momentum.known,
      expected: next || undefined,
      activeQuestion: gain === "question" ? change : momentum.activeQuestion,
      curiosityGap: next || momentum.curiosityGap,
      predictionShift: change || undefined,
      currentWant: next || undefined,
      unresolved: next || change || undefined,
      forwardPull: next || undefined,
      payoffDebt: momentum.payoffDebt,
    };
    cuts.push({
      id: `cut-${index + 1}`,
      order: index + 1,
      role: role as ViewerAttentionRole,
      gainKind: gain as SequenceCut["gainKind"],
      sourceIds: [],
      informationGain: change,
      attentionDelta: next,
      viewerBefore: {
        known: momentum.known,
        expected: momentum.expected,
        unresolved: momentum.unresolved,
        currentWant: momentum.currentWant,
        recentChange: momentum.predictionShift,
      } satisfies ViewerState,
      viewerAfter: {
        known: after.known,
        expected: after.expected,
        unresolved: after.unresolved,
        currentWant: after.currentWant,
        recentChange: after.predictionShift,
      } satisfies ViewerState,
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

function scenesFromSequence(sequence: SequencePlay | undefined, input: AuthorBrainTruth): AuthorScene[] {
  if (!sequence) return [];
  return sequence.cuts
    .map((cut) => clean((cut as SequenceCut & { text?: string }).text ?? ""))
    .filter(Boolean)
    .filter((text) => validCut(text, input))
    .map((text) => ({ text, kind: "line" as const }));
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
    avoid: ["fact parade", "generic emotion arc", "invented reality", "literal viewer questions", "service-provider protagonist", "padding", "over-explaining"],
  };
}

export async function authorBrainMomentumV3(input: AuthorBrainTruth): Promise<{ brief: AuthorCreativeBrief; scenes: AuthorScene[]; sequence?: SequencePlay; field: Record<string, unknown> }> {
  const learned = uniq(input.creativeLearningContext, 18);
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
        "You are QRE's universal creative author. Discover the strongest short movie hidden inside the supplied world.",
        "Do not summarize the world. Do not treat the source's emotional labels as a required emotional arc.",
        "Your first job is to find the most specific interesting relationship already present: contradiction, recurrence, implication, status shift, image, mismatch, callback, consequence, or withheld meaning.",
        "Then make a sequence where each cut changes the viewer's mental model enough to create forward pull.",
        "Ask privately before each cut: what do they know, what do they expect, what is unresolved, what can change without inventing reality, why is that change specific to this world, what do they want next, and what breaks if this cut disappears?",
        "Emotion is evidence, not instruction. Do not automatically build fear -> relief, sadness -> happiness, or any other generic emotional arc unless the source itself makes that arc the strongest specific movie.",
        "Identity and stable facts are baseline. Do not spend cuts reintroducing the subject or listing traits.",
        "Use relationships among supplied facts to create new implication. Do not invent physical events, physical behavior, dialogue, participants, roles, relationships, outcomes, or locations.",
        "A state like scared does not authorize trembling, hiding, crying, jumping, or any other physical performance. A state like happy does not authorize wagging, smiling, cheering, or leaping. Use only supported behavior.",
        "Questions stay inside the viewer-state model. Do not make the narrator ask literal questions.",
        "The provider or service is usually stage context. Keep the supplied subject as the temporary star unless the provider is explicitly significant.",
        "Prefer tiny implication when it carries a large amount of context. Length follows the creative job.",
        "Do not explain the joke. Let the viewer close the gap.",
        "Use recurrence only when recurrence is supported by memory, trajectory, or multiple supplied mentions. When recurrence is supported, compress it rather than explaining it.",
        "The sequence may be 2 to 6 cuts. Stop as soon as the payoff earns itself.",
        "Output only JSON with this exact shape: {\"sequence\":{\"premise\":\"grounded relationship or pressure\",\"baselineFacts\":[\"...\"],\"cuts\":[{\"role\":\"hook|question|pressure|reframe|escalation|discovery|consequence|payoff|callback|continuation\",\"gainKind\":\"new_fact|surprise|question|escalation|reframe|discovery|consequence|callback|payoff\",\"change\":\"short viewer-model change\",\"next\":\"short forward pressure\",\"text\":\"one finished cut\"}],\"continuation\":\"optional\"}}.",
      ].join(" "),
    },
    { role: "user", content: JSON.stringify(field) },
  ], "json");

  debug(result.text);
  const parsed = parseJson<{ sequence?: unknown; scenes?: unknown }>(result.text);
  const sequence = buildSequence(input.subject, parsed?.sequence);
  const sequenceScenes = scenesFromSequence(sequence, input);
  const explicitScenes = normalizeScenes(parsed?.scenes);
  const recoveredScenes = recoverTexts(result.text).map((text) => ({ text, kind: "line" as const }));
  const scenes = [...sequenceScenes, ...explicitScenes, ...recoveredScenes]
    .filter((scene, index, all) => all.findIndex((x) => x.text.toLowerCase() === scene.text.toLowerCase()) === index)
    .filter((scene) => validCut(scene.text, input))
    .slice(0, 6);

  return { brief: brief(input), scenes, sequence, field };
}
