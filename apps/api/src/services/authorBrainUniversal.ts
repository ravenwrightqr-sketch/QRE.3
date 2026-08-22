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
type Beat = { order: number; function: BeatFunction; source: string[]; change: string; setupFor?: number; paysOff?: number; creativeMove: CreativeMove };
type Path = { id: string; thesis: string; move: CreativeMove; beats: Beat[]; budget: number; operation: string };
type Candidate = { pathId: string; lines: string[] };
type BeatMetrics = { factuality: number; specificity: number; attention: number; novelty: number; statusChange: number; nextBeatPull: number; creativeMove: number; repetition: number; cinematicity: number };
type Validation = { ok: boolean; reasons: string[]; score: number; metrics: BeatMetrics[] };
type ReferencePolicy = { subject: string; mode: "explicit_name"; allowPronouns: false; allowIdentityInference: false; instruction: string };
type MovieLock = { approvedMeaning: string; creativeBudget: number; worldFreedom: "closed"; referencePolicy: ReferencePolicy; ending: string; sensitivity: "normal" | "sensitive"; preferredLens?: string; allowedMoves: CreativeMove[] };
type Packet = { subject: string; reality: string[]; ending: string; lineCount: number; maxWords: number; lock: MovieLock; path: Path; thesis: string; movieCognition: ReturnType<typeof buildMovieCognition> };

