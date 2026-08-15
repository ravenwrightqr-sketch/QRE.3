import type { AuthorBrainTruth, AuthorCreativeBrief, AuthorScene, SubjectTruth } from "@qre/contracts";
import { localModelGenerate } from "./localModelRuntime.js";

const GENERIC = [
  /still here/i,
  /something changes/i,
  /then it shifts/i,
  /see you next time/i,
  /beautiful transformation/i,
  /magical moment/i,
  /unforgettable experience/i,
  /incredible journey/i,
  /new routine/i,
  /power of (?:love|affection|friendship)/i,
  /symbol of (?:love|bravery|affection|friendship)/i,
  /eyes sparkle/i,
  /heart softens/i,
  /tiny paws/i,
];
const META = /\b(ai|qre|prompt|compiler|cognition|metadata|model|instruction|writing process)\b/i;
const PROVIDER = /\b(?:groomer|groomer's|groomer’s|cleaner|cleaner's|cleaner’s|technician|barber|stylist|mechanic|plumber|employee|worker|staff|owner)\b/i;
const SPOKEN = /\b(?:says?|asks?|replies?|answers?|sighs?|laughs?|smiles?|whispers?|shouts?|yells?)\b|[“”]/i;
const CAMERA = /\b(?:camera|zoom|close-up|cut to|final shot|screen|scene opens|we see)\b/i;
const MULTI_CUT_PUNCT = /[,;]/;
const CHAIN = /\b(?:and then|then|while|after|before|as|finally|suddenly)\b/i;
const PRONOUN = /\b(he|him|his|she|her|hers|they|them|their|themself|themselves)\b/i;
const STOP = new Set(["the","a","an","and","or","but","with","for","from","into","that","this","today","after","before","very","just","was","were","is","are","to","of","in","on","at","it","its"]);

const clean = (value: unknown) => String(value ?? "").replace(/\s+/g, " ").trim();
const uniq = (values: unknown[], limit = 40) => [...new Set(values.map(clean).filter(Boolean))].slice(0, limit);

function json<T>(text: string): T | null {
  const value = String(text ?? "").replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try { return JSON.parse(value) as T; } catch { return null; }
}

function debug(label: string, text: string): void {
  if (process.env.QRE_AUTHOR_DEBUG_RAW !== "true") return;
  console.log(`\n--- QRE RAW MODEL OUTPUT · ${label} ---\n${text}\n--- END RAW MODEL OUTPUT ---\n`);
}

