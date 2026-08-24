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
import { buildRealityProvenance } from "./authorRealityProvenance.js";
import { validateAuthorProvenance, type ProvenanceViolation } from "./authorProvenanceGate.js";
import { localModelGenerate } from "./localModelRuntime.js";

type BeatFunction = "hook" | "question" | "turn" | "escalation" | "payoff";
type CreativeMove = "contrast" | "status_shift" | "understatement" | "unexpected_verb" | "social_friction" | "deadpan" | "callback" | "implication" | "absurd_escalation" | "double_meaning";
type Beat = { order: number; function: BeatFunction; source: string[]; change: string; setupFor?: number; paysOff?: number; creativeMove: CreativeMove };
type Path = { id: string; thesis: string; move: CreativeMove; beats: Beat[]; budget: number; operation: string };
type AttentionMetrics = { factuality: number; specificity: number; attention: number; novelty: number; statusChange: number; nextBeatPull: number; creativeMove: number; repetition: number; cinematicity: number; interruption: number; curiosity: number; contrast: number; payoff: number };
type Validation = { ok: boolean; reasons: string[]; score: number; metrics: AttentionMetrics[]; provenance: ProvenanceViolation[] };
type Packet = { prompt: string; subject: string; reality: string[]; ending: string; lineCount: number; maxWords: number; path: Path; thesis: string; movieCognition: ReturnType<typeof buildMovieCognition>; provenanceFacts: Array<{ text: string; provenance: ReturnType<typeof buildRealityProvenance> }>; subjectModel: Record<string, unknown> | null };

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
const ACTION = /\b(?:came|arrived|left|got|stole|found|sent|ordered|changed|ran|returned|noticed|redlined|repaired|disappeared|stayed|moved|laughed|waited|opened|closed|called|signed|checked|cleaned|placed|listed|reviewed|diagnosed|approved|emerged|departed|took|secured|settled|turned|shifted|drew|broke|held|talked|connected|met|served|paid|showed|went|worked|walked|started|finished|began)\b/i;
const STATE = /\b(?:nervous|confident|quiet|loud|happy|sad|angry|excited|tired|ready|late|early|busy|empty|full|broken|fixed|clean|dirty|fresh|approved|rejected|missing|gone|fabulous|muddy|calm|bold|radiant|unsteady|successful|failed|resolved|unresolved|fierce|friendly|sweet|wild|proud|scared|alone|together|connected|private|done|finished|complete|completed|ordinary|normal)\b/i;
const CONTRAST = /\b(?:but|yet|still|until|instead|rather|then|suddenly|except|however|despite|temporary|again|already|finally|or so|seemed|for now)\b/i;
const QUESTION = /\?|\b(?:why|what|who|where|when|how|or so|for now|until)\b/i;
const PAYOFF = /\b(?:finally|again|now|that was|this was|for now|or so|the beginning|the end|only beginning|temporary)\b/i;

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
  return match ? Math.max(3, Math.min(8, Number(match[1]))) : 5;
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

function subjectModel(input: AuthorBrainTruth): Record<string, unknown> | null {
  const identity = input.cognitiveContext?.identityState;
  if (!identity) return null;
  return {
    subject: identity.subject,
    kind: identity.kind,
    canonicalFacts: identity.canonicalFacts.slice(0, 120).map((fact) => ({ text: fact.text, source: fact.source, status: fact.status, confidence: fact.confidence })),
    currentState: identity.currentState,
    traits: identity.traits.map((fact) => fact.text),
    preferences: identity.preferences.map((fact) => fact.text),
    activities: identity.activities.map((fact) => fact.text),
    relationships: identity.relationships,
    history: identity.history.slice(0, 80),
    recentEvents: identity.recentEvents.slice(0, 20),
    recurringPatterns: identity.recurringPatterns,
    goals: identity.goals,
    intentions: identity.intentions,
    locations: identity.locations,
    activeContext: identity.activeContext,
    confidence: identity.confidence,
    creativeLearning: identity.creativeLearning,
  };
}

