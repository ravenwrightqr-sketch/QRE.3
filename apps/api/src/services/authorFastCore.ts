import { localModelGenerate } from "./localModelRuntime.js";

type Input = {
  prompt: string;
  lens?: string;
  subject?: string;
  facts: string[];
  sourceMoments: string[];
  memoryContext?: string[];
  creativeLearningContext?: string[];
  trajectory?: string[];
};

type Plan = {
  angle: string;
  tension: string;
  movement: string;
  payoff: string;
  antiRepeat: string;
  beatCount: number;
};

type Scene = { text: string; kind?: string };

const GENERIC = [
  /still here/i, /something changes/i, /then it shifts/i, /see you next time/i,
  /quick zoom/i, /camera pulls back/i, /final shot/i,
  /power of (?:affection|love|friendship)/i, /transformation and affection/i,
  /symbol of (?:love|bravery|affection|friendship)/i, /new routine/i,
  /cherished memory/i, /in (?:her|his|their) world/i,
];
const META = /\b(ai|qre|prompt|compiler|cognition|metadata|model|instruction)\b/i;
const PROVIDER_TERMS = /\b(?:groomer|groomer's|groomer’s|cleaner|cleaner's|cleaner’s|technician|tech|barber|stylist|mechanic|plumber|employee|worker|staff|owner)\b/i;
const PROVIDER_SPOKEN = /\b(?:says?|asks?|replies?|answers?|sighs?|laughs?|smiles?|whispers?|shouts?|yells?)\b|[“”]/i;
const FORCED_CINEMA = /\b(?:camera|zoom|close-up|cut to|final shot|screen|scene opens|we see)\b/i;
const CHEESE = /\b(?:tiny paws|heart softens|eyes sparkle|cherished|symbol of|power of|not so bad|suddenly,?)\b/i;
const CHOPPED = /^(?:\w+[',!?]?[ ]*){1,3}$/;
const ABSTRACT = /\b(?:transformation|fear vs\.? affection|from (?:scared|fear) to (?:happy|joy)|first treat|new routine|building trust|journey with|emotional journey|from fear to happiness)\b/i;

const clean = (v: unknown) => String(v ?? "").replace(/\s+/g, " ").trim();
const uniq = (xs: unknown[]) => [...new Set(xs.map(clean).filter(Boolean))];

function json<T>(text: string): T | null {
  const s = String(text ?? "").replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try { return JSON.parse(s) as T; } catch { return null; }
}

function debug(label: string, text: string): void {
  if (process.env.QRE_AUTHOR_DEBUG_RAW !== "true") return;
  console.log(`\n--- QRE RAW MODEL OUTPUT · ${label} ---\n${text}\n--- END RAW MODEL OUTPUT ---\n`);
}

function unsupportedPronoun(text: string, input: Input): boolean {
  const source = [...input.facts, ...input.sourceMoments, ...(input.memoryContext ?? [])].join(" ");
  if (/\b(he|him|his|she|her|hers|they|them|their)\b/i.test(source)) return false;
  return /\b(he|him|his|her|hers)\b/i.test(text);
}

function invalid(text: string): boolean {
  return FORCED_CINEMA.test(text) || CHEESE.test(text) || GENERIC.some((p) => p.test(text));
}

function weakFragment(text: string): boolean {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length >= 4) return false;
  if (/[?!.]$/.test(text) && words.length >= 2) return false;
  return CHOPPED.test(text);
}

function splitText(text: string): Scene[] {
  return String(text ?? "")
    .split(/\n+/)
    .map((line) => line.replace(/^\s*(?:\d+[.)-]|[-*•])\s*/, "").trim())
    .filter(Boolean)
    .map((line) => ({ text: line, kind: "line" }));
}

function extractScenes(raw: unknown): Scene[] {
  if (Array.isArray(raw)) return raw as Scene[];
  if (!raw || typeof raw !== "object") return [];
  const value = raw as { scenes?: unknown; text?: unknown; lines?: unknown[] };
  if (Array.isArray(value.scenes)) return value.scenes as Scene[];
  if (Array.isArray(value.lines)) return value.lines.map((line) => ({ text: clean(line), kind: "line" }));
  if (typeof value.text === "string") return splitText(value.text);
  return [];
}

function invalidAngle(angle: string): boolean {
  const a = clean(angle);
  return !a || ABSTRACT.test(a);
}

