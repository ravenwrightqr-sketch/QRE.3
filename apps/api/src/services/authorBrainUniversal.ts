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
  allowPronouns: boolean;
  allowIdentityInference: boolean;
  instruction: string;
};

type BeatDirective = {
  order: number;
  operation: Operation;
  source: string;
  purpose: string;
  viewerChange: string;
  referencePolicy: ReferencePolicy;
};

type EntityProfile = {
  subject: string;
  explicitIdentity: string[];
  explicitPeople: string[];
  explicitPlaces: string[];
  explicitObjects: string[];
  explicitBodyDetails: string[];
};

type Packet = {
  mission: string;
  subject: string;
  referencePolicy: ReferencePolicy;
  entityProfile: EntityProfile;
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
  output: { lineCount: number; maxWords: number; endingExact: string };
};

type Candidate = { lines: string[] };
type Validation = { ok: boolean; reasons: string[]; score: number };

const MIN_SCORE = 0.72;
const META_LANGUAGE = /\b(?:as an ai|the audience|the viewer|this means|this shows|this reveals|the strategy|the beat|the writing process|according to qre|cognitive)\b/i;
const STOCK_SENTIMENT = /\b(?:magical moment|unforgettable experience|incredible journey|newfound confidence|a testament to|making memories|cherished moment|one for the books|truly amazing|absolutely adorable|once in a lifetime|beautiful moment|heartwarming)\b/i;
const EXPLANATORY_GLUE = /\b(?:therefore|as a result|which means|this is why|in order to|thus|ultimately)\b/i;
const GENERIC_DECORATION = /\b(?:beautifully|gracefully|dramatically|magically|poetically|gently|softly|wonderfully|incredibly|extremely)\b/i;
const PRONOUN_REFERENCE = /\b(?:he|she|him|her|his|hers|they|them|their|theirs)\b/i;
const EXPLICIT_RELATIONSHIP = /\b(?:husband|wife|partner|girlfriend|boyfriend|sister|brother|mother|father|son|daughter|friend|owner|boss|manager|lawyer|judge|doctor|nurse|employee|customer|officer)\b/i;
const EXPLICIT_PLACE = /\b(?:street|office|room|chair|table|bed|floor|counter|dresser|park|car|restaurant|hotel|house|kitchen|bathroom|store|shop|court|church|school|hospital)\b/i;
const EXPLICIT_BODY = /\b(?:tail|tails|legs|leg|ears|ear|paws|paw|eyes|eye|mouth|teeth|face|head|hands|hand|feet|foot|shoulder|hair|skin)\b/i;

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const uniq = (values: readonly string[], limit = 48): string[] => [...new Set(values.map(clean).filter(Boolean))].slice(0, limit);
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

function explicitMatches(text: string, pattern: RegExp): string[] {
  return uniq(text.match(new RegExp(pattern.source, "gi")) ?? []);
}

