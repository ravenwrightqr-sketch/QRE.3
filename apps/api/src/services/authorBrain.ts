import type { AuthorBrainTruth, AuthorCreativeBrief, AuthorScene, SubjectTruth } from "@qre/contracts";
import { localModelGenerate } from "./localModelRuntime.js";

const GENERIC = [/still here/i,/something changes/i,/then it shifts/i,/see you next time/i,/beautiful transformation/i,/magical moment/i,/unforgettable experience/i,/incredible journey/i,/new routine/i,/power of (?:love|affection|friendship)/i,/symbol of (?:love|bravery|affection|friendship)/i,/eyes sparkle/i,/heart softens/i,/tiny paws/i,/happy now/i,/happily now/i,/looks happy/i,/feels happy/i];
const META = /\b(ai|qre|prompt|compiler|cognition|metadata|model|instruction|writing process)\b/i;
const PROVIDER = /\b(?:groomer|groomer's|groomer’s|cleaner|cleaner's|cleaner’s|technician|barber|stylist|mechanic|plumber|employee|worker|staff|owner|customer|client)\b/i;
const DIALOGUE = /[“”]/;
const CAMERA = /\b(?:camera|zoom|close-up|cut to|final shot|screen|scene opens|we see)\b/i;
const MULTI_CUT_PUNCT = /[,;]/;
const PRONOUN = /\b(he|him|his|she|her|hers|they|them|their|themself|themselves)\b/i;
const INFERRED_EMOTION = /\b(?:happy|sad|angry|excited|afraid|scared|nervous|joyful|thrilled|content|confident|loving|furious|heartbroken|alarmed|alarming|relieved|anxious|delighted|worried|calm|proud|uneasy|unease|surprised|surprise|softening|cautious|cautiously|gracefully|happily)\b/i;
const NAMED_ENTITY = /\b(?:Mr\.?|Mrs\.?|Ms\.?|Dr\.?)?\s*[A-Z][A-Za-z'’-]+(?:\s+[A-Z][A-Za-z'’-]+)+\b/g;

const clean = (value: unknown) => String(value ?? "").replace(/\s+/g, " ").trim();
const uniq = (values: readonly unknown[] | undefined, limit = 20) => [...new Set((values ?? []).map(clean).filter(Boolean))].slice(0, limit);

function parseJson<T>(text: string): T | null {
  const value = String(text ?? "").replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try { return JSON.parse(value) as T; } catch { return null; }
}

function debug(label: string, text: string): void {
  if (process.env.QRE_AUTHOR_DEBUG_RAW !== "true") return;
  console.log(`\n--- QRE RAW MODEL OUTPUT · ${label} ---\n${text}\n--- END RAW MODEL OUTPUT ---\n`);
}

function recoverPartialScenes(raw: string): AuthorScene[] {
  const out: AuthorScene[] = [];
  const objectPattern = /"text"\s*:\s*"((?:\\.|[^"\\])*)"/g;
  for (const match of raw.matchAll(objectPattern)) {
    try { out.push({ text: clean(JSON.parse(`"${match[1]}"`)), kind: "line" }); } catch { /* ignore */ }
  }
  if (out.length) return out;
  const strings = raw.match(/"([^"]{2,120})"/g)?.map((x) => x.slice(1, -1)) ?? [];
  return strings.filter((x) => !/^scenes?$|^text$|^line$/i.test(x)).slice(0, 8).map((text) => ({ text: clean(text), kind: "line" }));
}

function normalizeScenes(raw: unknown): AuthorScene[] {
  if (Array.isArray(raw)) return raw.map((item) => typeof item === "string" ? ({ text: item, kind: "line" as const }) : item as AuthorScene);
  if (!raw || typeof raw !== "object") return [];
  const value = raw as { scenes?: unknown; lines?: unknown[]; text?: unknown };
  if (Array.isArray(value.scenes)) return normalizeScenes(value.scenes);
  if (Array.isArray(value.lines)) return value.lines.map((line) => ({ text: clean(line), kind: "line" as const }));
  if (typeof value.text === "string") return value.text.split(/\n+/).filter(Boolean).map((line) => ({ text: clean(line), kind: "line" as const }));
  return [];
}

function pronounsAllowed(text: string, truth?: SubjectTruth): boolean {
  if (!PRONOUN.test(text)) return true;
  return Boolean(truth?.pronouns && ["explicit","memory","runtime"].includes(truth.provenance));
}

function knownWorldText(input: AuthorBrainTruth): string {
  return [input.prompt,input.subject,input.place,...input.facts,...input.sourceMoments,...(input.memoryContext ?? []),...(input.trajectory ?? []),...(input.presenceSummary ?? [])].filter(Boolean).join(" ");
}

