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
  /cherished memory/i, /new routine/i, /not so bad/i, /from .* to .*happiness/i,
];
const META = /\b(ai|qre|prompt|compiler|cognition|metadata|model|instruction)\b/i;
const PROVIDER = /\b(?:groomer|groomer's|groomer’s|cleaner|cleaner's|cleaner’s|technician|tech|barber|stylist|mechanic|plumber|employee|worker|staff|owner)\b/i;
const PROVIDER_SPOKEN = /\b(?:says?|asks?|replies?|answers?|sighs?|laughs?|smiles?|whispers?|shouts?|yells?)\b|[“”]/i;
const FORCED_CAMERA = /\b(?:camera|zoom|close-up|cut to|final shot|screen|scene opens|we see)\b/i;
const CHEESE = /\b(?:tiny paws|heart softens|eyes sparkle|cherished|symbol of|power of|magical moment|beautiful transformation)\b/i;
const ABSTRACT_ANGLE = /\b(?:transformation|fear vs\.? affection|from (?:scared|fear) to (?:happy|joy)|first treat|new routine|building trust|journey with|emotional journey)\b/i;

const clean = (v: unknown) => String(v ?? "").replace(/\s+/g, " ").trim();
const uniq = (xs: unknown[]) => [...new Set(xs.map(clean).filter(Boolean))];
function json<T>(text: string): T | null { const s = String(text ?? "").replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim(); try { return JSON.parse(s) as T; } catch { return null; } }
function debug(label: string, text: string): void { if (process.env.QRE_AUTHOR_DEBUG_RAW === "true") console.log(`\n--- QRE RAW MODEL OUTPUT · ${label} ---\n${text}\n--- END RAW MODEL OUTPUT ---\n`); }
function unsupportedPronoun(text: string, input: Input): boolean { const source = [...input.facts, ...input.sourceMoments, ...(input.memoryContext ?? [])].join(" "); if (/\b(he|him|his|she|her|hers|they|them|their)\b/i.test(source)) return false; return /\b(he|him|his|her|hers)\b/i.test(text); }
function invalidLine(text: string): boolean { return META.test(text) || GENERIC.some((p) => p.test(text)) || FORCED_CAMERA.test(text) || CHEESE.test(text) || text.includes(","); }
function weakLine(text: string): boolean { const words = text.split(/\s+/).filter(Boolean); if (words.length >= 4) return false; if (words.length >= 2 && /[?!\.]/.test(text)) return false; return words.length <= 1; }
function splitText(text: string): Scene[] { return String(text ?? "").split(/\n+/).map((line) => line.replace(/^\s*(?:\d+[.)-]|[-*•])\s*/, "").trim()).filter(Boolean).map((line) => ({ text: line, kind: "line" })); }
function extractScenes(raw: unknown): Scene[] { if (Array.isArray(raw)) return raw as Scene[]; if (!raw || typeof raw !== "object") return []; const value = raw as { scenes?: unknown; text?: unknown; lines?: unknown[] }; if (Array.isArray(value.scenes)) return value.scenes.map((scene) => typeof scene === "string" ? ({ text: scene, kind: "line" }) : scene as Scene); if (Array.isArray(value.lines)) return value.lines.map((line) => ({ text: clean(line), kind: "line" })); if (typeof value.text === "string") return splitText(value.text); return []; }
function serviceLike(input: Input): boolean { return /\b(service|groom|grooming|clean|cleaning|housekeeping|pool|maintenance|barber|salon|repair|mechanic|tattoo|restaurant|client|customer)\b/i.test(`${input.prompt} ${input.lens ?? ""}`); }

export async function authorFast(input: Input): Promise<{ plan: Plan; scenes: Scene[] }> {
  const beatCount = /living memory|chapter/i.test(input.prompt) ? 4 : 5;
  const isService = serviceLike(input);
  const source = { prompt: input.prompt, lens: input.lens ?? "", subject: input.subject ?? "", facts: uniq(input.facts), sourceMoments: uniq(input.sourceMoments), memoryContext: uniq(input.memoryContext ?? []), creativeLearningContext: uniq(input.creativeLearningContext ?? []), trajectory: uniq(input.trajectory ?? []), serviceLike: isService };
  const result = await localModelGenerate([
    { role: "system", content: [
      "You are QRE's universal author: filmmaker + editor + comedian + memory artist + ruthless attention designer.",
      "Discover the most interesting way this reality can be seen, then splice a tiny sequence that makes the viewer want the next cut. Do not summarize.",
      "Privately search several interpretations. Kill the obvious, generic, sentimental, repetitive, or unsupported idea before writing.",
      "The subject is temporarily the star. Service is the stage. Do not invent a provider as a character.",
      "HIGH-DENSITY CUT MODE is NOT a word-count trick. It means one charged idea per line, stripped of explanation.",
      "ONE LINE = ONE ATTENTION MOMENT. No commas. No semicolon chains. No stacked clauses. No line may hide multiple shots, actions, or reactions.",
      "A short line is welcome when it hits. A longer line is welcome when it adds a genuinely new dramatic idea. Do not pad and do not force every line short.",
      "Think in clean splices: image → implication; question → escalation; claim → contradiction; setup → reframe; character → world response.",
      "The viewer should infer some of the meaning. REMOVE EXPLANATION. KEEP THE CHARGED PART.",
      "Character presence comes from attitude, choice, resistance, implication, history, callback, and consequence. Do not repeat the subject name mechanically.",
      "Do not mechanically restate source labels such as hates/loves/scared/happy. Find the more interesting implication behind them.",
      "Reality is sacred. Never invent gender/pronouns, people, provider characters, dialogue, relationships, locations, object placement, actions, timestamps, outcomes, weather, or physical events absent from evidence.",
      "Do not use camera directions, generic AI cheese, sentimental filler, theme announcements, or generic goodbyes.",
      `Create EXACTLY ${beatCount} viewer-facing lines. Return JSON only: {\"scenes\":[{\"text\":\"...\",\"kind\":\"line\"}]}. A string array is also accepted.`,
    ].join(" ") },
    { role: "user", content: JSON.stringify(source) },
  ], "json");
  debug("AUTHOR", result.text);
  const parsed = json<unknown>(result.text) ?? {};
  const rawScenes = extractScenes(parsed);
  const scenes = rawScenes.map((scene) => ({ text: clean(scene.text), kind: clean(scene.kind) || "line" }))
    .filter((scene) => scene.text)
    .filter((scene) => !invalidLine(scene.text) && !unsupportedPronoun(scene.text, input))
    .filter((scene) => !weakLine(scene.text))
    .filter((scene) => !(isService && PROVIDER.test(scene.text)))
    .filter((scene) => !PROVIDER_SPOKEN.test(scene.text))
    .filter((scene, index, all) => all.findIndex((candidate) => candidate.text.toLowerCase() === scene.text.toLowerCase()) === index)
    .slice(0, beatCount);
  return { plan: { angle: "high-density creative discovery", tension: "viewer wanting the next cut", movement: "discover → compress → reframe → escalate/payoff", payoff: "character-specific consequence or memorable residue", antiRepeat: "generic themes, source-label paraphrase, invented events, provider-as-protagonist, clause-stacking", beatCount }, scenes };
}
