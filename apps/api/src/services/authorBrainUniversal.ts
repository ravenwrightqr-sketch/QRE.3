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
import { buildMovieCognition } from "./authorMovieCognition.js";
import { localModelGenerate } from "./localModelRuntime.js";

type BeatFunction = "hook" | "question" | "turn" | "escalation" | "payoff";
type CreativeMove = "contrast" | "status_shift" | "understatement" | "unexpected_verb" | "social_friction" | "deadpan" | "callback" | "implication" | "absurd_escalation" | "double_meaning";
type Path = { id: string; thesis: string; move: CreativeMove; beats: Beat[]; budget: number; operation: string };
type Beat = { order: number; function: BeatFunction; source: string[]; change: string; setupFor?: number; paysOff?: number; creativeMove: CreativeMove };
type Candidate = { pathId: string; lines: string[] };
type BeatMetrics = { factuality: number; specificity: number; attention: number; novelty: number; statusChange: number; nextBeatPull: number; creativeMove: number; repetition: number; cinematicity: number };
type Validation = { ok: boolean; reasons: string[]; score: number; metrics: BeatMetrics[] };
type ReferencePolicy = { subject: string; mode: "explicit_name"; allowPronouns: false; allowIdentityInference: false; instruction: string };
type MovieLock = { approvedMeaning: string; creativeBudget: number; worldFreedom: "closed"; referencePolicy: ReferencePolicy; ending: string; sensitivity: "normal" | "sensitive"; preferredLens?: string; allowedMoves: CreativeMove[] };
type Packet = { subject: string; reality: string[]; ending: string; lineCount: number; maxWords: number; lock: MovieLock; paths: Path[]; thesis: string; movieCognition: ReturnType<typeof buildMovieCognition> };