function buildProvenanceFacts(source: string[], subject: string, prompt: string) {
  const facts = source.map((text) => ({ text, provenance: buildRealityProvenance(text, "memory", { subject }) }));
  if (prompt && !facts.some((fact) => fact.text.toLowerCase() === prompt.toLowerCase())) {
    facts.push({ text: prompt, provenance: buildRealityProvenance(prompt, "prompt", { subject }) });
  }
  return facts;
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

function parseCandidateLines(raw: string): string[][] {
  const text = clean(raw).replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  if (!text) return [];

  const normalize = (value: unknown): string[] => Array.isArray(value) ? value.map(clean).filter(Boolean) : [];
  const complete = (value: string): string[][] => {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== "object") return [];
    const record = parsed as Record<string, unknown>;
    if (Array.isArray(record.lines)) {
      const lines = normalize(record.lines);
      return lines.length ? [lines] : [];
    }
    if (Array.isArray(record.candidates)) {
      return record.candidates.flatMap((candidate) => {
        if (!candidate || typeof candidate !== "object") return [];
        const lines = normalize((candidate as Record<string, unknown>).lines);
        return lines.length ? [lines] : [];
      });
    }
    return [];
  };

  try {
    const parsed = complete(text);
    if (parsed.length) return parsed;
  } catch {
    // Salvage only complete candidate objects from a truncated outer envelope.
  }

  const candidates: string[][] = [];
  const candidatePattern = /\{\s*"lines"\s*:\s*\[(?:[^\[\]]|\[(?:[^\[\]]|\[[^\[\]]*\])*\])*\]\s*\}/g;
  for (const match of text.matchAll(candidatePattern)) {
    try {
      const parsed = JSON.parse(match[0]) as Record<string, unknown>;
      const lines = normalize(parsed.lines);
      if (lines.length) candidates.push(lines);
      if (candidates.length >= 6) break;
    } catch {
      // Ignore malformed fragments.
    }
  }
  return candidates;
}

function makePath(cognition: ReturnType<typeof buildMovieCognition>, subject: string, ending: string): Path {
  const selected = cognition.selected;
  const source = uniq(selected.sources.filter((value) => clean(value).toLowerCase() !== subject.toLowerCase()));
  const trajectory = selected.trajectory.length ? selected.trajectory.slice(0, 4) : source.slice(0, 4);
  while (trajectory.length < 4) trajectory.push(source.at(-1) ?? subject);
  const changes = [...trajectory, ending || "Land the earned consequence."];
  const move = selected.operation === "contrast" ? "contrast" : selected.operation === "echo" ? "callback" : selected.operation === "reversal" ? "status_shift" : selected.operation === "reframe" ? "double_meaning" : "implication";
  return {
    id: "selected",
    thesis: selected.premise,
    move: move as CreativeMove,
    budget: 1,
    operation: selected.operation,
    beats: changes.map((change, index) => ({
      order: index + 1,
      function: index === 0 ? "hook" : index === 1 ? "question" : index === changes.length - 1 ? "payoff" : index === changes.length - 2 ? "escalation" : "turn",
      source: [trajectory[Math.min(index, trajectory.length - 1)] ?? subject],
      change,
      setupFor: index < changes.length - 1 ? index + 2 : undefined,
      paysOff: index === changes.length - 2 ? changes.length : undefined,
      creativeMove: move as CreativeMove,
    })),
  };
}

