/**
 * QRE AUTHOR · CREATIVE REALIZATION ENGINE
 *
 * CANONICAL PURPOSE:
 *   approved reality
 *   + character / relationship meaning
 *   + semantic trajectory
 *   + safe creative strategies
 *     ↓
 *   BEST CREATIVE REALIZATION
 *
 * This layer does NOT write viewer prose and does NOT create reality.
 * It computes the interesting thing the Mouth should realize.
 *
 * CORE LAW:
 *   A supplied fact is raw material, not automatically viewer-facing language.
 *
 * The engine is deterministic and model-free so the same approved inputs produce
 * the same realization intent. The Mouth remains the only language generator.
 */
import type {
  AuthorCharacterProfile,
  AuthorRealizationStrategy,
  AuthorStrategyCandidate,
  MouthCandidateBeat,
} from "@qre/contracts";
import type { RealityEnvelope } from "./authorRealityEnvelope.js";

export type CreativeRealization = {
  strategy: AuthorRealizationStrategy;
  creativeOpportunity: string;
  realizationIntent: string;
  viewerEffect: string;
  sourceAnchors: string[];
  forbiddenLiteralizations: string[];
  score: number;
};

const CONTRAST_PAIRS: readonly [string, string][] = [
  ["nervous", "fierce"],
  ["afraid", "brave"],
  ["uncertain", "confident"],
  ["quiet", "bold"],
  ["shy", "commanding"],
  ["calm", "chaotic"],
  ["soft", "fierce"],
  ["sweet", "rebellious"],
  ["serious", "playful"],
  ["reluctant", "determined"],
  ["lost", "certain"],
  ["reserved", "dramatic"],
];

const OBJECT_WORDS = /\b(?:bow|ring|gift|dress|photo|receipt|meal|plate|cup|menu|car|home|key|ticket|phone|box|toy|leash|ball|shoe|jacket|book|letter|package|product|house|room)\b/i;

