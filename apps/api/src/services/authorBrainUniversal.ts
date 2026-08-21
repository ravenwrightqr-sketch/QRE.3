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

type Candidate = { lines: string[] };
type CandidateEnvelope = { lines?: unknown };

type RealizationOperation =
  | "anchor"
  | "contrast"
  | "status_shift"
  | "invert"
  | "escalate"
  | "callback"
  | "payoff";

type RealizationDirective = {
  order: number;
  operation: RealizationOperation;
  source: string;
  purpose: string;
};

type RealizationPacket = {
  mission: string;
  subject: string;
  reality: string[];
  intent: string;
  arc: {
    baseline: string;
    transition: string;
    disruption: string;
    result: string;
    ending: string;
  };
  directives: RealizationDirective[];
  constraints: string[];
  output: { lineCount: number; maxWords: number; endingExact: string };
};

type Validation = { ok: boolean; reasons: string[]; score: number };

const MIN_SCORE = 0.72;
const BAD_META = /\b(?:this means|this reveals|this shows|the viewer|the audience|the strategy|the beat|the point is|as an ai|cognitive|the writing process|according to qre)\b/i;
const BAD_FILLER = /\b(?:magical moment|unforgettable experience|incredible journey|newfound confidence|a testament to|making memories|cherished moment|one for the books|truly amazing|absolutely adorable|once in a lifetime)\b/i;
const BAD_EXPLANATION = /\b(?:therefore|as a result|which means|this is why|in order to|thus)\b/i;
const BAD_DECORATION = /\b(?:beautifully|gracefully|dramatically|magically|heartwarming|poetically|gently|softly)\b/i;
const SENSITIVE = /\b(?:he|she|him|her|his|hers|husband|wife|man|woman|male|female|boy|girl|lawyer|judge|king|queen|boss|manager|officer|doctor|nurse|friend|stranger|customer|owner|employee|tail|tails|legs|leg|ears|ear|paws|paw|eyes|eye|mouth|teeth|face|head|hands|hand|feet|foot|counter|dresser|door|outside|inside|street|car|park|office|room|chair|table|bed|floor|steam|water|bathwater|towel|mirror|window|leash|collar|coat|hat|running|ran|walked|walking|jumped|jumping|hugged|smiled|laughed|cried|whispered|yelled|shaking|shook|trembled|trembling|shivering)\b/i;

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const uniq = (values: readonly string[], limit = 36): string[] => [...new Set(values.map(clean).filter(Boolean))].slice(0, limit);
const words = (value: string): string[] => clean(value).toLowerCase().split(/[^a-z0-9'-]+/i).filter(Boolean);
const meaningfulWords = (value: string): string[] => words(value).filter((word) => word.length > 2);
const metric = (value: number): number => Number(Math.max(0, Math.min(1, value)).toFixed(3));

function lineCount(prompt: string): number {
  const match = clean(prompt).match(/\b(\d{1,2})\s*[- ]?\s*line(?:s)?\b/i);
  const count = match ? Number(match[1]) : 5;
  return Number.isFinite(count) ? Math.max(3, Math.min(8, count)) : 5;
}

function endpoint(prompt: string): string {
  const match = clean(prompt).match(/(?:final\s+line|ending|endpoint)\s*:\s*(.+)$/i);
  return clean(match?.[1] ?? "").replace(/^['\"]|['\"]$/g, "");
}

function normalizeLine(value: unknown): string {
  return clean(value).replace(/^(?:[-*•]|\d+[.)])\s*/u, "").replace(/^['\"]|['\"]$/g, "");
}

function facts(input: AuthorBrainTruth): string[] {
  return uniq([
    input.subject,
    input.place ?? "",
    ...input.facts,
    ...input.sourceMoments,
    ...(input.memoryContext ?? []),
    ...(input.presenceSummary ?? []),
  ], 36);
}

function distinctiveness(value: string, all: string[]): number {
  const mine = new Set(meaningfulWords(value));
  if (!mine.size) return 0;
  let shared = 0;
  for (const other of all) {
    if (other === value) continue;
    const otherWords = new Set(meaningfulWords(other));
    for (const token of mine) if (otherWords.has(token)) shared += 1;
  }
  return mine.size / Math.max(1, shared + 1);
}

function chooseArc(source: string[], subject: string, ending: string) {
  const material = source.filter((value) => value.toLowerCase() !== subject.toLowerCase());
  const baseline = material[0] ?? subject;
  const result = material.at(-1) ?? baseline;
  const middle = material.slice(1, Math.max(1, material.length - 1));
  const disruption = middle.length
    ? [...middle].sort((a, b) => distinctiveness(b, material) - distinctiveness(a, material))[0]!
    : result;
  const transition = middle.find((value) => value !== disruption) ?? result;
  return {
    baseline,
    transition,
    disruption,
    result,
    ending,
  };
}

function operationFor(index: number, count: number, arc: ReturnType<typeof chooseArc>, input: AuthorBrainTruth, ending: string): RealizationOperation {
  if (index === count - 1) return "payoff";
  if (index === 0) return "anchor";
  if (index === count - 2) return ending ? "contrast" : "payoff";
  const text = `${arc.disruption} ${input.prompt} ${input.lens ?? ""}`.toLowerCase();
  if (/again|return|callback|memory|history/.test(text)) return "callback";
  if (/status|authority|approved|boss|lawyer|king|queen|running the place|power/.test(text)) return "status_shift";
  if (/attack|attacked|chaos|absurd|surreal|weird|strange|contradiction|wild|unhinged/.test(text)) return "invert";
  if (/pressure|danger|escalat|dark|horror|creepy/.test(text)) return "escalate";
  return "contrast";
}

function buildPacket(input: AuthorBrainTruth): RealizationPacket {
  const subject = clean(input.subject) || "the subject";
  const source = facts(input);
  const ending = endpoint(input.prompt);
  const count = lineCount(input.prompt);
  const arc = chooseArc(source, subject, ending);
  const targets = [arc.baseline, arc.transition, arc.disruption, arc.result, ending || arc.result];
  const directives: RealizationDirective[] = Array.from({ length: count }, (_, index) => {
    const operation = operationFor(index, count, arc, input, ending);
    const sourceTarget = targets[Math.min(index, targets.length - 1)] ?? subject;
    const purpose =
      operation === "anchor" ? "establish the starting reality" :
      operation === "contrast" ? "make the supplied change suddenly visible" :
      operation === "status_shift" ? "make the change in status or attitude unmistakable" :
      operation === "invert" ? "turn the supplied relationship into the sharpest creative read" :
      operation === "escalate" ? "push the supplied pressure further without adding a new event" :
      operation === "callback" ? "reuse an established element with a changed read" :
      "land the payoff and stop";
    return { order: index + 1, operation, source: sourceTarget, purpose };
  });
  return {
    mission: "Turn the supplied reality into a compact, memorable sequence. QRE decides meaning and limits; the model decides wording.",
    subject,
    reality: source,
    intent: clean(input.prompt),
    arc,
    directives,
    constraints: [
      "Reality is immutable unless the user explicitly asks for fiction or transformation.",
      "Creative intent can authorize attitude, status, contrast, inversion, personification, implication, and metaphorical framing.",
      "Do not invent unsupported people, places, objects, body details, dialogue, sensory details, or literal physical outcomes.",
      "Do not explain the creative move.",
      "One line per directive.",
      "The final line is the supplied ending when one exists.",
    ],
    output: { lineCount: count, maxWords: 7, endingExact: ending },
  };
}

function modelMessage(packet: RealizationPacket): Array<{ role: "user"; content: string }> {
  const content = [
    "QRE FINAL REALIZATION.",
    "Render this packet directly. Do not plan, critique, summarize, or explain it.",
    `Return JSON only: {\"lines\":[\"...\"]} with exactly ${packet.output.lineCount} lines.`,
    `Each non-final line: 2-${packet.output.maxWords} words.`,
    packet.output.endingExact ? `FINAL LINE EXACTLY: ${packet.output.endingExact}` : "Finish on the strongest supplied change.",
    JSON.stringify(packet),
  ].join("\n");
  return [{ role: "user", content }];
}

function parseCandidate(raw: string, count: number): Candidate | undefined {
  const text = clean(raw).replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try {
    const parsed = JSON.parse(text) as CandidateEnvelope;
    const lines = Array.isArray(parsed.lines) ? parsed.lines.map(normalizeLine).filter(Boolean) : [];
    return lines.length === count ? { lines } : undefined;
  } catch {
    return undefined;
  }
}

function overlap(a: string, b: string): number {
  const left = new Set(meaningfulWords(a));
  const right = new Set(meaningfulWords(b));
  if (!left.size || !right.size) return 0;
  let shared = 0;
  for (const token of left) if (right.has(token)) shared += 1;
  return shared / Math.max(left.size, right.size);
}

function validate(candidate: Candidate, input: AuthorBrainTruth, packet: RealizationPacket): Validation {
  const reasons: string[] = [];
  const realWords = new Set(meaningfulWords(packet.reality.join(" ")));
  const intentWords = new Set(meaningfulWords(packet.intent));
  const allowed = new Set([...realWords, ...intentWords]);

  candidate.lines.forEach((line, index) => {
    const count = words(line).length;
    if (count < 1) reasons.push(`line_${index + 1}:empty`);
    if (index !== candidate.lines.length - 1 && count > packet.output.maxWords) reasons.push(`line_${index + 1}:wrong_length`);
    if (BAD_META.test(line)) reasons.push(`line_${index + 1}:meta_language`);
    if (BAD_FILLER.test(line)) reasons.push(`line_${index + 1}:generic_filler`);
    if (BAD_EXPLANATION.test(line)) reasons.push(`line_${index + 1}:explanatory_glue`);
    if (BAD_DECORATION.test(line)) reasons.push(`line_${index + 1}:decorative_prose`);
    if (/```|[{}]/.test(line)) reasons.push(`line_${index + 1}:format_noise`);
    for (const token of meaningfulWords(line)) {
      if (SENSITIVE.test(token) && !allowed.has(token)) reasons.push(`line_${index + 1}:unsupported_concrete:${token}`);
    }
  });

  if (packet.output.endingExact && clean(candidate.lines.at(-1)).toLowerCase() !== packet.output.endingExact.toLowerCase()) reasons.push("endpoint_mismatch");
  const normalized = candidate.lines.map((line) => line.toLowerCase());
  if (new Set(normalized).size !== normalized.length) reasons.push("duplicate_lines");

  const support = candidate.lines.map((line) => {
    const parts = meaningfulWords(line);
    if (!parts.length) return 0;
    return parts.filter((token) => allowed.has(token)).length / parts.length;
  });
  const novelty = candidate.lines.length < 2
    ? 1
    : candidate.lines.slice(1).reduce((sum, line, index) => sum + 1 - overlap(line, candidate.lines[index] ?? ""), 0) / (candidate.lines.length - 1);
  const compact = candidate.lines.reduce((sum, line) => sum + Math.min(1, 7 / Math.max(1, words(line).length)), 0) / candidate.lines.length;
  const score = metric((support.reduce((a, b) => a + b, 0) / support.length) * 0.55 + novelty * 0.25 + compact * 0.20);
  if (score < MIN_SCORE) reasons.push(`score_below_floor:${score}`);
  return { ok: reasons.length === 0, reasons, score };
}

function roleFor(index: number, total: number): ViewerAttentionRole {
  if (index === 0) return "hook";
  if (index === total - 1) return "payoff";
  if (index === total - 2) return "reframe";
  return "escalation";
}

function gainFor(operation: RealizationOperation): SequenceGainKind {
  switch (operation) {
    case "anchor": return "new_fact";
    case "contrast": return "surprise";
    case "status_shift": return "reframe";
    case "invert": return "surprise";
    case "escalate": return "escalation";
    case "callback": return "callback";
    default: return "payoff";
  }
}

function buildSequence(packet: RealizationPacket, candidate: Candidate, score: number): SequencePlay {
  const cuts: SequenceCut[] = [];
  const known: string[] = [];
  candidate.lines.forEach((text, index) => {
    const directive = packet.directives[index]!;
    const before: ViewerState = {
      known: [...known],
      expected: directive.purpose,
      unresolved: index ? packet.directives[index - 1]?.purpose : undefined,
      currentWant: directive.purpose,
      recentChange: index ? packet.directives[index - 1]?.source : undefined,
    };
    known.push(text);
    const after: ViewerState = {
      known: [...known],
      expected: index === candidate.lines.length - 1 ? undefined : packet.directives[index + 1]?.purpose,
      unresolved: directive.purpose,
      currentWant: index === candidate.lines.length - 1 ? undefined : packet.directives[index + 1]?.purpose,
      recentChange: directive.source,
    };
    cuts.push({
      id: `author-cut-${index + 1}`,
      order: index + 1,
      role: roleFor(index, candidate.lines.length),
      gainKind: gainFor(directive.operation),
      sourceIds: [`directive:${index + 1}`],
      informationGain: directive.purpose,
      attentionDelta: directive.source,
      viewerBefore: before,
      viewerAfter: after,
      nextPromise: index === candidate.lines.length - 1 ? undefined : packet.directives[index + 1]?.purpose,
      payoffConnection: index === candidate.lines.length - 1 ? text : undefined,
      noveltyScore: metric(index === 0 ? 1 : 1 - overlap(text, candidate.lines[index - 1] ?? "")),
      confidence: score,
    });
  });
  return {
    subject: packet.subject,
    premise: packet.mission,
    openingState: cuts[0]?.viewerBefore ?? { known: [] },
    baselineFacts: packet.reality,
    cuts,
    closingState: cuts.at(-1)?.viewerAfter,
    continuity: candidate.lines,
    antiCrutch: ["no summary", "no explanation", "no unsupported concrete detail", "rejected output never rendered"],
  };
}

function makeBrief(packet: RealizationPacket): AuthorCreativeBrief {
  return {
    angle: `${packet.subject}: ${packet.directives.slice(0, 3).map((directive) => directive.operation).join(" → ")}`,
    engine: "reality → realization contract → one model call → gate",
    question: packet.output.endingExact ? "How does the sequence earn the ending?" : "What changes next?",
    strongestImage: packet.arc.disruption || packet.arc.baseline,
    tension: `${packet.arc.baseline} ↔ ${packet.arc.disruption}`,
    payoff: packet.output.endingExact || packet.arc.result,
    callback: packet.arc.transition,
    rhythm: ["short", "hit", "short", "hit", "short"] as AuthorRhythm[],
    avoid: ["fact parade", "analysis", "generic filler", "unsupported concrete invention", "explanation"],
  };
}

export async function authorBrainUniversal(input: AuthorBrainTruth): Promise<AuthorResult> {
  const packet = buildPacket(input);
  const modelResult = await localModelGenerate(modelMessage(packet), "json", {
    numPredict: Math.min(640, Math.max(320, packet.output.lineCount * 96)),
    temperature: 0.5,
  });
  const candidate = parseCandidate(modelResult.text, packet.output.lineCount);
  const validation = candidate
    ? validate(candidate, input, packet)
    : { ok: false, reasons: ["invalid_model_json_or_line_count"], score: 0 };

  if (!candidate || !validation.ok) {
    return {
      brief: makeBrief(packet),
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
        safeFallbackUsed: false,
      },
    };
  }

  const sequence = buildSequence(packet, candidate, validation.score);
  const scenes: AuthorScene[] = candidate.lines.map((text, index, all) => ({
    text,
    kind: index === 0 ? "hook" : index === all.length - 1 ? "payoff" : index === all.length - 2 ? "turn" : "movement",
  }));

  return {
    brief: makeBrief(packet),
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
      endpointExact: packet.output.endingExact ? clean(scenes.at(-1)?.text).toLowerCase() === packet.output.endingExact.toLowerCase() : true,
      complete: true,
      oneCanonicalPacket: true,
      packetOperations: packet.directives.map((directive) => directive.operation),
      rejectedOutputNeverRendered: true,
      safeFallbackUsed: false,
    },
  };
}
