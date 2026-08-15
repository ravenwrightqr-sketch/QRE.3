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
  /still here/i,
  /something changes/i,
  /then it shifts/i,
  /see you next time/i,
  /quick zoom/i,
  /camera pulls back/i,
  /final shot/i,
  /the power of (?:affection|love|friendship)/i,
  /transformation and affection/i,
  /a symbol of (?:love|bravery|affection|friendship)/i,
  /new routine/i,
  /cherished memory/i,
  /in (?:her|his|their) world/i,
];
const META = /\b(ai|qre|prompt|compiler|cognition|metadata|model|instruction)\b/i;
const PROVIDER_TERMS = /\b(?:groomer|groomer's|groomer’s|cleaner|cleaner's|cleaner’s|technician|tech|barber|stylist|mechanic|plumber|employee|worker|staff|owner)\b/i;
const PROVIDER_SPOKEN = /\b(?:says?|asks?|replies?|answers?|sighs?|laughs?|smiles?|whispers?|shouts?|yells?)\b|[“”]/i;
const FORCED_CINEMA = /\b(?:camera|zoom|close-up|cut to|final shot|screen|scene opens|we see)\b/i;
const CHEESE = /\b(?:tiny paws|heart softens|eyes sparkle|cherished|symbol of|power of|not so bad|suddenly,?)\b/i;
const CHOPPED = /^(?:\w+[',!?]?[ ]*){1,3}$/;
const ABSTRACT = /\b(?:transformation|fear vs\.? affection|from (?:scared|fear) to (?:happy|joy)|first treat|new routine|building trust|journey with|emotional journey|from fear to happiness|from scared to happy)\b/i;

const clean = (v: unknown) => String(v ?? "").replace(/\s+/g, " ").trim();
const uniq = (xs: unknown[]) => [...new Set(xs.map(clean).filter(Boolean))];

function json<T>(text: string): T | null {
  const s = String(text ?? "").replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try { return JSON.parse(s) as T; } catch { return null; }
}

function debug(label: string, text: string) {
  if (process.env.QRE_AUTHOR_DEBUG_RAW !== "true") return;
  console.log(`\n--- QRE RAW MODEL OUTPUT · ${label} ---\n${text}\n--- END RAW MODEL OUTPUT ---\n`);
}

function unsupportedPronoun(text: string, input: Input) {
  const source = [...input.facts, ...input.sourceMoments, ...(input.memoryContext ?? [])].join(" ");
  if (/\b(he|him|his|she|her|hers|they|them|their)\b/i.test(source)) return false;
  return /\b(he|him|his|her|hers)\b/i.test(text);
}

function invalid(text: string) {
  return FORCED_CINEMA.test(text) || CHEESE.test(text) || GENERIC.some((p) => p.test(text));
}

function weakFragment(text: string) {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length >= 4) return false;
  if (/[?!.]$/.test(text) && words.length >= 2) return false;
  return CHOPPED.test(text);
}

function splitDraftText(text: string): Scene[] {
  return String(text ?? "")
    .split(/\n+/)
    .map((line) => line.replace(/^\s*(?:\d+[.)-]|[-*•])\s*/, "").trim())
    .filter(Boolean)
    .map((text) => ({ text, kind: "line" }));
}

function extractScenes(raw: unknown): Scene[] {
  if (Array.isArray(raw)) return raw as Scene[];
  if (raw && typeof raw === "object") {
    const value = raw as { scenes?: unknown; text?: unknown; lines?: unknown[]; angle?: unknown; tension?: unknown; movement?: unknown; payoff?: unknown; antiRepeat?: unknown; beatCount?: unknown };
    if (Array.isArray(value.scenes)) return value.scenes as Scene[];
    if (Array.isArray(value.lines)) return value.lines.map((line) => ({ text: clean(line), kind: "line" }));
    if (typeof value.text === "string") return splitDraftText(value.text);
  }
  return [];
}

function invalidAngle(angle: string) {
  return !clean(angle) || ABSTRACT.test(clean(angle));
}