function modelMessage(packet: Packet): Array<{ role: "user"; content: string }> {
  const trajectory = packet.movieCognition.selected.trajectory.slice(0, packet.lineCount - 1);
  const payload = {
    subject: packet.subject,
    subjectModel: packet.subjectModel,
    currentExperience: {
      request: packet.prompt,
      sourceReality: packet.reality,
      orderedMovieTrajectory: trajectory,
      cognitiveStates: packet.movieCognition.selected.states,
    },
    operation: packet.movieCognition.selected.operation,
    lens: packet.movieCognition.selected.lens,
    ending: packet.ending,
  };
  return [{ role: "user", content: [
    "QRE MOUTH. COG selected the experience. Render ONE final five-beat sequence.",
    `Return JSON only: {\"lines\":[\"...\"]}. Exactly ${packet.lineCount} lines.`,
    `Every non-final line is ${packet.maxWords} words or fewer.`,
    "ATTENTION IS THE PRODUCT.",
    "Beat 1 establishes the supplied reality or normal state.",
    "Beat 2 interrupts that state with a concrete contrast, reversal, unexpected implication, or withheld answer.",
    "Beat 3 creates curiosity, an unresolved question, anticipation, or a reason to need the next beat.",
    "Beat 4 changes the interpretation of supplied material through contrast, callback, reframing, or status change.",
    "Beat 5 pays something off: a supplied callback, earned consequence, short implication, dry verdict, or truthful continuation.",
    "A beautiful sentence that does not change the viewer's state is a weak beat. Do not write for prettiness.",
    "Do not merely copy the source facts. Compress and rephrase them, but stay entirely inside supplied reality and accumulated identity memory.",
    "The subject model is accumulated understanding. It can shape tone, emphasis, callbacks, humor, characterization, and framing. It cannot create new biography or new concrete facts.",
    "Use the supplied movie trajectory in chronological order. Do not reorder events.",
    "Use the selected lens only to change framing, tone, emphasis, or implication. The lens NEVER adds facts.",
    "HARD REALITY LAW: do not invent a person, relationship, place, room, object, body detail, sensory detail, dialogue, participant, ownership, tenancy, customer/client relationship, or literal event.",
    "A plausible detail is still invented. Do not infer physical props from actions.",
    "Do not explain cognition. Do not write about the strategy, lens, premise, tension, transformation, operation, trajectory, movie, audience, viewer, or meaning.",
    packet.ending ? `The final line must be EXACTLY: ${packet.ending}` : "The final line must be an earned consequence, callback, implication, or continuation grounded in the supplied material.",
    JSON.stringify(payload),
  ].join("\n") }];
}

function attentionMetrics(lines: string[], packet: Packet): AttentionMetrics[] {
  return lines.map((line, index) => {
    const previous = lines[index - 1] ?? "";
    const next = lines[index + 1] ?? "";
    const novelty = metric(1 - overlap(line, previous));
    const action = ACTION.test(line);
    const state = STATE.test(line);
    const contrast = CONTRAST.test(line);
    const question = QUESTION.test(line);
    const payoff = index === lines.length - 1 && PAYOFF.test(line);
    const transition = metric((action ? 0.35 : 0) + (state ? 0.25 : 0) + (contrast ? 0.25 : 0) + (novelty * 0.15));
    const interruption = index === 0 ? metric(0.55 + novelty * 0.2 + (action ? 0.15 : 0) + (state ? 0.1 : 0)) : metric(novelty * 0.55 + (contrast ? 0.3 : 0) + (action ? 0.15 : 0));
    const curiosity = index === 0 ? metric(0.45 + novelty * 0.25) : metric((question ? 0.45 : 0) + (contrast ? 0.25 : 0) + (next && overlap(line, next) < 0.55 ? 0.2 : 0) + novelty * 0.1);
    const contrastScore = metric((contrast ? 0.55 : 0) + (state ? 0.15 : 0) + Math.abs(overlap(line, previous) - overlap(line, packet.reality[index] ?? "")) * 0.3);
    const payoffScore = index === lines.length - 1 ? metric((payoff ? 0.55 : 0) + novelty * 0.2 + (contrast ? 0.15 : 0) + (action || state ? 0.1 : 0)) : 0;
    const nextBeatPull = index === lines.length - 1 ? 1 : metric(0.3 + curiosity * 0.35 + interruption * 0.2 + novelty * 0.15);
    const attention = metric((interruption * 0.25) + (curiosity * 0.25) + (contrastScore * 0.25) + ((index === lines.length - 1 ? payoffScore : nextBeatPull) * 0.25));
    return {
      factuality: 1,
      specificity: metric(Math.min(1, words(line).filter((word) => word.length > 2).length / 4)),
      attention,
      novelty,
      statusChange: transition,
      nextBeatPull,
      creativeMove: packet.movieCognition.selected.operation === "reframe" ? 0.85 : 0.7,
      repetition: 0,
      cinematicity: metric(action ? 0.75 + novelty * 0.25 : 0.45 + novelty * 0.3),
      interruption,
      curiosity,
      contrast: contrastScore,
      payoff: payoffScore,
    };
  });
}

