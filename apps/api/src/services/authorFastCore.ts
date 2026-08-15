import { localModelGenerate } from "./localModelRuntime.js";

type Input = { prompt: string; lens?: string; subject?: string; facts: string[]; sourceMoments: string[]; memoryContext?: string[]; creativeLearningContext?: string[]; trajectory?: string[] };
type Plan = { angle: string; tension: string; movement: string; payoff: string; antiRepeat: string; beatCount: number };
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
  /a symbol of (?:love|bravery|affection|friendship)/i,
  /new routine/i,
  /cherished memory/i,
  /in (?:her|his|their) world/i,
];
const META = /\b(ai|qre|prompt|compiler|cognition|metadata|model|instruction)\b/i;
const ABSTRACT_ANGLE = /^(transformation|affection|love|friendship|happiness|joy|adventure|memory|fun|fear|emotion|connection|journey)$/i;
const CHOPPED = /^(?:\w+[,!]?\s*){1,3}$/;
const FORCED_CINEMA = /\b(?:camera|zoom|close-up|cut to|final shot|screen|scene opens|we see)\b/i;
const FAKE_CHEESE = /\b(?:tiny paws|monster in|heart softens|eyes sparkle|cherished|symbol of|power of|not so bad|suddenly,?)/i;

const clean = (v: unknown) => String(v ?? "").replace(/\s+/g, " ").trim();
const uniq = (xs: unknown[]) => [...new Set(xs.map(clean).filter(Boolean))];
function json<T>(text: string): T | null {
  const s = String(text ?? "").replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try { return JSON.parse(s) as T; } catch { return null; }
}
function debug(label: string, text: string) {
  if (process.env.QRE_AUTHOR_DEBUG_RAW === "true") console.log(`\n--- QRE RAW MODEL OUTPUT · ${label} ---\n${text}\n--- END RAW MODEL OUTPUT ---\n`);
}
function unsupportedPronoun(text: string, input: Input) {
  const source = [...input.facts, ...input.sourceMoments, ...(input.memoryContext ?? [])].join(" ");
  if (/\b(he|him|his|she|her|hers|they|them|their)\b/i.test(source)) return false;
  return /\b(he|him|his|she|her|hers)\b/i.test(text);
}
function generic(text: string) { return GENERIC.some(p => p.test(text)); }
function weakFragment(text: string) {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length >= 4) return false;
  if (/[?!.]$/.test(text) && words.length >= 2) return false;
  return CHOPPED.test(text);
}
function invalidMouth(text: string) {
  return FORCED_CINEMA.test(text) || FAKE_CHEESE.test(text);
}
function normalize(scenes: Scene[], input: Input) {
  return scenes
    .map(s => ({ text: clean(s.text), kind: clean(s.kind) || "movement" }))
    .filter(s => s.text && !META.test(s.text) && !generic(s.text) && !invalidMouth(s.text) && !unsupportedPronoun(s.text, input))
    .filter(s => !weakFragment(s.text))
    .filter((s, i, a) => a.findIndex(x => x.text.toLowerCase() === s.text.toLowerCase()) === i)
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
      "Privately generate genuinely different interpretations, then attack them for genericness, unsupported invention, repetition, weak dramatic movement, and predictable payoff. Choose ONE champion.",
      "The champion angle must be specific to this character/world. Never return an abstract one-word angle such as transformation, affection, love, happiness, adventure, memory, or connection.",
      "A strong angle identifies a relationship or game: rivalry, recurring friction, status negotiation, private ritual, contradiction, obsession, escalation, unexpected tenderness, or a character-specific rule.",
      "Do not confuse a theme with an angle. 'Transformation' is a theme. 'The bow keeps reopening a negotiation this character refuses to lose' is an angle-shaped problem.",
      "Hard reality: gender/pronouns, people, relationships, locations, actions, outcomes, timestamps, and physical events are usable only when supplied. Never infer them.",
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
    antiRepeat: "generic transformation language, mechanical name repetition, unsupported events",
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
      "You are QRE's elite micro-beat mouth. HARD MODE.",
      `Write EXACTLY ${plan.beatCount} beats as one coherent attention sequence.`,
      "This is a short-form living-memory experience. It is NOT a novel, essay, receipt, poem, or screenplay.",
      "Your only job is to keep the viewer leaning forward.",
      "Use this internal loop: HOOK → ANSWER/COMPLICATION → PRESSURE → TURN → PAYOFF. Four beats may compress jobs; do not add a beat just to explain.",
      "EVERY CUT MUST DO SOMETHING. It must create a question, sharpen a conflict, expose attitude, change the terms, reveal a consequence, reverse expectations, deepen a relationship, trigger a callback, or pay something off. If a line merely describes what is visible, it is probably dead.",
      "DO NOT WRITE A DESCRIPTION OF THE EVENT. Write the character's relationship to the event.",
      "DO NOT INVENT THE MISSING MOVIE. Use only the supplied evidence to create the movie. You may infer attitude, implication, tension, and meaning. You may NOT invent a groomer, owner, customer, action, placement of an object, physical reaction, relationship, gender, pronoun, location, timestamp, or outcome that the source did not establish.",
      "Important: a source label like 'grooming visit' does not prove a groomer appeared in the story. A source label like 'pink bow' does not prove someone placed it on the character.",
      "If gender/pronouns are not established, stay neutral. Never guess.",
      "CHARACTER GRAVITY WITHOUT NAME ABUSE: the character should dominate the sequence through attitude, choices, resistance, consequences, and callbacks. Do NOT repeat the character's name every beat.",
      "LANGUAGE RHYTHM: 2–4 words can be a killer cut when it has pressure. Other beats should often be natural compact thoughts, roughly 4–10 words when that carries more meaning. Mix lengths intentionally.",
      "NEVER pad a line to sound cinematic. Never make all beats telegraphic.",
      "NO CAMERA LANGUAGE. Do not write camera, zoom, close-up, final shot, cinematic framing, screen directions, or editing directions.",
      "NO AI-CHEESE. Avoid eyes widening, eyes sparkling, tiny paws, heart softens, monster metaphors, 'not so bad', 'suddenly', generic symbols, generic transformations, and vague emotional labels unless the exact phrase is uniquely justified by supplied evidence.",
      "NO RECEIPT WRITING. Do not list timestamps, rooms, tasks, likes, dislikes, or steps as if filling a form.",
      "NO THEME ANNOUNCEMENTS. Do not tell the viewer the memory is about transformation, affection, bravery, love, happiness, or a cherished memory. Make the viewer feel the meaning through the sequence.",
      "ONE MOVIE ONLY. Every beat must serve the SAME champion angle. Do not jump from one possible story to another because a line sounds cute.",
      "A HOOK IS NOT A PAYOFF. 'Bows?' or 'Bows. Again?' can open the movie. The next cut must exploit that hook instead of abandoning it.",
      "THE PAYOFF MUST LAND HARD. It should be a character-specific reversal, consequence, victory, sting, realization, joke, or earned image. Never end with a generic observation or goodbye.",
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
