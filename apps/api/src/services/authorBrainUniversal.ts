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

type Operation = "anchor" | "change" | "disruption" | "payoff_setup" | "payoff";

type ReferencePolicy = {
  subject: string;
  mode: "explicit_name";
  allowPronouns: false;
  allowIdentityInference: false;
  instruction: string;
};

type BeatDirective = {
  order: number;
  operation: Operation;
  source: string;
  purpose: string;
  viewerChange: string;
  realizationGoal: string;
  referencePolicy: ReferencePolicy;
};

type Packet = {
  mission: string;
  thesis: string;
  transformation: string;
  subject: string;
  referencePolicy: ReferencePolicy;
  reality: string[];
  intent: string;
  arc: {
    baseline: string;
    change: string;
    disruption: string;
    resolution: string;
    ending: string;
  };
  payoff: { target: string; setup: string; requirement: string };
  directives: BeatDirective[];
  style: string[];
  constraints: string[];
  output: { lineCount: number; maxWords: number; endingExact: string };
};

type Candidate = { lines: string[] };
type Validation = { ok: boolean; reasons: string[]; score: number };

const MIN_SCORE = 0.76;
const META = /\b(?:as an ai|the audience|the viewer|this means|this shows|the strategy|the beat|according to qre|cognitive)\b/i;
const STOCK = /\b(?:magical moment|unforgettable experience|incredible journey|newfound confidence|a testament to|making memories|cherished moment|one for the books|once in a lifetime|heartwarming)\b/i;
const GLUE = /\b(?:therefore|as a result|which means|this is why|in order to|thus|ultimately)\b/i;
const DECORATION = /\b(?:beautifully|gracefully|dramatically|magically|poetically|gently|softly|wonderfully|incredibly|extremely)\b/i;
const PRONOUN = /\b(?:he|she|him|her|his|hers|they|them|their|theirs)\b/i;
const RELATIONSHIP = /\b(?:husband|wife|partner|girlfriend|boyfriend|sister|brother|mother|father|son|daughter|friend|owner|boss|manager|lawyer|judge|doctor|nurse|employee|customer|officer)\b/i;
const PLACE = /\b(?:street|office|room|chair|table|bed|floor|counter|dresser|park|restaurant|hotel|house|kitchen|bathroom|store|shop|court|church|school|hospital)\b/i;
const BODY = /\b(?:tail|tails|legs|leg|ears|ear|paws|paw|eyes|eye|mouth|teeth|face|head|hands|hand|feet|foot|shoulder|hair|skin)\b/i;
const STATE = /\b(?:nervous|calm|anxious|confident|quiet|loud|happy|sad|angry|excited|tired|ready|late|early|busy|empty|full|broken|fixed|clean|dirty|fresh|approved|rejected|missing|gone|fabulous|muddy|still|already|finally|peaceful)\b/i;
const ACTION = /\b(?:came|arrived|left|got|stole|found|sent|ordered|changed|ran|returned|noticed|redlined|repaired|disappeared|stayed|moved|laughed|waited|opened|closed|called|signed|checked|cleaned|placed|listed|reviewed|diagnosed|approved)\b/i;

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const words = (value: string): string[] => clean(value).toLowerCase().split(/[^a-z0-9'-]+/i).filter(Boolean);
const meaningful = (value: string): string[] => words(value).filter((word) => word.length > 2);
const metric = (value: number): number => Number(Math.max(0, Math.min(1, value)).toFixed(3));
const uniq = (values: readonly string[], limit = 48): string[] => [...new Set(values.map(clean).filter(Boolean))].slice(0, limit);

function lineCount(prompt: string): number {
  const match = clean(prompt).match(/\b(\d{1,2})\s*[- ]?\s*line(?:s)?\b/i);
  const value = match ? Number(match[1]) : 5;
  return Number.isFinite(value) ? Math.max(3, Math.min(8, value)) : 5;
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

function overlap(a: string, b: string): number {
  const left = new Set(meaningful(a));
  const right = new Set(meaningful(b));
  if (!left.size || !right.size) return 0;
  let shared = 0;
  for (const token of left) if (right.has(token)) shared += 1;
  return shared / Math.max(left.size, right.size);
}

function distinctiveness(value: string, all: string[]): number {
  const mine = new Set(meaningful(value));
  let shared = 0;
  for (const other of all) {
    if (other === value) continue;
    const set = new Set(meaningful(other));
    for (const token of mine) if (set.has(token)) shared += 1;
  }
  return mine.size / Math.max(1, shared + 1);
}

function chooseArc(source: string[], subject: string, ending: string): Packet["arc"] {
  const material = source.filter((value) => clean(value).toLowerCase() !== subject.toLowerCase());
  const baseline = material[0] ?? subject;
  const change = material[1] ?? material.at(-1) ?? baseline;
  const middle = material.slice(2, Math.max(2, material.length - 1));
  const disruption = [...middle]
    .sort((a, b) => distinctiveness(b, material) - distinctiveness(a, material))[0]
    ?? material.at(-1)
    ?? change;
  const resolution = material.at(-1) ?? change;
  return { baseline, change, disruption, resolution, ending };
}

function buildReferencePolicy(subject: string): ReferencePolicy {
  return {
    subject,
    mode: "explicit_name",
    allowPronouns: false,
    allowIdentityInference: false,
    instruction: `SUBJECT REFERENCE IS CLOSED. Refer to the subject as exactly "${subject}". Never infer identity. Never substitute a gendered pronoun.`,
  };
}

function semanticLabel(value: string): string {
  if (STATE.test(value)) return "state";
  if (ACTION.test(value)) return "event";
  return "material";
}

function deriveDirection(
  arc: Packet["arc"],
  subject: string,
  ending: string,
): { thesis: string; transformation: string } {
  const thesis = `${subject}: ${semanticLabel(arc.baseline)} → ${semanticLabel(arc.change)} → ${semanticLabel(arc.disruption)} → apparent resolution → payoff.`;
  const transformation = `Turn supplied reality into a changed read: establish the baseline, express the consequence of the change, make the distinctive turn newly matter, create apparent resolution, then let ${ending ? "the supplied ending reframe the sequence" : "the final beat become the earned consequence"}.`;
  return { thesis, transformation };
}

function operationFor(index: number, total: number, hasEnding: boolean): Operation {
  if (index === total - 1) return "payoff";
  if (hasEnding && index === total - 2) return "payoff_setup";
  if (index === 0) return "anchor";
  if (index === 1) return "change";
  return "disruption";
}

function realizationGoal(operation: Operation, packet: Omit<Packet, "directives">): string {
  switch (operation) {
    case "anchor": return `Establish ${packet.arc.baseline} with one clean beat. Do not explain.`;
    case "change": return `Express the consequence or new read created by ${packet.arc.change}. Do not restate the source event as a receipt.`;
    case "disruption": return `Reframe ${packet.arc.disruption} so it becomes newly important. Use implication, contrast, inversion, personification, status shift, or compression; do not invent a literal event.`;
    case "payoff_setup": return packet.payoff.target ? `Create a visible sense of resolution while keeping the thread alive for: ${packet.payoff.target}.` : "Create apparent resolution that makes the final beat land.";
    default: return packet.payoff.target ? `Land the exact supplied destination as a payoff: ${packet.payoff.target}.` : "Land the strongest earned consequence and stop.";
  }
}

function purpose(operation: Operation, target: string): string {
  switch (operation) {
    case "anchor": return "establish baseline";
    case "change": return "change the read";
    case "disruption": return "reframe an established element";
    case "payoff_setup": return target ? `prepare payoff: ${target}` : "prepare payoff";
    default: return target ? `land payoff: ${target}` : "land payoff";
  }
}

function viewerChange(operation: Operation): string {
  switch (operation) {
    case "anchor": return "baseline established";
    case "change": return "meaning changes";
    case "disruption": return "new question or reversal";
    case "payoff_setup": return "resolution appears";
    default: return "pressure resolves";
  }
}

function buildPacket(input: AuthorBrainTruth): Packet {
  const subject = clean(input.subject) || "the subject";
  const intent = clean(input.prompt);
  const source = reality(input);
  const ending = endpoint(intent);
  const count = lineCount(intent);
  const arc = chooseArc(source, subject, ending);
  const referencePolicy = buildReferencePolicy(subject);
  const derived = deriveDirection(arc, subject, ending);
  const base = {
    mission: "QRE is the authoring brain. It chooses reality, thesis, transformation, beat progression, and payoff. The model is only the final language renderer.",
    thesis: derived.thesis,
    transformation: derived.transformation,
    subject,
    referencePolicy,
    reality: source,
    intent,
    arc,
    payoff: {
      target: ending || arc.resolution,
      setup: ending ? "Build backward from the supplied ending. The penultimate beat must make the ending newly relevant." : "Make the last beat the earned consequence of the progression.",
      requirement: ending ? "Do not reveal the destination early. The ending must change the read of what came before." : "Stop on the earned consequence.",
    },
    style: [
      "Current, direct, compressed language.",
      "Strong verbs, clean syntax, varied rhythm, implication over explanation.",
      "Every line should create a new read, not merely deliver another record entry.",
      "No AI-summary voice, greeting-card language, corporate mush, generic inspiration, or ornamental narration.",
      "Trust the reader.",
    ],
    constraints: [
      "Reality is immutable unless the prompt explicitly requests fiction or transformation.",
      "Creative wording may be new. Creative framing may be new. Literal facts may not be fabricated.",
      "No unsupported people, places, objects, relationships, identity attributes, body details, dialogue, sensory facts, or physical outcomes.",
      "Do not infer identity from names or domain.",
      "Do not mechanically replay source facts across the middle beats.",
      "At least two non-final beats must transform or reframe supplied material rather than merely restating it.",
      "Use the exact supplied ending when one exists.",
    ],
    output: { lineCount: count, maxWords: 7, endingExact: ending },
  };

  const targets = [arc.baseline, arc.change, arc.disruption, arc.resolution, ending || arc.resolution];
  const directives = Array.from({ length: count }, (_, index) => {
    const operation = operationFor(index, count, Boolean(ending));
    const sourceTarget = operation === "payoff_setup"
      ? arc.resolution || arc.disruption
      : operation === "payoff"
        ? ending || arc.resolution
        : targets[Math.min(index, targets.length - 1)] ?? subject;
    return {
      order: index + 1,
      operation,
      source: sourceTarget,
      purpose: purpose(operation, base.payoff.target),
      viewerChange: viewerChange(operation),
      realizationGoal: realizationGoal(operation, base),
      referencePolicy,
    };
  });

  return { ...base, directives };
}

function modelMessage(packet: Packet): Array<{ role: "user"; content: string }> {
  const compact = {
    thesis: packet.thesis,
    transformation: packet.transformation,
    subject: packet.subject,
    referencePolicy: packet.referencePolicy,
    reality: packet.reality,
    arc: packet.arc,
    payoff: packet.payoff,
    directives: packet.directives,
    style: packet.style,
    constraints: packet.constraints,
    output: packet.output,
  };
  return [{
    role: "user",
    content: [
      "QRE FINAL REALIZATION.",
      "You are the final language renderer. QRE already made the creative decisions.",
      "Your job is to realize the decisions, not retell the input facts.",
      `RETURN JSON ONLY: {\"lines\":[\"...\"]}. EXACTLY ${packet.output.lineCount} lines.`,
      `Each non-final line is ${packet.output.maxWords} words or fewer.`,
      packet.output.endingExact ? `FINAL LINE EXACTLY: ${packet.output.endingExact}` : "Finish on the earned consequence.",
      "Middle beats must transform the supplied material through consequence, implication, contrast, inversion, personification, status, juxtaposition, or compression.",
      "Do not write a sequence of fact sentences. Do not paraphrase the facts one-by-one.",
      "At least two non-final lines must make the supplied material newly meaningful rather than merely naming the event again.",
      packet.referencePolicy.instruction,
      "Do not invent a literal event, person, place, relationship, body detail, or identity attribute.",
      "No commentary, analysis, headings, markdown, or extra keys.",
      JSON.stringify(compact),
    ].join("\n"),
  }];
}

function normalizeLine(value: unknown): string {
  return clean(value).replace(/^(?:[-*•]|\d+[.)])\s*/u, "").replace(/^['\"]|['\"]$/g, "").trim();
}

function parseCandidate(raw: string, count: number): Candidate | undefined {
  const text = clean(raw).replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  if (!text) return undefined;
  try {
    const parsed = JSON.parse(text) as unknown;
    const lines = Array.isArray(parsed)
      ? parsed.map(normalizeLine).filter(Boolean)
      : parsed && typeof parsed === "object" && Array.isArray((parsed as Record<string, unknown>).lines)
        ? ((parsed as Record<string, unknown>).lines as unknown[]).map(normalizeLine).filter(Boolean)
        : [];
    return lines.length === count ? { lines } : undefined;
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return undefined;
    try {
      const parsed = JSON.parse(match[0]) as Record<string, unknown>;
      const lines = Array.isArray(parsed.lines) ? parsed.lines.map(normalizeLine).filter(Boolean) : [];
      return lines.length === count ? { lines } : undefined;
    } catch {
      return undefined;
    }
  }
}

function exactFactReplay(line: string, source: string): boolean {
  const a = clean(line).toLowerCase().replace(/[.!?]+$/g, "");
  const b = clean(source).toLowerCase().replace(/[.!?]+$/g, "");
  return Boolean(a && b && (a === b || (meaningful(a).length >= 3 && overlap(a, b) >= 0.92)));
}

function isIncidentalBodyUse(line: string): boolean {
  const normalized = clean(line).toLowerCase();
  return /\b(?:in|on|at|by)\s+hand\b/.test(normalized)
    || /\bface[- ]to[- ]face\b/.test(normalized)
    || /\bface\s+value\b/.test(normalized)
    || /\beye\s+level\b/.test(normalized)
    || /\bhead[- ]on\b/.test(normalized)
    || /\bhead\s+start\b/.test(normalized)
    || /\bfirst[- ]hand\b/.test(normalized)
    || /\bsecond[- ]hand\b/.test(normalized);
}

function bodyClaimViolation(line: string, packet: Packet): string | undefined {
  if (!BODY.test(line)) return undefined;
  if (isIncidentalBodyUse(line)) return undefined;
  const known = packet.reality.join(" ").toLowerCase();
  const bodyMatches = line.match(new RegExp(BODY.source, "gi")) ?? [];
  for (const token of bodyMatches) {
    if (!known.includes(token.toLowerCase())) return "unsupported_body_detail";
  }
  return undefined;
}

function identityViolation(line: string, packet: Packet): string | undefined {
  if (packet.referencePolicy.allowPronouns) return undefined;
  return PRONOUN.test(line) ? "unsupported_identity_reference" : undefined;
}

function explicitWorldExpansion(line: string, packet: Packet): string | undefined {
  const known = packet.reality.join(" ").toLowerCase();
  for (const [pattern, label] of [
    [RELATIONSHIP, "relationship"],
    [PLACE, "place"],
  ] as const) {
    const match = line.match(pattern);
    if (match && !known.includes(match[0].toLowerCase())) return `unsupported_${label}`;
  }
  return bodyClaimViolation(line, packet);
}

function beatQuality(candidate: Candidate, packet: Packet): number {
  const middleStart = 1;
  const middleEnd = Math.max(middleStart, candidate.lines.length - 1);
  let transformed = 0;
  for (let index = middleStart; index < middleEnd; index += 1) {
    const source = packet.directives[index]?.source ?? "";
    if (!exactFactReplay(candidate.lines[index] ?? "", source)) transformed += 1;
  }
  const middleCount = Math.max(1, middleEnd - middleStart);
  const transformationRate = transformed / middleCount;
  const ending = packet.output.endingExact
    ? clean(candidate.lines.at(-1)).toLowerCase() === packet.output.endingExact.toLowerCase() ? 1 : 0
    : 0.8;
  const progression = candidate.lines.length >= 3 ? 1 : 0;
  return metric(transformationRate * 0.58 + ending * 0.27 + progression * 0.15);
}

function validate(candidate: Candidate, packet: Packet): Validation {
  const reasons: string[] = [];
  if (candidate.lines.length !== packet.output.lineCount) reasons.push("wrong_line_count");
  let replayCount = 0;

  candidate.lines.forEach((line, index) => {
    const count = words(line).length;
    if (!count) reasons.push(`line_${index + 1}:empty`);
    if (index < candidate.lines.length - 1 && count > packet.output.maxWords) reasons.push(`line_${index + 1}:wrong_length`);
    if (META.test(line)) reasons.push(`line_${index + 1}:meta_language`);
    if (STOCK.test(line)) reasons.push(`line_${index + 1}:stock_sentiment`);
    if (GLUE.test(line)) reasons.push(`line_${index + 1}:explanatory_glue`);
    if (DECORATION.test(line)) reasons.push(`line_${index + 1}:generic_decoration`);
    if (/```|[{}]/.test(line)) reasons.push(`line_${index + 1}:format_noise`);
    const identity = identityViolation(line, packet);
    if (identity) reasons.push(`line_${index + 1}:${identity}`);
    const expansion = explicitWorldExpansion(line, packet);
    if (expansion) reasons.push(`line_${index + 1}:${expansion}`);
    if (index > 0 && index < candidate.lines.length - 1 && exactFactReplay(line, packet.directives[index]?.source ?? "")) replayCount += 1;
  });

  if (replayCount > 1) reasons.push(`mechanical_fact_replay:${replayCount}`);
  if (packet.output.endingExact && clean(candidate.lines.at(-1)).toLowerCase() !== packet.output.endingExact.toLowerCase()) reasons.push("endpoint_mismatch");
  if (new Set(candidate.lines.map((line) => line.toLowerCase())).size !== candidate.lines.length) reasons.push("duplicate_lines");

  const score = beatQuality(candidate, packet);
  if (score < MIN_SCORE) reasons.push(`quality_below_floor:${score}`);
  return { ok: reasons.length === 0, reasons, score };
}

function roleFor(index: number, total: number): ViewerAttentionRole {
  if (index === 0) return "hook";
  if (index === total - 1) return "payoff";
  if (index === total - 2) return "reframe";
  if (index === 1) return "question";
  return "escalation";
}

function gainFor(operation: Operation): SequenceGainKind {
  switch (operation) {
    case "anchor": return "baseline";
    case "change": return "new_fact";
    case "disruption": return "surprise";
    case "payoff_setup": return "reframe";
    default: return "payoff";
  }
}

function buildSequence(packet: Packet, candidate: Candidate, score: number): SequencePlay {
  const cuts: SequenceCut[] = [];
  const known: string[] = [];
  candidate.lines.forEach((text, index) => {
    const directive = packet.directives[index]!;
    const before: ViewerState = {
      known: [...known],
      expected: directive.purpose,
      unresolved: index ? packet.directives[index - 1]?.purpose : undefined,
      currentWant: directive.viewerChange,
      recentChange: index ? packet.directives[index - 1]?.source : undefined,
    };
    known.push(text);
    const after: ViewerState = {
      known: [...known],
      expected: index === candidate.lines.length - 1 ? undefined : packet.directives[index + 1]?.purpose,
      unresolved: directive.purpose,
      currentWant: index === candidate.lines.length - 1 ? undefined : packet.directives[index + 1]?.viewerChange,
      recentChange: directive.source,
    };
    cuts.push({
      id: `author-cut-${index + 1}`,
      order: index + 1,
      role: roleFor(index, candidate.lines.length),
      gainKind: gainFor(directive.operation),
      sourceIds: [`reality:${index + 1}`],
      informationGain: directive.realizationGoal,
      attentionDelta: directive.viewerChange,
      viewerBefore: before,
      viewerAfter: after,
      nextPromise: index === candidate.lines.length - 1 ? undefined : packet.directives[index + 1]?.purpose,
      payoffConnection: index === candidate.lines.length - 1 ? text : packet.output.endingExact || undefined,
      noveltyScore: metric(index === 0 ? 1 : 1 - overlap(text, candidate.lines[index - 1] ?? "")),
      confidence: score,
    });
  });

  return {
    subject: packet.subject,
    premise: packet.thesis,
    openingState: cuts[0]?.viewerBefore ?? { known: [] },
    baselineFacts: packet.reality,
    cuts,
    closingState: cuts.at(-1)?.viewerAfter,
    continuity: candidate.lines,
    antiCrutch: [
      "no summary",
      "no explanation",
      "no unsupported identity inference",
      "no unsupported world expansion",
      "no fact parade",
      "no mechanical replay",
      "ending must be earned",
      "rejected output never rendered",
    ],
  };
}

function brief(packet: Packet): AuthorCreativeBrief {
  return {
    angle: packet.thesis,
    engine: "reality → thesis → transformation → backward payoff → reference policy → one model call → semantic gate",
    question: packet.output.endingExact ? "What must become newly relevant before the ending lands?" : "What changes next?",
    strongestImage: packet.arc.disruption || packet.arc.change || packet.arc.baseline,
    tension: `${packet.arc.baseline} → ${packet.arc.disruption || packet.arc.change}`,
    payoff: packet.output.endingExact || packet.arc.resolution,
    callback: packet.arc.change,
    rhythm: ["short", "hit", "short", "hit", "short"] as AuthorRhythm[],
    avoid: ["fact parade", "mechanical replay", "stock sentiment", "generic transition", "unsupported identity", "unsupported world expansion", "detached ending"],
  };
}

export async function authorBrainUniversal(input: AuthorBrainTruth): Promise<AuthorResult> {
  const packet = buildPacket(input);
  const modelResult = await localModelGenerate(modelMessage(packet), "json", {
    numPredict: Math.min(512, Math.max(256, packet.output.lineCount * 80)),
    temperature: 0.5,
  });
  const candidate = parseCandidate(modelResult.text, packet.output.lineCount);
  const validation = candidate
    ? validate(candidate, packet)
    : { ok: false, reasons: ["invalid_model_json_or_line_count"], score: 0 };
  const raw = process.env.QRE_AUTHOR_DEBUG_RAW === "true" ? modelResult.text : undefined;

  if (!candidate || !validation.ok) {
    return {
      brief: brief(packet),
      scenes: [],
      sequence: undefined,
      field: { packet, prompt: input.prompt, subject: input.subject },
      diagnostics: {
        model: modelResult.model,
        modelCalls: 1,
        qualityStatus: "REJECTED_MODEL_OUTPUT",
        renderable: false,
        candidateSequences: candidate ? 1 : 0,
        acceptedCandidates: 0,
        rejectedCandidates: [{ reasons: validation.reasons, score: validation.score }],
        selectedScore: 0,
        qualityFloor: MIN_SCORE,
        lineCount: packet.output.lineCount,
        endpoint: packet.output.endingExact,
        endpointExact: false,
        complete: false,
        oneCanonicalPacket: true,
        thesis: packet.thesis,
        transformation: packet.transformation,
        referencePolicy: packet.referencePolicy,
        packetOperations: packet.directives.map((directive) => directive.operation),
        rejectedOutputNeverRendered: true,
        rawModelOutput: raw,
        creativeGrammar: packet.style,
        payoffContract: packet.payoff,
      },
    };
  }

  const sequence = buildSequence(packet, candidate, validation.score);
  const scenes: AuthorScene[] = candidate.lines.map((text, index, all) => ({
    text,
    kind: index === 0 ? "hook" : index === all.length - 1 ? "payoff" : index === all.length - 2 ? "turn" : "movement",
  }));

  return {
    brief: brief(packet),
    scenes,
    sequence,
    field: { packet, prompt: input.prompt, subject: input.subject },
    diagnostics: {
      model: modelResult.model,
      modelCalls: 1,
      qualityStatus: "ACCEPTED",
      renderable: true,
      candidateSequences: 1,
      acceptedCandidates: 1,
      rejectedCandidates: [],
      selectedScore: validation.score,
      qualityFloor: MIN_SCORE,
      lineCount: scenes.length,
      endpoint: packet.output.endingExact,
      endpointExact: packet.output.endingExact
        ? clean(scenes.at(-1)?.text).toLowerCase() === packet.output.endingExact.toLowerCase()
        : true,
      complete: true,
      oneCanonicalPacket: true,
      thesis: packet.thesis,
      transformation: packet.transformation,
      referencePolicy: packet.referencePolicy,
      packetOperations: packet.directives.map((directive) => directive.operation),
      rejectedOutputNeverRendered: true,
      rawModelOutput: raw,
      safeFallbackUsed: false,
      creativeGrammar: packet.style,
      payoffContract: packet.payoff,
    },
  };
}