function validate(lines: string[], packet: Packet): Validation {
  const reasons: string[] = [];
  if (lines.length !== packet.lineCount) reasons.push(`wrong_line_count:${lines.length}/${packet.lineCount}`);
  const ms = attentionMetrics(lines, packet);
  lines.forEach((line, index) => {
    const count = words(line).length;
    if (!count) reasons.push(`line_${index + 1}:empty`);
    if (index < lines.length - 1 && count > packet.maxWords) reasons.push(`line_${index + 1}:wrong_length`);
    if (META.test(line)) reasons.push(`line_${index + 1}:meta_language`);
    if (STOCK.test(line)) reasons.push(`line_${index + 1}:stock_sentiment`);
    if (GLUE.test(line)) reasons.push(`line_${index + 1}:explanatory_glue`);
    if (DECORATION.test(line)) reasons.push(`line_${index + 1}:generic_decoration`);
    if (PRONOUN.test(line)) reasons.push(`line_${index + 1}:unsupported_identity_reference`);
    const violation = worldViolation(line, packet);
    if (violation) reasons.push(`line_${index + 1}:${violation}`);
  });
  const provenance = validateAuthorProvenance(lines, packet.provenanceFacts);
  for (const violation of provenance) reasons.push(`line_${violation.line}:provenance_${violation.reason}`);
  if (packet.ending && clean(lines.at(-1)).toLowerCase() !== packet.ending.toLowerCase()) reasons.push("endpoint_mismatch");
  if (new Set(lines.map((line) => line.toLowerCase())).size !== lines.length) reasons.push("duplicate_lines");

  const directFacts = packet.reality.filter((fact) => clean(fact).toLowerCase() !== packet.subject.toLowerCase());
  const directParaphrases = directFacts.filter((fact) => lines.join(" ").toLowerCase().includes(fact.toLowerCase())).length;
  const paraphraseRatio = directFacts.length ? directParaphrases / directFacts.length : 0;
  if (paraphraseRatio >= 0.75 && !packet.ending) reasons.push(`fact_parade:${paraphraseRatio.toFixed(2)}`);

  const creativeBeats = lines.filter((line, index) => {
    const sourceMatch = packet.reality.some((fact) => overlap(line, fact) >= 0.82);
    const roleScore = index === 0 ? ms[index]?.interruption ?? 0 : index === 1 ? ms[index]?.interruption ?? 0 : index === 2 ? ms[index]?.curiosity ?? 0 : index === lines.length - 2 ? ms[index]?.contrast ?? 0 : ms[index]?.payoff ?? 0;
    return !sourceMatch && roleScore >= 0.42;
  }).length;
  if (creativeBeats < Math.min(2, packet.lineCount - 1)) reasons.push(`attention_realization_too_low:${creativeBeats}`);

  const rolePass = ms.length === packet.lineCount
    && ms[1]?.interruption >= 0.42
    && ms[2]?.curiosity >= 0.42
    && ms[packet.lineCount - 2]?.contrast >= 0.38
    && ms[packet.lineCount - 1]?.payoff >= 0.42;
  if (!rolePass) reasons.push("attention_arc_incomplete");

  const averageAttention = ms.reduce((sum, item) => sum + item.attention, 0) / Math.max(1, ms.length);
  const averageCinematicity = ms.reduce((sum, item) => sum + item.cinematicity, 0) / Math.max(1, ms.length);
  const score = metric(averageAttention * 0.6 + averageCinematicity * 0.2 + (rolePass ? 0.15 : 0) + Math.min(0.05, creativeBeats * 0.0125));
  if (score < MIN_SCORE) reasons.push(`quality_below_floor:${score}`);
  return { ok: reasons.length === 0, reasons, score, metrics: ms, provenance };
}

function capitalizeFact(value: string): string {
  const text = clean(value).replace(/[.]+$/g, "");
  if (!text) return "";
  return /^[A-Z]/.test(text) ? `${text}.` : `${text.charAt(0).toUpperCase()}${text.slice(1)}.`;
}

