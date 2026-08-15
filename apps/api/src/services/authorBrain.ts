import type { AuthorBrainTruth, AuthorCreativeBrief, AuthorScene, SubjectTruth } from "@qre/contracts";
import { localModelGenerate } from "./localModelRuntime.js";

const GENERIC = [/still here/i,/something changes/i,/then it shifts/i,/see you next time/i,/beautiful transformation/i,/magical moment/i,/unforgettable experience/i,/incredible journey/i,/new routine/i,/power of (?:love|affection|friendship)/i,/symbol of (?:love|bravery|affection|friendship)/i,/eyes sparkle/i,/heart softens/i,/tiny paws/i];
const META = /\b(ai|qre|prompt|compiler|cognition|metadata|model|instruction|writing process)\b/i;
const PROVIDER = /\b(?:groomer|groomer's|groomer’s|cleaner|cleaner's|cleaner’s|technician|barber|stylist|mechanic|plumber|employee|worker|staff|owner)\b/i;
const DIALOGUE = /[“”]/;
const CAMERA = /\b(?:camera|zoom|close-up|cut to|final shot|screen|scene opens|we see)\b/i;
const MULTI_CUT_PUNCT = /[,;]/;
const PRONOUN = /\b(he|him|his|she|her|hers|they|them|their|themself|themselves)\b/i;

const clean = (value: unknown) => String(value ?? "").replace(/\s+/g, " ").trim();
const uniq = (values: readonly unknown[] | undefined, limit = 20) => [...new Set((values ?? []).map(clean).filter(Boolean))].slice(0, limit);

function parseJson<T>(text: string): T | null {
  const value = String(text ?? "").replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try { return JSON.parse(value) as T; } catch { return null; }
}

function debug(label: string, text: string): void {
  if (process.env.QRE_AUTHOR_DEBUG_RAW !== "true") return;
  console.log(`\n--- QRE RAW MODEL OUTPUT · ${label} ---\n${text}\n--- END RAW MODEL OUTPUT ---\n`);
}

function recoverPartialScenes(raw: string): AuthorScene[] {
  const out: AuthorScene[] = [];
  const objectPattern = /"text"\s*:\s*"((?:\\.|[^"\\])*)"/g;
  for (const match of raw.matchAll(objectPattern)) {
    try { out.push({ text: clean(JSON.parse(`"${match[1]}"`)), kind: "line" }); } catch { /* ignore */ }
  }
  if (out.length) return out;
  const strings = raw.match(/"([^"]{2,120})"/g)?.map((x) => x.slice(1, -1)) ?? [];
  return strings.filter((x) => !/^scenes?$|^text$|^line$/i.test(x)).slice(0, 8).map((text) => ({ text: clean(text), kind: "line" }));
}

function normalizeScenes(raw: unknown): AuthorScene[] {
  if (Array.isArray(raw)) return raw.map((item) => typeof item === "string" ? ({ text: item, kind: "line" as const }) : item as AuthorScene);
  if (!raw || typeof raw !== "object") return [];
  const value = raw as { scenes?: unknown; lines?: unknown[]; text?: unknown };
  if (Array.isArray(value.scenes)) return normalizeScenes(value.scenes);
  if (Array.isArray(value.lines)) return value.lines.map((line) => ({ text: clean(line), kind: "line" as const }));
  if (typeof value.text === "string") return value.text.split(/\n+/).filter(Boolean).map((line) => ({ text: clean(line), kind: "line" as const }));
  return [];
}

function pronounsAllowed(text: string, truth?: SubjectTruth): boolean {
  if (!PRONOUN.test(text)) return true;
  return Boolean(truth?.pronouns && ["explicit","memory","runtime"].includes(truth.provenance));
}

function invalid(text: string, input: AuthorBrainTruth): boolean {
  if (!text || META.test(text) || GENERIC.some((pattern) => pattern.test(text))) return true;
  if (CAMERA.test(text) || DIALOGUE.test(text)) return true;
  if (MULTI_CUT_PUNCT.test(text)) return true;
  if (!pronounsAllowed(text, input.subjectTruth)) return true;
  const service = /\b(service|groom|grooming|clean|cleaning|housekeeping|pool|maintenance|barber|salon|repair|mechanic|client|customer)\b/i.test(`${input.prompt} ${input.lens ?? ""}`);
  if (service && PROVIDER.test(text) && !input.facts.concat(input.sourceMoments).some((fact) => PROVIDER.test(fact))) return true;
  return false;
}

