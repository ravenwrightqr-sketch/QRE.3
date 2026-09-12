import type {
  AuthorCreativeProposition,
  RealityGraph,
  SequenceCandidate,
  SequencePlay,
  SequenceCut,
  SequenceGainKind,
  ViewerAttentionRole,
  ViewerMomentum,
  ViewerState,
  SequenceTransition,
} from "@qre/contracts";
import { localModelGenerate } from "./localModelRuntime.js";

export type AuthorCutDraft = {
  text: string;
  sourceEventIds: string[];
};

const clean = (value: unknown): string =>
  typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";

const unique = (values: readonly string[]): string[] =>
  [...new Set(values.map(clean).filter(Boolean))];

const words = (value: string): Set<string> =>
  new Set(value.toLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length > 2));

const validIds = (value: unknown, graph: RealityGraph): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string =>
        typeof item === "string" && graph.events.some((event) => event.id === item),
      )
    : [];

function lexicalNovelty(previous: string, current: string): number {
  if (!previous) return 1;
  const first = words(previous);
  const second = words(current);
  if (!first.size || !second.size) return current === previous ? 0 : 1;
  let shared = 0;
  first.forEach((word) => {
    if (second.has(word)) shared += 1;
  });
  return 1 - shared / Math.max(first.size, second.size);
}

function fallback(input: {
  graph: RealityGraph;
  candidate: SequenceCandidate;
  proposition: AuthorCreativeProposition;
}): AuthorCutDraft[] {
  const anchors = input.candidate.anchorEventIds
    .map((id) => input.graph.events.find((event) => event.id === id))
    .filter((event): event is NonNullable<typeof event> => Boolean(event));
  if (!anchors.length) return [];

  const first = clean(anchors[0].label);
  const last = clean(anchors.at(-1)?.label);
  const hypothesis = clean(input.candidate.hypothesis[0]);
  const payoff = clean(input.candidate.payoff);
  const relationship = clean(input.candidate.supportingRelationKinds[0]) || "relationship";

  const candidates: AuthorCutDraft[] = [
    { text: input.proposition.text, sourceEventIds: [anchors[0].id] },
    { text: first, sourceEventIds: [anchors[0].id] },
    {
      text: hypothesis && hypothesis !== first
        ? hypothesis
        : `The important part is how ${relationship} changes the reading.`,
      sourceEventIds: anchors.slice(0, 2).map((event) => event.id),
    },
    ...(anchors.length > 2
      ? [{
          text: `Then ${last || first} stops looking like a separate detail.`,
          sourceEventIds: anchors.slice(-2).map((event) => event.id),
        }]
      : []),
    { text: payoff || `That is the pattern.`, sourceEventIds: [anchors.at(-1)!.id] },
  ];

  const result: AuthorCutDraft[] = [];
  for (const cut of candidates) {
    const text = clean(cut.text);
    if (!text) continue;
    if (result.some((existing) => existing.text.toLowerCase() === text.toLowerCase())) continue;
    result.push({ text, sourceEventIds: unique(cut.sourceEventIds) });
  }
  return result.slice(0, 8);
}

function semanticTransition(
  before: ViewerMomentum,
  currentText: string,
  candidate: SequenceCandidate,
  index: number,
  total: number,
): SequenceTransition {
  const novelty = lexicalNovelty(before.known.at(-1) ?? "", currentText);
  const isFinal = index === total - 1;
  const unresolved = isFinal ? undefined : candidate.unresolvedQuestion;
  const nextNeed = isFinal ? undefined : "see what this relationship changes next";
  const tension = isFinal ? 0.2 : Math.min(1, 0.35 + novelty * 0.55);
  const informationValue = Math.min(1, 0.45 + novelty * 0.45 + candidate.informationValue * 0.2);
  const forwardPull = isFinal ? undefined : candidate.unresolvedQuestion;
  const magnetStrength = Math.min(1, novelty * 0.35 + informationValue * 0.3 + tension * 0.25 + 0.1);

  const after: ViewerMomentum = {
    known: [...before.known, currentText].slice(-12),
    expected: isFinal ? undefined : candidate.unresolvedQuestion,
    activeQuestion: isFinal ? undefined : candidate.unresolvedQuestion,
    curiosityGap: isFinal ? undefined : candidate.unresolvedQuestion,
    predictionShift: novelty > 0.45 ? `The reading changes around: ${currentText}` : undefined,
    currentWant: isFinal ? undefined : "understand the consequence of the relationship",
    unresolved,
    forwardPull,
    payoffDebt: isFinal ? undefined : candidate.payoff,
    magnet: {
      novelty,
      uncertainty: Math.min(1, 0.3 + novelty * 0.6),
      informationValue,
      attention: Math.min(1, 0.4 + novelty * 0.5),
      tension,
      informationSeeking: isFinal ? 0.1 : Math.min(1, 0.42 + novelty * 0.45),
      narrativeEngagement: Math.min(1, 0.4 + candidate.attentionPotential * 0.35 + novelty * 0.25),
      magnetStrength,
      unresolved,
      nextNeed,
    },
    informationFrontier: {
      known: before.known.slice(-8),
      frontier: currentText,
      novelty,
      uncertainty: Math.min(1, 0.3 + novelty * 0.6),
      informationValue,
      tension,
      nextNeed,
    },
  };

  return {
    before,
    change: novelty > 0.45 ? "reinterpret" : "advance",
    after,
    nextPressure: nextNeed,
    necessity: {
      necessary: index === 0 || novelty >= 0.35 || Boolean(isFinal),
      reason: index === 0
        ? "opens the selected proposition"
        : isFinal
          ? "lands the selected proposition"
          : novelty >= 0.35
            ? "changes the viewer's current reading"
            : "weak semantic change",
      removalDamage: novelty >= 0.35 ? "removing the cut would erase a distinct semantic change" : "little semantic damage",
    },
  };
}

