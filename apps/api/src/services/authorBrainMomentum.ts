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

const ROLES: ViewerAttentionRole[] = [
  "arrival", "hook", "question", "pressure", "reframe", "escalation",
  "discovery", "consequence", "release", "payoff", "callback", "continuation",
];
const GAINS = new Set(["new_fact", "surprise", "question", "escalation", "reframe", "discovery", "consequence", "callback", "payoff"]);
const META = /\b(?:qre|prompt|compiler|cognition|metadata|language model|writing process)\b/i;
const CAMERA = /\b(?:camera|zoom|close-up|cut to|final shot|scene opens|we see)\b/i;
const PROVIDER = /\b(?:groomer|cleaner|technician|barber|stylist|mechanic|plumber|employee|worker|staff|owner|customer|client)\b/i;
const GENERIC = /\b(?:beautiful transformation|magical moment|unforgettable experience|incredible journey|new routine|power of love|symbol of love)\b/i;
const INFERRED_EMOTION = /\b(?:happy|sad|angry|excited|afraid|scared|nervous|joyful|thrilled|content|confident|loving|furious|heartbroken|alarmed|relieved|anxious|delighted|worried|calm|proud|uneasy|gleeful)\b/i;
const NAMED_ENTITY = /\b(?:Mr\.?|Mrs\.?|Ms\.?|Dr\.?)?\s*[A-Z][A-Za-z'’-]+(?:\s+[A-Z][A-Za-z'’-]+)+\b/g;

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const uniq = (values: readonly unknown[] | undefined, limit = 20): string[] => [...new Set((values ?? []).map(clean).filter(Boolean))].slice(0, limit);

function parseJson<T>(raw: string): T | null {
  const text = String(raw ?? "").replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try { return JSON.parse(text) as T; } catch { return null; }
}

