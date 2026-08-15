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
  /eyes? (?:widen|sparkle)/i,
  /the power of (?:affection|love|friendship)/i,
  /transformation and affection/i,
];
const META = /\b(ai|qre|prompt|compiler|cognition|metadata|model|instruction)\b/i;
const ABSTRACT_ANGLE = /^(transformation|affection|love|friendship|happiness|joy|adventure|memory|fun|fear|emotion|connection|journey)$/i;
const CHOPPED = /^(?:\w+[,!]?\s*){1,3}$/;

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
function weakFragment(text: string) {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length >= 4) return false;
  if (/[?!.]$/.test(text) && words.length >= 2) return false;
  return CHOPPED.test(text);
}
function normalize(scenes: Scene[], input: Input): Scene[] {
  return scenes
    .map((s) => ({ text: clean(s.text), kind: clean(s.kind) || "movement" }))
    .filter((s) => s.text && !META.test(s.text) && !generic(s.text) && !unsupportedPronoun(s.text, input))
    .filter((s) => !weakFragment(s.text))
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
      "You are QRE's senior creative director. Find the latent movie inside supplied reality before writing prose.",
      "The character/subject is the center of gravity. The input is the world they experience. Make the character's personality, contradiction, attitude, relationship, choice, or consequence the creative engine.",
      "Privately generate genuinely different interpretations, then attack them for genericness, unsupported invention, repetition, weak visual/dramatic movement, and predictable payoff. Choose ONE champion.",
      "The champion angle must be specific to the supplied character/world. Do NOT use an abstract one-word angle such as transformation, affection, love, happiness, adventure, memory, or connection.",
      "For Coco, 'recurring bow rivalry' is a specific angle; 'transformation' is not. For Maria's housekeeping, a worker/client attitude or recurring ritual can be an angle; 'cleaning' is not.",
      "A short hook may be 2-3 words when it has real tension or curiosity. Do not make the whole sequence telegraphic. The normal line should have enough language to express a complete thought.",
      "HARD REALITY: gender/pronouns, people, relationships, locations, actions, outcomes, timestamps, and physical events are usable only when supplied. Never infer them.",
      "A boring job can become entertaining through the real person's perspective, attitude, rhythm, relationship, contrast, or meaning. Never invent events to improve it.",
      "Return JSON only: {angle,tension,movement,payoff,antiRepeat,beatCount}.",
    ].join(" ") },
    { role: "user", content: JSON.stringify(source) },
  ], "json");
  debug("PLAN", planResult.text);
  const fallback: Plan = {
    angle: "character-specific contradiction",
    tension: "the character meets the recurring situation on different terms",
    movement: "hook → complication → character turn → consequence",
    payoff: "the character gets the last word",
    antiRepeat: "generic transformation language, mechanical name repetition, and recycled motifs",
    beatCount: input.prompt.toLowerCase().includes("living memory") || input.prompt.toLowerCase().includes("chapter") ? 4 : 5,
  };
  const parsedPlan = json<Partial<Plan>>(planResult.text) ?? {};
  const plan: Plan = {
    ...fallback,
    ...parsedPlan,
    angle: ABSTRACT_ANGLE.test(clean(parsedPlan.angle)) ? fallback.angle : clean(parsedPlan.angle || fallback.angle),
  };
  plan.beatCount = Math.max(4, Math.min(6, Number(plan.beatCount) || fallback.beatCount));

  const draftResult = await localModelGenerate([
    { role: "system", content: [
      "You are QRE's cinematic micro-beat author. Write an attention-grabbing living memory, not a novel and not a poem.",
      `Write EXACTLY ${plan.beatCount} beats.`,
      "Use a rhythm like: sharp hook → development → sharper hook/complication → character turn → earned payoff. Four beats may omit one stage when that makes the sequence stronger.",
      "IMPORTANT: 2-3 words can be a killer hook, but do NOT make every beat 2-3 words. Prefer compact complete thoughts, often roughly 4-10 words, when the idea needs them. Variety in length is part of the rhythm.",
      "A beat should feel like a cut worth watching: it should create curiosity, reveal character, introduce a meaningful change, sharpen a conflict, reverse expectations, or pay something off.",
      "The character is the movie. Do not mechanically repeat the subject's name. Keep them present through attitude, resistance, choices, reactions, history, and consequences.",
      "A short hook like 'Bows again?' is valuable because it raises a question. The next beat must answer or complicate THAT question, not start a different movie.",
      "Do not turn facts into a receipt. Do not simply list timestamps, rooms, tasks, likes, or dislikes. Make the character's relationship to those facts do the work.",
      "Do not invent gender/pronouns, people, actions, relationships, locations, outcomes, timestamps, weather, or physical events absent from the supplied source. Inference of attitude is allowed; invention of concrete events is not.",
      "Do not write camera directions, zooms, final shots, or decorative cinematography.",
      "Do not use generic endings such as 'See you next time', 'happily ever after', or vague emotional labels.",
      "Do not explain the joke. Let the viewer connect it.",
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