function unknownNamedEntity(text: string, input: AuthorBrainTruth): boolean {
  const world = knownWorldText(input).toLowerCase();
  const subjectName = clean(input.subject).toLowerCase();
  for (const match of text.matchAll(NAMED_ENTITY)) {
    const candidate = clean(match[0]);
    if (!candidate) continue;
    if (candidate.toLowerCase() === subjectName) continue;
    if (!world.includes(candidate.toLowerCase())) return true;
  }
  return false;
}

function unsupportedEmotion(text: string, input: AuthorBrainTruth): boolean {
  if (!INFERRED_EMOTION.test(text)) return false;
  return !INFERRED_EMOTION.test(input.prompt);
}

function explicitProviderKnown(input: AuthorBrainTruth): boolean {
  const explicit = [input.prompt,input.subject,input.place,...input.facts,...input.sourceMoments,...(input.memoryContext ?? []),...(input.trajectory ?? []),...(input.presenceSummary ?? [])].filter(Boolean).join(" ");
  return PROVIDER.test(explicit);
}

function repeatsEstablishedIdentity(text: string, input: AuthorBrainTruth): boolean {
  const subject = clean(input.subject);
  if (!subject) return false;
  if (!text.toLowerCase().includes(subject.toLowerCase())) return false;
  const establishedDescriptor = /\b(?:male|female|boy|girl|poodle|dog|cat|pet|person|man|woman|couple|child|baby|business|company|home|house)\b/i;
  return establishedDescriptor.test(text.replace(new RegExp(`^${subject.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}`,"i"), "").trim());
}

function buildSourceLedger(input: AuthorBrainTruth) {
  return {
    identity: uniq(input.subjectTruth?.identityFacts, 8),
    facts: uniq(input.facts, 16),
    sourceMoments: uniq(input.sourceMoments, 12),
    memory: uniq(input.memoryContext, 8),
    trajectory: uniq(input.trajectory, 8),
    preferences: uniq(input.creativeLearningContext, 8),
    presence: uniq(input.presenceSummary, 8),
  };
}

function invalid(text: string, input: AuthorBrainTruth): boolean {
  if (!text || META.test(text) || GENERIC.some((pattern) => pattern.test(text))) return true;
  if (CAMERA.test(text) || DIALOGUE.test(text)) return true;
  if (MULTI_CUT_PUNCT.test(text)) return true;
  if (unsupportedEmotion(text, input)) return true;
  if (unknownNamedEntity(text, input)) return true;
  if (repeatsEstablishedIdentity(text, input)) return true;
  if (!pronounsAllowed(text, input.subjectTruth)) return true;
  if (PROVIDER.test(text) && !explicitProviderKnown(input)) return true;
  return false;
}

function finalizeScenes(input: AuthorBrainTruth, scenes: AuthorScene[], targetMax = 4): AuthorScene[] {
  const out: AuthorScene[] = [];
  const seen = new Set<string>();
  for (const scene of scenes) {
    const text = clean(scene.text);
    if (!text || text.split(/\s+/).length > 14 || invalid(text, input)) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ text, kind: scene.kind ?? "line" });
  }
  return out.slice(0, targetMax);
}

function compactPlan(input: AuthorBrainTruth) {
  const plan = input.cognitivePlan;
  if (!plan) return {};
  return {
    direction: plan.direction ?? null,
    purpose: clean(plan.purpose),
    why: uniq(plan.whyInteract, 4),
    emotion: uniq(plan.emotionalIntent, 4),
    story: uniq(plan.storyStructure, 5),
    memory: uniq(plan.memoryModel, 4),
    discovery: uniq(plan.discoveryModel, 4),
    possibilities: uniq(plan.creativePossibilities, 8),
    future: uniq(plan.futureEvolution, 4),
  };
}

function fallbackBrief(input: AuthorBrainTruth): AuthorCreativeBrief {
  const plan = input.cognitivePlan;
  return {
    angle: clean(plan?.creativePossibilities?.[0]) || "the subject's most specific contradiction or relationship",
    engine: clean(plan?.purpose) || "character lens over supplied reality",
    question: clean(plan?.whyInteract?.[0]) || "what is unexpectedly interesting here?",
    strongestImage: input.facts[0] ?? input.sourceMoments[0] ?? "the strongest supplied detail",
    tension: clean(plan?.emotionalIntent?.[0]) || "something the subject makes personal",
    payoff: clean(plan?.futureEvolution?.[0]) || "a character-specific consequence or reframe",
    callback: input.memoryContext?.[0] ?? input.trajectory?.[0] ?? "none yet",
    rhythm: ["hit","short","variable","short","hit"],
    avoid: ["literal fact list","generic emotional journey","invented concrete events","provider as protagonist","paragraph prose","subject-name repetition","action plus emotion summaries","unestablished named entities","database-role narration","padding to reach a beat count"],
  };
}