function debug(label: string, raw: string): void {
  if (process.env.QRE_AUTHOR_DEBUG_RAW !== "true") return;
  console.log(`\n--- QRE RAW MODEL OUTPUT · ${label} ---\n${raw}\n--- END RAW MODEL OUTPUT ---\n`);
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

function normalizeScenes(raw: unknown): AuthorScene[] {
  if (Array.isArray(raw)) return raw.flatMap((item) => {
    if (typeof item === "string") return [{ text: item, kind: "line" as const }];
    if (item && typeof item === "object" && typeof (item as AuthorScene).text === "string") return [item as AuthorScene];
    return [];
  });
  if (typeof raw === "string") return raw.split(/\n+/).filter(Boolean).map((text) => ({ text: clean(text), kind: "line" as const }));
  if (!raw || typeof raw !== "object") return [];
  const value = raw as { scenes?: unknown; lines?: unknown[]; text?: unknown };
  if (Array.isArray(value.scenes)) return normalizeScenes(value.scenes);
  if (Array.isArray(value.lines)) return normalizeScenes(value.lines);
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

function invalidCut(text: string, input: AuthorBrainTruth): boolean {
  if (!text || text.split(/\s+/).length > 14) return true;
  if (META.test(text) || CAMERA.test(text) || GENERIC.test(text)) return true;
  if (/[;,]/.test(text)) return true;
  if (NAMED_ENTITY.test(text)) {
    const world = worldText(input).toLowerCase();
    for (const match of text.matchAll(NAMED_ENTITY)) {
      if (!world.includes(clean(match[0]).toLowerCase())) return true;
    }
  }
  if (PROVIDER.test(text) && !PROVIDER.test(worldText(input))) return true;
  if (INFERRED_EMOTION.test(text) && !INFERRED_EMOTION.test(worldText(input))) return true;
  return false;
}

function finalizeScenes(input: AuthorBrainTruth, raw: AuthorScene[]): AuthorScene[] {
  const seen = new Set<string>();
  const out: AuthorScene[] = [];
  for (const scene of raw) {
    const text = clean(scene.text);
    const key = text.toLowerCase();
    if (!text || seen.has(key) || invalidCut(text, input)) continue;
    seen.add(key);
    out.push({ text, kind: scene.kind ?? "line" });
  }
  return out.slice(0, 6);
}

function momentumFrom(previous: ViewerMomentum | undefined, change: string, next: string): ViewerMomentum {
  return {
    known: previous?.known ?? [],
    expected: next || undefined,
    activeQuestion: next || undefined,
    curiosityGap: next || undefined,
    predictionShift: change || undefined,
    currentWant: next || undefined,
    unresolved: next || undefined,
    forwardPull: next || undefined,
    payoffDebt: previous?.payoffDebt,
  };
}

function toSequence(subject: string, raw: unknown): SequencePlay | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const value = raw as {
    premise?: unknown;
    baselineFacts?: unknown;
    cuts?: unknown;
    continuation?: unknown;
  };
  if (!Array.isArray(value.cuts)) return undefined;

  const baselineFacts = uniq(value.baselineFacts as unknown[] | undefined, 10);
  let momentum: ViewerMomentum = { known: baselineFacts };

  const cuts: SequenceCut[] = value.cuts.flatMap((item, index) => {
    if (!item || typeof item !== "object") return [];
    const cut = item as Record<string, unknown>;
    const roleValue = clean(cut.role);
    const gainValue = clean(cut.gainKind);
    if (!ROLES.includes(roleValue as ViewerAttentionRole) || !GAINS.has(gainValue)) return [];
    const change = clean(cut.change);
    const next = clean(cut.next);
    const after = momentumFrom(momentum, change, next);
    const output: SequenceCut = {
      id: `cut-${index + 1}`,
      order: index + 1,
      role: roleValue as ViewerAttentionRole,
      gainKind: gainValue as SequenceCut["gainKind"],
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
    };
    momentum = after;
    return [output];
  });

  if (!cuts.length) return undefined;
  return {
    subject,
    premise: clean(value.premise),
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
    avoid: ["fact parade", "generic emotion arc", "invented reality", "subject repetition", "database roles", "padding", "over-explaining"],
  };
}

export async function authorBrainMomentum(input: AuthorBrainTruth): Promise<{ brief: AuthorCreativeBrief; scenes: AuthorScene[]; sequence?: SequencePlay; field: Record<string, unknown> }> {
  const field = {
    identity: uniq(input.subjectTruth?.identityFacts, 8),
    facts: uniq(input.facts, 14),
    moments: uniq(input.sourceMoments, 10),
    memory: uniq(input.memoryContext, 8),
    trajectory: uniq(input.trajectory, 8),
    lens: clean(input.lens),
    prompt: clean(input.prompt),
  };

  const result = await localModelGenerate([
    {
      role: "system",
      content: [
        "You are QRE's universal sequence intelligence and author.",
        "Create the strongest valid movie hidden inside the supplied world.",
        "Do not summarize. Do not write a chronological receipt. Discover a sequence of viewer mental-model changes.",
        "Before every cut privately ask: what does the viewer know; what do they expect; what is unresolved; what is the curiosity gap; what coherent surprise can occur using only known material; why does it matter to this subject; what does the viewer want next; what remains unrevealed; and would removing the cut damage the movie?",
        "A fact earns a cut only when it changes the viewer's knowledge, expectation, question, desire, interpretation, tension, or payoff pressure.",
        "Identity is baseline. Do not waste cuts on established sex, breed, category, or name.",
        "The service world is setting unless a supplied relationship makes it meaningful. Never invent an owner, groomer, employee, customer, or named person.",
        "Reality is sacred. Reorder, compress, juxtapose, escalate, imply, and reframe only from supplied prompt, facts, source moments, memory, trajectory, and presence. Do not invent concrete events, people, placements, dialogue, outcomes, or private emotions.",
        "The lens is STYLE ONLY. Never turn the lens into a fact, premise, event, or sequence step.",
        "Prefer implication. Two words can carry a whole scene when context supports them. Do not chase shortness as a rule.",
        "Every cut must make the next cut more desirable, surprising, coherent, or necessary.",
        "Use anti-crutch thinking. If the obvious arc is fear-to-happy, search for a more specific contradiction or reframe.",
        "Output only this compact JSON shape. Do not add fields. {\"sequence\":{\"premise\":\"...\",\"baselineFacts\":[\"...\"],\"cuts\":[{\"role\":\"hook|question|pressure|reframe|escalation|discovery|consequence|payoff|callback|continuation\",\"gainKind\":\"new_fact|surprise|question|escalation|reframe|discovery|consequence|callback|payoff\",\"change\":\"what changed in the viewer model\",\"next\":\"why the next cut is wanted\",\"text\":\"finished cut\"}],\"continuation\":\"...\"},\"scenes\":[\"finished cut\",\"finished cut\"]}",
        "The sequence can be 2 to 6 cuts. Use fewer when the material is sparse. Never pad.",
        "Cut text: no commas, no semicolons, no camera language, no explanatory theme statements, no paragraph prose.",
      ].join(" "),
    },
    { role: "user", content: JSON.stringify(field) },
  ], "json");

  debug("AUTHOR-BRAIN-MOMENTUM", result.text);
  const parsed = parseJson<{ sequence?: unknown; scenes?: unknown }>(result.text);
  const rawScenes = parsed?.scenes !== undefined ? normalizeScenes(parsed.scenes) : [];
  const scenes = finalizeScenes(input, rawScenes.length ? rawScenes : recoverScenes(result.text));
  const sequence = toSequence(input.subject, parsed?.sequence);
  return { brief: brief(input), scenes, sequence, field };
}
