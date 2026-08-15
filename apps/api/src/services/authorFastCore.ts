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

type Plan = { angle: string; tension: string; movement: string; payoff: string; antiRepeat: string; beatCount: number };
type Scene = { text: string; kind?: string };

const GENERIC = [
  /still here/i, /something changes/i, /then it shifts/i, /see you next time/i,
  /quick zoom/i, /camera pulls back/i, /final shot/i, /eyes? (?:widen|sparkle)/i,
  /power of (?:affection|love|friendship)/i, /symbol of (?:love|bravery|affection|friendship)/i,
  /cherished memory/i, /new routine/i, /not so bad/i,
];
const META = /\b(ai|qre|prompt|compiler|cognition|metadata|model|instruction)\b/i;
const PROVIDER = /\b(?:groomer|groomer's|groomer’s|cleaner|cleaner's|cleaner’s|technician|tech|barber|stylist|mechanic|plumber|employee|worker|staff|owner)\b/i;
const PROVIDER_SPOKEN = /\b(?:says?|asks?|replies?|answers?|sighs?|laughs?|smiles?|whispers?|shouts?|yells?)\b|[“”]/i;
const FORCED_CAMERA = /\b(?:camera|zoom|close-up|cut to|final shot|screen|scene opens|we see)\b/i;
const CHEESE = /\b(?:tiny paws|heart softens|eyes sparkle|cherished|symbol of|power of|magical moment|beautiful transformation)\b/i;
const MULTI_MOMENT = /[,;:]/;
const SUMMARY_LANGUAGE = /\b(?:then|as|while|after|before|finally|suddenly)\b/i;

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
function invalidLine(text: string): boolean {
  return META.test(text) || GENERIC.some((p) => p.test(text)) || FORCED_CAMERA.test(text) || CHEESE.test(text);
}
function weakLine(text: string): boolean {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length < 2) return true;
  if (MULTI_MOMENT.test(text)) return true;
  if (SUMMARY_LANGUAGE.test(text) && words.length > 7) return true;
  return false;
}
function splitText(text: string): Scene[] {
  return String(text ?? "")
    .split(/\n+/)
    .map((line) => line.replace(/^\s*(?:\d+[.)-]|[-*•])\s*/, "").trim())
    .filter(Boolean)
    .map((line) => ({ text: line, kind: "line" }));
}
function extractScenes(raw: unknown): Scene[] {
  if (Array.isArray(raw)) {
    return raw.map((value) => typeof value === "string" ? ({ text: value, kind: "line" }) : value as Scene);
  }
  if (!raw || typeof raw !== "object") return [];
  const value = raw as { scenes?: unknown; text?: unknown; lines?: unknown[] };
  if (Array.isArray(value.scenes)) {
    return value.scenes.map((item) => typeof item === "string" ? ({ text: item, kind: "line" }) : item as Scene);
  }
  if (Array.isArray(value.lines)) return value.lines.map((line) => ({ text: clean(line), kind: "line" }));
  if (typeof value.text === "string") return splitText(value.text);
  return [];
}
function serviceLike(input: Input): boolean {
  return /\b(service|groom|grooming|clean|cleaning|housekeeping|pool|maintenance|barber|salon|repair|mechanic|tattoo|restaurant|client|customer)\b/i
    .test(`${input.prompt} ${input.lens ?? ""}`);
}