const MIN_SCORE = 0.74;
const MIN_PULL = 0.34;
const PATH_IDS = ["shift", "deadpan", "pressure"] as const;
const META = /\b(?:as an ai|the audience|the viewer|this means|this shows|the strategy|the beat|according to qre|cognitive|the truth is|status feels|pressure builds|this is|never simple|the meaning|the transformation|the symbol|the tension|the contrast)\b/i;
const STOCK = /\b(?:magical moment|unforgettable experience|incredible journey|newfound confidence|a testament to|making memories|cherished moment|one for the books|once in a lifetime|heartwarming)\b/i;
const GLUE = /\b(?:therefore|as a result|which means|this is why|in order to|thus|ultimately)\b/i;
const DECORATION = /\b(?:beautifully|gracefully|dramatically|magically|poetically|gently|softly|wonderfully|incredibly|extremely|quiet tremor|silent storm|theft of grace|new face)\b/i;
const PRONOUN = /\b(?:he|she|him|her|his|hers|they|them|their|theirs)\b/i;
const RELATIONSHIP = /\b(?:husband|wife|partner|girlfriend|boyfriend|sister|brother|mother|father|son|daughter|friend|owner|boss|manager|lawyer|judge|doctor|nurse|employee|customer|officer)\b/i;
const PLACE = /\b(?:street|office|room|chair|table|bed|floor|counter|dresser|park|restaurant|hotel|house|kitchen|bathroom|store|shop|court|church|school|hospital)\b/i;
const BODY = /\b(?:tail|tails|legs|leg|ears|ear|paws|paw|eyes|eye|mouth|teeth|face|head|hands|hand|feet|foot|shoulder|hair|skin|body|gaze)\b/i;
const BODY_IDIOM = /\b(?:in|under|over|on)\s+(?:hand|hands)\b/i;
const SENSITIVE = /\b(?:memorial|funeral|tribute|grief|grieving|bereavement|condolence|passed away|death|deceased|eulogy)\b/i;
const CONTRAST = /\b(?:but|yet|still|until|instead|rather|then|suddenly|except|however|despite|temporary|again|already|finally)\b/i;
const STATUS = /\b(?:nervous|confident|quiet|loud|happy|sad|angry|excited|tired|ready|late|early|busy|empty|full|broken|fixed|clean|dirty|fresh|approved|rejected|missing|gone|fabulous|muddy|calm|bold|radiant|unsteady|successful|failed|resolved|unresolved)\b/i;
const ACTION = /\b(?:came|arrived|left|got|stole|found|sent|ordered|changed|ran|returned|noticed|redlined|repaired|disappeared|stayed|moved|laughed|waited|opened|closed|called|signed|checked|cleaned|placed|listed|reviewed|diagnosed|approved|emerged|departed|took|secured|settled|turned|shifted|drew|broke|held|talked|connected|met|served|paid)\b/i;

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const words = (value: string): string[] => clean(value).toLowerCase().split(/[^a-z0-9'-]+/i).filter(Boolean);
const tokens = (value: string): Set<string> => new Set(words(value).filter((word) => word.length > 2));
const metric = (value: number): number => Number(Math.max(0, Math.min(1, value)).toFixed(3));
const uniq = (values: readonly string[], limit = 64): string[] => [...new Set(values.map(clean).filter(Boolean))].slice(0, limit);

function overlap(a: string, b: string): number {
  const left = tokens(a); const right = tokens(b);
  if (!left.size || !right.size) return 0;
  let shared = 0; for (const token of left) if (right.has(token)) shared += 1;
  return shared / Math.max(left.size, right.size);
}

function lineCount(prompt: string): number {
  const match = clean(prompt).match(/\b(\d{1,2})\s*[- ]?\s*line(?:s)?\b/i);
  const n = match ? Number(match[1]) : 5;
  return Number.isFinite(n) ? Math.max(3, Math.min(8, n)) : 5;
}

function endpoint(prompt: string): string {
  const match = clean(prompt).match(/(?:final\s+line|ending|endpoint)\s*:\s*(.+)$/i);
  return clean(match?.[1] ?? "").replace(/^['\"]|['\"]$/g, "");
}

function reality(input: AuthorBrainTruth): string[] {
  return uniq([
    input.subject,
    input.place ?? "",
    ...input.facts,
    ...input.sourceMoments,
    ...(input.memoryContext ?? []),
    ...(input.presenceSummary ?? []),
    ...(input.trajectory ?? []),
  ]);
}

function creativeBudget(source: string[], prompt: string): number {
  const text = `${source.join(" | ")} ${prompt}`;
  if (SENSITIVE.test(text)) return 0.18;
  let score = 0.48;
  if (/\b(?:steal|stole|unexpected|suddenly|odd|strange|contradiction|returned|again|temporary|failed|missing)\b/i.test(text)) score += 0.22;
  if (/(final\s+line|ending|payoff|funny|comic|cinematic|playful|surprising|clever)/i.test(prompt)) score += 0.14;
  if (source.length >= 4) score += 0.08;
  return metric(score);
}

function sensitivity(prompt: string, source: string[]): "normal" | "sensitive" {
  return SENSITIVE.test(`${prompt} ${source.join(" ")}`) ? "sensitive" : "normal";
}

function moveForOperation(operation: string, fallback: CreativeMove): CreativeMove {
  switch (operation) {
    case "contrast": return "contrast";
    case "reframe": return "double_meaning";
    case "reversal": return "status_shift";
    case "amplification": return "absurd_escalation";
    case "echo": return "callback";
    case "enclosure": return "implication";
    case "reveal": return "unexpected_verb";
    case "implication": return "understatement";
    default: return fallback;
  }
}

function hypothesisSources(hypothesis: Packet["movieCognition"]["hypotheses"][number], subject: string): string[] {
  return uniq(hypothesis.sources.filter((value) => clean(value).toLowerCase() !== subject.toLowerCase()));
}

function makePaths(
  cognition: ReturnType<typeof buildMovieCognition>,
  subject: string,
  ending: string,
  budget: number,
  preferredLens?: string,
): Path[] {
  const hypotheses = cognition.hypotheses.length ? cognition.hypotheses.slice(0, 3) : [cognition.selected];
  const fallbackMoves: CreativeMove[] = ["status_shift", "deadpan", "social_friction"];

  return hypotheses.slice(0, 3).map((hypothesis, index) => {
    const id = PATH_IDS[index] ?? `path-${index + 1}`;
    const source = hypothesisSources(hypothesis, subject);
    const anchor = source[0] ?? subject;
    const turn = source[1] ?? anchor;
    const support = source[2] ?? turn;
    const move = preferredLens && index === 0 ? "status_shift" : moveForOperation(hypothesis.operation, fallbackMoves[index] ?? "contrast");
    const trajectory = hypothesis.trajectory.length ? [...hypothesis.trajectory] : [
      `Establish ${anchor}.`,
      `Let ${turn} change the expectation.`,
      `Let ${support} create the consequence.`,
      "Reframe the established read.",
    ];
    while (trajectory.length < 4) trajectory.push("Advance the earned consequence.");
    const changes = [...trajectory.slice(0, 4), ending || trajectory[trajectory.length - 1] || "Land the earned consequence."];

    return {
      id,
      thesis: hypothesis.premise,
      move,
      budget,
      operation: hypothesis.operation,
      beats: changes.map((change, beatIndex) => ({
        order: beatIndex + 1,
        function: beatIndex === 0 ? "hook" : beatIndex === 1 ? "question" : beatIndex === changes.length - 1 ? "payoff" : beatIndex === changes.length - 2 ? "escalation" : "turn",
        source: [source[Math.min(beatIndex, Math.max(0, source.length - 1))] ?? subject],
        change,
        setupFor: beatIndex < changes.length - 1 ? beatIndex + 2 : undefined,
        paysOff: beatIndex === changes.length - 2 ? changes.length : undefined,
        creativeMove: move,
      })),
    };
  });
}

function referencePolicy(subject: string): ReferencePolicy {
  return {
    subject,
    mode: "explicit_name",
    allowPronouns: false,
    allowIdentityInference: false,
    instruction: `SUBJECT REFERENCE IS CLOSED. Use exactly "${subject}". Never infer identity or substitute a pronoun.`,
  };
}

function modelMessage(packet: Packet): Array<{ role: "user"; content: string }> {
  const payload = {
    subject: packet.subject,
    reality: packet.reality,
    ending: packet.ending,
    creativeBudget: packet.lock.creativeBudget,
    approvedMeaning: packet.lock.approvedMeaning,
    movieCognition: {
      selected: packet.movieCognition.selected,
      hypotheses: packet.paths.map((path) => ({ id: path.id, operation: path.operation, thesis: path.thesis, beats: path.beats })),
    },
    paths: packet.paths,
    referencePolicy: packet.lock.referencePolicy,
    world: "closed",
  };

  const schema = packet.paths.map((path) => `{"pathId":"${path.id}","lines":["..."]}`).join(",");

  return [{
    role: "user",
    content: [
      "QRE MOUTH. QRE has already computed the movie trajectories. You are the language renderer only.",
      `Return JSON only using exactly: {"candidates":[${schema}]}.`,
      `Allowed pathId values are exactly: ${packet.paths.map((path) => `"${path.id}"`).join(", ")}.`,
      `Return exactly ${packet.paths.length} candidates, one for each path, in path order.`,
      `Each candidate has exactly ${packet.lineCount} lines. Each non-final line is ${packet.maxWords} words or fewer.`,
      packet.ending ? `Every candidate final line must be EXACTLY: ${packet.ending}` : "Finish on the earned consequence.",
      "Each path is a different movie hypothesis. Do not reuse another path's trajectory, beat order, or language merely to sound different.",
      "Realize the path's tension, operation, consequence, and payoff. Do not mechanically list the supplied facts.",
      "Every screen must earn the next screen: establish, create tension, redirect, escalate, reveal, resolve, or pay off.",
      "Use the lens only as framing pressure. The lens may change tone, emphasis, or interpretation, but it cannot create a new fact, person, object, place, relationship, body detail, or literal event.",
      "IMPORTANT: turn cognitive instructions into concrete movie language. Never write the instruction itself. Never write analysis words such as meaning, transformation, symbol, tension, contrast, pressure, interpretation, premise, operation, lens, or trajectory as the subject of a line.",
      "A line should normally contain a concrete supplied entity, action, state, object, place, or observable consequence. Make the viewer infer the meaning instead of explaining it.",
      "Prefer: concrete action + consequence + implication. Avoid: abstract noun + explanation.",
      "If a beat says 'reframe', 'reinterpret', 'increase relevance', or 'land meaning', do not repeat those words. Show the changed situation instead.",
      "Do not use generic analysis language such as 'the truth is', 'pressure builds', 'status feels', 'never simple', or 'this shows'.",
      "Do not explain the technique. Make the screen line itself perform the move.",
      "Use small creative moves when earned: contrast, status shift, understatement, unexpected verb, social friction, deadpan, callback, implication, absurd escalation, double meaning.",
      "Never invent a person, place, relationship, body detail, dialogue, sensory fact, object, or literal event. Interpretive framing is allowed; unsupported physical detail is not.",
      packet.lock.referencePolicy.instruction,
      "Creative budget is a ceiling, not a requirement. Sensitive material stays restrained.",
      JSON.stringify(payload),
    ].join("\n"),
  }];
}

function normalizeLine(value: unknown): string {
  return clean(value).replace(/^(?:[-*•]|\d+[.)])\s*/u, "").replace(/^['\"]|['\"]$/g, "").trim();
}

function parseCandidates(raw: string, count: number): Candidate[] {
  const text = clean(raw).replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  if (!text) return [];
  try {
    const parsed = JSON.parse(text) as unknown;
    const list = parsed && typeof parsed === "object" && Array.isArray((parsed as Record<string, unknown>).candidates)
      ? (parsed as Record<string, unknown>).candidates as unknown[]
      : [];
    return list.map((item, index) => {
      const record = item && typeof item === "object" ? item as Record<string, unknown> : {};
      const suppliedPathId = String(record.pathId ?? "").trim();
      const pathId = PATH_IDS.includes(suppliedPathId as (typeof PATH_IDS)[number])
        ? suppliedPathId
        : !suppliedPathId || suppliedPathId === PATH_IDS.join("|") ? PATH_IDS[index] ?? "" : suppliedPathId;
      return { pathId, lines: Array.isArray(record.lines) ? record.lines.map(normalizeLine).filter(Boolean) : [] };
    }).filter((candidate) => candidate.lines.length === count) as Candidate[];
  } catch {
    return [];
  }
}

function worldViolation(line: string, packet: Packet): string | undefined {
  const known = packet.reality.join(" ").toLowerCase();
  for (const [pattern, label] of [[RELATIONSHIP, "relationship"], [PLACE, "place"], [BODY, "body_detail"]] as const) {
    const match = line.match(pattern);
    if (!match) continue;
    const token = match[0].toLowerCase();
    if (label === "body_detail" && BODY_IDIOM.test(line)) continue;
    if (!known.includes(token)) return `unsupported_${label}`;
  }
  return undefined;
}

function replay(line: string, source: string): number {
  const a = clean(line).toLowerCase(); const b = clean(source).toLowerCase();
  return a === b || overlap(a, b) >= 0.92 ? 1 : 0;
}

function pull(line: string, nextBeat: Beat | undefined, move: CreativeMove): number {
  if (!nextBeat) return 1;
  let score = 0.25;
  if (CONTRAST.test(line)) score += 0.18;
  if (ACTION.test(line)) score += 0.08;
  if (STATUS.test(line)) score += 0.08;
  if (move === "callback" && /\b(?:again|still|back|already|returned)\b/i.test(line)) score += 0.18;
  if (move === "contrast" && CONTRAST.test(line)) score += 0.18;
  if (move === "understatement" && /\b(?:just|only|apparently|somehow|fine|quietly)\b/i.test(line)) score += 0.18;
  if (move === "double_meaning" && /\b(?:deal|case|clean|clear|settled|handled|left|fine)\b/i.test(line)) score += 0.18;
  if (move === "implication" && /\b(?:almost|seemed|looked|not yet|until)\b/i.test(line)) score += 0.18;
  if (nextBeat.change && overlap(line, nextBeat.change) < 0.7) score += 0.1;
  return metric(score);
}

function metrics(lines: string[], path: Path): BeatMetrics[] {
  return lines.map((line, index) => {
    const beat = path.beats[index]!;
    const previous = lines[index - 1] ?? "";
    const repetition = index > 0 && index < lines.length - 1 ? replay(line, beat.source.join(" ")) : 0;
    const novelty = metric(1 - overlap(line, previous));
    const specificity = metric(Math.min(1, tokens(line).size / 4));
    const statusChange = metric((STATUS.test(line) ? 0.45 : 0) + (ACTION.test(line) ? 0.35 : 0) + (CONTRAST.test(line) ? 0.2 : 0));
    const nextBeatPull = pull(line, path.beats[index + 1], beat.creativeMove);
    const moveScore = nextBeatPull >= 0.6 ? 1 : 0.45;
    const cinematicity = metric((ACTION.test(line) ? 0.35 : 0) + (tokens(line).size ? 0.35 : 0) + novelty * 0.3);
    return { factuality: 1, specificity, attention: metric(novelty * 0.5 + nextBeatPull * 0.5), novelty, statusChange, nextBeatPull: index === lines.length - 1 ? 1 : nextBeatPull, creativeMove: moveScore, repetition, cinematicity };
  });
}

function validate(candidate: Candidate, path: Path, packet: Packet): Validation {
  const reasons: string[] = [];
  const ms = metrics(candidate.lines, path);
  let replayCount = 0;

  candidate.lines.forEach((line, index) => {
    const count = words(line).length;
    if (!count) reasons.push(`line_${index + 1}:empty`);
    if (index < candidate.lines.length - 1 && count > packet.maxWords) reasons.push(`line_${index + 1}:wrong_length`);
    if (META.test(line)) reasons.push(`line_${index + 1}:meta_language`);
    if (STOCK.test(line)) reasons.push(`line_${index + 1}:stock_sentiment`);
    if (GLUE.test(line)) reasons.push(`line_${index + 1}:explanatory_glue`);
    if (DECORATION.test(line)) reasons.push(`line_${index + 1}:generic_decoration`);
    if (PRONOUN.test(line)) reasons.push(`line_${index + 1}:unsupported_identity_reference`);
    const violation = worldViolation(line, packet); if (violation) reasons.push(`line_${index + 1}:${violation}`);
    if (ms[index]?.repetition) replayCount += 1;
  });

  if (replayCount > 1) reasons.push(`mechanical_fact_replay:${replayCount}`);
  if (packet.ending && clean(candidate.lines.at(-1)).toLowerCase() !== packet.ending.toLowerCase()) reasons.push("endpoint_mismatch");
  if (new Set(candidate.lines.map((line) => line.toLowerCase())).size !== candidate.lines.length) reasons.push("duplicate_lines");

  const weakPull = ms.slice(0, -1).filter((m) => m.nextBeatPull < MIN_PULL).length;
  if (weakPull >= Math.max(2, Math.floor(candidate.lines.length / 2))) reasons.push(`weak_next_beat_pull:${weakPull}`);

  const transformation = ms.slice(1, -1).reduce((sum, m) => sum + (1 - m.repetition), 0) / Math.max(1, candidate.lines.length - 2);
  const pullScore = ms.slice(0, -1).reduce((sum, m) => sum + m.nextBeatPull, 0) / Math.max(1, candidate.lines.length - 1);
  const creativeScore = ms.reduce((sum, m) => sum + m.creativeMove, 0) / Math.max(1, ms.length);
  const cinematicScore = ms.reduce((sum, m) => sum + m.cinematicity, 0) / Math.max(1, ms.length);
  const payoff = packet.ending ? 1 : 0.8;
  const score = metric(transformation * 0.28 + pullScore * 0.32 + creativeScore * 0.15 + cinematicScore * 0.15 + payoff * 0.1);
  if (score < MIN_SCORE) reasons.push(`quality_below_floor:${score}`);
  return { ok: reasons.length === 0, reasons, score, metrics: ms };
}

function role(index: number, total: number): ViewerAttentionRole {
  if (index === 0) return "hook";
  if (index === 1) return "question";
  if (index === total - 1) return "payoff";
  if (index === total - 2) return "reframe";
  return "escalation";
}

function gain(index: number, total: number): SequenceGainKind {
  if (index === 0) return "baseline";
  if (index === total - 1) return "payoff";
  if (index === total - 2) return "reframe";
  if (index === 1) return "question";
  return "surprise";
}

function buildSequence(packet: Packet, path: Path, candidate: Candidate, score: number): SequencePlay {
  const cuts: SequenceCut[] = [];
  const known: string[] = [];
  const candidateMetrics = metrics(candidate.lines, path);

  candidate.lines.forEach((text, index) => {
    const beat = path.beats[index]!;
    const before: ViewerState = {
      known: [...known],
      expected: beat.change,
      unresolved: index ? path.beats[index - 1]?.change : undefined,
      currentWant: index < candidate.lines.length - 1 ? path.beats[index + 1]?.change : undefined,
      recentChange: index ? path.beats[index - 1]?.source.join(" ") : undefined,
    };
    known.push(text);
    const after: ViewerState = {
      known: [...known],
      expected: index < candidate.lines.length - 1 ? beat.change : undefined,
      unresolved: index < candidate.lines.length - 1 ? beat.change : undefined,
      currentWant: index < candidate.lines.length - 1 ? path.beats[index + 1]?.change : undefined,
      recentChange: beat.change,
    };
    cuts.push({
      id: `author-cut-${index + 1}`,
      order: index + 1,
      role: role(index, candidate.lines.length),
      gainKind: gain(index, candidate.lines.length),
      sourceIds: beat.source.map((_, sourceIndex) => `reality:${index}:${sourceIndex}`),
      informationGain: beat.change,
      attentionDelta: `nextBeatPull=${candidateMetrics[index]?.nextBeatPull ?? 0}`,
      viewerBefore: before,
      viewerAfter: after,
      nextPromise: index < candidate.lines.length - 1 ? path.beats[index + 1]?.change : undefined,
      payoffConnection: index === candidate.lines.length - 1 ? packet.ending || text : path.beats[index + 1]?.change,
      noveltyScore: candidateMetrics[index]?.novelty ?? 0,
      confidence: score,
    });
  });

  return {
    subject: packet.subject,
    premise: packet.lock.approvedMeaning,
    openingState: cuts[0]?.viewerBefore ?? { known: [] },
    baselineFacts: packet.reality,
    cuts,
    closingState: cuts.at(-1)?.viewerAfter,
    continuity: candidate.lines,
    antiCrutch: ["no description-only beats", "no fact parade", "no unsupported identity", "no unsupported world expansion", "no decorative filler", "ending must reframe", "rejected output never rendered"],
  };
}

function brief(packet: Packet): AuthorCreativeBrief {
  return {
    angle: packet.lock.approvedMeaning,
    engine: "reality → cognitive hypotheses → trajectory competition → lens pressure → mouth → truth gate → attention editor",
    question: packet.movieCognition.attentionQuestion,
    strongestImage: packet.movieCognition.selected.sources[1] ?? packet.subject,
    tension: packet.movieCognition.selected.tension,
    payoff: packet.ending || packet.movieCognition.selected.trajectory.at(-1) || packet.subject,
    callback: packet.movieCognition.selected.sources.at(-1) ?? packet.subject,
    rhythm: ["hit", "short", "hit", "short", "hit"] as AuthorRhythm[],
    avoid: ["description", "fact parade", "restatement", "generic decoration", "unsupported identity", "unsupported world expansion", "weak next-beat pull", "random invention", "abstract analysis prose"],
  };
}

export async function authorBrainUniversal(input: AuthorBrainTruth): Promise<AuthorResult> {
  const subject = clean(input.subject) || "the subject";
  const source = reality(input);
  const ending = endpoint(input.prompt);
  const lineTotal = lineCount(input.prompt);
  const maxWords = 7;
  const budget = creativeBudget(source, input.prompt);
  const movieCognition = buildMovieCognition(input, ending);
  const sensitive = sensitivity(input.prompt, source);
  const ref = referencePolicy(subject);
  const paths = makePaths(movieCognition, subject, ending, budget, input.lens);
  const selectedMovie = movieCognition.selected;
  const lock: MovieLock = {
    approvedMeaning: `${subject}: ${selectedMovie.premise}`,
    creativeBudget: budget,
    worldFreedom: "closed",
    referencePolicy: ref,
    ending,
    sensitivity: sensitive,
    preferredLens: input.lens,
    allowedMoves: paths.map((path) => path.move),
  };
  const packet: Packet = { subject, reality: source, ending, lineCount: lineTotal, maxWords, lock, paths, thesis: selectedMovie.premise, movieCognition };

  const modelResult = await localModelGenerate(modelMessage(packet), "json", {
    numPredict: Math.min(2400, Math.max(1200, lineTotal * paths.length * 140)),
    temperature: sensitive === "sensitive" ? 0.36 : 0.58,
  });

  const candidates = parseCandidates(modelResult.text, lineTotal);
  const accepted: Array<{ candidate: Candidate; path: Path; validation: Validation }> = [];
  const rejected: Array<{ pathId: string; reasons: string[]; score: number; metrics: BeatMetrics[] }> = [];

  for (const candidate of candidates) {
    const path = paths.find((value) => value.id === candidate.pathId);
    if (!path) {
      rejected.push({ pathId: candidate.pathId, reasons: ["unknown_path"], score: 0, metrics: [] });
      continue;
    }
    const validation = validate(candidate, path, packet);
    if (validation.ok) accepted.push({ candidate, path, validation });
    else rejected.push({ pathId: candidate.pathId, reasons: validation.reasons, score: validation.score, metrics: validation.metrics });
  }

  const duplicateCandidateKeys = new Map<string, number>();
  for (const item of accepted) {
    const key = item.candidate.lines.join("\n").toLowerCase();
    duplicateCandidateKeys.set(key, (duplicateCandidateKeys.get(key) ?? 0) + 1);
  }
  for (const [key, count] of duplicateCandidateKeys) {
    if (count < 2) continue;
    let kept = false;
    for (let index = accepted.length - 1; index >= 0; index -= 1) {
      if (accepted[index]!.candidate.lines.join("\n").toLowerCase() !== key) continue;
      if (!kept) { kept = true; continue; }
      const duplicate = accepted.splice(index, 1)[0]!;
      rejected.push({ pathId: duplicate.candidate.pathId, reasons: ["duplicate_candidate_output"], score: duplicate.validation.score, metrics: duplicate.validation.metrics });
    }
  }

  accepted.sort((a, b) => b.validation.score - a.validation.score);
  const selected = accepted[0];
  const raw = process.env.QRE_AUTHOR_DEBUG_RAW === "true" ? modelResult.text : undefined;

  if (!selected) {
    return {
      brief: brief(packet),
      scenes: [],
      sequence: undefined,
      field: { packet, moviePaths: paths, movieCognition },
      diagnostics: {
        model: modelResult.model,
        modelCalls: 1,
        qualityStatus: "REJECTED_MODEL_OUTPUT",
        renderable: false,
        candidateSequences: candidates.length,
        acceptedCandidates: 0,
        rejectedCandidates: rejected,
        selectedScore: 0,
        qualityFloor: MIN_SCORE,
        lineCount: lineTotal,
        endpoint: ending,
        endpointExact: false,
        complete: false,
        oneCanonicalPacket: true,
        thesis: packet.thesis,
        creativeBudget: budget,
        sensitivity: sensitive,
        moviePaths: paths.map((path) => ({ id: path.id, thesis: path.thesis, move: path.move, beats: path.beats })),
        movieHypotheses: movieCognition.hypotheses,
        selectedMovie,
        selectedPath: undefined,
        attentionEditor: true,
        attentionMetrics: rejected.map((item) => ({ pathId: item.pathId, metrics: item.metrics })),
        rejectedOutputNeverRendered: true,
        rawModelOutput: raw,
      },
    };
  }

  const sequence = buildSequence(packet, selected.path, selected.candidate, selected.validation.score);
  const scenes: AuthorScene[] = selected.candidate.lines.map((text, index, all) => ({
    text,
    kind: index === 0 ? "hook" : index === all.length - 1 ? "payoff" : index === all.length - 2 ? "turn" : "movement",
  }));

  return {
    brief: brief(packet),
    scenes,
    sequence,
    field: { packet, moviePaths: paths, selectedPath: selected.path, movieCognition },
    diagnostics: {
      model: modelResult.model,
      modelCalls: 1,
      qualityStatus: "ACCEPTED",
      renderable: true,
      candidateSequences: candidates.length,
      acceptedCandidates: accepted.length,
      rejectedCandidates: rejected,
      selectedScore: selected.validation.score,
      qualityFloor: MIN_SCORE,
      lineCount: scenes.length,
      endpoint: ending,
      endpointExact: ending ? clean(scenes.at(-1)?.text).toLowerCase() === ending.toLowerCase() : true,
      complete: true,
      oneCanonicalPacket: true,
      thesis: packet.thesis,
      creativeBudget: budget,
      sensitivity: sensitive,
      moviePaths: paths.map((path) => ({ id: path.id, thesis: path.thesis, move: path.move, beats: path.beats })),
      movieHypotheses: movieCognition.hypotheses,
      selectedMovie,
      selectedPath: selected.path.id,
      selectedMove: selected.path.move,
      attentionEditor: true,
      attentionMetrics: selected.validation.metrics,
      rejectedOutputNeverRendered: true,
      rawModelOutput: raw,
    },
  };
}
