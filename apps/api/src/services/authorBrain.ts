import type {
  AuthorBrainTruth,
  AuthorCreativeBrief,
  AuthorScene,
  SequencePlay,
  SequenceCut,
  SubjectTruth,
  ViewerAttentionRole,
  ViewerState,
} from "@qre/contracts";
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
const ROLES: ViewerAttentionRole[] = ["arrival","hook","question","pressure","reframe","escalation","discovery","consequence","release","payoff","callback","continuation"];
const GAIN_KINDS = new Set(["new_fact","surprise","question","escalation","reframe","discovery","consequence","callback","payoff"]);
const BASELINE_DESCRIPTOR = /\b(?:male|female|boy|girl|poodle|dog|cat|pet|person|man|woman|couple|child|baby|business|company|home|house)\b/i;

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
  return out;
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

function normalizeState(raw: unknown): ViewerState {
  if (!raw || typeof raw !== "object") return { known: [] };
  const value = raw as Partial<ViewerState>;
  return {
    known: uniq(value.known, 8),
    expected: clean(value.expected) || undefined,
    unresolved: clean(value.unresolved) || undefined,
    currentWant: clean(value.currentWant) || undefined,
    recentChange: clean(value.recentChange) || undefined,
  };
}

function normalizeSequence(raw: unknown, subject: string): SequencePlay | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const value = raw as Partial<SequencePlay> & { cuts?: unknown; baselineFacts?: unknown };
  if (!Array.isArray(value.cuts)) return undefined;
  const cuts: SequenceCut[] = value.cuts.map((item, index) => {
    const cut = (item && typeof item === "object" ? item : {}) as Partial<SequenceCut>;
    const role = ROLES.includes(cut.role as ViewerAttentionRole) ? cut.role as ViewerAttentionRole : index === 0 ? "hook" : "continuation";
    const gainKind = typeof cut.gainKind === "string" && GAIN_KINDS.has(cut.gainKind) ? cut.gainKind : undefined;
    return {
      id: clean(cut.id) || `cut-${index + 1}`,
      order: Number.isFinite(cut.order) ? Number(cut.order) : index + 1,
      role,
      gainKind,
      sourceIds: uniq(cut.sourceIds, 8),
      informationGain: clean(cut.informationGain),
      attentionDelta: clean(cut.attentionDelta),
      viewerBefore: normalizeState(cut.viewerBefore),
      viewerAfter: normalizeState(cut.viewerAfter),
      nextPromise: clean(cut.nextPromise) || undefined,
      payoffConnection: clean(cut.payoffConnection) || undefined,
      noveltyScore: typeof cut.noveltyScore === "number" ? cut.noveltyScore : undefined,
      confidence: typeof cut.confidence === "number" ? cut.confidence : 0.8,
    };
  }).filter((cut) => GAIN_KINDS.has(String(cut.gainKind)) && Boolean(cut.informationGain || cut.attentionDelta));
  return {
    subject: clean(value.subject) || subject,
    premise: clean(value.premise),
    openingState: normalizeState(value.openingState),
    baselineFacts: uniq(value.baselineFacts as unknown[] | undefined, 10),
    cuts,
    closingState: value.closingState ? normalizeState(value.closingState) : undefined,
    continuity: uniq(value.continuity, 6),
    antiCrutch: uniq(value.antiCrutch, 6),
    continuation: clean(value.continuation) || undefined,
  };
}

function knownWorldText(input: AuthorBrainTruth): string {
  return [input.prompt,input.subject,input.place,...input.facts,...input.sourceMoments,...(input.memoryContext ?? []),...(input.trajectory ?? []),...(input.presenceSummary ?? [])].filter(Boolean).join(" ");
}

function pronounsAllowed(text: string, input: AuthorBrainTruth, truth?: SubjectTruth): boolean {
  if (!PRONOUN.test(text)) return true;
  const world = knownWorldText(input).toLowerCase();
  if (/\b(?:he|his|him)\b/i.test(text) && /\b(?:male|boy|man|he|his|him)\b/i.test(world)) return true;
  if (/\b(?:she|her|hers)\b/i.test(text) && /\b(?:female|girl|woman|she|her|hers)\b/i.test(world)) return true;
  if (/\b(?:they|them|their|themselves|themself)\b/i.test(text)) return true;
  return Boolean(truth?.pronouns && ["explicit","memory","runtime"].includes(truth.provenance));
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
  return !INFERRED_EMOTION.test(knownWorldText(input));
}

function explicitProviderKnown(input: AuthorBrainTruth): boolean {
  return PROVIDER.test(knownWorldText(input));
}