function clean(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function metric(value: number): number {
  return Number(Math.max(0, Math.min(1, value)).toFixed(3));
}

function unique(values: readonly unknown[]): string[] {
  return [...new Set(values.map(clean).filter(Boolean))];
}

function lowerTokens(values: readonly string[]): Set<string> {
  return new Set(
    values
      .flatMap((value) =>
        clean(value)
          .toLowerCase()
          .split(/[^a-z0-9'-]+/i)
          .filter((token) => token.length >= 3),
      ),
  );
}

function relationKindsForBeat(
  beat: MouthCandidateBeat,
  envelope: RealityEnvelope,
): string[] {
  const eventIds = new Set(beat.eventIds ?? []);
  return unique(
    envelope.relations
      .filter(
        (relation) =>
          eventIds.has(relation.from) ||
          eventIds.has(relation.to),
      )
      .map((relation) => relation.kind),
  );
}

function eventLabelsForBeat(
  beat: MouthCandidateBeat,
  envelope: RealityEnvelope,
): string[] {
  const ids = new Set(beat.eventIds ?? []);
  return unique(
    envelope.events
      .filter((event) => ids.has(event.id))
      .map((event) => event.label),
  );
}

function detectContradictions(
  character: AuthorCharacterProfile,
  envelope: RealityEnvelope,
): string[] {
  const signals = lowerTokens([
    ...character.coreTraits,
    ...character.contradictions,
    ...character.emotionalPosture ? [character.emotionalPosture] : [],
    ...(envelope.suppliedStates ?? []),
  ]);

  const found: string[] = [];
  for (const [left, right] of CONTRAST_PAIRS) {
    if (signals.has(left) && signals.has(right)) {
      found.push(`${left} ↔ ${right}`);
    }
  }

  return unique([
    ...character.contradictions,
    ...found,
  ]).slice(0, 8);
}

function chooseStrategy(
  beat: MouthCandidateBeat,
  character: AuthorCharacterProfile,
  envelope: RealityEnvelope,
  strategies: readonly AuthorStrategyCandidate[],
): AuthorStrategyCandidate | undefined {
  if (!strategies.length) return undefined;

  const contradictions = detectContradictions(character, envelope);
  const relationKinds = relationKindsForBeat(beat, envelope);
  const labels = eventLabelsForBeat(beat, envelope);
  const objectPresent = labels.some((label) => OBJECT_WORDS.test(label)) ||
    envelope.events.some((event) => OBJECT_WORDS.test(event.label));
  const role = clean(beat.role).toLowerCase();
  const attention = clean(beat.attentionFunction).toLowerCase();

  const scored = strategies.map((candidate, index) => {
    let bonus = 0;

    if (
      contradictions.length &&
      (candidate.strategy === "contrast" || candidate.strategy === "status_inversion")
    ) {
      bonus += 0.22;
    }

    if (
      relationKinds.length &&
      (candidate.strategy === "recontextualization" || candidate.strategy === "implication")
    ) {
      bonus += 0.15;
    }

    if (
      objectPresent &&
      (candidate.strategy === "double_meaning" || candidate.strategy === "personification" || candidate.strategy === "recontextualization")
    ) {
      bonus += 0.12;
    }

    if (
      (role === "payoff" || attention === "payoff") &&
      (candidate.strategy === "compression" || candidate.strategy === "understatement" || candidate.strategy === "callback")
    ) {
      bonus += 0.2;
    }

    if (
      (role === "hook" || attention === "hook") &&
      (candidate.strategy === "contrast" || candidate.strategy === "status_inversion" || candidate.strategy === "implication")
    ) {
      bonus += 0.12;
    }

    return {
      candidate,
      score: metric(candidate.safety * 0.5 + candidate.novelty * 0.2 + bonus + Math.max(0, 0.05 - index * 0.005)),
    };
  });

  return scored.sort((a, b) => b.score - a.score)[0]?.candidate;
}

function opportunityFor(
  strategy: AuthorRealizationStrategy,
  beat: MouthCandidateBeat,
  character: AuthorCharacterProfile,
  contradictions: readonly string[],
  labels: readonly string[],
  relationKinds: readonly string[],
): CreativeRealization {
  const role = clean(beat.role).toLowerCase();
  const isPayoff = role === "payoff" || clean(beat.attentionFunction).toLowerCase() === "payoff";
  const anchors = unique([
    ...(beat.eventIds ?? []),
    ...labels,
    ...contradictions,
    ...relationKinds,
  ]).slice(0, 8);

  const forbidden = [
    "literal fact restatement",
    "unsupported concrete action",
    "unsupported setting or object",
    "analytic explanation",
    "new chronology",
  ];

  switch (strategy) {
    case "status_inversion":
      return {
        strategy,
        creativeOpportunity:
          contradictions.length
            ? `Turn the supplied contradiction (${contradictions[0]}) into social leverage or attitude without changing reality.`
            : "Let the subject read as more composed, prepared, powerful, or self-possessed than the literal facts require.",
        realizationIntent:
          "Express the subject as if they already have the upper hand; do not narrate the source event literally.",
        viewerEffect: "The viewer feels an attitude reveal before being told what to think.",
        sourceAnchors: anchors,
        forbiddenLiteralizations: forbidden,
        score: 0,
      };
    case "contrast":
      return {
        strategy,
        creativeOpportunity:
          contradictions.length
            ? `Put ${contradictions[0]} into immediate tension and let the contrast carry the line.`
            : "Place two supplied qualities or signals against each other so the tension becomes the story.",
        realizationIntent: "Make the contradiction visible through language rather than restating either fact.",
        viewerEffect: "Immediate curiosity and character-specific punch.",
        sourceAnchors: anchors,
        forbiddenLiteralizations: forbidden,
        score: 0,
      };
    case "recontextualization":
      return {
        strategy,
        creativeOpportunity:
          relationKinds.length
            ? `Let the supplied relationship (${relationKinds[0]}) change what an earlier detail means.`
            : "Use a later supplied signal to make an earlier detail suddenly read differently.",
        realizationIntent: "Reveal a new reading of the same evidence instead of repeating the evidence.",
        viewerEffect: "The viewer gets the satisfying click of a new interpretation.",
        sourceAnchors: anchors,
        forbiddenLiteralizations: forbidden,
        score: 0,
      };
    case "double_meaning":
      return {
        strategy,
        creativeOpportunity:
          labels.length
            ? `Use the supplied object or phrase (${labels[0]}) as a safe second meaning.`
            : "Give a supplied word, object, or relationship a second safe reading.",
        realizationIntent: "Exploit the supplied language as a joke, metaphor, status signal, or subtext without creating an event.",
        viewerEffect: "A small line lands twice.",
        sourceAnchors: anchors,
        forbiddenLiteralizations: forbidden,
        score: 0,
      };
    case "understatement":
      return {
        strategy,
        creativeOpportunity: "Let the smallest language carry the largest implication.",
        realizationIntent: "Say less than the literal facts while making the attitude unmistakable.",
        viewerEffect: "The audience completes the joke or meaning themselves.",
        sourceAnchors: anchors,
        forbiddenLiteralizations: forbidden,
        score: 0,
      };
    case "implication":
      return {
        strategy,
        creativeOpportunity:
          relationKinds.length
            ? "Let the relationship be felt without explaining it."
            : "Trust the supplied signals to imply a stronger meaning than their literal wording.",
        realizationIntent: "Write the line that makes the reader infer the interesting part.",
        viewerEffect: "The audience discovers the meaning rather than receiving an explanation.",
        sourceAnchors: anchors,
        forbiddenLiteralizations: forbidden,
        score: 0,
      };
    case "callback":
      return {
        strategy,
        creativeOpportunity: "Reuse an earlier supplied signal only after it has gained a different meaning.",
        realizationIntent: "Make the callback feel earned and changed, never repeated for padding.",
        viewerEffect: "Recognition plus a new punch.",
        sourceAnchors: anchors,
        forbiddenLiteralizations: forbidden,
        score: 0,
      };
    case "reversal":
      return {
        strategy,
        creativeOpportunity: "Reverse the expected reading while remaining entirely inside supplied reality.",
        realizationIntent: "Make the line turn the viewer's assumption without inventing a new event.",
        viewerEffect: "A compact surprise.",
        sourceAnchors: anchors,
        forbiddenLiteralizations: forbidden,
        score: 0,
      };
    case "compression":
      return {
        strategy,
        creativeOpportunity: "Collapse several supplied signals into the one thought that matters most.",
        realizationIntent: "Combine only when the resulting line creates a stronger meaning than the individual facts.",
        viewerEffect: "Fast, quotable momentum.",
        sourceAnchors: anchors,
        forbiddenLiteralizations: forbidden,
        score: 0,
      };
    case "personification":
      return {
        strategy,
        creativeOpportunity: "Give a supplied object, relationship, or situation human-like attitude without asserting a literal event.",
        realizationIntent: "Use personification as framing only; never imply the object literally acted.",
        viewerEffect: "Memorable visual personality.",
        sourceAnchors: anchors,
        forbiddenLiteralizations: forbidden,
        score: 0,
      };
  }
}

export function buildCreativeRealization(
  beat: MouthCandidateBeat,
  envelope: RealityEnvelope,
  character: AuthorCharacterProfile,
  strategies: readonly AuthorStrategyCandidate[],
): CreativeRealization {
  const selected = chooseStrategy(beat, character, envelope, strategies);
  const fallback = selected?.strategy ?? "implication";
  const contradictions = detectContradictions(character, envelope);
  const labels = eventLabelsForBeat(beat, envelope);
  const relationKinds = relationKindsForBeat(beat, envelope);
  const realization = opportunityFor(
    fallback,
    beat,
    character,
    contradictions,
    labels,
    relationKinds,
  );

  const bestScore = selected
    ? metric((selected.safety * 0.45) + (selected.novelty * 0.2) + (realization.sourceAnchors.length ? 0.15 : 0) + (contradictions.length ? 0.2 : 0))
    : 0.45;

  return {
    ...realization,
    score: bestScore,
  };
}