export async function realizeAuthorSequence(input: {
  graph: RealityGraph;
  candidate: SequenceCandidate;
  proposition: AuthorCreativeProposition;
}): Promise<AuthorCutDraft[]> {
  const fallbackCuts = fallback(input);
  try {
    const response = await localModelGenerate([
      {
        role: "system",
        content: [
          "You are QRE Mouth.",
          "Realize one approved Artist proposition as 4-8 terse language cuts.",
          "Every cut must be grounded in supplied event IDs.",
          "Every cut must change the viewer's interpretation, expectation, question, or emotional meaning of what came before.",
          "The selected perceptual treatment changes how the real relationship is felt; it never changes the underlying facts.",
          "Use implication, compression, contrast, recontextualization, escalation, consequence, or callback.",
          "Do not serialize the source facts. Do not restate the same idea in different words.",
          "Do not add events, attributes, people, locations, outcomes, or motivations that are not supplied.",
          "Do not describe production or presentation mechanics.",
          "Return JSON only.",
        ].join(" "),
      },
      {
        role: "user",
        content: JSON.stringify({
          proposition: input.proposition,
          candidate: input.candidate,
          treatment: input.proposition.treatment,
          evidence: input.graph.events.map((event) => ({
            id: event.id,
            label: event.label,
            entities: event.entities,
            place: event.place,
            time: event.time,
            provenance: event.provenance,
          })),
          relationships: input.graph.relations,
          patterns: input.graph.patterns ?? [],
        }),
      },
    ], "json", {
      numPredict: 1300,
      numCtx: 12288,
      temperature: 0.92,
      jsonSchema: {
        type: "object",
        additionalProperties: false,
        required: ["cuts"],
        properties: {
          cuts: {
            type: "array",
            minItems: 4,
            maxItems: 8,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["text", "sourceEventIds"],
              properties: {
                text: { type: "string" },
                sourceEventIds: { type: "array", minItems: 1, maxItems: 6, items: { type: "string" } },
              },
            },
          },
        },
      },
    });

    const parsed: unknown = JSON.parse(response.text);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const raw = (parsed as { cuts?: unknown }).cuts;
      if (Array.isArray(raw)) {
        const cuts = raw
          .map((item): AuthorCutDraft | null => {
            if (!item || typeof item !== "object" || Array.isArray(item)) return null;
            const row = item as { text?: unknown; sourceEventIds?: unknown };
            const text = clean(row.text);
            const sourceEventIds = validIds(row.sourceEventIds, input.graph);
            return text && sourceEventIds.length ? { text, sourceEventIds } : null;
          })
          .filter((value): value is AuthorCutDraft => Boolean(value))
          .filter((cut, index, values) =>
            values.findIndex((other) => other.text.toLowerCase() === cut.text.toLowerCase()) === index,
          )
          .slice(0, 8);
        if (cuts.length >= 4) return cuts;
      }
    }
  } catch {
    // Fall through to deterministic realization.
  }
  return fallbackCuts;
}

function roleFor(index: number, total: number, hasRelationship: boolean): ViewerAttentionRole {
  if (index === 0) return "hook";
  if (index === total - 1) return "payoff";
  if (index === 1) return "question";
  if (index === 2 && hasRelationship) return "discovery";
  return index === total - 2 ? "consequence" : "reframe";
}