function finalizeScenes(input: AuthorBrainTruth, scenes: AuthorScene[], target: number): AuthorScene[] {
  const out: AuthorScene[] = [];
  const seen = new Set<string>();
  for (const scene of scenes) {
    const text = clean(scene.text);
    if (!text || text.split(/\s+/).length > 14 || invalid(text, input)) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ text, kind: scene.kind ?? "line" });
  }
  return out.slice(0, target);
}

function compactPlan(input: AuthorBrainTruth) {
  const plan = input.cognitivePlan;
  if (!plan) return {};
  return {
    direction: plan.direction ?? null,
    purpose: clean(plan.purpose),
    why: uniq(plan.whyInteract, 4),
    emotion: uniq(plan.emotionalIntent, 4),
    story: uniq(plan.storyStructure, 5),
    memory: uniq(plan.memoryModel, 4),
    discovery: uniq(plan.discoveryModel, 4),
    possibilities: uniq(plan.creativePossibilities, 8),
    future: uniq(plan.futureEvolution, 4),
  };
}

function fallbackBrief(input: AuthorBrainTruth): AuthorCreativeBrief {
  const plan = input.cognitivePlan;
  return {
    angle: clean(plan?.creativePossibilities?.[0]) || "the subject's most specific contradiction or relationship",
    engine: clean(plan?.purpose) || "character lens over supplied reality",
    question: clean(plan?.whyInteract?.[0]) || "what is unexpectedly interesting here?",
    strongestImage: input.facts[0] ?? input.sourceMoments[0] ?? "the strongest supplied detail",
    tension: clean(plan?.emotionalIntent?.[0]) || "something the subject makes personal",
    payoff: clean(plan?.futureEvolution?.[0]) || "a character-specific consequence or reframe",
    callback: input.memoryContext?.[0] ?? input.trajectory?.[0] ?? "none yet",
    rhythm: /living memory|chapter/i.test(input.prompt) ? ["hit","short","short","hit"] : ["hit","short","standard","short","hit"],
    avoid: ["literal fact list","generic emotional journey","invented concrete events","provider as protagonist","paragraph prose"],
  };
}

export async function authorBrain(input: AuthorBrainTruth, options: { fast?: boolean } = {}): Promise<{ brief: AuthorCreativeBrief; scenes: AuthorScene[]; field: Record<string, unknown> }> {
  const target = /living memory|chapter/i.test(input.prompt) ? 4 : 5;
  const brief = fallbackBrief(input);
  const field = {
    truth: input.subjectTruth ?? null,
    current: uniq([...input.facts, ...input.sourceMoments], 12),
    history: uniq([...(input.memoryContext ?? []), ...(input.trajectory ?? [])], 8),
    learning: uniq(input.creativeLearningContext, 6),
    returning: input.returning ?? false,
    visit: input.visitNumber ?? null,
    presence: uniq(input.presenceSummary, 5),
    plan: compactPlan(input),
  };

  const result = await localModelGenerate([
    {
      role: "system",
      content: [
        "You are QRE's universal author.",
        "Think deeply but output only the finished cuts. Privately compete between interpretations. Kill the obvious, generic, sentimental, repetitive, or fact-list version. Find the most character-specific movie hidden in the supplied reality and history.",
        "The subject is temporarily the star. Service, business, job, event, place, and object are stage and raw material unless explicitly established as characters.",
        "Reality is sacred. Explicit subject truth controls pronouns and identity. Do not invent people, relationships, dialogue, locations, actions, timestamps, object placement, weather, outcomes, or provider behavior.",
        "ONE LINE = ONE ATTENTION MOMENT. Every cut should make the next cut desirable.",
        "Compression means removing explanation, not making every line tiny. Use 2–4 words when that hits harder. Use longer lines only when they add real dramatic information.",
        "Never use commas or semicolons in scene text. A colon is allowed for a supplied factual time such as 9:04 AM.",
        "Do not repeat the subject name mechanically. Do not announce themes. Do not narrate multiple actions inside one cut.",
        input.returning ? "Returning chapter: evolve history. A callback must change meaning, stakes, or relationship." : "",
        `Return EXACTLY ${target} scenes. JSON ONLY: {"scenes":[{"text":"...","kind":"line"}]}`,
      ].join(" "),
    },
    { role: "user", content: JSON.stringify({ prompt: input.prompt, lens: input.lens ?? "", subject: input.subject ?? "", place: input.place ?? "", field }) },
  ], "json");

  debug("AUTHOR-BRAIN", result.text);
  const parsed = parseJson<{ scenes?: unknown }>(result.text);
  const raw = parsed?.scenes !== undefined ? normalizeScenes(parsed.scenes) : recoverPartialScenes(result.text);
  return { brief, scenes: finalizeScenes(input, raw, target), field };
}