function buildEntityProfile(subject: string, source: string[], intent: string): EntityProfile {
  const text = `${source.join(" ")} ${intent}`;
  return {
    subject,
    explicitIdentity: uniq(text.match(/\b(?:he|she|him|her|his|hers|they|them|their|theirs|man|woman|male|female|boy|girl)\b/gi) ?? []),
    explicitPeople: explicitMatches(text, EXPLICIT_RELATIONSHIP),
    explicitPlaces: explicitMatches(text, EXPLICIT_PLACE),
    explicitObjects: uniq(text.match(/\b(?:bow|towel|dessert|dish|agreement|contract|clause|warning|light|connection|song|offer|house|car|room|reception)\b/gi) ?? []),
    explicitBodyDetails: explicitMatches(text, EXPLICIT_BODY),
  };
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
    .sort((a, b) => distinctiveness(b, material) - distinctiveness(a, material))[0]
    ?? material.at(-1)
    ?? change;
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

function purposeFor(operation: Operation, target: string): string {
  switch (operation) {
    case "anchor": return "Establish the starting condition clearly and quickly.";
    case "change": return "Make the supplied change visible; do not merely copy the next fact.";
    case "disruption": return "Make an established element newly matter through contrast, inversion, escalation, personification, or reframing.";
    case "payoff_setup": return target ? `Prepare the immediate condition that makes the destination land: ${target}` : "Prepare the final beat so the ending feels earned.";
    default: return target ? `Land the destination as a payoff, not as a detached slogan: ${target}` : "Land the strongest earned payoff and stop.";
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

function buildReferencePolicy(subject: string): ReferencePolicy {
  return {
    subject,
    mode: "explicit_name",
    allowPronouns: false,
    allowIdentityInference: false,
    instruction: `SUBJECT REFERENCE IS CLOSED. When referring to the subject, use exactly "${subject}". Do not use pronouns for the subject. Do not infer gender, age, relationships, profession, authority, or physical traits.`,
  };
}

function buildPacket(input: AuthorBrainTruth): Packet {
  const subject = clean(input.subject) || "the subject";
  const intent = clean(input.prompt);
  const source = reality(input);
  const ending = endpoint(intent);
  const count = lineCount(intent);
  const arc = chooseArc(source, subject, ending);
  const referencePolicy = buildReferencePolicy(subject);
  const entityProfile = buildEntityProfile(subject, source, intent);
  const base = {
    mission: "Create a contemporary, compressed sequence from supplied reality. QRE decides reality, meaning, progression, and destination. The model only realizes that decision in language.",
    subject,
    referencePolicy,
    entityProfile,
    reality: source,
    intent,
    arc,
    payoff: {
      target: ending || arc.apparentResolution,
      setup: ending
        ? "Build backward from the ending. The penultimate beat should create the condition that makes the final line newly meaningful."
        : "Make the final beat the earned consequence or newly relevant read of the preceding progression.",
      requirement: ending
        ? "Establish change, pressure, contradiction, false resolution, or another prerequisite before the exact ending. Never reveal the ending early."
        : "Finish on the strongest earned consequence and stop.",
    },
    style: [
      "Contemporary spoken intelligence: direct, compressed, specific, alive.",
      "Prefer strong verbs, clean syntax, and varied rhythm over exposition.",
      "Every line advances the experience; never pad with connective prose.",
      "No greeting-card sentiment, corporate mush, fake cinematic narration, moral lesson, or generic inspiration.",
      "Trust the reader. Imply where useful; explain only when clarity requires it.",
      "Fragments are allowed only when deliberate and sharp.",
    ],
    constraints: [
      "Literal reality is immutable unless the prompt explicitly requests fiction or transformation.",
      "Creative realization may change framing, attitude, status, implication, juxtaposition, rhythm, personification, or metaphorical read without inventing a new literal event.",
      "Do not invent unsupported people, places, objects, dialogue, relationships, body details, sensory facts, or physical outcomes.",
      "Do not infer identity attributes from names or context.",
      "One distinct beat per line.",
      "Do not repeat facts merely to fill space.",
      "Use the exact supplied ending when one exists.",
      "Build toward the ending; do not append it without setup.",
    ],
    output: { lineCount: count, maxWords: 7, endingExact: ending },
  };

  const targets = [arc.baseline, arc.change, arc.disruption, arc.apparentResolution, ending || arc.apparentResolution];
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
      purpose: purposeFor(operation, base.payoff.target),
      viewerChange: viewerChangeFor(operation),
      referencePolicy,
    };
  });

  return { ...base, directives };
}