function gainFor(index: number, total: number, novelty: number): SequenceGainKind {
  if (index === 0) return "surprise";
  if (index === total - 1) return "payoff";
  if (novelty >= 0.6) return index === 2 ? "discovery" : "reframe";
  return index === total - 2 ? "consequence" : "question";
}

export function buildSequencePlay(input: {
  subject: string;
  proposition: AuthorCreativeProposition;
  candidate: SequenceCandidate;
  cuts: AuthorCutDraft[];
}): SequencePlay {
  const total = input.cuts.length;
  const openingMomentum: ViewerMomentum = {
    known: [],
    expected: input.proposition.text,
    activeQuestion: input.candidate.unresolvedQuestion,
    curiosityGap: input.candidate.unresolvedQuestion,
    currentWant: "discover what is distinctive about this reality",
    unresolved: input.candidate.unresolvedQuestion,
    forwardPull: input.candidate.unresolvedQuestion,
    payoffDebt: input.candidate.payoff,
    magnet: {
      novelty: input.candidate.novelty,
      uncertainty: input.candidate.uncertainty,
      informationValue: input.candidate.informationValue,
      attention: input.candidate.attentionPotential,
      tension: input.candidate.consequencePotential,
      informationSeeking: input.candidate.informationValue,
      narrativeEngagement: input.candidate.attentionPotential,
      magnetStrength: Math.min(1, (input.candidate.novelty + input.candidate.attentionPotential) / 2),
      unresolved: input.candidate.unresolvedQuestion,
      nextNeed: input.candidate.unresolvedQuestion,
    },
    informationFrontier: {
      known: [],
      frontier: input.proposition.text,
      novelty: input.candidate.novelty,
      uncertainty: input.candidate.uncertainty,
      informationValue: input.candidate.informationValue,
      tension: input.candidate.consequencePotential,
      nextNeed: input.candidate.unresolvedQuestion,
    },
  };

  let previousMomentum = openingMomentum;
  const sequenceCuts: SequenceCut[] = [];
  for (let index = 0; index < total; index += 1) {
    const draft = input.cuts[index];
    const novelty = lexicalNovelty(index ? input.cuts[index - 1].text : "", draft.text);
    const transition = semanticTransition(previousMomentum, draft.text, input.candidate, index, total);
    const role = roleFor(index, total, input.candidate.supportingRelationKinds.length > 0);
    const gainKind = gainFor(index, total, novelty);
    const viewerBefore: ViewerState = {
      known: previousMomentum.known.slice(-8),
      expected: previousMomentum.expected,
      unresolved: previousMomentum.unresolved,
      currentWant: previousMomentum.currentWant,
      recentChange: previousMomentum.known.at(-1),
    };
    const viewerAfter: ViewerState = {
      known: transition.after.known.slice(-8),
      expected: transition.after.expected,
      unresolved: transition.after.unresolved,
      currentWant: transition.after.currentWant,
      recentChange: draft.text,
    };

    sequenceCuts.push({
      id: `cut-${index + 1}`,
      order: index + 1,
      role,
      gainKind,
      sourceIds: [...draft.sourceEventIds],
      informationGain: draft.text,
      attentionDelta: index === 0
        ? `The viewer enters through: ${draft.text}`
        : transition.change === "reinterpret"
          ? `The previous reading changes because: ${draft.text}`
          : `The viewer now understands: ${draft.text}`,
      viewerBefore,
      viewerAfter,
      momentum: transition,
      necessity: transition.necessity,
      nextPromise: index < total - 1 ? input.cuts[index + 1]?.text : undefined,
      payoffConnection: index === total - 1 ? input.proposition.text : undefined,
      noveltyScore: novelty,
      confidence: Math.min(0.98, 1 - input.candidate.truthRisk),
    });
    previousMomentum = transition.after;
  }

  return {
    subject: input.subject,
    premise: input.proposition.text,
    openingState: sequenceCuts[0]?.viewerBefore ?? { known: [] },
    baselineFacts: [],
    openingMomentum,
    cuts: sequenceCuts,
    closingMomentum: previousMomentum,
    closingState: sequenceCuts.at(-1)?.viewerAfter,
    continuity: [
      input.proposition.pattern,
      input.proposition.treatment.id,
      ...(input.proposition.relationIds.length ? input.proposition.relationIds : []),
    ],
    antiCrutch: [
      "Reality facts remain grounding; they do not become attention gains merely by being stated.",
      "Each cut must earn its place through a semantic change.",
    ],
    continuation: input.candidate.unresolvedQuestion || previousMomentum.forwardPull,
  };
}