export async function authorFast(input: Input): Promise<{ plan: Plan; scenes: Scene[] }> {
  const serviceLike = /\b(service|groom|grooming|clean|cleaning|housekeeping|pool|maintenance|barber|salon|repair|mechanic|tattoo|restaurant|client|customer)\b/i
    .test(`${input.prompt} ${input.lens ?? ""}`);

  const beatCount = /living memory|chapter/i.test(input.prompt) ? 4 : 5;
  const source = {
    prompt: input.prompt,
    lens: input.lens ?? "",
    subject: input.subject ?? "",
    facts: uniq(input.facts),
    sourceMoments: uniq(input.sourceMoments),
    memoryContext: uniq(input.memoryContext ?? []),
    creativeLearningContext: uniq(input.creativeLearningContext ?? []),
    trajectory: uniq(input.trajectory ?? []),
    serviceLike,
  };

  const result = await localModelGenerate([
    {
      role: "system",
      content: [
        "You are QRE's universal creative computer: a world interpreter, character observer, filmmaker, comedian, editor, and attention designer in one.",
        "Do not follow a screenplay template. Do not manufacture an emotional journey. Do not mechanically convert facts into beats.",
        "Understand the supplied world, the subject, history, intent, and what is actually interesting. Privately explore several ways of seeing it. Kill the obvious, generic, sentimental, repetitive, or unsupported ideas. Then make ONE memorable little movie.",
        "The subject is temporarily the star. In a service experience, the service is the stage; do not invent the provider as a character unless the source explicitly gives us one.",
        "Look for creative leaps: contradiction, running joke, rivalry, status game, strange image, absurdity, ritual, personality, unexpected meaning, callback, escalation, understatement, or a detail that can be reframed through the character's eyes.",
        "Attention is a living loop, not a checklist. Make the viewer want the next cut. Satisfy some curiosity while creating a stronger one. Bend expectations without becoming random. Leave a useful residue for another chapter.",
        "You are splicing film. ONE LINE = ONE ATTENTION MOMENT. A line can be 2 words or 12 words. Mix lengths naturally. Compress the idea, not the intelligence.",
        "A supplied object can become a surprising character lens. Example of the operation, not a template: a pink bow can become 'The monster appeared.' Discover the equivalent yourself from the supplied world.",
        "Do not write prose paragraphs. Do not cram multiple camera moments into one sentence. Do not narrate a beginning-middle-end summary.",
        "Reality is sacred: never invent gender/pronouns, people, relationships, provider characters, dialogue, locations, object placement, actions, timestamps, outcomes, weather, or physical events absent from the source.",
        "Do not repeat the subject's name every line. Character presence comes from attitude, implication, choice, resistance, consequence, callback, and voice.",
        "Do not announce themes such as transformation, affection, bravery, happiness, or memory. Make the viewer feel the idea through the cuts.",
        "Do not use camera directions, generic AI cheese, generic goodbyes, or receipt-like fact listing.",
        `Write EXACTLY ${beatCount} viewer-facing lines.`,
        "Return JSON only in this shape: {\"scenes\":[{\"text\":\"...\",\"kind\":\"line\"}]}. If needed, a single text block with newline-separated lines is also accepted.",
      ].join(" "),
    },
    { role: "user", content: JSON.stringify(source) },
  ], "json");

  debug("AUTHOR", result.text);
  const parsed = json<unknown>(result.text) ?? {};
  const rawScenes = extractScenes(parsed);
  const scenes = rawScenes
    .map((scene) => ({ text: clean(scene.text), kind: clean(scene.kind) || "line" }))
    .filter((scene) => scene.text)
    .filter((scene) => !META.test(scene.text) && !invalid(scene.text) && !unsupportedPronoun(scene.text, input))
    .filter((scene) => !weakFragment(scene.text))
    .filter((scene) => !PROVIDER_SPOKEN.test(scene.text) && !(serviceLike && PROVIDER_TERMS.test(scene.text)))
    .filter((scene, index, all) => all.findIndex((candidate) => candidate.text.toLowerCase() === scene.text.toLowerCase()) === index)
    .slice(0, beatCount);

  const rawPlan = (parsed && typeof parsed === "object" ? parsed : {}) as Partial<Plan>;
  const plan: Plan = {
    angle: invalidAngle(clean(rawPlan.angle)) ? "creative discovery" : clean(rawPlan.angle),
    tension: clean(rawPlan.tension) || "character versus circumstance",
    movement: clean(rawPlan.movement) || "discover → deepen → surprise → land",
    payoff: clean(rawPlan.payoff) || "a character-specific consequence",
    antiRepeat: clean(rawPlan.antiRepeat) || "generic themes, recycled motifs, invented events",
    beatCount,
  };

  return { plan, scenes };
}
