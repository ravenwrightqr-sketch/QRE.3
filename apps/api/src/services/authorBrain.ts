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
  const value = raw as Partial<SequencePlay> & { cuts?: unknown };
  if (!Array.isArray(value.cuts)) return undefined;
  const cuts: SequenceCut[] = value.cuts.map((item, index) => {
    const cut = (item && typeof item === "object" ? item : {}) as Partial<SequenceCut>;
    const role = ROLES.includes(cut.role as ViewerAttentionRole) ? cut.role as ViewerAttentionRole : index === 0 ? "hook" : "continuation";
    return {
      id: clean(cut.id) || `cut-${index + 1}`,
      order: Number.isFinite(cut.order) ? Number(cut.order) : index + 1,
      role,
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
  }).filter((cut) => Boolean(cut.informationGain || cut.attentionDelta));
  return {
    subject: clean(value.subject) || subject,
    premise: clean(value.premise),
    openingState: normalizeState(value.openingState),
    cuts,
    closingState: value.closingState ? normalizeState(value.closingState) : undefined,
    continuity: uniq(value.continuity, 6),
    antiCrutch: uniq(value.antiCrutch, 6),
    continuation: clean(value.continuation) || undefined,
  };
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

export async function authorBrain(input: AuthorBrainTruth, options: { fast?: boolean } = {}): Promise<{ brief: AuthorCreativeBrief; scenes: AuthorScene[]; sequence?: SequencePlay; field: Record<string, unknown> }> {
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
    plan: input.cognitivePlan ?? null,
    sourceLedger,
  };

  const result = await localModelGenerate([
    {
      role: "system",
      content: [
        "You are QRE's universal experience author and sequence director.",
        "Think deeply before writing. First decide how the experience should PLAY from cut to cut. Then realize that sequence into the finished cuts. Output only compact JSON.",
        "A sequence is not a list of events. It is a chain of viewer-state changes. For every cut ask: what does the viewer know now, what do they expect now, what remains unresolved, what do they want next, and what changed because of this cut?",
        "Privately compete between genuinely different interpretations of the supplied world. Kill the obvious, generic, sentimental, repetitive, literal action-report, fact-list, and padded versions.",
        "The viewer already knows the established subject. Do not reintroduce the subject with a name plus breed, sex, category, or identity label. Identity belongs to the world model. The mouth spends attention on NEW information.",
        "The subject is temporarily the star. The subject's world is the experience. Other entities may appear only when their presence changes that world meaningfully. Database roles such as owner, customer, groomer, employee, or technician are not cinematic characters unless explicitly relevant in the supplied world.",
        "RAW ACTION IS NOT AUTHORSHIP. A fact is source material. The sequence must choose which detail earns screen time and what that detail causes the viewer to think or want next.",
        "CREATIVE FREEDOM HAS A HARD BOUNDARY: compress, reorder, juxtapose, reframe, exploit contradiction, change the meaning of known history, and create implication from known facts. Do NOT invent new physical events, actions, people, placements, outcomes, dialogue, or participants.",
        "Use the source ledger as authority. Identity is canonical. Facts are observed truth. Source moments are supplied context. Memory is history. Trajectory is continuity. Preferences are guidance, never facts.",
        "Do not manufacture private emotion or interpretive body language. Observable action is allowed. Emotion claims require explicit evidence or memory.",
        "ONE CUT = ONE ATTENTION MOMENT. A cut should change the viewer state. Two excellent cuts beat four padded cuts. The sequence earns its length.",
        "Very short cuts can be powerful because of implication: 'The monster appeared.' 'Pink bows everywhere.' The goal is information density and next-cut pressure, not minimum words.",
        "Prefer implied subject + new information after identity is established.",
        "No comma chains. No semicolon chains. No multi-shot 'then X and Y' constructions. Never use commas or semicolons in cut text. A colon is allowed for supplied factual times such as 9:04 AM.",
        "Do not write a miniature novel. Do not explain themes. Do not explain the character. Make the viewer discover the world through the sequence.",
        "Returning chapter: if true, evolve prior meaning. A callback should change meaning, stakes, or relationship instead of replaying the previous chapter.",
        "Return JSON with exactly two top-level keys: sequence and scenes.",
        "sequence must contain subject, premise, openingState, cuts, optional closingState, continuity, antiCrutch, continuation.",
        "Each sequence cut must contain role, informationGain, attentionDelta, viewerBefore, viewerAfter, optional nextPromise and payoffConnection, plus confidence. Keep state descriptions compact.",
        "scenes must contain only the actual finished cut lines. The scenes realize the sequence. Do not put explanations in scenes.",
      ].join(" "),
    },
    { role: "user", content: JSON.stringify({ prompt: input.prompt, lens: input.lens ?? "", subject: input.subject ?? "", place: input.place ?? "", field }) },
  ], "json");

  debug("AUTHOR-BRAIN", result.text);
  const parsed = parseJson<{ sequence?: unknown; scenes?: unknown }>(result.text);
  const rawScenes = parsed?.scenes !== undefined ? normalizeScenes(parsed.scenes) : recoverPartialScenes(result.text);
  const sequence = normalizeSequence(parsed?.sequence, input.subject);
  return { brief, scenes: finalizeScenes(input, rawScenes, 4), sequence, field };
}