export async function authorFast(input: Input): Promise<{ plan: Plan; scenes: Scene[] }> {
  const serviceLike = /\b(service|groom|grooming|clean|cleaning|housekeeping|pool|maintenance|barber|salon|repair|mechanic|tattoo|restaurant|client|customer)\b/i.test(`${input.prompt} ${input.lens ?? ""}`);
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
    requiredBeatCount: beatCount,
  };

  const result = await localModelGenerate([
    {
      role: "system",
      content: [
        "You are QRE's universal creative author. One pass. No planner. No template. No explanation.",
        "You are a creative computer, not a summarizer. First understand the world and subject, privately search for several different ways this reality could become interesting, kill the obvious ones, and then make ONE sequence from the strongest discovery.",
        "The subject is the temporary star. A service, business, event, wedding, rave, trip, job, home, or object is the stage and raw material. Do not make the business/provider the protagonist unless the source explicitly does.",
        "Do not turn reality into an emotional journey. 'fear to happiness', 'transformation', 'first treat', 'new routine', and similar arcs are usually lazy summaries, not creative discoveries.",
        "Look for a specific thing that is interesting NOW: a strange relationship, recurring game, contradiction, status battle, private rule, unexpected metaphor, absurdity, tiny obsession, callback, escalation, or a detail that can suddenly mean something different through the character's eyes.",
        "The viewer should keep wanting the next cut. Do not mechanically label or design beat jobs. Discover the rhythm yourself.",
        "Think like an editor splicing film: CUT → WANT → CUT → WANT → CUT → PAYOFF. A cut can be 2 words or 12. Use the length the idea deserves.",
        "Each line is ONE attention moment. Do not cram multiple shots into a descriptive sentence. Do not write prose paragraphs.",
        "Compress great ideas, not everything. The goal is high-density thought with natural rhythm.",
        "A supplied object may be reframed through the character's perspective. Example of the kind of transformation we like: a pink bow can become 'The monster appeared.' That is a lens on supplied reality, not an invented physical event. Do not copy this example; discover your own.",
        "Character presence does not require repeating the name. Use attitude, implication, choice, resistance, consequence, callback, and voice.",
        "Do not tell the audience what the theme is. Make them feel it. Do not summarize what happened.",
        "Do not write a chronological receipt or a sequence of generic observations.",
        "The ending must land on something the character makes true about the moment: a reversal, joke, victory, sting, realization, image, callback, or delicious residue that makes another chapter desirable.",
        "REALITY IS SACRED: never invent gender/pronouns, people, relationships, provider characters, dialogue, locations, object placement, actions, timestamps, outcomes, weather, or physical events absent from the supplied evidence.",
        "If the service is only named as a service, do not invent the provider. The service creates the stage; the subject creates the story.",
        "Avoid AI cheese, camera directions, generic emotional labels, theme announcements, and generic goodbyes.",
        `Write EXACTLY ${beatCount} lines. Return JSON only: {scenes:[{text,kind}]}. Also accepted: {text:"line 1\\nline 2\\nline 3\\nline 4"} or {text:"...",kind:"line"}.",
      ].join(" "),
    },
    { role: "user", content: JSON.stringify(source) },
  ], "json");

  debug("AUTHOR", result.text);
  const parsed = json<any>(result.text) ?? {};
  const rawScenes = extractScenes(parsed);
  const scenes = rawScenes
    .map((scene) => ({ text: clean(scene.text), kind: clean(scene.kind) || "line" }))
    .filter((scene) => scene.text)
    .filter((scene) => !META.test(scene.text) && !invalid(scene.text) && !unsupportedPronoun(scene.text, input))
    .filter((scene) => !weakFragment(scene.text))
    .filter((scene) => !PROVIDER_SPOKEN.test(scene.text) && !(serviceLike && PROVIDER_TERMS.test(scene.text)))
    .filter((scene, index, all) => all.findIndex((candidate) => candidate.text.toLowerCase() === scene.text.toLowerCase()) === index)
    .slice(0, beatCount);

  const angle = clean(parsed.angle);
  const plan: Plan = {
    angle: invalidAngle(angle) ? "creative discovery" : angle,
    tension: clean(parsed.tension) || "character versus circumstance",
    movement: clean(parsed.movement) || "discover → deepen → surprise → land",
    payoff: clean(parsed.payoff) || "a character-specific consequence",
    antiRepeat: clean(parsed.antiRepeat) || "generic themes, recycled motifs, invented events",
    beatCount,
  };

  return { plan, scenes };
}
