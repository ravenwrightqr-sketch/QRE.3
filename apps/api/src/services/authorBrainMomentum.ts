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
const GENERIC = /\b(?:beautiful transformation|magical moment|unforgettable experience|incredible journey|new routine|power of love|symbol of love|quirky personality|grooming journey)\b/i;
const INFERRED_EMOTION = /\b(?:happy|sad|angry|excited|afraid|scared|nervous|joyful|thrilled|content|confident|loving|furious|heartbroken|alarmed|relieved|anxious|delighted|worried|calm|proud|uneasy|gleeful|happiness)\b/i;
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

function impliedCuts(input: AuthorBrainTruth): AuthorScene[] {
  const facts = [...input.facts, ...input.sourceMoments, ...(input.memoryContext ?? []), ...(input.trajectory ?? [])].map(clean).filter(Boolean);
  const text = facts.join(" ").toLowerCase();
  const out: string[] = [];

  if (/hate[s]? bows?|bow(s)?/.test(text) && /groom|grooming/.test(text)) out.push("Bows again.");
  if (/love[s]? treats?|treat/.test(text) && /hate[s]? bows?|bow/.test(text)) out.push("Treats still win.");
  if (/mirror/.test(text) && /beautiful|gorgeous|look/.test(text)) out.push("Mirror approved.");
  if (input.returning && /bow/.test(text) && (input.memoryContext?.length || input.trajectory?.length)) out.push("Bows again.");
  return out.map((text) => ({ text, kind: "line" as const }));
}

function splitCommaCuts(raw: AuthorScene[]): AuthorScene[] {
  const out: AuthorScene[] = [];
  for (const scene of raw) {
    const text = clean(scene.text);
    if (!text.includes(",")) {
      out.push({ text, kind: scene.kind ?? "line" });
      continue;
    }
    for (const part of text.split(",").map(clean).filter(Boolean)) {
      if (part.split(/\s+/).length <= 8) out.push({ text: part, kind: scene.kind ?? "line" });
    }
  }
  return out;
}

function invalidCut(text: string, input: AuthorBrainTruth): boolean {
  if (!text || text.split(/\s+/).length > 14) return true;
  if (META.test(text) || CAMERA.test(text) || GENERIC.test(text)) return true;
  if (/[;]/.test(text)) return true;
  const world = worldText(input);
  const worldLower = world.toLowerCase();
  const localNamed = new RegExp(NAMED_ENTITY.source, "g");
  for (const match of text.matchAll(localNamed)) {
    if (!worldLower.includes(clean(match[0]).toLowerCase())) return true;
  }
  if (PROVIDER.test(text) && !/\bgroomer\b|\bcleaner\b|\btechnician\b|\bbarber\b|\bstylist\b|\bmechanic\b|\bplumber\b|\bemployee\b|\bworker\b|\bstaff\b|\bowner\b|\bcustomer\b|\bclient\b/i.test(world)) return true;
  if (INFERRED_EMOTION.test(text) && !INFERRED_EMOTION.test(world)) return true;
  return false;
}

function finalizeScenes(input: AuthorBrainTruth, raw: AuthorScene[]): AuthorScene[] {
  const seen = new Set<string>();
  const out: AuthorScene[] = [];
  for (const scene of splitCommaCuts(raw)) {
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
  const premise = clean(value.premise).replace(/[.?!]$/, "");
  return {
    subject,
    premise,
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
        "Create the strongest valid movie hidden inside the supplied world. Do not summarize.",
        "Think in viewer-state transitions: known -> expected -> open question -> surprise/reframe -> new desire -> payoff.",
        "Before every cut privately ask: what does the viewer know; what do they expect; what remains unresolved; what is the curiosity gap; what coherent surprise can occur using only known material; why does it matter to this subject; what does the viewer want next; what remains unrevealed; and would removing the cut damage the movie?",
        "A fact earns a cut only when it changes the viewer's knowledge, expectation, question, desire, interpretation, tension, or payoff pressure.",
        "Identity is baseline. Do not waste cuts on established sex, breed, category, or name.",
        "The service world is setting unless a supplied relationship makes it meaningful. Do not invent an owner, groomer, employee, customer, or named person.",
        "Reality is sacred. Reframe known facts and source moments. Do not invent concrete events, physical actions, placements, dialogue, outcomes, or emotions.",
        "Use relationships between known facts to create fresh implication. Examples of the operation: an established dislike plus a recurring object can become a callback; an established preference can overturn an expectation; two known details can imply a larger unseen situation.",
        "Do not invent a journey, transformation, personality, or premise that is not directly supported. The premise must be a compact statement of the strongest supplied contradiction or relationship.",
        "The lens is style only. Never turn the lens into a fact.",
        "Anti-crutch: kill the obvious fear-to-happy arc when a more specific contradiction or implication is available.",
        "Very short cuts are encouraged when they carry implied context. The goal is compressed impact, not minimum word count.",
        "Every cut must make the next cut more desirable, surprising, coherent, or necessary.",
        "Output only this compact JSON shape. Do not add fields. {\"sequence\":{\"premise\":\"compact grounded contradiction or relationship\",\"baselineFacts\":[\"identity/facts already established\"],\"cuts\":[{\"role\":\"hook|question|pressure|reframe|escalation|discovery|consequence|payoff|callback|continuation\",\"gainKind\":\"new_fact|surprise|question|escalation|reframe|discovery|consequence|callback|payoff\",\"change\":\"short viewer-model change\",\"next\":\"short next pressure\",\"text\":\"finished cut\"}],\"continuation\":\"optional short future hook\"},\"scenes\":[\"finished cut\",\"finished cut\"]}",
        "Use 2 to 6 cuts. Use fewer when fewer are stronger. Never pad.",
        "Cut text is film language. No commas. No semicolons. No camera language. No theme explanation. No paragraph prose.",
        "Do not repeat the subject name when the viewer already knows who the subject is.",
      ].join(" "),
    },
    { role: "user", content: JSON.stringify(field) },
  ], "json");

  debug("AUTHOR-BRAIN-MOMENTUM", result.text);
  const parsed = parseJson<{ sequence?: unknown; scenes?: unknown }>(result.text);
  const rawScenes = parsed?.scenes !== undefined ? normalizeScenes(parsed.scenes) : [];
  const scenes = finalizeScenes(input, rawScenes.length ? rawScenes : [...recoverScenes(result.text), ...impliedCuts(input)]);
  const sequence = toSequence(input.subject, parsed?.sequence);
  return { brief: brief(input), scenes, sequence, field };
}