export async function authorFast(input: Input): Promise<{ plan: Plan; scenes: Scene[] }> {
  const beatCount = /living memory|chapter/i.test(input.prompt) ? 4 : 5;
  const isService = serviceLike(input);
  const source = {
    prompt: input.prompt,
    lens: input.lens ?? "",
    subject: input.subject ?? "",
    facts: uniq(input.facts),
    sourceMoments: uniq(input.sourceMoments),
    memoryContext: uniq(input.memoryContext ?? []),
    creativeLearningContext: uniq(input.creativeLearningContext ?? []),
    trajectory: uniq(input.trajectory ?? []),
    serviceLike: isService,
  };

  const result = await localModelGenerate([
    {
      role: "system",
      content: [
        "You are QRE's universal CUT AUTHOR.",
        "You are splicing film. You are NOT writing prose.",
        "First understand the reality and find the most interesting character-centered interpretation. Privately reject the obvious emotional arc, literal fact retelling, generic sentiment, and invented drama.",
        "Then write a tiny sequence of clean cuts that makes the viewer want the next cut.",
        "ONE LINE = ONE ATTENTION MOMENT. Treat every line like a separate piece of film.",
        "A line should usually express ONE image, ONE thought, ONE attitude, ONE question, or ONE consequence.",
        "DO NOT join multiple moments with commas, semicolons, or long chained clauses. A comma usually means you are hiding two cuts inside one line. Separate them.",
        "DO NOT write 'Coco does X, then Y' or 'X, looking Y'. Split the ideas into separate cuts.",
        "Compression is the goal. Strip explanation and leave the charged piece. Two or three words can be excellent. A longer line is allowed only when the extra words create a genuinely stronger idea.",
        "The useful rhythm is not shortness by itself. It is clean thought → gap → next thought → gap → escalation/reframe → payoff.",
        "Think in attention loops: what does the viewer now wonder? what do they expect? what can the next cut reveal, twist, widen, contradict, or escalate?",
        "Strong pair patterns include IMAGE → WIDEN, QUESTION → ANSWER-TURN, CLAIM → CONTRADICTION, CHARACTER → WORLD RESPONSE, SETUP → REFRAME. Discover the pattern that belongs to this reality.",
        "The subject is the temporary star. The surrounding service, job, event, place, or object is the stage. In a service story the provider is background infrastructure unless explicitly supplied as part of the story.",
        "Do not mechanically repeat the subject name every line. Let character appear through attitude, implication, choice, resistance, callback, and consequence.",
        "REALITY IS SACRED. Never invent gender/pronouns, people, relationships, provider actions, dialogue, locations, object placement, physical actions, timestamps, weather, or outcomes absent from the source.",
        "A supplied detail may be reframed through character perspective. Do not invent the physical event behind the metaphor.",
        "Do not announce themes such as transformation, happiness, bravery, affection, or memory. Make the viewer infer them.",
        "Do not use camera directions, screenplay language, AI cheese, sentimental filler, generic goodbyes, or chronological receipt writing.",
        `Write EXACTLY ${beatCount} lines.`,
        "Return JSON only: {\"scenes\":[\"line one\",\"line two\",\"line three\",\"line four\"]}.",
      ].join(" "),
    },
    { role: "user", content: JSON.stringify(source) },
  ], "json");

  debug("CUT-AUTHOR", result.text);
  const parsed = json<unknown>(result.text) ?? {};
  const rawScenes = extractScenes(parsed);
  const scenes = rawScenes
    .map((scene) => ({ text: clean(scene.text), kind: clean(scene.kind) || "line" }))
    .filter((scene) => scene.text)
    .filter((scene) => !invalidLine(scene.text) && !unsupportedPronoun(scene.text, input))
    .filter((scene) => !weakLine(scene.text))
    .filter((scene) => !(isService && PROVIDER.test(scene.text)))
    .filter((scene) => !PROVIDER_SPOKEN.test(scene.text))
    .filter((scene, index, all) => all.findIndex((candidate) => candidate.text.toLowerCase() === scene.text.toLowerCase()) === index)
    .slice(0, beatCount);

  return {
    plan: {
      angle: "cut discovery",
      tension: "viewer wanting the next cut",
      movement: "discover → compress → reframe → escalate → land",
      payoff: "earned character-specific consequence or residue",
      antiRepeat: "multi-moment prose, literal fact restatement, invented reality, generic sentiment",
      beatCount,
    },
    scenes,
  };
}