function tokens(text: string): string[] {
  return text.toLowerCase().match(/[a-z][a-z'-]{2,}/g)?.filter((token) => !STOP.has(token)) ?? [];
}

function recurringDetails(input: AuthorBrainTruth): string[] {
  const current = new Set(tokens([...input.facts, ...input.sourceMoments].join(" ")));
  const history = new Set(tokens([...input.memoryContext, ...input.trajectory].join(" ")));
  return [...current].filter((token) => history.has(token)).slice(0, 12);
}

function contradictions(input: AuthorBrainTruth): string[] {
  const text = [...input.facts, ...input.sourceMoments, ...input.memoryContext].join(" ").toLowerCase();
  const out: string[] = [];
  const tests: Array<[RegExp, string]> = [
    [/hates? .*loves?|loves? .*hates?/, "rejection versus desire"],
    [/scared|nervous/, "resistance or fear versus what the subject still wants"],
    [/happy|joy|excited/, "emotion versus the thing that caused it"],
    [/old|worn|scratched|faded|vintage/, "wear versus continued value"],
    [/new|brand new|pristine|first/, "newness versus uncertainty or possibility"],
    [/quiet|calm/, "calm surface versus hidden pressure"],
    [/funny|comedy|ridiculous|absurd/, "ordinary reality versus comic interpretation"],
    [/horror|knife|glass|door|dark/, "ordinary behavior versus reality breaking"],
  ];
  for (const [pattern, label] of tests) if (pattern.test(text)) out.push(label);
  return uniq(out, 8);
}

function creativeSearchField(input: AuthorBrainTruth) {
  const recurring = recurringDetails(input);
  const tension = contradictions(input);
  const service = /\b(service|groom|grooming|clean|cleaning|housekeeping|pool|maintenance|barber|salon|repair|mechanic|client|customer)\b/i.test(`${input.prompt} ${input.lens ?? ""}`);
  return {
    recurringDetails: recurring,
    contradictions: tension,
    subject: input.subject ?? "",
    place: input.place ?? "",
    strongestRawMaterial: uniq([...input.facts, ...input.sourceMoments], 16),
    history: uniq([...input.memoryContext, ...input.trajectory], 16),
    learning: uniq(input.creativeLearningContext, 20),
    serviceStage: service,
    creativeSearches: [
      "character contradiction",
      "running relationship or game",
      "status shift",
      "unexpected framing",
      "personification",
      "understatement",
      "scale contrast",
      "callback with changed meaning",
      "ordinary detail made strangely important",
      "small reversal",
      "pattern break",
      "earned after-image",
    ],
  };
}

function subjectTruthText(truth?: SubjectTruth): string {
  if (!truth) return "IDENTITY STATUS: unresolved. Do not invent sex, gender, or pronouns.";
  const parts = [
    truth.name ? `name=${truth.name}` : "",
    truth.kind ? `kind=${truth.kind}` : "",
    truth.sex && truth.sex !== "unknown" ? `sex=${truth.sex}` : "",
    truth.pronouns ? `pronouns=${truth.pronouns.subject}/${truth.pronouns.object}/${truth.pronouns.possessive}` : "pronouns=unknown",
    truth.provenance ? `provenance=${truth.provenance}` : "",
    ...(truth.identityFacts ?? []).map((fact) => `identity_fact=${clean(fact)}`),
  ];
  return parts.filter(Boolean).join(" | ");
}

function normalizeScenes(raw: unknown): AuthorScene[] {
  if (Array.isArray(raw)) {
    return raw.map((item) => typeof item === "string" ? ({ text: item, kind: "line" as const }) : item as AuthorScene);
  }
  if (!raw || typeof raw !== "object") return [];
  const value = raw as { scenes?: unknown; text?: unknown; lines?: unknown[] };
  if (Array.isArray(value.scenes)) return normalizeScenes(value.scenes);
  if (Array.isArray(value.lines)) return value.lines.map((line) => ({ text: clean(line), kind: "line" as const }));
  if (typeof value.text === "string") return value.text.split(/\n+/).filter(Boolean).map((line) => ({ text: clean(line), kind: "line" as const }));
  return [];
}

function pronounsAllowed(text: string, truth?: SubjectTruth): boolean {
  if (!PRONOUN.test(text)) return true;
  return Boolean(truth?.pronouns && (truth.provenance === "explicit" || truth.provenance === "memory" || truth.provenance === "runtime"));
}

function hardInvalid(text: string, input: AuthorBrainTruth): boolean {
  if (!text || META.test(text) || GENERIC.some((pattern) => pattern.test(text))) return true;
  if (CAMERA.test(text) || SPOKEN.test(text)) return true;
  if (MULTI_CUT_PUNCT.test(text)) return true;
  if (PRONOUN.test(text) && !pronounsAllowed(text, input.subjectTruth)) return true;
  if (/\bserviceLike\b|\bbeat job\b|\bviewer want\b/i.test(text)) return true;
  const service = /\b(service|groom|grooming|clean|cleaning|housekeeping|pool|maintenance|barber|salon|repair|mechanic|client|customer)\b/i.test(`${input.prompt} ${input.lens ?? ""}`);
  if (service && PROVIDER.test(text) && !input.facts.concat(input.sourceMoments).some((fact) => PROVIDER.test(fact))) return true;
  return false;
}

function weakLine(text: string): boolean {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  if (words.length > 14) return true;
  if (words.length >= 4) return false;
  if (/[?!\.]/.test(text)) return false;
  return words.length === 1;
}

function finalizeScenes(input: AuthorBrainTruth, scenes: AuthorScene[], beatCount: number): AuthorScene[] {
  const output: AuthorScene[] = [];
  const seen = new Set<string>();
  for (const scene of scenes) {
    const text = clean(scene.text);
    const key = text.toLowerCase();
    if (hardInvalid(text, input) || weakLine(text) || seen.has(key)) continue;
    seen.add(key);
    output.push({ text, kind: scene.kind ?? "line" });
  }
  return output.slice(0, beatCount);
}

function fallbackBrief(input: AuthorBrainTruth): AuthorCreativeBrief {
  return {
    angle: "find the subject's most specific contradiction or relationship",
    engine: "character lens over supplied reality",
    question: "what is unexpectedly interesting here?",
    strongestImage: input.facts[0] ?? input.sourceMoments[0] ?? "the strongest supplied detail",
    tension: "something the subject makes personal",
    payoff: "a character-specific consequence or reframe",
    callback: input.memoryContext[0] ?? input.trajectory[0] ?? "none yet",
    rhythm: /living memory|chapter/i.test(input.prompt) ? ["hit", "short", "short", "hit"] : ["hit", "short", "standard", "short", "hit"],
    avoid: ["literal fact list", "generic emotional journey", "invented concrete events", "provider as protagonist", "paragraph prose"],
  };
}

export async function authorBrain(input: AuthorBrainTruth, options: { fast?: boolean } = {}): Promise<{ brief: AuthorCreativeBrief; scenes: AuthorScene[]; field: ReturnType<typeof creativeSearchField> }> {
  const beatCount = /living memory|chapter/i.test(input.prompt) ? 4 : 5;
  const field = creativeSearchField(input);
  const fallback = fallbackBrief(input);

  const result = await localModelGenerate([
    {
      role: "system",
      content: [
        "You are QRE's UNIVERSAL AUTHOR BRAIN and CUT MOUTH in one pass.",
        "You are not a novelist. You are not a receipt writer. You are not a screenplay formatter. You are a creative computer that finds the latent movie inside reality and splices it into addictive cuts.",
        "Privately compete: explore several genuinely different ways to see the material. Attack your own first idea for being generic, obvious, sentimental, repetitive, or merely a paraphrase of the facts. Choose the idea that is most specific to this subject and this history.",
        "The subject is temporarily the star. A service, business, job, event, place, or object is the stage and raw material. In service experiences, do not invent the provider as a story character unless explicitly supplied.",
        "The strongest creative move is often: supplied reality → character lens → surprising framing. A detail can become a metaphor, status game, running joke, mystery, rivalry, ritual, or strange image without inventing a concrete physical event.",
        "ATTENTION IS WANTING. Give the viewer a reason to lean forward. Then make the next cut change what they expect. Do not explain the cleverness.",
        "CUT GRAMMAR: ONE LINE = ONE ATTENTION MOMENT. One strong thought. One image. One attitude. One question. Or one consequence.",
        "SHORT-CUT BEHAVIOR: a 2–4 word line can be powerful because it leaves a gap for the viewer to fill. Use that compression when it strengthens the idea. Do not shorten weak writing just to hit a word count.",
        "RHYTHM: let cuts breathe and spike. Short → short → fuller → hit is good. So is short → long → short → long. Choose rhythm from the material.",
        "PUNCTUATION: NEVER use commas or semicolons in scene text. If two thoughts need to coexist, they are two cuts.",
        "Do not mechanically repeat the subject name. Character presence can persist through voice, attitude, choice, resistance, implication, callback, and consequence.",
        "Do not narrate multiple actions in one line. Avoid chained 'then', 'while', 'after', or 'as' constructions when they hide another shot.",
        "Do not announce transformation, happiness, bravery, affection, memory, or other themes. Make the cuts imply them.",
        "REALITY IS SACRED. Use pronouns only when the subject truth explicitly establishes them. Never invent people, relationships, provider actions, dialogue, locations, object placement, physical actions, timestamps, weather, or outcomes.",
        "Metaphor and perspective are creative framing. They do not create a new factual event.",
        `Create exactly ${beatCount} lines.`,
        "Return JSON with a compact creativeBrief plus scenes: {creativeBrief:{angle,engine,question,strongestImage,tension,payoff,callback,rhythm,avoid},scenes:[{text,kind}]}.",
        `SUBJECT TRUTH: ${subjectTruthText(input.subjectTruth)}`,
        `CREATIVE SEARCH FIELD: ${JSON.stringify(field)}`,
      ].join(" "),
    },
    { role: "user", content: JSON.stringify(input) },
  ], "json");

  debug("AUTHOR-BRAIN", result.text);
  const parsed = json<{ creativeBrief?: Partial<AuthorCreativeBrief>; scenes?: unknown; text?: string }>(result.text) ?? {};
  const brief: AuthorCreativeBrief = {
    ...fallback,
    ...(parsed.creativeBrief ?? {}),
    rhythm: Array.isArray(parsed.creativeBrief?.rhythm) ? parsed.creativeBrief!.rhythm! : fallback.rhythm,
    avoid: Array.isArray(parsed.creativeBrief?.avoid) ? parsed.creativeBrief!.avoid! : fallback.avoid,
  };
  const rawScenes = normalizeScenes(parsed.scenes ?? (typeof parsed.text === "string" ? { text: parsed.text } : []));
  return { brief, scenes: finalizeScenes(input, rawScenes, beatCount), field };
}
