import type {
  AuthorBrainTruth,
  AuthorCreativeBrief,
  AuthorResult,
  AuthorRhythm,
  AuthorScene,
  SequenceCut,
  SequenceGainKind,
  SequencePlay,
  ViewerAttentionRole,
  ViewerState,
} from "@qre/contracts";
import { localModelGenerate } from "./localModelRuntime.js";

type CandidateSequence = { lines: string[] };
type CandidateBatch = { candidateSequences?: unknown };
type SemanticJob = {
  order: number;
  role: "hook" | "turn" | "escalation" | "reframe" | "payoff";
  change: string;
  expressionJob: string;
  nextPull: string;
};

type Rejection = { index: number; reasons: string[]; score: number };

const MIN_SEQUENCE_SCORE = 0.80;
const MAX_CANDIDATES = 4;

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const uniq = (values: readonly string[], limit = 32): string[] => [...new Set(values.map(clean).filter(Boolean))].slice(0, limit);
const tokens = (text: string): string[] => clean(text).toLowerCase().split(/[^a-z0-9'-]+/i).filter((x) => x.length >= 2);
const tokenSet = (text: string): Set<string> => new Set(tokens(text));
const metric = (value: number): number => Number(Math.max(0, Math.min(1, value)).toFixed(3));

function requestedLineCount(prompt: string): number {
  const match = clean(prompt).match(/\b(\d{1,2})\s*[- ]?\s*line\b/i);
  const n = match ? Number(match[1]) : 5;
  return Number.isFinite(n) ? Math.max(3, Math.min(8, n)) : 5;
}

function endpointFromPrompt(prompt: string): string {
  const match = clean(prompt).match(/(?:final\s+line|ending|endpoint)\s*:\s*(.+)$/i);
  return clean(match?.[1] ?? "").replace(/^['\"]|['\"]$/g, "");
}

function normalizeLine(value: unknown): string {
  return clean(value).replace(/^(?:[-*•]|\d+[.)])\s*/u, "").replace(/^['\"]|['\"]$/g, "").trim();
}

const GENDER_WORDS = /\b(?:his|her|him|he|she|husband|wife|man|woman|male|female|boy|girl)\b/i;
const CONCRETE_WORDS = /\b(?:tail|tails|legs|leg|ears|ear|paws|paw|eyes|eye|mouth|teeth|face|head|hands|hand|feet|foot|counter|dresser|door|outside|inside|street|car|park|office|room|chair|table|bed|floor|steam|water|bathwater|towel|mirror|window|leash|collar|coat|hat|shaking|shook|trembled|trembling|shivering|strutting|running|walked|walking|ran|jumped|jumping|hugged|smiled|laughed|cried|whispered|yelled)\b/i;
const PERSON_WORDS = /\b(?:man|woman|boy|girl|male|female|husband|wife|father|mother|dad|mom|lawyer|judge|king|queen|boss|manager|officer|doctor|nurse|friend|stranger|customer|owner|employee)\b/i;
const META_WORDS = /\b(?:this means|this reveals|this shows|the viewer|the audience|the strategy|the beat|the point is|as an ai|attention function|creative move|cognitive|the reader)\b/i;
const FILLER_WORDS = /\b(?:magical moment|unforgettable experience|incredible journey|newfound confidence|a testament to|making memories|cherished moment|one for the books|truly amazing|absolutely adorable)\b/i;
const EXPLANATION_WORDS = /\b(?:therefore|as a result|which means|this is why|in order to|thus)\b/i;
const DECORATIVE_WORDS = /\b(?:gently|softly|beautifully|gracefully|dramatically|magically|heartwarming|poetically)\b/i;

function evidenceFor(input: AuthorBrainTruth): string[] {
  return uniq([
    input.subject,
    input.place ?? "",
    ...input.facts,
    ...input.sourceMoments,
    ...(input.memoryContext ?? []),
    ...(input.presenceSummary ?? []),
  ], 36);
}

function evidenceText(input: AuthorBrainTruth): string {
  return evidenceFor(input).join(" ").toLowerCase();
}

function hasUnsupportedConcrete(line: string, input: AuthorBrainTruth): string | undefined {
  const known = evidenceText(input);
  const gender = line.match(GENDER_WORDS)?.[0];
  if (gender && !new RegExp(`\\b${gender}\\b`, "i").test(known)) return `unsupported_person_or_gender:${gender}`;

  const concrete = line.match(CONCRETE_WORDS)?.[0];
  if (concrete && !known.includes(concrete.toLowerCase())) return `unsupported_concrete_detail:${concrete}`;

  const person = line.match(PERSON_WORDS)?.[0];
  if (person && !known.includes(person.toLowerCase())) return `unsupported_person:${person}`;
  return undefined;
}

function acceptableLine(line: string, endpoint: boolean, input: AuthorBrainTruth): string[] {
  const text = normalizeLine(line);
  const reasons: string[] = [];
  const count = tokens(text).length;
  if (!text) reasons.push("empty");
  if (/\b(?:line\s*\d+|placeholder|tbd|lorem ipsum)\b/i.test(text)) reasons.push("placeholder");
  if (META_WORDS.test(text)) reasons.push("meta_language");
  if (FILLER_WORDS.test(text)) reasons.push("generic_filler");
  if (EXPLANATION_WORDS.test(text)) reasons.push("explanatory_glue");
  if (DECORATIVE_WORDS.test(text)) reasons.push("decorative_prose");
  if (!endpoint && (count < 1 || count > 9)) reasons.push("wrong_length");
  if (/```|^\{|^\[|[{}]/.test(text)) reasons.push("format_noise");
  const invention = hasUnsupportedConcrete(text, input);
  if (invention) reasons.push(invention);
  return reasons;
}

function semanticJobs(input: AuthorBrainTruth, count: number, endpoint: string): SemanticJob[] {
  const facts = uniq([...input.sourceMoments, ...input.facts, ...(input.memoryContext ?? [])], 24);
  const jobs: SemanticJob[] = [];
  const roles: SemanticJob["role"][] = ["hook", "turn", "escalation", "reframe", "payoff"];
  for (let i = 0; i < count; i += 1) {
    const role = endpoint && i === count - 1 ? "payoff" : roles[Math.min(i, roles.length - 2)]!;
    const fact = facts[i] ?? facts[facts.length - 1] ?? "the supplied reality";
    if (role === "hook") jobs.push({ order: i + 1, role, change: "establish the starting reality", expressionJob: `Use this supplied fact without adding detail: ${fact}`, nextPull: "show what changes next" });
    else if (role === "turn") jobs.push({ order: i + 1, role, change: "change the interpretation", expressionJob: `Use the next supplied fact as the turn: ${fact}`, nextPull: "make the next behavior matter" });
    else if (role === "escalation") jobs.push({ order: i + 1, role, change: "increase character evidence", expressionJob: `Use this supplied behavior or object: ${fact}. Make the attitude visible without explaining it.`, nextPull: "push toward the payoff" });
    else if (role === "reframe") jobs.push({ order: i + 1, role, change: "recontextualize what came before", expressionJob: `Use this supplied fact as a callback or sharper read: ${fact}`, nextPull: endpoint ? "land the supplied ending" : "leave forward pressure" });
    else jobs.push({ order: i + 1, role, change: "land the exact endpoint", expressionJob: `Use the exact endpoint: ${endpoint}`, nextPull: "finish" });
  }
  return jobs;
}

function buildBrief(input: AuthorBrainTruth, endpoint: string): AuthorCreativeBrief {
  const facts = uniq([...input.sourceMoments, ...input.facts], 16);
  const subject = clean(input.subject) || "the subject";
  return {
    angle: `${subject}: behavior reveals character`,
    engine: "change → behavior → implication → payoff",
    question: endpoint ? "How does the ending become inevitable?" : "What changes next?",
    strongestImage: facts[0] ?? "the supplied reality",
    tension: `${facts[0] ?? "the opening"} ↔ ${facts[1] ?? "the turn"}`,
    payoff: endpoint || facts[facts.length - 1] || "earned ending",
    callback: facts[1] ?? facts[0] ?? "the opening",
    rhythm: ["short", "short", "hit", "hit", "short"] as AuthorRhythm[],
    avoid: ["summary", "explanation", "poetic filler", "invented literal events", "unsupported attributes", "repeated sentence shape"],
  };
}

function buildPrompt(input: AuthorBrainTruth, jobs: SemanticJob[], endpoint: string): Array<{ role: "system" | "user"; content: string }> {
  const subject = clean(input.subject) || "the subject";
  const facts = evidenceFor(input);
  const known = facts.join(" | ");
  const genderSupplied = GENDER_WORDS.test(known);
  const system = [
    "QRE AUTHORING REALIZATION BOUNDARY.",
    "You are not the story engine. QRE already decided reality, subject, evidence, beats, and endpoint. You only realize that decision as language.",
    `SUBJECT: ${subject}. The subject identity is immutable.`,
    `EVIDENCE LEDGER: ${known}`,
    genderSupplied ? "Gendered language is allowed only when explicitly present in the evidence ledger." : "GENDER IS UNKNOWN. Never use he/she/him/her/his/male/female/man/woman/boy/girl/husband/wife.",
    "Every concrete noun, body part, person, location, object, sensory detail, physical action, and outcome must be supported by the evidence ledger.",
    "A pronoun is a factual claim. If unsupported, repeat the subject name.",
    "Do not invent steam, water, warmth, hands, tails, legs, rooms, counters, doors, streets, movement, dialogue, or atmosphere unless supplied.",
    "Do not turn a source fact into a new literal event. Interpret behavior only through language that does not assert new physical facts.",
    "Write compact conversational prose. Prefer 3–7 words per non-endpoint line.",
    "No analyst language, no explanation, no poetic filler, no generic inspiration, no viewer-directed language.",
    "Every line must advance the read of the subject or move toward the endpoint.",
    endpoint ? `FINAL LINE MUST BE EXACTLY: ${endpoint}` : "",
    `Return exactly ${jobs.length} lines inside one JSON candidate.`,
    '{"candidateSequences":[{"lines":["...","..."]}]}'
  ].filter(Boolean).join("\n");
  const user = JSON.stringify({
    subject,
    prompt: clean(input.prompt),
    evidence: facts,
    jobs,
    endpoint,
    hardRules: ["evidence_only", "subject_locked", "no_unsupported_gender", "no_unsupported_concrete_details", "exact_line_count", "exact_endpoint"],
  });
  return [{ role: "system", content: system }, { role: "user", content: user }];
}

function parseBatch(raw: string, count: number): CandidateSequence[] {
  const text = clean(raw).replace(/^```(?:json|text)?/i, "").replace(/```$/i, "").trim();
  if (!text) return [];
  try {
    const parsed = JSON.parse(text) as CandidateBatch;
    if (!Array.isArray(parsed.candidateSequences)) return [];
    return parsed.candidateSequences
      .filter((x): x is { lines?: unknown } => Boolean(x) && typeof x === "object")
      .map((x) => ({ lines: Array.isArray(x.lines) ? x.lines.map(normalizeLine) : [] }))
      .filter((x) => x.lines.length === count)
      .slice(0, MAX_CANDIDATES);
  } catch {
    return [];
  }
}

function overlap(a: string, b: string): number {
  const left = tokenSet(a); const right = tokenSet(b);
  if (!left.size || !right.size) return 0;
  let shared = 0; for (const token of left) if (right.has(token)) shared += 1;
  return shared / Math.max(left.size, right.size);
}

function scoreCandidate(candidate: CandidateSequence, input: AuthorBrainTruth, endpoint: string): number {
  const facts = evidenceFor(input);
  const lines = candidate.lines;
  const scores = lines.map((line, i) => {
    const count = tokens(line).length;
    const brevity = count <= 6 ? 1 : count <= 8 ? 0.85 : 0.5;
    const grounded = facts.some((fact) => overlap(line, fact) >= 0.2) ? 1 : 0.72;
    const novelty = i === 0 ? 1 : 1 - overlap(line, lines[i - 1] ?? "");
    return brevity * 0.30 + grounded * 0.30 + novelty * 0.25 + (META_WORDS.test(line) ? 0 : 0.15);
  });
  const endpointScore = endpoint && clean(lines.at(-1)).toLowerCase() !== endpoint.toLowerCase() ? 0 : 1;
  const rhythm = metric(new Set(lines.map((x) => tokens(x).length)).size / Math.min(lines.length, 4));
  return metric((scores.reduce((a, b) => a + b, 0) / Math.max(1, scores.length)) * 0.72 + rhythm * 0.08 + endpointScore * 0.20);
}

function validate(candidate: CandidateSequence, input: AuthorBrainTruth, endpoint: string): { ok: boolean; reasons: string[]; score: number } {
  const reasons: string[] = [];
  candidate.lines.forEach((line, i) => {
    acceptableLine(line, Boolean(endpoint && i === candidate.lines.length - 1), input).forEach((reason) => reasons.push(`line_${i + 1}:${reason}`));
  });
  if (endpoint && clean(candidate.lines.at(-1)).toLowerCase() !== endpoint.toLowerCase()) reasons.push("endpoint_mismatch");
  const normalized = candidate.lines.map((x) => clean(x).toLowerCase());
  if (new Set(normalized).size !== normalized.length) reasons.push("duplicate_lines");
  const score = scoreCandidate(candidate, input, endpoint);
  if (score < MIN_SEQUENCE_SCORE) reasons.push(`score_below_floor:${score}`);
  return { ok: reasons.length === 0, reasons, score };
}

function factLine(subject: string, fact: string): string {
  const value = normalizeLine(fact).replace(/[.!?]+$/g, "");
  if (!value) return subject;
  const lower = value.toLowerCase();
  if (lower.startsWith("came ") || lower.startsWith("got ") || lower.startsWith("stole ") || lower.startsWith("left ")) return `${subject} ${value}.`;
  if (/^[A-Z]/.test(value)) return `${value}.`;
  return `${subject} ${value}.`;
}

function buildSafeFallback(input: AuthorBrainTruth, count: number, endpoint: string): CandidateSequence {
  const subject = clean(input.subject) || "the subject";
  const facts = uniq([...input.sourceMoments, ...input.facts], count);
  const lines: string[] = [];
  for (let i = 0; i < Math.max(0, count - (endpoint ? 1 : 0)); i += 1) {
    const fact = facts[i] ?? facts[facts.length - 1];
    if (fact) lines.push(factLine(subject, fact));
  }
  while (lines.length < Math.max(0, count - (endpoint ? 1 : 0))) lines.push(`${subject}.`);
  if (endpoint) lines.push(endpoint);
  return { lines: lines.slice(0, count) };
}

function roleFor(index: number, total: number): ViewerAttentionRole {
  if (index === total - 1) return "payoff";
  if (index === 0) return "hook";
  if (index === 1) return "reframe";
  return "escalation";
}

function gainFor(index: number, total: number): SequenceGainKind {
  if (index === total - 1) return "payoff";
  if (index === 1) return "reframe";
  if (index >= 2) return "escalation";
  return "surprise";
}

function buildSequence(subject: string, candidate: CandidateSequence, jobs: SemanticJob[], score: number): SequencePlay {
  const known: string[] = [];
  const cuts: SequenceCut[] = candidate.lines.map((text, index) => {
    const job = jobs[index] ?? jobs[jobs.length - 1]!;
    const before: ViewerState = { known: [...known], expected: index ? jobs[index - 1]?.nextPull : undefined, unresolved: index ? jobs[index - 1]?.change : undefined, currentWant: job.nextPull, recentChange: index ? jobs[index - 1]?.change : undefined };
    known.push(text);
    const after: ViewerState = { known: [...known], expected: job.nextPull, unresolved: job.nextPull, currentWant: job.nextPull, recentChange: `${job.change}: ${text}` };
    return {
      id: `author-cut-${index + 1}`,
      order: index + 1,
      role: roleFor(index, candidate.lines.length),
      gainKind: gainFor(index, candidate.lines.length),
      sourceIds: [`line:${index + 1}`],
      informationGain: job.change,
      attentionDelta: job.expressionJob,
      viewerBefore: before,
      viewerAfter: after,
      nextPromise: job.nextPull,
      payoffConnection: index === candidate.lines.length - 1 ? text : undefined,
      noveltyScore: metric(index === 0 ? 1 : 1 - overlap(text, candidate.lines[index - 1] ?? "")),
      confidence: score,
    };
  });
  return {
    subject,
    premise: jobs[0]?.change ?? "earned change",
    openingState: cuts[0]?.viewerBefore ?? { known: [] },
    baselineFacts: [],
    cuts,
    closingState: cuts.at(-1)?.viewerAfter,
    continuity: candidate.lines,
    antiCrutch: ["no summary", "no explanation", "no unsupported concrete detail", "no unsupported subject attributes", "rejected output never rendered"],
  };
}

function sceneKind(index: number, total: number): AuthorScene["kind"] {
  if (index === 0) return "hook";
  if (index === total - 1) return "payoff";
  if (index === total - 2) return "turn";
  return index === 1 ? "discovery" : "movement";
}

export async function authorBrainUniversal(input: AuthorBrainTruth): Promise<AuthorResult> {
  const subject = clean(input.subject) || "the subject";
  const endpoint = endpointFromPrompt(input.prompt);
  const count = requestedLineCount(input.prompt);
  const facts = evidenceFor(input);
  const jobs = semanticJobs(input, count, endpoint);
  const brief = buildBrief(input, endpoint);
  const messages = buildPrompt(input, jobs, endpoint);

  const modelResult = await localModelGenerate(messages, "json", {
    numPredict: Math.min(2048, Math.max(1024, count * 320)),
    temperature: 0.52,
  });

  const candidates = parseBatch(modelResult.text, count);
  const accepted: Array<{ candidate: CandidateSequence; score: number }> = [];
  const rejected: Rejection[] = [];
  candidates.forEach((candidate, index) => {
    const result = validate(candidate, input, endpoint);
    if (result.ok) accepted.push({ candidate, score: result.score });
    else rejected.push({ index: index + 1, reasons: result.reasons, score: result.score });
  });

  accepted.sort((a, b) => b.score - a.score);
  let selected = accepted[0];
  let safeFallbackUsed = false;
  if (!selected) {
    const fallback = buildSafeFallback(input, count, endpoint);
    const validation = validate(fallback, input, endpoint);
    if (validation.ok) {
      selected = { candidate: fallback, score: validation.score };
      safeFallbackUsed = true;
    } else {
      return {
        brief,
        scenes: [],
        sequence: undefined,
        field: { prompt: clean(input.prompt), subject, facts, jobs },
        diagnostics: {
          model: modelResult.model,
          modelCalls: 1,
          qualityStatus: "REJECTED_MODEL_OUTPUT",
          renderable: false,
          candidateSequences: candidates.length,
          acceptedCandidates: 0,
          rejectedCandidates: [...rejected, { index: 0, reasons: ["safe_fallback_failed", ...validation.reasons], score: validation.score }],
          qualityFloor: MIN_SEQUENCE_SCORE,
          safeFallbackUsed: false,
          complete: false,
        },
      };
    }
  }

  const sequence = buildSequence(subject, selected.candidate, jobs, selected.score);
  const scenes: AuthorScene[] = selected.candidate.lines.map((text, index, all) => ({ text, kind: sceneKind(index, all.length) }));

  return {
    brief,
    scenes,
    sequence,
    field: { prompt: clean(input.prompt), subject, facts, jobs, endpoint },
    diagnostics: {
      model: modelResult.model,
      modelCalls: 1,
      qualityStatus: safeFallbackUsed ? "ACCEPTED_SAFE_FALLBACK" : "ACCEPTED",
      renderable: true,
      candidateSequences: candidates.length,
      acceptedCandidates: accepted.length,
      rejectedCandidates: rejected,
      selectedScore: selected.score,
      qualityFloor: MIN_SEQUENCE_SCORE,
      lineCount: scenes.length,
      endpoint,
      endpointExact: endpoint ? clean(scenes.at(-1)?.text).toLowerCase() === endpoint.toLowerCase() : true,
      complete: true,
      antiTrash: {
        unsupportedConcrete: true,
        unsupportedSubjectAttributes: true,
        explanationBlocked: true,
        decorativeProseBlocked: true,
        duplicateLinesBlocked: true,
        scoreFloorEnforced: true,
        rejectedOutputNeverRendered: true,
        safeEvidenceFallback: true,
      },
      safeFallbackUsed,
    },
  };
}