const MIN_SCORE = 0.74;
const META = /\b(?:as an ai|the audience|the viewer|this means|this shows|the strategy|the beat|according to qre|cognitive|the truth is|status feels|pressure builds|the meaning|the transformation|the symbol|the tension|the contrast|the premise|the operation|the lens|the trajectory|the movie|the bow's meaning|a transformation followed)\b/i;
const STOCK = /\b(?:magical moment|unforgettable experience|incredible journey|newfound confidence|a testament to|making memories|cherished moment|one for the books|once in a lifetime|heartwarming)\b/i;
const GLUE = /\b(?:therefore|as a result|which means|this is why|in order to|thus|ultimately)\b/i;
const DECORATION = /\b(?:beautifully|gracefully|dramatically|magically|poetically|gently|softly|wonderfully|incredibly|extremely|quiet tremor|silent storm|theft of grace|new face)\b/i;
const PRONOUN = /\b(?:he|she|him|her|his|hers|they|them|their|theirs)\b/i;
const RELATIONSHIP = /\b(?:husband|wife|partner|girlfriend|boyfriend|sister|brother|mother|father|son|daughter|friend|owner|boss|manager|lawyer|judge|doctor|nurse|employee|customer|officer|guest|client|buyer|seller|agent|groomer|housekeeper|mechanic|barber|photographer)\b/i;
const PLACE = /\b(?:street|office|room|chair|table|bed|floor|counter|dresser|park|restaurant|hotel|house|kitchen|bathroom|store|shop|court|church|school|hospital|lobby|door|window|hallway|garage|yard|living room|bedroom|dining room|desk|countertop|sink|trash|mirror)\b/i;
const OBJECT = /\b(?:towel|towels|bow|bows|cup|glass|plate|dish|key|keys|phone|camera|mirror|photograph|photo|letter|note|bag|box|gift|shoes|shirt|dress|ring|flowers|candle|candles|menu|carpet|pillow|blanket|soap|brush|comb|leash|collar|receipt|contract|clause|document|paper|tool|engine|wheel|tire|warning light)\b/i;
const BODY = /\b(?:tail|tails|legs|leg|ears|ear|paws|paw|eyes|eye|mouth|teeth|face|head|hands|hand|feet|foot|shoulder|hair|skin|body|gaze)\b/i;
const BODY_IDIOM = /\b(?:in|under|over|on)\s+(?:hand|hands)\b/i;
const SENSITIVE = /\b(?:memorial|funeral|tribute|grief|grieving|bereavement|condolence|passed away|death|deceased|eulogy)\b/i;
const ACTION = /\b(?:came|arrived|left|got|stole|found|sent|ordered|changed|ran|returned|noticed|redlined|repaired|disappeared|stayed|moved|laughed|waited|opened|closed|called|signed|checked|cleaned|placed|listed|reviewed|diagnosed|approved|emerged|departed|took|secured|settled|turned|shifted|drew|broke|held|talked|connected|met|served|paid|showed|went|worked|walked)\b/i;
const STATE = /\b(?:nervous|confident|quiet|loud|happy|sad|angry|excited|tired|ready|late|early|busy|empty|full|broken|fixed|clean|dirty|fresh|approved|rejected|missing|gone|fabulous|muddy|calm|bold|radiant|unsteady|successful|failed|resolved|unresolved|fierce|friendly|sweet|wild|proud|scared|alone|together|connected|private)\b/i;
const CONTRAST = /\b(?:but|yet|still|until|instead|rather|then|suddenly|except|however|despite|temporary|again|already|finally)\b/i;

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const words = (value: string): string[] => clean(value).toLowerCase().split(/[^a-z0-9'-]+/i).filter(Boolean);
const tokens = (value: string): Set<string> => new Set(words(value).filter((word) => word.length > 2));
const metric = (value: number): number => Number(Math.max(0, Math.min(1, value)).toFixed(3));
const uniq = (values: readonly string[], limit = 64): string[] => [...new Set(values.map(clean).filter(Boolean))].slice(0, limit);

function overlap(a: string, b: string): number {
  const left = tokens(a); const right = tokens(b);
  if (!left.size || !right.size) return 0;
  let shared = 0;
  for (const token of left) if (right.has(token)) shared += 1;
  return shared / Math.max(left.size, right.size);
}

function lineCount(prompt: string): number {
  const match = clean(prompt).match(/\b(\d{1,2})\s*[- ]?\s*line(?:s)?\b/i);
  const count = match ? Number(match[1]) : 5;
  return Number.isFinite(count) ? Math.max(3, Math.min(8, count)) : 5;
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
  if (/(final\s+line|ending|payoff|funny|comic|cinematic|playful|surprising|clever|living memory|social)/i.test(prompt)) score += 0.14;
  if (source.length >= 4) score += 0.08;
  return metric(score);
}

function sensitivity(prompt: string, source: string[]): "normal" | "sensitive" {
  return SENSITIVE.test(`${prompt} ${source.join(" ")}`) ? "sensitive" : "normal";
}

function moveForOperation(operation: string): CreativeMove {
  switch (operation) {
    case "contrast": return "contrast";
    case "reframe": return "double_meaning";
    case "reversal": return "status_shift";
    case "amplification": return "absurd_escalation";
    case "echo": return "callback";
    case "enclosure": return "implication";
    case "reveal": return "unexpected_verb";
    default: return "understatement";
  }
}

function makePath(cognition: ReturnType<typeof buildMovieCognition>, subject: string, ending: string, budget: number): Path {
  const selected = cognition.selected;
  const source = uniq(selected.sources.filter((value) => clean(value).toLowerCase() !== subject.toLowerCase()));
  const trajectory = selected.trajectory.length ? selected.trajectory.slice(0, 4) : source.slice(0, 4);
  while (trajectory.length < 4) trajectory.push(source.at(-1) ?? subject);
  const changes = [...trajectory, ending || "Land the earned consequence."];
  const move = moveForOperation(selected.operation);
  return {
    id: "selected",
    thesis: selected.premise,
    move,
    budget,
    operation: selected.operation,
    beats: changes.map((change, index) => ({
      order: index + 1,
      function: index === 0 ? "hook" : index === 1 ? "question" : index === changes.length - 1 ? "payoff" : index === changes.length - 2 ? "escalation" : "turn",
      source: [trajectory[Math.min(index, trajectory.length - 1)] ?? subject],
      change,
      setupFor: index < changes.length - 1 ? index + 2 : undefined,
      paysOff: index === changes.length - 2 ? changes.length : undefined,
      creativeMove: move,
    })),
  };
}

function modelMessage(packet: Packet): Array<{ role: "user"; content: string }> {
  const trajectory = packet.movieCognition.selected.trajectory.slice(0, packet.lineCount - 1);
  const payload = {
    subject: packet.subject,
    reality: packet.reality,
    orderedMovieTrajectory: trajectory,
    cognitiveStates: packet.movieCognition.selected.states,
    operation: packet.movieCognition.selected.operation,
    lens: packet.movieCognition.selected.lens,
    ending: packet.ending,
  };
  return [{ role: "user", content: [
    "QRE MOUTH. COG has already selected the movie. Render ONE sequence only.",
    `Return JSON only: {"lines":["..."]}. Exactly ${packet.lineCount} lines.`,
    `Every non-final line is ${packet.maxWords} words or fewer.`,
    packet.ending ? `The final line must be EXACTLY: ${packet.ending}` : "The final line must be the earned consequence.",
    "Use the supplied movie trajectory in its supplied chronological order. Do not reorder events.",
    "Use the selected lens only to change framing, tone, emphasis, or implication. The lens NEVER adds facts.",
    "HARD REALITY LAW: do not invent a person, identity, relationship, place, room, object, body detail, sensory detail, dialogue, participant, ownership, tenancy, customer/client relationship, or literal event.",
    "A plausible detail is still invented. Do not infer physical props from actions. A bath does not authorize a sink; grooming does not authorize a towel; stealing does not authorize a trash can.",
    "Do not reorder, merge, or replace supplied events. You may compress language around them.",
    "Do not explain cognition. Never write words such as meaning, transformation, symbol, tension, contrast, pressure, premise, operation, lens, trajectory, state, or interpretation as the subject of a line.",
    "Make the viewer infer the creative move from concrete supplied reality.",
    JSON.stringify(payload),
  ].join("\n") }];
}

function parseSingle(raw: string): string[] {
  const text = clean(raw).replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  if (!text) return [];
  const parse = (value: string): string[] => {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== "object") return [];
    const record = parsed as Record<string, unknown>;
    if (Array.isArray(record.lines)) return record.lines.map((line) => clean(line)).filter(Boolean);
    if (Array.isArray(record.candidates)) {
      const first = record.candidates[0];
      if (first && typeof first === "object" && Array.isArray((first as Record<string, unknown>).lines)) return ((first as Record<string, unknown>).lines as unknown[]).map((line) => clean(line)).filter(Boolean);
    }
    return [];
  };
  try { return parse(text); } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return [];
    try { return parse(match[0]); } catch { return []; }
  }
}

function worldViolation(line: string, packet: Packet): string | undefined {
  const known = packet.reality.join(" ").toLowerCase();
  for (const [pattern, label] of [[RELATIONSHIP, "relationship"], [PLACE, "place"], [OBJECT, "object"], [BODY, "body_detail"]] as const) {
    const match = line.match(pattern);
    if (!match) continue;
    if (label === "body_detail" && BODY_IDIOM.test(line)) continue;
    if (!known.includes(match[0].toLowerCase())) return `unsupported_${label}`;
  }
  return undefined;
}

function chronologyViolation(lines: string[], packet: Packet): string | undefined {
  const order = packet.reality.map((fact, index) => ({ index, fact }));
  let last = -1;
  for (const line of lines) {
    const hit = order.filter((item) => overlap(line, item.fact) >= 0.75).sort((a, b) => b.fact.length - a.fact.length)[0];
    if (!hit) continue;
    if (hit.index < last) return "reordered_supplied_event";
    last = hit.index;
  }
  return undefined;
}

function metrics(lines: string[], path: Path, packet: Packet): BeatMetrics[] {
  return lines.map((line, index) => {
    const previous = lines[index - 1] ?? "";
    const novelty = metric(1 - overlap(line, previous));
    const specificity = metric(Math.min(1, words(line).filter((word) => word.length > 2).length / 4));
    const statusChange = metric((STATE.test(line) ? 0.45 : 0) + (ACTION.test(line) ? 0.35 : 0) + (CONTRAST.test(line) ? 0.2 : 0));
    const pull = index === lines.length - 1 ? 1 : metric(0.34 + (ACTION.test(line) ? 0.18 : 0) + (STATE.test(line) ? 0.15 : 0) + (CONTRAST.test(line) ? 0.18 : 0) + (novelty * 0.15));
    const cinematicity = metric((ACTION.test(line) ? 0.35 : 0) + (words(line).length ? 0.35 : 0) + novelty * 0.3);
    return { factuality: 1, specificity, attention: metric(novelty * 0.5 + pull * 0.5), novelty, statusChange, nextBeatPull: pull, creativeMove: packet.path.operation === "reframe" ? 0.85 : 0.65, repetition: 0, cinematicity };
  });
}

function validate(lines: string[], path: Path, packet: Packet): Validation {
  const reasons: string[] = [];
  const ms = metrics(lines, path, packet);
  lines.forEach((line, index) => {
    const count = words(line).length;
    if (!count) reasons.push(`line_${index + 1}:empty`);
    if (index < lines.length - 1 && count > packet.maxWords) reasons.push(`line_${index + 1}:wrong_length`);
    if (META.test(line)) reasons.push(`line_${index + 1}:meta_language`);
    if (STOCK.test(line)) reasons.push(`line_${index + 1}:stock_sentiment`);
    if (GLUE.test(line)) reasons.push(`line_${index + 1}:explanatory_glue`);
    if (DECORATION.test(line)) reasons.push(`line_${index + 1}:generic_decoration`);
    if (PRONOUN.test(line)) reasons.push(`line_${index + 1}:unsupported_identity_reference`);
    const violation = worldViolation(line, packet); if (violation) reasons.push(`line_${index + 1}:${violation}`);
  });
  const chronology = chronologyViolation(lines, packet); if (chronology) reasons.push(chronology);
  if (packet.ending && clean(lines.at(-1)).toLowerCase() !== packet.ending.toLowerCase()) reasons.push("endpoint_mismatch");
  if (new Set(lines.map((line) => line.toLowerCase())).size !== lines.length) reasons.push("duplicate_lines");
  const score = metric(ms.reduce((sum, item) => sum + item.attention, 0) / Math.max(1, ms.length) * 0.45 + ms.reduce((sum, item) => sum + item.cinematicity, 0) / Math.max(1, ms.length) * 0.25 + 0.2 + (packet.ending ? 0.1 : 0));
  if (score < MIN_SCORE) reasons.push(`quality_below_floor:${score}`);
  return { ok: reasons.length === 0, reasons, score, metrics: ms };
}

function capitalizeFact(value: string): string {
  const text = clean(value).replace(/[.]+$/g, "");
  if (!text) return "";
  return /^[A-Z]/.test(text) ? `${text}.` : `${text.charAt(0).toUpperCase()}${text.slice(1)}.`;
}

function groundedRecovery(packet: Packet): string[] {
  const facts = uniq(packet.reality.filter((fact) => clean(fact).toLowerCase() !== packet.subject.toLowerCase()));
  const targetFacts = facts.slice(0, Math.max(0, packet.lineCount - 1));
  const lines: string[] = [];
  for (const fact of targetFacts) lines.push(capitalizeFact(packet.subject && !new RegExp(`^${packet.subject}\\b`, "i").test(fact) ? `${packet.subject} ${fact}` : fact));
  while (lines.length < packet.lineCount - 1) {
    const fallbackFact = facts.at(Math.min(lines.length, Math.max(0, facts.length - 1)));
    if (!fallbackFact) break;
    const candidate = capitalizeFact(fallbackFact);
    if (!lines.includes(candidate)) lines.push(candidate); else break;
  }
  const memory = /living memory|relationship|memory/i.test(packet.lock.approvedMeaning + " " + packet.subject + " " + packet.reality.join(" "));
  if (lines.length < packet.lineCount - 1 && memory) lines.push("And that was the beginning.");
  if (packet.ending) lines.push(packet.ending);
  else if (lines.length < packet.lineCount) lines.push(capitalizeFact(facts.at(-1) ?? packet.subject));
  return lines.slice(0, packet.lineCount);
}

function role(index: number, total: number): ViewerAttentionRole { if (index === 0) return "hook"; if (index === 1) return "question"; if (index === total - 1) return "payoff"; if (index === total - 2) return "reframe"; return "escalation"; }
function gain(index: number, total: number): SequenceGainKind { if (index === 0) return "baseline"; if (index === 1) return "question"; if (index === total - 2) return "reframe"; if (index === total - 1) return "payoff"; return "surprise"; }

function buildSequence(packet: Packet, lines: string[], score: number): SequencePlay {
  const cuts: SequenceCut[] = []; const known: string[] = []; const ms = metrics(lines, packet.path, packet);
  lines.forEach((text, index) => {
    const beat = packet.path.beats[index] ?? packet.path.beats.at(-1)!;
    const before: ViewerState = { known: [...known], expected: beat.change, unresolved: index ? packet.path.beats[index - 1]?.change : undefined, currentWant: index < lines.length - 1 ? packet.path.beats[index + 1]?.change : undefined, recentChange: index ? lines[index - 1] : undefined };
    known.push(text);
    const after: ViewerState = { known: [...known], expected: index < lines.length - 1 ? beat.change : undefined, unresolved: index < lines.length - 1 ? beat.change : undefined, currentWant: index < lines.length - 1 ? packet.path.beats[index + 1]?.change : undefined, recentChange: beat.change };
    cuts.push({ id: `author-cut-${index + 1}`, order: index + 1, role: role(index, lines.length), gainKind: gain(index, lines.length), sourceIds: beat.source.map((_, sourceIndex) => `reality:${sourceIndex}`), informationGain: beat.change, attentionDelta: `nextBeatPull=${ms[index]?.nextBeatPull ?? 0}`, viewerBefore: before, viewerAfter: after, nextPromise: index < lines.length - 1 ? packet.path.beats[index + 1]?.change : undefined, payoffConnection: index === lines.length - 1 ? packet.ending || text : packet.path.beats[index + 1]?.change, noveltyScore: ms[index]?.novelty ?? 0, confidence: score });
  });
  return { subject: packet.subject, premise: packet.lock.approvedMeaning, openingState: cuts[0]?.viewerBefore ?? { known: [] }, baselineFacts: packet.reality, cuts, closingState: cuts.at(-1)?.viewerAfter, continuity: lines, antiCrutch: ["no invented details", "no fact parade", "no unsupported identity", "no chronology rewriting", "no decorative filler", "ending must be earned", "rejected model output never rendered"] };
}

function brief(packet: Packet): AuthorCreativeBrief {
  return { angle: packet.lock.approvedMeaning, engine: "reality → cognitive state → trajectory → selected movie → lens → mouth → truth gate", question: packet.movieCognition.attentionQuestion, strongestImage: packet.movieCognition.selected.trajectory.at(-1) ?? packet.reality.at(-1) ?? packet.subject, tension: packet.movieCognition.selected.tension, payoff: packet.ending || packet.movieCognition.selected.trajectory.at(-1) || packet.subject, callback: packet.movieCognition.selected.sources.at(-1) ?? packet.subject, rhythm: ["hit", "short", "hit", "short", "hit"] as AuthorRhythm[], avoid: ["description", "fact parade", "restatement", "generic decoration", "unsupported identity", "unsupported world expansion", "weak next-beat pull", "random invention"] };
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
  const selected = movieCognition.selected;
  const path = makePath(movieCognition, subject, ending, budget);
  const lock: MovieLock = { approvedMeaning: selected.premise, creativeBudget: budget, worldFreedom: "closed", referencePolicy: { subject, mode: "explicit_name", allowPronouns: false, allowIdentityInference: false, instruction: `SUBJECT REFERENCE IS CLOSED. Use exactly "${subject}". Never infer identity or substitute a pronoun.` }, ending, sensitivity: sensitive, preferredLens: input.lens, allowedMoves: [path.move] };
  const packet: Packet = { subject, reality: source, ending, lineCount: lineTotal, maxWords, lock, path, thesis: selected.premise, movieCognition };

  const modelResult = await localModelGenerate(modelMessage(packet), "json", { numPredict: Math.min(1200, Math.max(420, lineTotal * 80)), temperature: sensitive ? 0.32 : 0.48 });
  const modelLines = parseSingle(modelResult.text).slice(0, lineTotal);
  const modelValidation = modelLines.length === lineTotal ? validate(modelLines, path, packet) : { ok: false, reasons: ["incomplete_model_output"], score: 0, metrics: [] };

  let finalLines = modelValidation.ok ? modelLines : groundedRecovery(packet);
  let finalValidation = validate(finalLines, path, packet);
  const recoveryUsed = !modelValidation.ok;
  if (!finalValidation.ok) {
    const ultraSafe = uniq(source.filter((fact) => clean(fact).toLowerCase() !== subject.toLowerCase())).slice(0, Math.max(0, lineTotal - 1)).map((fact) => capitalizeFact(`${subject} ${fact}`));
    finalLines = packet.ending ? [...ultraSafe.slice(0, Math.max(0, lineTotal - 1)), packet.ending] : ultraSafe.slice(0, lineTotal);
    finalValidation = validate(finalLines, path, packet);
  }

  const selectedScore = finalValidation.score || (recoveryUsed ? 0.75 : 0);
  const scenes: AuthorScene[] = finalLines.map((text, index, all) => ({ text, kind: index === 0 ? "hook" : index === all.length - 1 ? "payoff" : index === all.length - 2 ? "turn" : "movement" }));
  const sequence = finalValidation.ok ? buildSequence(packet, finalLines, selectedScore) : undefined;
  const raw = process.env.QRE_AUTHOR_DEBUG_RAW === "true" ? modelResult.text : undefined;
  const moviePaths = movieCognition.hypotheses.slice(0, 3).map((hypothesis, index) => ({ id: ["shift", "deadpan", "pressure"][index] ?? hypothesis.id, thesis: hypothesis.premise, move: moveForOperation(hypothesis.operation), beats: path.beats.map((beat) => ({ ...beat, creativeMove: moveForOperation(hypothesis.operation) })) }));

  return {
    brief: brief(packet),
    scenes: finalValidation.ok ? scenes : [],
    sequence,
    field: { packet, moviePaths, selectedPath: path, movieCognition },
    diagnostics: {
      model: modelResult.model,
      modelCalls: 1,
      qualityStatus: finalValidation.ok ? "ACCEPTED" : "REJECTED_MODEL_OUTPUT",
      renderable: finalValidation.ok,
      candidateSequences: 1,
      acceptedCandidates: finalValidation.ok ? 1 : 0,
      rejectedCandidates: modelValidation.ok ? [] : [{ pathId: "selected", reasons: modelValidation.reasons, score: modelValidation.score, metrics: modelValidation.metrics }],
      selectedScore: finalValidation.ok ? selectedScore : 0,
      qualityFloor: MIN_SCORE,
      lineCount: finalValidation.ok ? scenes.length : 0,
      endpoint: ending,
      endpointExact: ending ? clean(finalLines.at(-1)).toLowerCase() === ending.toLowerCase() : finalValidation.ok,
      complete: finalValidation.ok && scenes.length === lineTotal && Boolean(sequence),
      oneCanonicalPacket: true,
      thesis: packet.thesis,
      creativeBudget: budget,
      sensitivity: sensitive,
      moviePaths,
      movieHypotheses: movieCognition.hypotheses,
      selectedMovie: selected,
      selectedPath: path.id,
      selectedMove: path.move,
      attentionEditor: true,
      attentionMetrics: finalValidation.metrics,
      rejectedOutputNeverRendered: true,
      rawModelOutput: raw,
      recoveryRendererUsed: recoveryUsed,
    },
  } as AuthorResult;
}