export async function authorBrain(input: AuthorBrainTruth, options: { fast?: boolean } = {}): Promise<{ brief: AuthorCreativeBrief; scenes: AuthorScene[]; field: Record<string, unknown> }> {
  const brief = fallbackBrief(input);
  const sourceLedger = buildSourceLedger(input);
  const field = {
    truth: input.subjectTruth ?? null,
    current: uniq([...input.facts, ...input.sourceMoments], 12),
    history: uniq([...(input.memoryContext ?? []), ...(input.trajectory ?? [])], 8),
    learning: uniq(input.creativeLearningContext, 6),
    returning: input.returning ?? false,
    visit: input.visitNumber ?? null,
    presence: uniq(input.presenceSummary, 5),
    plan: compactPlan(input),
    sourceLedger,
  };

  const result = await localModelGenerate([
    {
      role: "system",
      content: [
        "You are QRE's universal author.",
        "Think deeply but output only the finished cuts. Privately compete between genuinely different interpretations. Kill the obvious, generic, sentimental, repetitive, literal action-report, and fact-list versions.",
        "Your job is not to summarize what happened. Find the most specific movie hidden inside what happened.",
        "The viewer already knows the established subject. Do not reintroduce the subject with a name plus breed, sex, category, or other identity label. Identity belongs to the world model. The mouth spends its limited attention budget on NEW information.",
        "The subject is temporarily the star. The subject's world is the experience. Other entities may appear only when their presence makes the subject's world more interesting. Database relationship labels such as owner, customer, groomer, employee, or technician are not cinematic characters unless the supplied world explicitly makes them relevant.",
        "RAW ACTION IS NOT AUTHORSHIP. A source fact such as 'Coco barks' is usable material, not automatically a cut. Look for the interesting relationship, contradiction, image, implication, callback, status shift, or consequence that is already supportable by the world.",
        "CREATIVE FREEDOM HAS A HARD BOUNDARY: you may compress, reorder, juxtapose, reframe, personify an established object, or imply meaning from known history. You may NOT invent a new physical event, new action, new person, new object placement, new outcome, or new participant just to make the sequence more dramatic.",
        "Use the source ledger as the authority. Identity is canonical. Facts are observed truth. Source moments are supplied context. Memory is history. Trajectory is continuity. Preferences are creative guidance only and are never facts.",
        "Do not manufacture emotions or interpretive body language. Observable action is allowed. Private emotion is not unless explicitly established. Do not turn barking, wagging, staring, sniffing, smiling, or similar behavior into a claim about what the subject feels.",
        "Do not invent named people. Do not invent staff. Do not invent the owner. Do not invent a groomer. Do not invent dialogue. If a service is the setting, let the subject's world carry the experience unless the provider is explicitly part of the supplied world.",
        "Reality is sacred. Explicit subject truth controls pronouns and identity. Do not invent people, relationships, locations, actions, timestamps, object placement, weather, outcomes, or provider behavior.",
        "ONE LINE = ONE ATTENTION MOMENT. A cut should add NEW information or change the meaning of what came before.",
        "The strongest cuts may be very short: 'The monster appeared.' 'Pink bows everywhere.' The power is implication, not word count.",
        "Prefer implied subject + new information over explicit subject + narrated action when the subject is already established.",
        "Prefer one observable or supportable idea per cut. No comma chains. No semicolon chains. No 'then X and Y' constructions. Never use commas or semicolons in scene text. A colon is allowed for a supplied factual time such as 9:04 AM.",
        "Do not write a miniature novel. Do not announce themes. Do not explain the character to the viewer. Make the viewer discover the character through the cut sequence.",
        input.returning ? "Returning chapter: evolve history. A callback must change meaning, stakes, or relationship." : "",
        "Do not pad. Return only as many cuts as the supplied world actually earns. Two excellent cuts beat four padded cuts. Maximum four cuts.",
        "JSON ONLY: {\"scenes\":[{\"text\":\"...\",\"kind\":\"line\"}]}",
      ].join(" "),
    },
    { role: "user", content: JSON.stringify({ prompt: input.prompt, lens: input.lens ?? "", subject: input.subject ?? "", place: input.place ?? "", field }) },
  ], "json");

  debug("AUTHOR-BRAIN", result.text);
  const parsed = parseJson<{ scenes?: unknown }>(result.text);
  const raw = parsed?.scenes !== undefined ? normalizeScenes(parsed.scenes) : recoverPartialScenes(result.text);
  return { brief, scenes: finalizeScenes(input, raw, 4), field };
}