function repeatsEstablishedIdentity(text: string, input: AuthorBrainTruth): boolean {
  const subject = clean(input.subject);
  if (!subject) return false;
  if (!text.toLowerCase().includes(subject.toLowerCase())) return false;
  return BASELINE_DESCRIPTOR.test(text.replace(new RegExp(`^${subject.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}`,"i"), "").trim());
}

function isBaselineRestatement(text: string, input: AuthorBrainTruth): boolean {
  const normalized = clean(text).toLowerCase();
  const subject = clean(input.subject).toLowerCase();
  if (!subject || !normalized.includes(subject)) return false;
  const identityTerms = (input.subjectTruth?.identityFacts ?? []).map(clean).filter(Boolean);
  return identityTerms.some((fact) => normalized === fact.toLowerCase() || normalized.includes(fact.toLowerCase().replace(`${subject} `, "")));
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
  if (isBaselineRestatement(text, input)) return true;
  if (!pronounsAllowed(text, input, input.subjectTruth)) return true;
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
    avoid: ["literal fact list","generic emotional journey","invented concrete events","provider as protagonist","paragraph prose","subject-name repetition","action plus emotion summaries","unestablished named entities","database-role narration","padding to reach a beat count","identity facts as sequence cuts"],
  };
}

export async function authorBrain(input: AuthorBrainTruth, options: { fast?: boolean } = {}): Promise<{ brief: AuthorCreativeBrief; scenes: AuthorScene[]; sequence?: SequencePlay; field: Record<string, unknown> }> {
  const brief = fallbackBrief(input);
  const sourceLedger = buildSourceLedger(input);
  const field = { truth: input.subjectTruth ?? null, current: uniq([...input.facts, ...input.sourceMoments], 12), history: uniq([...(input.memoryContext ?? []), ...(input.trajectory ?? [])], 8), learning: uniq(input.creativeLearningContext, 6), returning: input.returning ?? false, visit: input.visitNumber ?? null, presence: uniq(input.presenceSummary, 5), plan: input.cognitivePlan ?? null, sourceLedger };

  const result = await localModelGenerate([
    { role: "system", content: [
      "You are QRE's universal experience author and sequence director.",
      "Decide the smallest sequence that creates the strongest viewer movement. Then write the finished cuts. Output only compact JSON.",
      "A sequence is NOT a list of facts and NOT a chronology. It is a chain of viewer-state changes.",
      "IDENTITY IS BASELINE. Established name, sex, species, breed, business category, location identity, or other canonical descriptors belong in openingState/baselineFacts. Never spend a cut merely revealing them unless the reveal itself changes the viewer's question or expectation.",
      "Every actual cut must have a non-baseline gainKind and must materially change what the viewer knows, expects, wants, wonders, or understands.",
      "Use only supplied facts, source moments, memory, trajectory, and presence. Reframe, compress, juxtapose, escalate, and imply from them. Do not invent concrete events, people, names, locations, dialogue, placements, outcomes, or physical actions.",
      "The subject is temporarily the star. Other entities appear only when they materially change the subject's world. Database labels are not cinematic roles.",
      "Very short cuts are allowed. The target is compressed impact, not a word-count fetish. Prefer implication when the viewer can reconstruct the missing context.",
      "No comma or semicolon chains in cut text.",
      "Return JSON with exactly two top-level keys: sequence and scenes.",
      "If you cannot form a meaningful sequence from the supplied world, use fewer cuts. Never pad.",
      "sequence must be compact: subject, premise, openingState, optional baselineFacts, cuts, optional closingState, continuity, antiCrutch, continuation.",
      "Each cut must contain role from [arrival,hook,question,pressure,reframe,escalation,discovery,consequence,release,payoff,callback,continuation], gainKind from [new_fact,surprise,question,escalation,reframe,discovery,consequence,callback,payoff], informationGain, attentionDelta, viewerBefore, viewerAfter, optional nextPromise/payoffConnection, confidence.",
      "Do not use person names or roles in the role field. role means the viewer-attention job, not the actor.",
      "scenes contains only the actual finished cut lines. Keep each line self-contained and compact.",
    ].join(" ") },
    { role: "user", content: JSON.stringify({ prompt: input.prompt, lens: input.lens ?? "", subject: input.subject ?? "", place: input.place ?? "", field }) },
  ], "json");

  debug("AUTHOR-BRAIN", result.text);
  const parsed = parseJson<{ sequence?: unknown; scenes?: unknown }>(result.text);
  const rawScenes = parsed?.scenes !== undefined ? normalizeScenes(parsed.scenes) : recoverPartialScenes(result.text);
  const sequence = normalizeSequence(parsed?.sequence, input.subject);
  return { brief, scenes: finalizeScenes(input, rawScenes, 4), sequence, field };
}
