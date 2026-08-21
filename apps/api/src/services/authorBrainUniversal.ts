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
  return /\b(?:this means|this reveals|this shows|the viewer|the audience|the strategy|the beat|the line|the point is|as an ai|attention function|creative move|cognitive)\b/i.test(
    line,
  );
}

function hasGenericFiller(line: string): boolean {
  return /\b(?:beautiful transformation|magical moment|unforgettable experience|incredible journey|newfound confidence|a testament to|making memories|cherished moment|one for the books)\b/i.test(
    line,
  );
}

function acceptableLine(line: string, isEndpoint: boolean): boolean {
  const normalized = normalizeLine(line);
  const count = tokens(normalized).length;
  if (!normalized || hasPlaceholder(normalized) || hasMetaLanguage(normalized) || hasGenericFiller(normalized)) return false;
  if (count < 1 || count > 9) return false;
  if (/```|^\{|^\[|[{}]/.test(normalized)) return false;
  if (isEndpoint) return true;
  if (/\?{2,}|!{3,}/.test(normalized)) return false;
  return true;
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
  const roles: SemanticJob["role"][] = [
    "hook",
    "turn",
    "escalation",
    "reframe",
    "payoff",
  ];

  for (let index = 0; index < count; index += 1) {
    const role = endpoint && index === count - 1
      ? "payoff"
      : roles[Math.min(index, roles.length - 2)]!;

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
  const evidence = uniq([
    ...input.sourceMoments,
    ...input.facts,
  ], 16);
  const subject = clean(input.subject) || "the subject";
  const first = evidence[0] ?? "the supplied reality";
  const second = evidence[1] ?? "the next detail";
  const tension = first && second ? `${first} ↔ ${second}` : first;

  return {
    angle: `${subject}: behavior reveals character`,
    engine: "change → behavior → implication → payoff",
    question: endpoint ? `How does the ending become inevitable?` : "What changes next?",
    strongestImage: first,
    tension,
    payoff: endpoint || evidence.at(-1) || "earned ending",
    callback: evidence.length > 1 ? second : first,
    rhythm: ["short", "short", "hit", "hit", "short"].slice(0, Math.max(3, Math.min(5, evidence.length + 1))) as AuthorRhythm[],
    avoid: [
      "summary",
      "explanation",
      "poetic filler",
      "generic inspiration",
      "invented literal events",
      "repeating the same sentence shape",
    ],
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

  const system = [
    "QRE FINAL LANGUAGE INSTRUMENT.",
    "QRE has already decided what matters. You only write the language.",
    "",
    "WRITE SHORT, CONVERSATIONAL, ADDICTIVE SEQUENCES.",
    "Every line must change, sharpen, or deepen the line before it.",
    "Reveal character through behavior, not explanation.",
    "Do not summarize the supplied facts.",
    "Do not explain the joke, meaning, emotion, strategy, or structure.",
    "Do not sound poetic, literary, inspirational, or cinematic-by-description.",
    "Avoid decorative metaphors. Useful figurative framing is legal when it clarifies character or attitude without inventing a literal event.",
    "Different lines must feel different. Do not repeat the same sentence pattern.",
    "Use only supplied reality plus safe interpretation of that reality.",
    "Never invent a literal person, place, object, action, dialogue, chronology, reaction, or outcome.",
    "A figurative phrase such as 'like a lawyer already notified' is legal framing, not a literal lawyer event.",
    endpoint ? `The final line MUST be exactly: ${endpoint}` : "",
    "",
    `Return exactly 4 candidate sequences. Each sequence contains exactly ${count} lines.`,
    "Return JSON only in this shape:",
    '{"candidateSequences":[{"lines":["LINE 1","LINE 2","LINE 3"]},{"lines":["..."]}]}',
  ].filter(Boolean).join("\n");

  const user = {
    task: "execute_sequence_jobs",
    subject,
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
      .slice(0, 4);
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

function sequenceScore(candidate: CandidateSequence, evidence: string[], endpoint: string): number {
  const lines = candidate.lines;
  const lineScores = lines.map((line, index) => {
    const words = tokens(line).length;
    const brevity = words <= 6 ? 1 : words <= 8 ? 0.8 : 0.4;
    const grounding = evidence.some((fact) => overlap(line, fact) >= 0.2) ? 1 : 0.55;
    const distinct = index === 0 ? 1 : 1 - overlap(line, lines[index - 1] ?? "");
    const style = !/[,:;]/.test(line) ? 1 : 0.7;
    return brevity * 0.32 + grounding * 0.22 + distinct * 0.30 + style * 0.16;
  });

  const rhythm = lines.length <= 1
    ? 1
    : metric(new Set(lines.map((line) => tokens(line).length)).size / Math.min(lines.length, 4));

  const endpointScore = endpoint
    ? (clean(lines.at(-1)).toLowerCase() === clean(endpoint).toLowerCase() ? 1 : 0)
    : 1;

  return metric(
    lineScores.reduce((sum, value) => sum + value, 0) / Math.max(1, lineScores.length) * 0.78 +
      rhythm * 0.12 +
      endpointScore * 0.10,
  );
}

function validateCandidate(candidate: CandidateSequence, endpoint: string): { ok: boolean; reasons: string[] } {
  const reasons: string[] = [];
  candidate.lines.forEach((line, index) => {
    if (!acceptableLine(line, Boolean(endpoint && index === candidate.lines.length - 1))) {
      reasons.push(`line_${index + 1}_failed_quality_gate`);
    }
  });
  if (endpoint && clean(candidate.lines.at(-1)).toLowerCase() !== endpoint.toLowerCase()) {
    reasons.push("endpoint_mismatch");
  }
  if (new Set(candidate.lines.map((line) => line.toLowerCase())).size !== candidate.lines.length) {
    reasons.push("duplicate_lines");
  }
  return { ok: reasons.length === 0, reasons };
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
    const job = jobs[index] ?? jobs.at(-1)!;
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
    closingState: cuts.at(-1)?.viewerAfter,
    continuity: candidate.lines,
    antiCrutch: ["no summary", "no explanation", "no repeated sentence shape"],
  };
}

function sceneKind(index: number, total: number): AuthorScene["kind"] {
  if (index === 0) return "hook";
  if (index === total - 1) return "payoff";
  if (index === total - 2) return "turn";
  return index === 1 ? "discovery" : "movement";
}

function briefFrom(input: AuthorBrainTruth, endpoint: string): AuthorCreativeBrief {
  return buildBrief(input, endpoint);
}

export async function authorBrainUniversal(input: AuthorBrainTruth): Promise<AuthorResult> {
  const subject = clean(input.subject) || "the subject";
  const facts = uniq([
    ...input.facts,
    ...input.sourceMoments,
    ...(input.memoryContext ?? []),
    ...(input.presenceSummary ?? []),
  ], 32);
  const endpoint = endpointFromPrompt(input.prompt);
  const count = requestedLineCount(input.prompt);
  const jobs = semanticJobs(input, count, endpoint);
  const brief = briefFrom(input, endpoint);
  const messages = buildPrompt(input, jobs, endpoint);

  const modelResult = await localModelGenerate(messages, "json", {
    numPredict: Math.min(2048, Math.max(1024, count * 320)),
    temperature: 0.82,
  });

  const rawCandidates = parseBatch(modelResult.text, count);
  const accepted: Array<{ candidate: CandidateSequence; score: number }> = [];
  const rejected: Array<{ index: number; reasons: string[] }> = [];

  rawCandidates.forEach((candidate, index) => {
    const validation = validateCandidate(candidate, endpoint);
    if (!validation.ok) {
      rejected.push({ index: index + 1, reasons: validation.reasons });
      return;
    }
    accepted.push({ candidate, score: sequenceScore(candidate, facts, endpoint) });
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
        candidateSequences: rawCandidates.length,
        acceptedCandidates: 0,
        rejectedCandidates: rejected,
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
      candidateSequences: rawCandidates.length,
      acceptedCandidates: accepted.length,
      rejectedCandidates: rejected,
      selectedScore: selected.score,
      lineCount: scenes.length,
      endpoint,
      endpointExact: endpoint ? clean(scenes.at(-1)?.text).toLowerCase() === endpoint.toLowerCase() : true,
      complete: true,
    },
  };
}
