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
const LITERAL_ARC = /\b(?:scared|fear|happy|happiness|joy|treat|routine|trust|bravery|affection)\b/i;

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
  return !a || ABSTRACT.test(a) || /\b(journey|from .* to .*|fear vs|new routine|first treat|building trust)\b/i.test(a);
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
        "You are QRE's universal creative computer: world interpreter + character observer + filmmaker + comedian + editor + attention designer.",
        "Do not build a screenplay template. Do not manufacture an emotional journey. Do not mechanically convert supplied facts into lines.",
        "FIRST, PRIVATELY SEARCH. Explore several genuinely different ways this reality could be seen. At least some should be non-obvious: a character game, contradiction, running joke, status inversion, absurdity, ritual, strange metaphor, understatement, callback, misdirection, or a tiny detail that suddenly means something else.",
        "Then attack your own first ideas. Kill anything generic, sentimental, literal, predictable, repetitive, or invented. Choose the strongest remaining movie.",
        "IMPORTANT: the supplied emotional labels are NOT the story. If the source says scared/happy/loves/hates/fear/joy/treats, do not simply repeat those labels back as the prose. Transform them through the character's perspective or relationships.",
        "A true fact is evidence. It is not automatically a beat. We want the author's interpretation of the fact, not the fact repeated with punctuation.",
        "The subject is temporarily the star. In a service experience, the service is the stage. Do not invent the provider as a character unless explicitly supplied.",
        "Attention is a living loop: create a desire or question, reward it, then make a more interesting desire or question appear. The viewer should keep leaning toward the next cut.",
        "You are splicing film. ONE LINE = ONE ATTENTION MOMENT. A line can be 2 words or 12 words. Mix lengths naturally. Compress great ideas, not everything.",
        "A supplied object or detail may be reframed through the character's eyes. The point is not to explain the metaphor; make the viewer feel it. Example of the operation, not a template: a pink bow can become 'The monster appeared.' Discover your own equivalent.",
        "Do not narrate beginning-middle-end. Do not write a miniature novel. Do not write a chronological receipt. Do not pack three descriptive observations into one line.",
        "Character presence does not require repeating the subject's name. Use attitude, implication, choice, resistance, consequence, callback, voice, or status.",
        "Do not announce themes like transformation, bravery, affection, happiness, or memory. Make the sequence earn the feeling.",
        "Reality is sacred: never invent gender/pronouns, people, relationships, provider characters, dialogue, locations, object placement, actions, timestamps, outcomes, weather, or physical events absent from the source.",
        "No camera directions. No generic AI cheese. No generic goodbye.",
        `Write EXACTLY ${beatCount} viewer-facing lines.`,
        "Return JSON only: {scenes:[{text,kind}]}. A single newline-separated text block is also accepted.",
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
