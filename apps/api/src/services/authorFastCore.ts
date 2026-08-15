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

const GENERIC = [/still here/i, /something changes/i, /then it shifts/i, /see you next time/i, /quick zoom/i, /camera pulls back/i, /final shot/i, /eyes? (?:widen|sparkle)/i];
const META = /\b(ai|qre|prompt|compiler|cognition|metadata|model|instruction)\b/i;

const clean = (v: unknown) => String(v ?? "").replace(/\s+/g, " ").trim();
const uniq = (xs: unknown[]) => [...new Set(xs.map(clean).filter(Boolean))];
function json<T>(text: string): T | null {
  const s = String(text ?? "").replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try { return JSON.parse(s) as T; } catch { return null; }
}
function debug(label: string, text: string) {
  if (process.env.QRE_AUTHOR_DEBUG_RAW === "true") console.log(`\n--- QRE RAW MODEL OUTPUT · ${label} ---\n${text}\n--- END RAW MODEL OUTPUT ---\n`);
}
function unsupportedPronoun(text: string, input: Input): boolean {
  const source = [...input.facts, ...input.sourceMoments, ...(input.memoryContext ?? [])].join(" ");
  if (/\b(he|him|his|she|her|hers|they|them|their)\b/i.test(source)) return false;
  return /\b(he|him|his|her|hers)\b/i.test(text);
}
function generic(text: string) { return GENERIC.some((p) => p.test(text)); }
function normalize(scenes: Scene[], input: Input): Scene[] {
  return scenes.map((s) => ({ text: clean(s.text), kind: clean(s.kind) || "movement" }))
    .filter((s) => s.text && !META.test(s.text) && !generic(s.text) && !unsupportedPronoun(s.text, input))
    .filter((s, i, all) => all.findIndex((x) => x.text.toLowerCase() === s.text.toLowerCase()) === i)
    .slice(0, 6);
}

export async function authorFast(input: Input): Promise<{ plan: Plan; scenes: Scene[] }> {
  const source = {
    prompt: input.prompt,
    lens: input.lens ?? "",
    subject: input.subject ?? "",
    facts: uniq(input.facts),
    sourceMoments: uniq(input.sourceMoments),
    memoryContext: uniq(input.memoryContext ?? []),
    creativeLearningContext: uniq(input.creativeLearningContext ?? []),
    trajectory: uniq(input.trajectory ?? []),
  };

  const planResult = await localModelGenerate([
    { role: "system", content: [
      "You are QRE's senior creative director.",
      "Find the movie inside the supplied reality before any prose is written.",
      "The character/subject is the center of gravity. The input is what they experience, encounter, resist, desire, reveal, or transform.",
      "Privately generate competing interpretations: comedy, contradiction, status inversion, tenderness, ritual, mystery, escalation, understatement, identity, callback, or transformation where supported. Choose one champion; do not merely rewrite the same angle.",
      "A boring job can become interesting through the worker's/client's perspective, attitude, relationship, rhythm, or meaning. Never fabricate events to make it interesting.",
      "HARD REALITY: gender/pronouns, people, relationships, locations, actions, outcomes, timestamps, and physical events are usable only when supplied. Never infer them.",
      "Reject generic premises like transformation and affection unless they become specific to the supplied world.",
      "The champion must define angle, tension, movement, payoff, and what to avoid repeating from history.",
      "Do not draft lines. Return JSON only: {angle,tension,movement,payoff,antiRepeat,beatCount}.",
    ].join(" ") },
    { role: "user", content: JSON.stringify(source) },
  ], "json");
  debug("PLAN", planResult.text);
  const fallback: Plan = {
    angle: "character-first interpretation",
    tension: "character versus the situation",
    movement: "attention → complication → turn → payoff",
    payoff: "a character-specific consequence",
    antiRepeat: "generic AI language and repeated motifs",
    beatCount: input.prompt.toLowerCase().includes("living memory") || input.prompt.toLowerCase().includes("chapter") ? 4 : 5,
  };
  const plan = { ...fallback, ...(json<Partial<Plan>>(planResult.text) ?? {}) };
  plan.beatCount = Math.max(4, Math.min(6, Number(plan.beatCount) || fallback.beatCount));

  const draftResult = await localModelGenerate([
    { role: "system", content: [
      "You are QRE's elite micro-beat mouth. This is the final cut, not prose writing.",
      `Write EXACTLY ${plan.beatCount} viewer-facing beats as separate film cuts.`,
      "The sequence should feel fast, alive, character-centered, and impossible to ignore.",
      "Do not write a mini-novel. Do not summarize a beginning, middle, and end.",
      "Each cut should do ONE interesting thing and make the viewer want the next cut.",
      "Let the length vary naturally. A killer 2–4 word cut is welcome. A longer cut is welcome only when the idea is worth the extra words.",
      "The character is the movie. The supplied input is the world around them.",
      "Do not repeat the character's name mechanically. Keep them present through attitude, implication, choices, reactions, callbacks, and consequences.",
      "Do not simply restate facts such as 'hates bows' or 'loves treats'. Discover a sharper framing or character attitude from those facts.",
      "Use the chosen angle consistently. Do not turn one sequence into several unrelated mini-stories.",
      "Find a memorable image or phrase when the supplied reality supports one. A mundane detail can become funny, threatening, romantic, absurd, tender, or strange through the character's lens.",
      "Do not invent gender/pronouns, people, relationships, locations, actions, outcomes, timestamps, or physical events absent from the source.",
      "Do not invent provider dialogue or provider behavior when a service is merely the setting. The service creates the stage; the subject gets the spotlight.",
      "No camera directions. No generic cinematic filler. No 'still here', 'something changes', 'then it shifts', or 'see you next time'.",
      "The final cut should feel like a payoff, not a goodbye or summary.",
      `CHAMPION ANGLE: ${plan.angle}`,
      `TENSION: ${plan.tension}`,
      `MOVEMENT: ${plan.movement}`,
      `PAYOFF: ${plan.payoff}`,
      `ANTI-REPEAT: ${plan.antiRepeat}`,
      "Return JSON only: {scenes:[{text,kind}]}.",
    ].join(" ") },
    { role: "user", content: JSON.stringify(source) },
  ], "json");
  debug("DRAFT", draftResult.text);
  const parsed = json<{ scenes?: Scene[] }>(draftResult.text);
  const scenes = normalize(Array.isArray(parsed?.scenes) ? parsed.scenes : [], input);
  return { plan, scenes };
}