function groundedRecovery(packet: Packet): string[] {
  const facts = uniq(packet.reality.filter((fact) => clean(fact).toLowerCase() !== packet.subject.toLowerCase()));
  const lines = facts.slice(0, Math.max(1, packet.lineCount - 2)).map((fact) => capitalizeFact(fact));
  while (lines.length < packet.lineCount - 2 && facts.length) {
    const candidate = capitalizeFact(facts[Math.min(lines.length, facts.length - 1)]!);
    if (lines.includes(candidate)) break;
    lines.push(candidate);
  }
  if (lines.length < packet.lineCount - 1) lines.push("For now.");
  if (packet.ending) lines.push(packet.ending);
  else if (lines.length < packet.lineCount) lines.push("And then the next part.");
  return lines.slice(0, packet.lineCount);
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
  if (index === 1) return "question";
  if (index === total - 2) return "reframe";
  if (index === total - 1) return "payoff";
  return "surprise";
}

function buildSequence(packet: Packet, lines: string[], score: number): SequencePlay {
  const cuts: SequenceCut[] = [];
  const known: string[] = [];
  const ms = attentionMetrics(lines, packet);
  lines.forEach((text, index) => {
    const beat = packet.path.beats[index] ?? packet.path.beats.at(-1)!;
    const before: ViewerState = { known: [...known], expected: beat.change, unresolved: index ? packet.path.beats[index - 1]?.change : undefined, currentWant: index < lines.length - 1 ? packet.path.beats[index + 1]?.change : undefined, recentChange: index ? lines[index - 1] : undefined };
    known.push(text);
    const after: ViewerState = { known: [...known], expected: index < lines.length - 1 ? beat.change : undefined, unresolved: index < lines.length - 1 ? beat.change : undefined, currentWant: index < lines.length - 1 ? packet.path.beats[index + 1]?.change : undefined, recentChange: beat.change };
    cuts.push({ id: `author-cut-${index + 1}`, order: index + 1, role: role(index, lines.length), gainKind: gain(index, lines.length), sourceIds: beat.source.map((_, sourceIndex) => `reality:${sourceIndex}`), informationGain: beat.change, attentionDelta: `attention=${ms[index]?.attention ?? 0}`, viewerBefore: before, viewerAfter: after, nextPromise: index < lines.length - 1 ? packet.path.beats[index + 1]?.change : undefined, payoffConnection: index === lines.length - 1 ? packet.ending || text : packet.path.beats[index + 1]?.change, noveltyScore: ms[index]?.novelty ?? 0, confidence: score });
  });
  return { subject: packet.subject, premise: packet.thesis, openingState: cuts[0]?.viewerBefore ?? { known: [] }, baselineFacts: packet.reality, cuts, closingState: cuts.at(-1)?.viewerAfter, continuity: lines, antiCrutch: ["no invented details", "no fact parade", "no unsupported identity", "no chronology rewriting", "no decorative filler", "attention arc required", "ending must be earned", "provenance gate passed", "rejected model output never rendered"] };
}

function brief(packet: Packet): AuthorCreativeBrief {
  return {
    angle: packet.thesis,
    engine: "reality → cognitive state → trajectory → selected movie → lens → mouth → truth gate",
    question: packet.movieCognition.attentionQuestion,
    strongestImage: packet.movieCognition.selected.trajectory.at(-1) ?? packet.reality.at(-1) ?? packet.subject,
    tension: packet.movieCognition.selected.tension,
    payoff: packet.ending || packet.movieCognition.selected.trajectory.at(-1) || packet.subject,
    callback: packet.movieCognition.selected.sources.at(-1) ?? packet.subject,
    rhythm: ["hit", "short", "hit", "short", "hit"] as AuthorRhythm[],
    avoid: ["description", "fact parade", "restatement", "generic decoration", "unsupported identity", "unsupported world expansion", "weak next-beat pull", "random invention"],
  };
}