function modelMessage(packet: Packet): Array<{ role: "user"; content: string }> {
  const compactPacket = {
    mission: packet.mission,
    subject: packet.subject,
    referencePolicy: packet.referencePolicy,
    entityProfile: packet.entityProfile,
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
      "QRE already decided reality, meaning, progression, and destination. Do not invent a second story.",
      `Return JSON only: {\"lines\":[\"...\"]}. Exactly ${packet.output.lineCount} lines.`,
      `Each non-final line is ${packet.output.maxWords} words or fewer.`,
      packet.output.endingExact ? `FINAL LINE EXACTLY: ${packet.output.endingExact}` : "End on the strongest earned result.",
      "Render the directives in order: establish → change → disrupt → setup → payoff.",
      packet.referencePolicy.instruction,
      "Use the supplied reality as authority. Creative language may reframe established material, but do not add literal world facts.",
      "Do not mechanically copy the facts. Make each line feel current, compressed, and purposeful.",
      "No commentary, analysis, headings, markdown, or extra keys.",
      JSON.stringify(compactPacket),
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
    if (Array.isArray(parsed)) {
      const lines = parsed.map(normalizeLine).filter(Boolean);
      return lines.length === count ? { lines } : undefined;
    }
    if (!parsed || typeof parsed !== "object") return undefined;
    const record = parsed as Record<string, unknown>;
    const lines = Array.isArray(record.lines) ? record.lines.map(normalizeLine).filter(Boolean) : [];
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

function identityViolation(line: string, packet: Packet): string | undefined {
  if (!packet.referencePolicy.allowPronouns && PRONOUN_REFERENCE.test(line)) {
    return "unsupported_identity_reference";
  }
  return undefined;
}

function explicitWorldExpansion(line: string, packet: Packet): string | undefined {
  const known = packet.reality.join(" ").toLowerCase();
  for (const [pattern, label] of [
    [EXPLICIT_RELATIONSHIP, "relationship"],
    [EXPLICIT_PLACE, "place"],
    [EXPLICIT_BODY, "body_detail"],
  ] as const) {
    const match = line.match(pattern);
    if (!match) continue;
    const token = match[0].toLowerCase();
    if (!known.includes(token)) return `unsupported_${label}`;
  }
  return undefined;
}

function beatQuality(candidate: Candidate, packet: Packet): number {
  const expected = packet.directives;
  if (!expected.length) return 0;
  let total = 0;
  for (let index = 0; index < expected.length; index += 1) {
    const line = candidate.lines[index] ?? "";
    const directive = expected[index]!;
    const sourceSupport = overlap(line, directive.source);
    const intentSupport = overlap(line, packet.intent);
    const novelty = index === 0 ? 1 : 1 - overlap(line, candidate.lines[index - 1] ?? "");
    let op = 0.7;
    if (directive.operation === "anchor") op = sourceSupport > 0 ? 1 : 0.7;
    if (directive.operation === "change") op = sourceSupport > 0 || intentSupport > 0 ? 1 : 0.8;
    if (directive.operation === "disruption") op = novelty > 0.18 ? 1 : 0.7;
    if (directive.operation === "payoff_setup") op = novelty > 0.12 ? 1 : 0.7;
    if (directive.operation === "payoff") op = packet.output.endingExact ? 1 : 0.85;
    total += op * 0.7 + Math.max(sourceSupport, intentSupport) * 0.2 + novelty * 0.1;
  }
  return metric(total / expected.length);
}

function validate(candidate: Candidate, packet: Packet): Validation {
  const reasons: string[] = [];
  if (candidate.lines.length !== packet.output.lineCount) reasons.push("wrong_line_count");

  candidate.lines.forEach((line, index) => {
    const count = words(line).length;
    if (!count) reasons.push(`line_${index + 1}:empty`);
    if (index < candidate.lines.length - 1 && count > packet.output.maxWords) reasons.push(`line_${index + 1}:wrong_length`);
    if (META_LANGUAGE.test(line)) reasons.push(`line_${index + 1}:meta_language`);
    if (STOCK_SENTIMENT.test(line)) reasons.push(`line_${index + 1}:stock_sentiment`);
    if (EXPLANATORY_GLUE.test(line)) reasons.push(`line_${index + 1}:explanatory_glue`);
    if (GENERIC_DECORATION.test(line)) reasons.push(`line_${index + 1}:generic_decoration`);
    if (/```|[{}]/.test(line)) reasons.push(`line_${index + 1}:format_noise`);
    const identity = identityViolation(line, packet);
    if (identity) reasons.push(`line_${index + 1}:${identity}`);
    const expansion = explicitWorldExpansion(line, packet);
    if (expansion) reasons.push(`line_${index + 1}:${expansion}`);
  });

  if (packet.output.endingExact) {
    const final = clean(candidate.lines.at(-1)).toLowerCase();
    if (final !== packet.output.endingExact.toLowerCase()) reasons.push("endpoint_mismatch");
  }

  const normalized = candidate.lines.map((line) => line.toLowerCase());
  if (new Set(normalized).size !== normalized.length) reasons.push("duplicate_lines");

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
      "no unsupported world expansion",
      "no fact parade",
      "ending must be earned",
      "rejected output never rendered",
    ],
  };
}

function brief(packet: Packet): AuthorCreativeBrief {
  return {
    angle: `${packet.subject}: ${packet.directives.map((directive) => directive.operation).join(" → ")}`,
    engine: "reality → meaning → backward payoff → reference policy → one model call → semantic gate",
    question: packet.output.endingExact ? "What must become newly relevant before the ending lands?" : "What changes next?",
    strongestImage: packet.arc.disruption || packet.arc.change || packet.arc.baseline,
    tension: `${packet.arc.baseline} → ${packet.arc.disruption || packet.arc.change}`,
    payoff: packet.output.endingExact || packet.arc.apparentResolution,
    callback: packet.arc.change,
    rhythm: ["short", "hit", "short", "hit", "short"] as AuthorRhythm[],
    avoid: ["fact parade", "stock sentiment", "generic transition", "unsupported identity", "unsupported world expansion", "detached ending"],
  };
}

export async function authorBrainUniversal(input: AuthorBrainTruth): Promise<AuthorResult> {
  const packet = buildPacket(input);
  const modelResult = await localModelGenerate(modelMessage(packet), "json", {
    numPredict: Math.min(512, Math.max(256, packet.output.lineCount * 80)),
    temperature: 0.36,
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
      referencePolicy: packet.referencePolicy,
      packetOperations: packet.directives.map((directive) => directive.operation),
      rejectedOutputNeverRendered: true,
      safeFallbackUsed: false,
      creativeGrammar: packet.style,
      payoffContract: packet.payoff,
    },
  };
}
