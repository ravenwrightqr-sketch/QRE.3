import type {
  AuthorBrainTruth,
  AuthorCreativeBrief,
  AuthorResult,
  AuthorRhythm,
  AuthorScene,
} from "@qre/contracts";
import type {
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

const MIN_SEQUENCE_SCORE = 0.82;
const MAX_CANDIDATES = 4;

const clean = (value: unknown): string =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();

const uniq = (values: readonly string[], limit = 24): string[] =>
  [...new Set(values.map(clean).filter(Boolean))].slice(0, limit);

const tokens = (text: string): string[] =>
  clean(text)
    .toLowerCase()
    .split(/[^a-z0-9'-]+/i)
    .filter((token) => token.length >= 2);

const tokenSet = (text: string): Set<string> => new Set(tokens(text));

function metric(value: number): number {
  return Number(Math.max(0, Math.min(1, value)).toFixed(3));
}

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
  return clean(value)
    .replace(/^(?:[-*•]|\d+[.)])\s*/u, "")
    .replace(/^['\"]|['\"]$/g, "")
    .trim();
}

function hasPlaceholder(line: string): boolean {
  return /\b(?:line\s*\d+|your\s+line|insert|placeholder|tbd|lorem ipsum)\b/i.test(line);
}

function hasMetaLanguage(line: string): boolean {
  return /\b(?:this means|this reveals|this shows|the viewer|the audience|the strategy|the beat|the line|the point is|as an ai|attention function|creative move|cognitive|the reader)\b/i.test(line);
}

function hasGenericFiller(line: string): boolean {
  return /\b(?:beautiful transformation|magical moment|unforgettable experience|incredible journey|newfound confidence|a testament to|making memories|cherished moment|one for the books|totally fabulous|truly amazing|absolutely adorable)\b/i.test(line);
}

function hasExplanatoryGlue(line: string): boolean {
  return /\b(?:because|therefore|as a result|which means|which made|so that|this is why|in order to|thus)\b/i.test(line);
}

function hasDecorativeProse(line: string): boolean {
  return /\b(?:warm|gently|softly|quietly|beautifully|gracefully|dramatically|magically|suddenly|actually|totally|completely|deeply|heartwarming|poetically|under the|beneath the|in the air|stepping into)\b/i.test(line);
}

function isFigurativeFraming(text: string): boolean {
  return (
    /\blike (?:a|an)\b/i.test(text) ||
    /\bas if\b/i.test(text) ||
    /\bas though\b/i.test(text) ||
    /\bapparently\b/i.test(text) ||
    /\bseemed like\b/i.test(text) ||
    /\bthe room\b.*\bapproved\b/i.test(text)
  );
}

const CONCRETE_INVENTION_WORDS =
  /\b(?:tail|tails|legs|leg|ears|ear|paws|paw|eyes|eye|mouth|teeth|face|head|hands|hand|feet|foot|counter|dresser|door|outside|inside|street|car|park|office|room|chair|table|bed|floor|steam|water|bathwater|towel|mirror|window|leash|collar|coat|hat|shaking|shook|trembled|trembling|shivering|strutting|running|walked|walking|ran|jumped|jumping|hugged|smiled|laughed|cried|whispered|yelled)\b/i;

const CONCRETE_PERSON_WORDS =
  /\b(?:man|woman|boy|girl|male|female|husband|wife|father|mother|dad|mom|lawyer|judge|king|queen|boss|manager|officer|celebrity|star|doctor|nurse|friend|stranger|customer|owner|employee)\b/gi;

const GENDER_WORDS =
  /\b(?:his|her|him|he|she|husband|wife|man|woman|male|female|boy|girl)\b/i;

function knownText(input: AuthorBrainTruth): string {
  return clean([
    input.subject,
    input.place,
    ...input.facts,
    ...input.sourceMoments,
    ...(input.memoryContext ?? []),
    ...(input.presenceSummary ?? []),
  ].join(" ")).toLowerCase();
}

function hasUnsupportedConcreteDetail(line: string, input: AuthorBrainTruth): string | undefined {
  const lower = line.toLowerCase();
  const known = knownText(input);
  const figurative = isFigurativeFraming(line);

  const gendered = GENDER_WORDS.exec(lower);
  GENDER_WORDS.lastIndex = 0;
  if (gendered && !new RegExp(`\\b${gendered[0]}\\b`, "i").test(known)) {
    return `unsupported_person_or_gender:${gendered[0]}`;
  }

  if (CONCRETE_INVENTION_WORDS.test(lower)) {
    const concrete = lower.match(CONCRETE_INVENTION_WORDS)?.[0] ?? "concrete_detail";
    if (!known.includes(concrete)) {
      return `unsupported_concrete_detail:${concrete}`;
    }
  }

  CONCRETE_PERSON_WORDS.lastIndex = 0;
  if (!figurative && CONCRETE_PERSON_WORDS.test(lower)) {
    const person = lower.match(CONCRETE_PERSON_WORDS)?.[0] ?? "person";
    CONCRETE_PERSON_WORDS.lastIndex = 0;
    if (!known.includes(person)) {
      return `unsupported_person:${person}`;
    }
  }
  CONCRETE_PERSON_WORDS.lastIndex = 0;

  return undefined;
}

function lineShape(line: string): string {
  const normalized = normalizeLine(line);
  return normalized
    .toLowerCase()
    .replace(/\b(?:the|a|an)\b/g, "DET")
    .replace(/\b\d+\b/g, "NUM")
    .replace(/\b[a-z]+(?:ed|ing|s)\b/g, "VERB")
    .replace(/\b[a-z]+\b/g, "WORD");
}

function acceptableLine(
  line: string,
  isEndpoint: boolean,
  input: AuthorBrainTruth,
): { ok: boolean; reasons: string[] } {
  const normalized = normalizeLine(line);
  const reasons: string[] = [];
  const count = tokens(normalized).length;

  if (!normalized) reasons.push("empty");
  if (hasPlaceholder(normalized)) reasons.push("placeholder");
  if (hasMetaLanguage(normalized)) reasons.push("meta_language");
  if (hasGenericFiller(normalized)) reasons.push("generic_filler");
  if (hasExplanatoryGlue(normalized)) reasons.push("explanatory_glue");
  if (hasDecorativeProse(normalized)) reasons.push("decorative_prose");
  if (count < 1 || count > 9) reasons.push("wrong_length");
  if (/```|^\{|^\[|[{}]/.test(normalized)) reasons.push("format_noise");
  if (/\?{2,}|!{3,}/.test(normalized)) reasons.push("punctuation_noise");

  const invention = hasUnsupportedConcreteDetail(normalized, input);
  if (invention) reasons.push(invention);

  if (isEndpoint && normalizeLine(normalized).toLowerCase() !== clean(input.prompt).toLowerCase()) {
    // Endpoint exactness is handled separately because the endpoint is allowed to differ from the prompt.
  }

  return { ok: reasons.length === 0, reasons };
}

function semanticJobs(
  input: AuthorBrainTruth,
  count: number,
  endpoint: string,
): SemanticJob[] {
  const evidence = uniq([
    ...input.sourceMoments,
    ...input.facts,
    ...(input.memoryContext ?? []),
    ...(input.presenceSummary ?? []),
  ], 32);

  const first = evidence[0] ?? "the strongest supplied detail";
  const second = evidence[1] ?? first;
  const third = evidence[2] ?? second;
  const fourth = evidence[3] ?? third;
  const jobs: SemanticJob[] = [];
  const roles: SemanticJob["role"][] = ["hook", "turn", "escalation", "reframe", "payoff"];

  for (let index = 0; index < count; index += 1) {
    const role = endpoint && index === count - 1 ? "payoff" : roles[Math.min(index, roles.length - 2)]!;

    switch (role) {
      case "hook":
        jobs.push({
          order: index + 1,
          role,
          change: "establish the starting behavior without explaining it",
          expressionJob: `Open on the most character-revealing supplied detail (${first}) in a short conversational line. Show, do not summarize.`,
          nextPull: "make the next change feel worth seeing",
        });
        break;
      case "turn":
        jobs.push({
          order: index + 1,
          role,
          change: "change the reader's first interpretation",
          expressionJob: `Use a different supplied detail (${second}) to change how the first line reads. Keep it short and behavioral.`,
          nextPull: "create a stronger character read",
        });
        break;
      case "escalation":
        jobs.push({
          order: index + 1,
          role,
          change: "turn behavior or an object into character evidence",
          expressionJob: `Use the supplied behavior/object (${third}) as evidence of attitude, status, or personality. Figurative framing is allowed. Do not invent a literal event.`,
          nextPull: "make the next line feel necessary",
        });
        break;
      case "reframe":
        jobs.push({
          order: index + 1,
          role,
          change: "deepen or recontextualize what came before",
          expressionJob: `Use another supplied detail (${fourth}) to deepen, callback, or reframe the sequence. Say less than an explanation would.`,
          nextPull: endpoint ? "land the ending" : "leave a clean forward pull",
        });
        break;
      case "payoff":
        jobs.push({
          order: index + 1,
          role,
          change: "land the earned ending",
          expressionJob: `Use the exact supplied payoff. Final line must be exactly: ${endpoint}`,
          nextPull: "finish and stop",
        });
        break;
    }
  }

  return jobs;
}

function buildBrief(input: AuthorBrainTruth, endpoint: string): AuthorCreativeBrief {
  const evidence = uniq([...input.sourceMoments, ...input.facts], 16);
  const subject = clean(input.subject) || "the subject";
  const first = evidence[0] ?? "the supplied reality";
  const second = evidence[1] ?? "the next detail";

  return {
    angle: `${subject}: behavior reveals character`,
    engine: "change → behavior → implication → payoff",
    question: endpoint ? "How does the ending become inevitable?" : "What changes next?",
    strongestImage: first,
    tension: `${first} ↔ ${second}`,
    payoff: endpoint || evidence[evidence.length - 1] || "earned ending",
    callback: evidence.length > 1 ? second : first,
    rhythm: ["short", "short", "hit", "hit", "short"] as AuthorRhythm[],
    avoid: ["summary", "explanation", "poetic filler", "generic inspiration", "invented literal events", "repeated sentence shape"],
  };
}

function buildPrompt(input: AuthorBrainTruth, jobs: SemanticJob[], endpoint: string): Array<{ role: "system" | "user"; content: string }> {
  const count = jobs.length;
  const subject = clean(input.subject) || "the subject";
  const evidence = uniq([
    ...input.sourceMoments,
    ...input.facts,
    ...(input.memoryContext ?? []),
    ...(input.presenceSummary ?? []),
  ], 28);
  const evidenceText = evidence.join(" | ");
  const hasSuppliedGender = GENDER_WORDS.test(evidenceText);
  GENDER_WORDS.lastIndex = 0;

  const system = [
    "QRE FINAL LANGUAGE INSTRUMENT.",
    "QRE owns reality, meaning, sequence, and truth. You own wording only.",
    `SUBJECT AUTHORITY: the subject is exactly ${subject}. Do not change the subject identity.`,
    hasSuppliedGender
      ? "Gendered language may be used only when directly supported by the supplied evidence."
      : "NO GENDER IS SUPPLIED. Do not use he, she, him, her, his, male, female, boy, girl, man, woman, husband, or wife. This is a hard factual constraint, not a style preference.",
    "A pronoun is a factual claim. If the evidence does not authorize it, repeat the subject name or omit the pronoun.",
    "WRITE SHORT, CONVERSATIONAL, ADDICTIVE SEQUENCES.",
    "Every line must change, sharpen, or deepen what came before.",
    "Reveal character through behavior and status, not explanation.",
    "Prefer compression over connective tissue.",
    "No poetic prose. No literary description. No decorative atmosphere.",
    "Do not summarize the facts. Perform the meaning.",
    "Do not explain the joke, meaning, emotion, strategy, or structure.",
    "Different lines must have different rhythm or syntax.",
    "Every non-endpoint line must be 1–9 words. Prefer 3–7 words.",
    "Never invent a literal person, place, object, body reaction, dialogue, chronology, setting, or outcome.",
    "Figurative framing is legal only when it does not assert a new literal fact.",
    "Do not add sensory decoration such as warm water, steam, lighting, atmosphere, or movement unless supplied.",
    endpoint ? `The final line MUST be exactly: ${endpoint}` : "",
    "",
    `Return complete candidate sequences with exactly ${count} lines each. Do not return fewer than one valid candidate.`,
    "Return JSON only:",
    '{"candidateSequences":[{"lines":["LINE 1","LINE 2","LINE 3"]}]}',
  ].filter(Boolean).join("\n");

  const user = {
    task: "execute_sequence_jobs",
    subject,
    subjectAuthority: {
      name: subject,
      genderSupplied: hasSuppliedGender,
      forbiddenIfUnsupplied: ["he", "she", "him", "her", "his", "male", "female", "boy", "girl", "man", "woman", "husband", "wife"],
    },
    prompt: clean(input.prompt),
    lens: clean(input.lens),
    facts: evidence,
    jobs,
    priorContext: uniq([...(input.trajectory ?? []), ...(input.creativeLearningContext ?? [])], 12),
    returning: Boolean(input.returning),
    visitNumber: input.visitNumber ?? null,
  };

  return [
    { role: "system", content: system },
    { role: "user", content: JSON.stringify(user) },
  ];
}

function parseBatch(raw: string, count: number): CandidateSequence[] {
  const text = clean(raw)
    .replace(/^```(?:json|text|txt)?/i, "")
    .replace(/```$/i, "")
    .trim();
  if (!text) return [];

  try {
    const parsed = JSON.parse(text) as CandidateBatch;
    if (!Array.isArray(parsed.candidateSequences)) return [];

    return parsed.candidateSequences
      .filter((entry): entry is { lines?: unknown } => Boolean(entry) && typeof entry === "object")
      .map((entry) => ({
        lines: Array.isArray(entry.lines) ? entry.lines.map(normalizeLine) : [],
      }))
      .filter((candidate) => candidate.lines.length === count)
      .slice(0, MAX_CANDIDATES);
  } catch {
    return [];
  }
}

function overlap(a: string, b: string): number {
  const left = tokenSet(a);
  const right = tokenSet(b);
  if (!left.size || !right.size) return 0;
  let shared = 0;
  for (const token of left) if (right.has(token)) shared += 1;
  return shared / Math.max(left.size, right.size);
}

function lineHasGrounding(line: string, evidence: string[]): boolean {
  return evidence.some((fact) => overlap(line, fact) >= 0.2);
}

function sequenceScore(candidate: CandidateSequence, input: AuthorBrainTruth, endpoint: string): number {
  const evidence = uniq([
    ...input.sourceMoments,
    ...input.facts,
    ...(input.memoryContext ?? []),
    ...(input.presenceSummary ?? []),
  ], 32);
  const lines = candidate.lines;

  const lineScores = lines.map((line, index) => {
    const words = tokens(line).length;
    const brevity = words <= 6 ? 1 : words <= 8 ? 0.8 : 0.35;
    const grounding = lineHasGrounding(line, evidence) ? 1 : 0.65;
    const distinct = index === 0 ? 1 : 1 - overlap(line, lines[index - 1] ?? "");
    const style = !/[,:;]/.test(line) && !hasExplanatoryGlue(line) && !hasDecorativeProse(line) ? 1 : 0.35;
    return brevity * 0.30 + grounding * 0.22 + distinct * 0.28 + style * 0.20;
  });

  const rhythm = metric(new Set(lines.map((line) => tokens(line).length)).size / Math.min(lines.length, 4));
  const endpointScore = endpoint
    ? clean(lines[lines.length - 1]).toLowerCase() === clean(endpoint).toLowerCase() ? 1 : 0
    : 1;
  const shapeCount = new Set(lines.slice(0, -1).map(lineShape)).size;
  const shapeVariety = metric(shapeCount / Math.max(1, Math.min(lines.length - 1, 4)));

  return metric(
    (lineScores.reduce((sum, value) => sum + value, 0) / Math.max(1, lineScores.length)) * 0.66 +
      rhythm * 0.12 +
      shapeVariety * 0.12 +
      endpointScore * 0.10,
  );
}

function validateCandidate(
  candidate: CandidateSequence,
  input: AuthorBrainTruth,
  endpoint: string,
): { ok: boolean; reasons: string[]; score: number } {
  const reasons: string[] = [];

  candidate.lines.forEach((line, index) => {
    const result = acceptableLine(line, Boolean(endpoint && index === candidate.lines.length - 1), input);
    if (!result.ok) {
      for (const reason of result.reasons) {
        reasons.push(`line_${index + 1}:${reason}`);
      }
    }
  });

  if (endpoint && clean(candidate.lines[candidate.lines.length - 1]).toLowerCase() !== clean(endpoint).toLowerCase()) {
    reasons.push("endpoint_mismatch");
  }

  const normalizedLines = candidate.lines.map((line) => clean(line).toLowerCase());
  if (new Set(normalizedLines).size !== normalizedLines.length) {
    reasons.push("duplicate_lines");
  }

  const score = sequenceScore(candidate, input, endpoint);
  if (score < MIN_SEQUENCE_SCORE) reasons.push(`score_below_floor:${score}`);

  return { ok: reasons.length === 0, reasons, score };
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

function jobToState(job: SemanticJob, text: string, known: string[]): ViewerState {
  return {
    known,
    expected: job.nextPull,
    unresolved: job.nextPull,
    currentWant: job.nextPull,
    recentChange: `${job.change}: ${text}`,
  };
}

function buildSequence(subject: string, candidate: CandidateSequence, jobs: SemanticJob[], score: number): SequencePlay {
  const known: string[] = [];
  const cuts: SequenceCut[] = candidate.lines.map((text, index) => {
    const job = jobs[index] ?? jobs[jobs.length - 1]!;
    const before: ViewerState = {
      known: [...known],
      expected: index === 0 ? undefined : jobs[index - 1]?.nextPull,
      unresolved: index === 0 ? undefined : jobs[index - 1]?.change,
      currentWant: job.nextPull,
      recentChange: index === 0 ? undefined : jobs[index - 1]?.change,
    };
    known.push(text);
    const after = jobToState(job, text, [...known]);
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
    closingState: cuts[cuts.length - 1]?.viewerAfter,
    continuity: candidate.lines,
    antiCrutch: ["no summary", "no explanation", "no repeated sentence shape", "no unsupported concrete detail"],
  };
}

function sceneKind(index: number, total: number): AuthorScene["kind"] {
  if (index === 0) return "hook";
  if (index === total - 1) return "payoff";
  if (index === total - 2) return "turn";
  return index === 1 ? "discovery" : "movement";
}

function buildBriefResult(input: AuthorBrainTruth, endpoint: string): AuthorCreativeBrief {
  return buildBrief(input, endpoint);
}

export async function authorBrainUniversal(input: AuthorBrainTruth): Promise<AuthorResult> {
  const subject = clean(input.subject) || "the subject";
  const endpoint = endpointFromPrompt(input.prompt);
  const count = requestedLineCount(input.prompt);
  const facts = uniq([
    ...input.facts,
    ...input.sourceMoments,
    ...(input.memoryContext ?? []),
    ...(input.presenceSummary ?? []),
  ], 32);
  const jobs = semanticJobs(input, count, endpoint);
  const brief = buildBriefResult(input, endpoint);
  const messages = buildPrompt(input, jobs, endpoint);

  const modelResult = await localModelGenerate(messages, "json", {
    numPredict: Math.min(2048, Math.max(1024, count * 320)),
    temperature: 0.62,
  });

  const rawCandidates = parseBatch(modelResult.text, count);
  const accepted: Array<{ candidate: CandidateSequence; score: number }> = [];
  const rejected: Array<{ index: number; reasons: string[]; score: number }> = [];

  rawCandidates.forEach((candidate, index) => {
    const validation = validateCandidate(candidate, input, endpoint);
    if (!validation.ok) {
      rejected.push({ index: index + 1, reasons: validation.reasons, score: validation.score });
      return;
    }
    accepted.push({ candidate, score: validation.score });
  });

  accepted.sort((a, b) => b.score - a.score);
  const selected = accepted[0];

  if (!selected) {
    return {
      brief,
      scenes: [],
      sequence: undefined,
      field: {
        prompt: clean(input.prompt),
        subject,
        facts,
        jobs,
      },
      diagnostics: {
        model: modelResult.model,
        modelCalls: 1,
        qualityStatus: "REJECTED_MODEL_OUTPUT",
        renderable: false,
        candidateSequences: rawCandidates.length,
        acceptedCandidates: 0,
        rejectedCandidates: rejected,
        qualityFloor: MIN_SEQUENCE_SCORE,
        safeFallbackUsed: false,
        complete: false,
      },
    };
  }

  const sequence = buildSequence(subject, selected.candidate, jobs, selected.score);
  const scenes: AuthorScene[] = selected.candidate.lines.map((text, index, all) => ({
    text,
    kind: sceneKind(index, all.length),
  }));

  return {
    brief,
    scenes,
    sequence,
    field: {
      prompt: clean(input.prompt),
      subject,
      facts,
      jobs,
      endpoint,
    },
    diagnostics: {
      model: modelResult.model,
      modelCalls: 1,
      qualityStatus: "ACCEPTED",
      renderable: true,
      candidateSequences: rawCandidates.length,
      acceptedCandidates: accepted.length,
      rejectedCandidates: rejected,
      selectedScore: selected.score,
      qualityFloor: MIN_SEQUENCE_SCORE,
      lineCount: scenes.length,
      endpoint,
      endpointExact: endpoint ? clean(scenes[scenes.length - 1]?.text).toLowerCase() === endpoint.toLowerCase() : true,
      complete: true,
      antiTrash: {
        unsupportedConcrete: true,
        unsupportedSubjectAttributes: true,
        explanationBlocked: true,
        decorativeProseBlocked: true,
        duplicateLinesBlocked: true,
        scoreFloorEnforced: true,
        rejectedOutputNeverRendered: true,
      },
    },
  };
}