export async function authorBrainUniversal(input: AuthorBrainTruth): Promise<AuthorResult> {
  const subject = clean(input.subject) || "the subject";
  const source = reality(input);
  const ending = endpoint(input.prompt);
  const lineTotal = lineCount(input.prompt);
  const pathCognition = buildMovieCognition(input, ending);
  const protectedMemorial = input.cognitiveContext?.creativeSafety?.class === "memorial";
  const movieCognition = protectedMemorial
    ? { ...pathCognition, attentionQuestion: "How can the supplied memory be honored through grounded continuity without genre transformation?" }
    : pathCognition;
  const path = makePath(movieCognition, subject, ending);
  const packet: Packet = {
    prompt: input.prompt,
    subject,
    reality: source,
    ending,
    lineCount: lineTotal,
    maxWords: 7,
    path,
    thesis: movieCognition.selected.premise,
    movieCognition,
    provenanceFacts: buildProvenanceFacts(source, subject, input.prompt),
    subjectModel: subjectModel(input),
  };

  const sensitive = /\b(?:memorial|funeral|tribute|grief|grieving|bereavement|condolence|passed away|death|deceased|eulogy)\b/i.test(`${input.prompt} ${source.join(" ")}`);
  const modelResult = await localModelGenerate(
    modelMessage(packet),
    "json",
    { numPredict: Math.min(2400, Math.max(900, lineTotal * 160)), temperature: protectedMemorial || sensitive ? 0.28 : 0.48 },
  );

  const candidateLines = parseCandidateLines(modelResult.text).slice(0, 6);
  const evaluations = candidateLines.map((lines) => ({ lines, validation: validate(lines.slice(0, lineTotal), packet) }));
  evaluations.sort((a, b) => b.validation.score - a.validation.score);
  const winner = evaluations.find((item) => item.validation.ok);
  let finalLines = winner?.lines.slice(0, lineTotal) ?? groundedRecovery(packet);
  let finalValidation = validate(finalLines, packet);
  const recoveryUsed = !winner;

  if (!finalValidation.ok) {
    const alternate = evaluations[0];
    if (alternate) {
      finalLines = alternate.lines.slice(0, lineTotal);
      finalValidation = validate(finalLines, packet);
    }
  }

  const selectedScore = finalValidation.ok ? finalValidation.score : 0;
  const scenes: AuthorScene[] = finalLines.map((text, index, all) => ({
    text,
    kind: index === 0 ? "hook" : index === all.length - 1 ? "payoff" : index === all.length - 2 ? "turn" : "movement",
  }));
  const sequence = finalValidation.ok ? buildSequence(packet, finalLines, selectedScore) : undefined;
  const raw = process.env.QRE_AUTHOR_DEBUG_RAW === "true" ? modelResult.text : undefined;

  return {
    brief: brief(packet),
    scenes: finalValidation.ok ? scenes : [],
    sequence,
    field: { packet, movieCognition, moviePaths: movieCognition.hypotheses.slice(0, 3), selectedPath: path, selectedMove: path.move },
    diagnostics: {
      model: modelResult.model,
      modelCalls: 1,
      qualityStatus: finalValidation.ok ? "ACCEPTED" : "REJECTED_MODEL_OUTPUT",
      renderable: finalValidation.ok,
      candidateSequences: candidateLines.length,
      acceptedCandidates: winner ? 1 : 0,
      rejectedCandidates: evaluations.filter((item) => !item.validation.ok).map((item) => ({ pathId: "selected", reasons: item.validation.reasons, score: item.validation.score, metrics: item.validation.metrics })),
      selectedScore,
      qualityFloor: MIN_SCORE,
      lineCount: finalValidation.ok ? scenes.length : 0,
      endpoint: ending,
      endpointExact: ending ? clean(finalLines.at(-1)).toLowerCase() === ending.toLowerCase() : finalValidation.ok,
      complete: finalValidation.ok && scenes.length === lineTotal && Boolean(sequence),
      oneCanonicalPacket: true,
      thesis: packet.thesis,
      creativeBudget: 1,
      sensitivity: protectedMemorial || sensitive ? "sensitive" : "normal",
      moviePaths: movieCognition.hypotheses.slice(0, 3),
      movieHypotheses: movieCognition.hypotheses,
      selectedMovie: movieCognition.selected,
      selectedPath: path.id,
      selectedMove: path.move,
      attentionEditor: true,
      attentionMetrics: finalValidation.metrics,
      rejectedOutputNeverRendered: true,
      rawModelOutput: raw,
      recoveryRendererUsed: recoveryUsed,
      provenanceGate: finalValidation.ok ? "passed" : "failed",
      provenanceViolations: finalValidation.provenance,
    },
  } as AuthorResult;
}
