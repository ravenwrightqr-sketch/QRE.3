import type {
  AuthorRealizationStrategy,
  AuthorStrategyCandidate,
  MouthCandidateBeat,
} from "@qre/contracts";
import type { RealityEnvelope } from "./authorRealityEnvelope.js";

const STRATEGY_ORDER: readonly AuthorRealizationStrategy[] = [
  "contrast",
  "recontextualization",
  "status_inversion",
  "understatement",
  "double_meaning",
  "callback",
  "implication",
  "reversal",
  "consequence",
  "compression",
  "personification",
];

function clean(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function metric(value: number): number {
  return Number(Math.max(0, Math.min(1, value)).toFixed(3));
}

function relationKindsForBeat(
  beat: MouthCandidateBeat,
  envelope: RealityEnvelope,
): string[] {
  const eventIds = new Set(beat.eventIds ?? []);
  return [
    ...new Set(
      envelope.relations
        .filter(
          (relation) =>
            eventIds.has(relation.from) ||
            eventIds.has(relation.to),
        )
        .map((relation) => relation.kind),
    ),
  ];
}

function reasonFor(
  strategy: AuthorRealizationStrategy,
  relationKinds: readonly string[],
  beat: MouthCandidateBeat,
): string {
  const mode = clean(beat.realizationMode).toLowerCase();
  const relation = relationKinds.join(", ") || "direct evidence";

  switch (strategy) {
    case "contrast":
      return `Use supplied signals to create a felt difference; graph relations=${relation}.`;
    case "recontextualization":
      return `Let a later supplied signal change an earlier reading; mode=${mode || "unspecified"}.`;
    case "status_inversion":
      return "Change the character's status reading without creating a new event.";
    case "understatement":
      return "Reduce the language while preserving the strongest supplied implication.";
    case "double_meaning":
      return "Exploit a supplied word or relationship with a second safe reading.";
    case "callback":
      return "Reuse an earlier supplied signal after its meaning has changed.";
    case "implication":
      return "Let the relationship be inferred instead of explained.";
    case "reversal":
      return "Reverse the expected reading while staying inside supplied evidence.";
    case "consequence":
      return "Make the supplied cause visibly matter without inventing a new outcome.";
    case "compression":
      return "Collapse multiple supplied signals into one short, natural thought.";
    case "personification":
      return "Use human-like framing only when it does not introduce concrete reality.";
  }
}

export function deriveRealizationStrategies(
  beat: MouthCandidateBeat,
  envelope: RealityEnvelope,
): AuthorStrategyCandidate[] {
  const relationKinds = relationKindsForBeat(beat, envelope);
  const mode = clean(beat.realizationMode).toLowerCase();
  const creativeMove = clean(beat.creativeMove).toLowerCase();
  const attentionFunction = clean(beat.attentionFunction).toLowerCase();
  const required = new Set<AuthorRealizationStrategy>();

  const contrastDriven =
    creativeMove === "contrast" ||
    attentionFunction === "reframe" ||
    mode.includes("contrast") ||
    relationKinds.includes("contrasts");

  if (contrastDriven) {
    required.add("contrast");
    required.add("status_inversion");
    required.add("understatement");
  }

  if (
    relationKinds.includes("changes") ||
    relationKinds.includes("recontextualizes") ||
    mode.includes("reframe") ||
    mode.includes("meaning")
  ) {
    required.add("recontextualization");
    required.add("implication");
    required.add("reversal");
  }

  if (relationKinds.includes("causes") || mode.includes("consequence")) {
    required.add("consequence");
  }

  if (mode.includes("callback") || relationKinds.includes("repeats")) {
    required.add("callback");
  }

  if (
    mode.includes("double") ||
    creativeMove === "double_meaning"
  ) {
    required.add("double_meaning");
  }

  if (
    mode.includes("payoff") ||
    attentionFunction === "payoff"
  ) {
    required.add("compression");
    required.add("callback");
    required.add("understatement");
  }

  if (
    mode.includes("person") ||
    creativeMove === "personification"
  ) {
    required.add("personification");
  }

  if (!required.size) {
    required.add("implication");
    required.add("compression");
    required.add("recontextualization");
  }

  return STRATEGY_ORDER
    .filter((strategy) => required.has(strategy))
    .map((strategy, index) => ({
      strategy,
      reason: reasonFor(strategy, relationKinds, beat),
      sourceRelationKinds: [...relationKinds],
      safety: metric(
        strategy === "personification" || strategy === "double_meaning"
          ? 0.78 - index * 0.025
          : 0.95 - index * 0.02,
      ),
      novelty: metric(0.55 + Math.min(0.4, index * 0.06)),
    }));
}

export function selectSafeStrategies(
  beat: MouthCandidateBeat,
  envelope: RealityEnvelope,
  limit = 5,
): AuthorStrategyCandidate[] {
  const selected = deriveRealizationStrategies(beat, envelope)
    .filter((candidate) => candidate.safety >= 0.7)
    .sort(
      (left, right) =>
        right.safety * 0.7 + right.novelty * 0.3 -
        (left.safety * 0.7 + left.novelty * 0.3),
    );

  const contrastCandidate = selected.find(
    (candidate) => candidate.strategy === "contrast",
  );

  if (contrastCandidate && !selected.slice(0, limit).some((candidate) => candidate.strategy === "contrast")) {
    const head = selected.slice(0, Math.max(0, limit - 1));
    return [
      ...head,
      contrastCandidate,
    ];
  }

  return selected.slice(0, limit);
}
