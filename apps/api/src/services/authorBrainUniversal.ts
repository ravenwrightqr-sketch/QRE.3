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

type Operation =
  | "anchor"
  | "change"
  | "disruption"
  | "payoff_setup"
  | "payoff";

type BeatDirective = {
  order: number;
  operation: Operation;
  source: string;
  purpose: string;
  viewerChange: string;
};

type Packet = {
  mission: string;
  subject: string;
  identityRule: string;
  reality: string[];
  intent: string;
  arc: {
    baseline: string;
    change: string;
    disruption: string;
    apparentResolution: string;
    ending: string;
  };
  payoff: {
    target: string;
    setup: string;
    requirement: string;
  };
  directives: BeatDirective[];
  style: string[];
  constraints: string[];
  output: {
    lineCount: number;
    maxWords: number;
    endingExact: string;
  };
};

type Candidate = { lines: string[] };
type Validation = { ok: boolean; reasons: string[]; score: number };

const MIN_SCORE = 0.76;

const META_LANGUAGE = /\b(?:as an ai|the audience|the viewer|this means|this shows|this reveals|the strategy|the beat|the writing process|according to qre|cognitive)\b/i;
const STOCK_SENTIMENT = /\b(?:magical moment|unforgettable experience|incredible journey|newfound confidence|a testament to|making memories|cherished moment|one for the books|truly amazing|absolutely adorable|once in a lifetime|beautiful moment|heartwarming)\b/i;
const EXPLANATORY_GLUE = /\b(?:therefore|as a result|which means|this is why|in order to|thus|ultimately)\b/i;
const GENERIC_DECORATION = /\b(?:beautifully|gracefully|dramatically|magically|poetically|gently|softly|wonderfully|incredibly|extremely)\b/i;
const IDENTITY_REFERENCE = /\b(?:he|she|him|her|his|hers|husband|wife|man|woman|male|female|boy|girl)\b/i;
const PRONOUN_REFERENCE = /\b(?:he|she|him|her|his|hers)\b/i;

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const uniq = (values: readonly string[], limit = 40): string[] => [...new Set(values.map(clean).filter(Boolean))].slice(0, limit);
const words = (value: string): string[] => clean(value).toLowerCase().split(/[^a-z0-9'-]+/i).filter(Boolean);
const meaningful = (value: string): string[] => words(value).filter((word) => word.length > 2);
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

function tokenSet(value: string): Set<string> {
  return new Set(meaningful(value));
}

function overlap(a: string, b: string): number {
  const left = tokenSet(a);
  const right = tokenSet(b);
  if (!left.size || !right.size) return 0;
  let shared = 0;
  for (const token of left) if (right.has(token)) shared += 1;
  return shared / Math.max(left.size, right.size);
}

function distinctiveness(value: string, all: string[]): number {
  const mine = tokenSet(value);
  if (!mine.size) return 0;
  let shared = 0;
  for (const other of all) {
    if (other === value) continue;
    const otherTokens = tokenSet(other);
    for (const token of mine) if (otherTokens.has(token)) shared += 1;
  }
  return mine.size / Math.max(1, shared + 1);
}

function chooseArc(source: string[], subject: string, ending: string): Packet["arc"] {
  const material = source.filter((value) => clean(value).toLowerCase() !== subject.toLowerCase());
  const baseline = material[0] ?? subject;
  const change = material[1] ?? material.at(-1) ?? baseline;
  const middle = material.slice(2, Math.max(2, material.length - 1));
  const disruption = [...middle]
    .sort((a, b) => distinctiveness(b, material) - distinctiveness(a, material))[0] ?? material.at(-1) ?? change;
  const apparentResolution = material.at(-1) ?? change;
  return { baseline, change, disruption, apparentResolution, ending };
}

function operationFor(index: number, count: number, hasEnding: boolean): Operation {
  if (index === count - 1) return "payoff";
  if (hasEnding && index === count - 2) return "payoff_setup";
  if (index === 0) return "anchor";
  if (index === 1) return "change";
  return "disruption";
}

function purposeFor(operation: Operation, packet: Omit<Packet, "directives">): string {
  switch (operation) {
    case "anchor":
      return "Make the starting condition immediately clear using the supplied reality.";
    case "change":
      return "Show a real change, shift, or new reading created by the supplied material; do not merely restate the next fact.";
    case "disruption":
      return "Do something sharper with an established element: invert it, reframe it, escalate it, or make it newly relevant.";
    case "payoff_setup":
      return packet.payoff.target
        ? `Create the immediate setup that makes the final destination land: ${packet.payoff.target}`
        : "Create the last turn that makes the ending feel earned.";
    default:
      return packet.payoff.target
        ? `Land the exact destination as the payoff: ${packet.payoff.target}`
        : "Land the strongest earned payoff and stop.";
  }
}

function viewerChangeFor(operation: Operation): string {
  switch (operation) {
    case "anchor": return "establish baseline";
    case "change": return "update the read";
    case "disruption": return "create a new question or reversal";
    case "payoff_setup": return "make the destination newly relevant";
    default: return "resolve the pressure";
  }
}

function buildPacket(input: AuthorBrainTruth): Packet {
  const subject = clean(input.subject) || "the subject";
  const intent = clean(input.prompt);
  const source = reality(input);
  const ending = endpoint(intent);
  const count = lineCount(intent);
  const arc = chooseArc(source, subject, ending);

  const base = {
    mission: "Create a contemporary, compressed sequence from supplied reality. QRE decides what matters, what changes, and where it lands. The model only realizes that decision in language.",
    subject,
    identityRule: "Use only identity attributes actually established by the supplied reality or prompt. When identity is unspecified, use the subject name or neutral phrasing. Never infer gender, relationships, profession, authority, age, or physical traits.",
    reality: source,
    intent,
    arc,
    payoff: {
      target: ending || arc.apparentResolution,
      setup: ending
        ? "Build backward from the ending. The penultimate beat must make the final line newly meaningful; the ending must not feel appended."
        : "Make the final beat feel like the earned consequence of the preceding progression.",
      requirement: ending
        ? "Before the exact ending appears, establish the change, pressure, contradiction, or false resolution that gives it force. Never reveal the ending early."
        : "Finish on the strongest newly relevant read of the supplied reality.",
    },
    style: [
      "Contemporary spoken intelligence: direct, compressed, specific, alive.",
      "Prefer strong verbs and clean syntax over explanation or ornament.",
      "Use sentence fragments only when they sharpen rhythm; do not produce accidental fragments.",
      "Every line must do something new. No fact-parade formatting.",
      "No greeting-card sentiment, corporate filler, moral lesson, fake cinematic narration, or generic inspirational language.",
      "Do not use stock transitions to glue facts together. Make the beat itself create the transition.",
      "Trust the reader. Imply where possible; explain only when necessary for clarity.",
    ],
    constraints: [
      "Literal reality is immutable unless the prompt explicitly asks for fiction or transformation.",
      "Creative realization may change framing, attitude, status, implication, juxtaposition, rhythm, personification, or metaphorical read without inventing a new literal event.",
      "Do not invent unsupported people, places, objects, dialogue, sensory details, body details, relationships, or physical outcomes.",
      "Do not infer gender or personal attributes from a name, subject type, or context.",
      "Do not explain the creative strategy.",
      "One distinct beat per line.",
      "Do not repeat a fact in different words merely to fill space.",
      "Use the exact supplied ending when one exists.",
      "The ending is a destination. Build toward it instead of appending it.",
    ],
    output: { lineCount: count, maxWords: 7, endingExact: ending },
  };

  const targets = [
    arc.baseline,
    arc.change,
    arc.disruption,
    arc.apparentResolution,
    ending || arc.apparentResolution,
  ];

  const directives = Array.from({ length: count }, (_, index) => {
    const operation = operationFor(index, count, Boolean(ending));
    const sourceTarget = operation === "payoff_setup"
      ? arc.apparentResolution || arc.disruption
      : operation === "payoff"
        ? ending || arc.apparentResolution
        : targets[Math.min(index, targets.length - 1)] ?? subject;
    return {
      order: index + 1,
      operation,
      source: sourceTarget,
      purpose: purposeFor(operation, base),
      viewerChange: viewerChangeFor(operation),
    };
  });

  return { ...base, directives };
}

function modelMessage(packet: Packet): Array<{ role: "user"; content: string }> {
  const compactPacket = {
    mission: packet.mission,
    subject: packet.subject,
    identityRule: packet.identityRule,
    reality: packet.reality,
    intent: packet.intent,
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
      "You are the language renderer at the end of a deterministic creative system.",
      "QRE has already decided the reality, creative direction, beat progression, and ending. Do not invent a second story.",
      `Return JSON only: {\"lines\":[\"...\"]}. Exactly ${packet.output.lineCount} lines.`,
      `Each non-final line is ${packet.output.maxWords} words or fewer.`,
      packet.output.endingExact
        ? `FINAL LINE EXACTLY: ${packet.output.endingExact}`
        : "End on the strongest earned result.",
      "Render the directives in order.",
      "Line 1 establishes. Middle lines change the read. The disruption should make an existing element newly matter. The penultimate line creates the immediate payoff setup. The final line lands the destination.",
      "Do not output commentary, analysis, headings, markdown, or extra keys.",
      JSON.stringify(compactPacket),
    ].join("\n"),
  }];
}

