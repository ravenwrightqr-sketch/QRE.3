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
  return /\b(he|him|his|she|her|hers)\b/i.test(text);
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
      "Reject generic premises like transformation and affection unless they are made specific by evidence.",
      "The champion must define angle, tension, movement, payoff, and what to avoid repeating from history.",
      "Return JSON only: {angle,tension,movement,payoff,antiRepeat,beatCount}.",
    ].join(" ") },
    { role: "user", content: JSON.stringify(source) },
  ], "json");
  debug("PLAN", planResult.text);
  const fallback: Plan = { angle: "character-first interpretation", tension: "character versus the situation", movement: "attention → complication → turn → payoff", payoff: "a character-specific consequence", antiRepeat: "generic AI language and repeated motifs", beatCount: input.prompt.toLowerCase().includes("living memory") || input.prompt.toLowerCase().includes("chapter") ? 4 : 5 };
  const plan = { ...fallback, ...(json<Partial<Plan>>(planResult.text) ?? {}) };
  plan.beatCount = Math.max(4, Math.min(6, Number(plan.beatCount) || fallback.beatCount));

  const draftResult = await localModelGenerate([
    { role: "system", content: [
      "You are QRE's rapid-attention cinematic author.",
      `Write EXACTLY ${plan.beatCount} beats.`,
      "This is NOT a novel. It is an attention loop: GRAB → DEVELOP → GRAB → TURN → PAYOFF.",
      "Each beat must create pressure, curiosity, attitude, surprise, contrast, consequence, or a reason to see the next cut.",
      "The character is the movie. The supplied input is the world/material around them.",
      "Do not repeat the character's name mechanically. Keep the character present through attitude, decisions, reactions, implications, callbacks, and consequences.",
      "Length is not the goal. Two words can be perfect; a longer line is correct when the creative job needs it. Never pad a line just to sound cinematic.",
      "Do not write camera directions, zooms, final shots, or decorative cinematography.",
      "Do not invent gender/pronouns, people, actions, relationships, locations, outcomes, timestamps, or physical events absent from the supplied source.",
      "Do not turn facts into a chronological receipt. Find the character's relationship to them.",
      "All beats must belong to the SAME champion angle. Do not switch movies halfway through.",
      "The final beat must pay off the character and angle. No generic goodbye.",
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
