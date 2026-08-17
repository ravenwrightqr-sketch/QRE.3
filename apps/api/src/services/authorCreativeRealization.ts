import type { RealityGraph } from "@qre/contracts";

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const lower = (value: unknown): string => clean(value).toLowerCase();

const INTERNAL = /\b(?:attention strategy|operator(?: mix|s)?|build from beat|cognitive(?: plan| brain)?|cognition|viewer-facing|writing process|information frontier|narrative engagement|why this beat)\b/i;
const CONCRETE_INVENTION = /\b(?:grabbed|grabs|grab|leaped|leaps|jumped|jumps|ran|runs|called|calls|said|says|told|tells|asked|asks|walked|walks|drove|drives|opened|opens|closed|closes|picked up|picks up|put|puts|tied|ties|hugged|hugs|kissed|kisses|smiled|smiles|laughed|laughs|cried|cries|shouted|shouts|yelled|yells|looked at|looks at|stared|stares|waved|waves)\b/i;

export type CreativeRealizationMode = "fact" | "interpretation";

export type GroundedCreativeRealization = {
  text: string;
  mode: CreativeRealizationMode;
  sourceIds: string[];
  frame?: string;
  confidence: number;
  reason: string;
};

export type CreativeRealizationContext = {
  realityGraph: RealityGraph;
  subject: string;
  facts: readonly string[];
  sourceMoments: readonly string[];
  characterRead?: {
    coreTraits?: readonly string[];
    contradictions?: readonly string[];
    statusPosture?: string;
    emotionalPosture?: string;
    objectRelationships?: readonly string[];
    creativeFrames?: readonly { frame: string; reason: string; confidence?: number }[];
    allowedMoves?: readonly string[];
    avoidedMoves?: readonly string[];
  };
};

/**
 * Universal creative invariant:
 *
 * A memorable interpretation is legal when its meaning is recoverable from
 * supplied reality + an explicit cognitive relationship/frame, without adding
 * a new concrete event.
 *
 * This module does not write prose. It creates the grounding contract that the
 * beat planner and mouth must obey.
 */
export function buildCreativeRealizationContract(context: CreativeRealizationContext) {
  const graph = context.realityGraph;
  const events = graph.events.map((event) => ({
    id: event.id,
    label: clean(event.label),
    sourceIds: event.sourceIds ?? [],
  }));
  const traits = [...new Set((context.characterRead?.coreTraits ?? []).map(clean).filter(Boolean))];
  const contradictions = [...new Set([
    ...graph.unresolvedTensions,
    ...(context.characterRead?.contradictions ?? []),
  ].map(clean).filter(Boolean))];
  const frames = (context.characterRead?.creativeFrames ?? [])
    .map((item) => ({ frame: clean(item.frame), reason: clean(item.reason), confidence: Number(item.confidence ?? 0) }))
    .filter((item) => item.frame);

  return {
    invariant: "memorable interpretive statement must be recoverable from supplied reality while introducing no new concrete event",
    reality: {
      facts: [...context.facts].map(clean).filter(Boolean),
      sourceMoments: [...context.sourceMoments].map(clean).filter(Boolean),
      events,
    },
    character: {
      subject: clean(context.subject),
      traits,
      contradictions,
      statusPosture: clean(context.characterRead?.statusPosture),
      emotionalPosture: clean(context.characterRead?.emotionalPosture),
      objectRelationships: [...(context.characterRead?.objectRelationships ?? [])].map(clean).filter(Boolean),
    },
    frames,
    allowedMoves: [...(context.characterRead?.allowedMoves ?? [])].map(clean).filter(Boolean),
    avoidedMoves: [...(context.characterRead?.avoidedMoves ?? [])].map(clean).filter(Boolean),
    legalModes: ["fact", "interpretation"],
    rule: [
      "A fact realization states supplied reality more sharply.",
      "An interpretation may use metaphor, status language, personification, implication, double meaning, comic framing, understatement, callback, or recontextualization.",
      "An interpretation must not assert a new person, object, location, dialogue, physical action, reaction, or outcome.",
      "The frame changes how supplied reality is seen; it does not change what happened.",
    ],
  } as const;
}

function tokens(text: string): Set<string> {
  return new Set(lower(text).split(/[^a-z0-9'’-]+/).filter((token) => token.length >= 3));
}

function overlap(a: Set<string>, b: Set<string>): number {
  if (!a.size) return 0;
  let hits = 0;
  for (const token of a) if (b.has(token)) hits += 1;
  return hits / a.size;
}

function sourceEvidence(context: CreativeRealizationContext): string[] {
  return [
    ...context.facts,
    ...context.sourceMoments,
    ...context.realityGraph.events.map((event) => event.label),
  ].map(clean).filter(Boolean);
}

/**
 * Deterministic gate for model-produced creative realizations.
 * It intentionally does not require lexical copying: an interpretation can
 * introduce words such as "negotiate" when the evidence establishes a
 * contradiction such as nervous + fierce and cognition supplies negotiation.
 */
export function evaluateCreativeRealization(
  text: string,
  context: CreativeRealizationContext,
  sourceIds: readonly string[] = [],
): GroundedCreativeRealization | null {
  const candidate = clean(text);
  if (!candidate || INTERNAL.test(candidate)) return null;
  if (candidate.split(/\s+/).length > 14) return null;

  const evidence = sourceEvidence(context);
  const candidateTokens = tokens(candidate);
  const evidenceTokens = tokens(evidence.join(" "));
  const lexicalGrounding = overlap(candidateTokens, evidenceTokens);

  const characterTerms = new Set([
    ...(context.characterRead?.coreTraits ?? []),
    ...(context.characterRead?.contradictions ?? []),
    ...(context.characterRead?.allowedMoves ?? []),
  ].flatMap((value) => [...tokens(clean(value))]));
  const characterGrounding = overlap(candidateTokens, characterTerms);

  const frames = context.characterRead?.creativeFrames ?? [];
  const frameHit = frames.find((frame) => {
    const frameTokens = tokens(`${frame.frame} ${frame.reason}`);
    return overlap(candidateTokens, frameTokens) >= 0.2 || lower(candidate).includes(lower(frame.frame));
  });

  // Concrete verbs are not automatically illegal. They are illegal when they
  // cannot be tied to an explicitly supplied event. This prevents "leaps"
  // from Coco's invented planner beat while allowing "arrived" when arrival
  // really exists in the source reality.
  const concreteVerb = CONCRETE_INVENTION.test(candidate);
  const directlyGrounded = evidence.some((item) => {
    const itemTokens = tokens(item);
    return overlap(candidateTokens, itemTokens) >= 0.45;
  });
  if (concreteVerb && !directlyGrounded) return null;

  const hasInterpretiveSignal = Boolean(frameHit) || characterGrounding >= 0.2 || context.characterRead?.statusPosture && candidateTokens.size > 0;
  if (lexicalGrounding < 0.12 && !hasInterpretiveSignal) return null;

  const mode: CreativeRealizationMode = hasInterpretiveSignal && !directlyGrounded ? "interpretation" : "fact";
  const confidence = Math.min(
    0.99,
    0.35 + lexicalGrounding * 0.3 + characterGrounding * 0.2 + (frameHit ? 0.15 : 0),
  );

  return {
    text: candidate,
    mode,
    sourceIds: [...new Set(sourceIds.filter(Boolean))],
    frame: frameHit?.frame,
    confidence: Number(confidence.toFixed(3)),
    reason: mode === "interpretation"
      ? `interpretation grounded by ${frameHit?.frame ?? "character contradiction/status"}`
      : "directly recoverable from supplied evidence",
  };
}