function normalizeLine(value: unknown): string {
  return clean(value)
    .replace(/^(?:[-*•]|\d+[.)])\s*/u, "")
    .replace(/^['\"]|['\"]$/g, "")
    .trim();
}

function parseCandidate(raw: string, count: number): Candidate | undefined {
  const text = clean(raw).replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  if (!text) return undefined;

  try {
    const parsed = JSON.parse(text) as unknown;
    if (Array.isArray(parsed)) {
      const lines = parsed.map(normalizeLine).filter(Boolean);
      return lines.length === count ? { lines } : undefined;
    }
    if (!parsed || typeof parsed !== "object") return undefined;
    const record = parsed as Record<string, unknown>;
    const direct = record.lines;
    if (Array.isArray(direct)) {
      const lines = direct.map(normalizeLine).filter(Boolean);
      if (lines.length === count) return { lines };
    }
    return undefined;
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return undefined;
    try {
      const parsed = JSON.parse(match[0]) as Record<string, unknown>;
      if (!Array.isArray(parsed.lines)) return undefined;
      const lines = parsed.lines.map(normalizeLine).filter(Boolean);
      return lines.length === count ? { lines } : undefined;
    } catch {
      return undefined;
    }
  }
}

function unauthorizedIdentity(line: string, packet: Packet): string | undefined {
  if (!IDENTITY_REFERENCE.test(line)) return undefined;
  const realityText = packet.reality.join(" ").toLowerCase();
  const intentText = packet.intent.toLowerCase();
  if (PRONOUN_REFERENCE.test(line)) {
    const subjectKnown = new RegExp(`\\b${packet.subject.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}\\b`, "i").test(realityText + " " + intentText);
    const explicitPronoun = new RegExp(`\\b(?:he|she|him|her|his|hers)\\b`, "i").test(realityText + " " + intentText);
    if (!explicitPronoun && subjectKnown) return "unsupported_identity_reference";
  }
  return undefined;
}

function noveltyLoad(line: string, packet: Packet): number {
  const allowed = new Set([...meaningful(packet.reality.join(" ")), ...meaningful(packet.intent)]);
  const tokens = meaningful(line);
  if (!tokens.length) return 0;
  return tokens.filter((token) => !allowed.has(token)).length / tokens.length;
}

function validate(candidate: Candidate, packet: Packet): Validation {
  const reasons: string[] = [];

  candidate.lines.forEach((line, index) => {
    const count = words(line).length;
    if (!count) reasons.push(`line_${index + 1}:empty`);
    if (index < candidate.lines.length - 1 && count > packet.output.maxWords) reasons.push(`line_${index + 1}:wrong_length`);
    if (META_LANGUAGE.test(line)) reasons.push(`line_${index + 1}:meta_language`);
    if (STOCK_SENTIMENT.test(line)) reasons.push(`line_${index + 1}:stock_sentiment`);
    if (EXPLANATORY_GLUE.test(line)) reasons.push(`line_${index + 1}:explanatory_glue`);
    if (GENERIC_DECORATION.test(line)) reasons.push(`line_${index + 1}:generic_decoration`);
    if (/```|[{}]/.test(line)) reasons.push(`line_${index + 1}:format_noise`);
    const identity = unauthorizedIdentity(line, packet);
    if (identity) reasons.push(`line_${index + 1}:${identity}`);

    const novelty = noveltyLoad(line, packet);
    const grounded = overlap(line, packet.reality.join(" "));
    if (novelty > 0.72 && grounded < 0.18) reasons.push(`line_${index + 1}:unsupported_claim_load`);
  });

  if (packet.output.endingExact) {
    const final = clean(candidate.lines.at(-1)).toLowerCase();
    if (final !== packet.output.endingExact.toLowerCase()) reasons.push("endpoint_mismatch");
    for (const line of candidate.lines.slice(0, -1)) {
      if (overlap(line, packet.output.endingExact) > 0.82) reasons.push("ending_revealed_early");
    }
  }

  const normalized = candidate.lines.map((line) => line.toLowerCase());
  if (new Set(normalized).size !== normalized.length) reasons.push("duplicate_lines");

  const groundedScores = candidate.lines.map((line) => Math.max(overlap(line, packet.reality.join(" ")), overlap(line, packet.intent)));
  const grounding = groundedScores.reduce((a, b) => a + b, 0) / Math.max(1, groundedScores.length);
  const novelty = candidate.lines.length < 2
    ? 1
    : candidate.lines.slice(1).reduce((sum, line, index) => sum + 1 - overlap(line, candidate.lines[index] ?? ""), 0) / (candidate.lines.length - 1);

  const penultimate = candidate.lines.at(-2) ?? "";
  const payoffSetup = packet.output.endingExact
    ? Math.max(0, 1 - overlap(penultimate, packet.output.endingExact)) * Math.max(overlap(penultimate, packet.reality.join(" ")), 0.35)
    : 0.5;

  const score = metric(grounding * 0.52 + novelty * 0.23 + payoffSetup * 0.25);
  if (score < MIN_SCORE) reasons.push(`score_below_floor:${score}`);

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
      informationGain: directive.purpose,
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
    premise: packet.mission,
    openingState: cuts[0]?.viewerBefore ?? { known: [] },
    baselineFacts: packet.reality,
    cuts,
    closingState: cuts.at(-1)?.viewerAfter,
    continuity: candidate.lines,
    antiCrutch: [
      "no summary",
      "no explanation",
      "no unsupported identity inference",
      "no fact parade",
      "ending must be earned",
      "rejected output never rendered",
    ],
  };
}

function brief(packet: Packet): AuthorCreativeBrief {
  return {
    angle: `${packet.subject}: ${packet.directives.map((d) => d.operation).join(" → ")}`,
    engine: "reality → meaning → backward payoff → realization contract → one model call → gate",
    question: packet.output.endingExact ? "What must become newly relevant before the ending lands?" : "What changes next?",
    strongestImage: packet.arc.disruption || packet.arc.change || packet.arc.baseline,
    tension: `${packet.arc.baseline} → ${packet.arc.disruption || packet.arc.change}`,
    payoff: packet.output.endingExact || packet.arc.apparentResolution,
    callback: packet.arc.change,
    rhythm: ["short", "hit", "short", "hit", "short"] as AuthorRhythm[],
    avoid: ["fact parade", "stock sentiment", "generic transition", "unsupported identity", "detached ending"],
  };
}

export async function authorBrainUniversal(input: AuthorBrainTruth): Promise<AuthorResult> {
  const packet = buildPacket(input);

  const modelResult = await localModelGenerate(modelMessage(packet), "json", {
    numPredict: Math.min(512, Math.max(256, packet.output.lineCount * 80)),
    temperature: 0.42,
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
        packetOperations: packet.directives.map((d) => d.operation),
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
      packetOperations: packet.directives.map((d) => d.operation),
      rejectedOutputNeverRendered: true,
      safeFallbackUsed: false,
      creativeGrammar: packet.style,
      payoffContract: packet.payoff,
    },
  };
}
