/**
 * QRE UNIVERSAL AUTHOR BRAIN · CANONICAL
 *
 * LIVING INTELLIGENCE CORE.
 * Expand or tune this file when general creative laws are discovered.
 * Do not freeze weaker behavior for compatibility. Generalize lessons across
 * domains instead of adding benchmark-specific hacks.
 *
 * Primary objective:
 * Given a grounded world and the viewer's current mental model, discover the
 * strongest valid sequence of attention-changing cuts. The mouth is the final
 * realization layer. The world remains the source of truth.
 *
 * Important general laws:
 * - A source state is evidence, not a mandatory story arc.
 * - Identity is baseline unless identity itself is the discovery.
 * - A cut must change the viewer's model, desire, expectation, or meaning.
 * - Relations between known facts may create fresh implication without
 *   inventing a physical event.
 * - Predicate-to-attitude compression may turn supplied preferences, status,
 *   recurrence, history, or contradiction into a sharp line.
 * - The same creative operation must work for pets, people, businesses,
 *   weddings, travel, products, horror, services, memories, and organizations.
 * - Questions belong in hidden cognition, not in the narrator's mouth.
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
const GAIN_ALIASES: Record<string, SequenceCut["gainKind"]> = {
  resolution: "payoff",
  reveal: "discovery",
  unrevealed_information: "discovery",
  hidden_information: "discovery",
  turn: "reframe",
  reversal: "reframe",
};
const META = /\b(?:qre|prompt|compiler|cognition|metadata|language model|writing process)\b/i;
const CAMERA = /\b(?:camera|zoom|close-up|cut to|final shot|scene opens|we see|fade to)\b/i;
const GENERIC = /\b(?:beautiful transformation|magical moment|unforgettable experience|incredible journey|new routine|power of love|symbol of love|quirky personality|grooming journey|positive transformation|emotional journey)\b/i;
const ANY_QUESTION = /\?/;
const PROVIDER = /\b(?:groomer|cleaner|technician|barber|stylist|mechanic|plumber|employee|worker|staff|owner|customer|client)\b/i;
const UNSUPPORTED_ACTION = /\b(?:trembles|trembling|shakes|shaking|leaps|jumped|jumps|hides|hiding|cries|crying|smiles|smiling|wags|wagging|runs|running|grabs|grabbed|throws|threw|places|placed|removes|removed|approaches|approached|walks|walked|laughs|laughed|chews|chewed|licks|licked|bites|bit|drops|dropped|widens|widened|pulls|pulled|picks|picked)\b/i;
const EMOTION = /\b(?:happy|sad|angry|excited|afraid|scared|nervous|joyful|thrilled|content|confident|loving|furious|heartbroken|alarmed|relieved|anxious|delighted|worried|calm|proud|uneasy|gleeful|happiness)\b/i;
const STOP = new Set("the a an and or but for to of in on at with from this that is are was were be been being as into by through after before then now very just still again his her their its it's he she they them you we me my our your what when where why how one two three four five six seven eight nine ten".split(/\s+/));

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const uniq = (values: readonly unknown[] | undefined, limit = 20): string[] => [...new Set((values ?? []).map(clean).filter(Boolean))].slice(0, limit);

function canonicalGain(value: unknown): string {
  const normalized = clean(value).toLowerCase();
  return GAIN_ALIASES[normalized] ?? normalized;
}

function parseJson<T>(raw: string): T | null {
  const text = String(raw ?? "").replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try { return JSON.parse(text) as T; } catch { return null; }
}

function debug(raw: string): void {
  if (process.env.QRE_AUTHOR_DEBUG_RAW !== "true") return;
  console.log(`\n--- QRE RAW MODEL OUTPUT · AUTHOR-BRAIN-UNIVERSAL ---\n${raw}\n--- END RAW MODEL OUTPUT ---\n`);
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

function sourceBackedQuestion(text: string, input: AuthorBrainTruth): boolean {
  return sourceFragments(input).some((fragment) => fragment.includes(text));
}

function validCut(text: string, input: AuthorBrainTruth): boolean {
  if (!text || text.split(/\s+/).length > 14) return false;
  if (META.test(text) || CAMERA.test(text) || GENERIC.test(text)) return false;
  if (ANY_QUESTION.test(text) && !sourceBackedQuestion(text, input)) return false;
  if (PROVIDER.test(text) && !PROVIDER.test(worldText(input))) return false;
  if (UNSUPPORTED_ACTION.test(text) && !UNSUPPORTED_ACTION.test(worldText(input))) return false;
  if (EMOTION.test(text) && !EMOTION.test(worldText(input))) return false;
  if (text.split(/\s+/).length > 3 && !groundedEnough(text, input)) return false;
  return true;
}

function recoveredTexts(raw: string): string[] {
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
    const gain = canonicalGain(c.gainKind);
    if (!ROLES.includes(role as ViewerAttentionRole) || !GAINS.has(gain)) continue;

    const text = clean(c.text);
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
      ...(text ? { text } : {}),
    } as SequenceCut & { text?: string });

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

function scenesFromSequence(sequence: SequencePlay | undefined, input: AuthorBrainTruth): { scenes: AuthorScene[]; attempted: number; rejected: number } {
  if (!sequence) return { scenes: [], attempted: 0, rejected: 0 };
  const attempted = sequence.cuts.length;
  const scenes = sequence.cuts
    .map((cut) => clean((cut as SequenceCut & { text?: string }).text ?? ""))
    .filter(Boolean)
    .filter((text) => validCut(text, input))
    .map((text) => ({ text, kind: "line" as const }));
  return { scenes, attempted, rejected: attempted - scenes.length };
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

export async function authorBrainUniversal(input: AuthorBrainTruth): Promise<{ brief: AuthorCreativeBrief; scenes: AuthorScene[]; sequence?: SequencePlay; field: Record<string, unknown>; diagnostics: Record<string, unknown> }> {
  const learning = uniq(input.creativeLearningContext, 20);
  const field = {
    identity: uniq(input.subjectTruth?.identityFacts, 8),
    facts: uniq(input.facts, 16),
    moments: uniq(input.sourceMoments, 12),
    memory: uniq(input.memoryContext, 10),
    trajectory: uniq(input.trajectory, 10),
    presence: uniq(input.presenceSummary, 8),
    learning,
    lens: clean(input.lens),
    prompt: clean(input.prompt),
  };

  const result = await localModelGenerate([
    {
      role: "system",
      content: [
        "You are QRE's universal creative author.",
        "Discover the strongest short movie hidden inside the supplied world. Do not summarize it.",
        "A source state is evidence, not a story instruction. Emotion labels do not automatically become the plot arc.",
        "First find the strongest specific relationship already present: contradiction, recurrence, implication, status shift, image, mismatch, callback, consequence, or withheld meaning.",
        "Then make each cut change the viewer's mental model enough to create forward pull.",
        "Privately test: what does the viewer know, what do they expect, what is unresolved, what can change without inventing reality, why is the change specific here, what will they want next, and what breaks if the cut disappears?",
        "Identity and stable facts are baseline. Do not spend cuts reintroducing the subject or listing traits.",
        "Use predicate-to-attitude compression: supplied dislike, love, status, history, recurrence, or contradiction may become a sharp line without inventing a physical event.",
        "A creative implication can emerge from the relationship between supplied facts. Reframe, juxtapose, contrast, compress, withhold, escalate, and callback without inventing events.",
        "Do not invent physical behavior, dialogue, participants, roles, relationships, locations, placements, or outcomes.",
        "A source state like scared does not authorize trembling, hiding, crying, jumping, or similar physical performance. A source state like happy does not authorize wagging, smiling, cheering, or leaping.",
        "Questions stay inside hidden viewer cognition. Never make the narrator ask literal questions unless supplied.",
        "The provider or service is usually stage context. Keep the supplied subject as the temporary star unless the provider is explicitly significant.",
        "Do not explain the joke. Let the viewer close the gap.",
        "Short is not the goal. Compressed impact is the goal. Use as few words as the cognitive job allows.",
        "Use recurrence only when supported by memory, trajectory, or repeated supplied evidence.",
        "Sparse-world rule: creative latitude applies to interpretation and juxtaposition, not to evidence. The less source evidence available, the smaller the invented-world surface must become.",
        "If evidence is sparse, prefer a compact implication, contrast, or image over adding hidden history, new people, objects, or events.",
        "Optional relation candidates are search hypotheses. Use, alter, combine, or reject them. Never promote them to canonical facts.",
        "Stop when the payoff earns itself. The sequence can be 2 to 6 cuts.",
        "Output only JSON: {\"sequence\":{\"premise\":\"grounded relationship\",\"baselineFacts\":[\"...\"],\"cuts\":[{\"role\":\"hook|question|pressure|reframe|escalation|discovery|consequence|payoff|callback|continuation\",\"gainKind\":\"new_fact|surprise|question|escalation|reframe|discovery|consequence|callback|payoff\",\"change\":\"short mental-model change\",\"next\":\"short forward pressure\",\"text\":\"one finished cut\"}],\"continuation\":\"optional\"}}.",
      ].join(" "),
    },
    { role: "user", content: JSON.stringify(field) },
  ], "json");

  debug(result.text);
  const parsed = parseJson<{ sequence?: unknown }>(result.text);
  const sequence = buildSequence(input.subject, parsed?.sequence);
  const sequenceResult = scenesFromSequence(sequence, input);
  const recovered = recoveredTexts(result.text).map((text) => ({ text, kind: "line" as const }));
  const recoveredValid = recovered.filter((scene) => validCut(scene.text, input));
  const scenes = [...sequenceResult.scenes, ...recoveredValid]
    .filter((scene, index, all) => all.findIndex((candidate) => candidate.text.toLowerCase() === scene.text.toLowerCase()) === index)
    .slice(0, 6);

  return {
    brief: brief(input),
    scenes,
    sequence,
    field,
    diagnostics: {
      sequenceCutsAttempted: sequenceResult.attempted,
      sequenceCutsRejected: sequenceResult.rejected,
      recoveredTextsAttempted: recovered.length,
      recoveredTextsRejected: recovered.length - recoveredValid.length,
      finalScenes: scenes.length,
    },
  };
}
