import type {
  AuthorMetamorphicRelation,
  AuthorMetamorphicRelationSet,
  LatentMovieCandidate,
} from "@qre/contracts";
import { searchAuthorMetamorphicRelations } from "./authorMetamorphicSearch.js";

/**
 * UNIVERSAL CREATIVE SPINE
 *
 * One universal path from supplied reality to a realizable creative treatment.
 *
 * Reality is not rewritten.
 * Relations are discovered before lenses are applied.
 * A lens changes creative pressure, not facts or semantic authority.
 * LatentMovieCandidate is a semantic hypothesis boundary, not source truth.
 */

export type CreativeOpportunity = {
  relationId: string;
  opportunity: AuthorMetamorphicRelation["creativeOpportunity"];
  strength: number;
  whyItWorks: string;
  evidenceEventIds: string[];
};

export type LensTreatment = {
  primary: string;
  secondary?: string;
  pressure: string[];
  relationId?: string;
  feltEffect: string;
  languageAim: string;
  guardrails: string[];
};

export type AuthorCreativeSpine = {
  version: 1;
  relationSet: AuthorMetamorphicRelationSet;
  latentMovieCandidates: LatentMovieCandidate[];
  opportunities: CreativeOpportunity[];
  selectedRelationId?: string;
  lensTreatment: LensTreatment;
};

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const unique = <T>(values: readonly T[]): T[] => [...new Set(values)];

const PRESSURE: Record<string, string[]> = {
  comedy: ["contrast", "deadpan", "understatement", "timing"],
  funny: ["contrast", "playfulness", "understatement", "timing"],
  noir: ["implication", "omission", "unease", "status"],
  romance: ["intimacy", "irrelevance_of_surroundings", "recognition", "tender_contrast"],
  romantic: ["intimacy", "recognition", "tender_contrast", "selective_detail"],
  horror: ["dread", "anomaly", "implication", "withhold_explanation"],
  heist: ["mission_pressure", "objective_language", "escalation", "payoff"],
  game: ["progression", "status", "levels", "reward_pressure"],
  fierce: ["attitude", "status", "confidence", "compression"],
  courtroom: ["evidence", "verdict", "contrast", "status"],
  military: ["discipline", "objective", "deployment", "status"],
  documentary: ["observation", "specificity", "distance", "accumulation"],
  deadpan: ["understatement", "contrast", "dry_timing", "implication"],
  tender: ["intimacy", "specificity", "recognition", "quiet_payoff"],
  surreal: ["dislocation", "contrast", "implication", "uncertainty"],
  wild: ["velocity", "escalation", "compression", "surprise"],
  spy: ["secrecy", "observation", "misdirection", "reveal"],
  mission: ["objective", "progression", "obstacles", "completion"],
  speedrun: ["velocity", "compression", "optimization", "finish_line"],
  tournament: ["rounds", "status", "competition", "escalation"],
  investigation: ["clues", "uncertainty", "recontextualization", "reveal"],
  backstage: ["access", "contrast", "hidden_work", "reveal"],
  transformation: ["contrast", "before_after", "accumulation", "reveal"],
  race: ["velocity", "competition", "progression", "finish_line"],
  restoration: ["damage", "repair", "before_after", "reveal"],
  expedition: ["discovery", "terrain", "uncertainty", "arrival"],
  quest: ["objective", "obstacles", "discovery", "payoff"],
  countdown: ["deadline", "compression", "escalation", "completion"],
  archive: ["evidence", "selection", "residue", "recontextualization"],
};

const LENS_ALIASES: Record<string, string> = {
  funny: "comedy",
  romantic: "romance",
};

function lensParts(lens: string): { primary: string; secondary?: string } {
  const parts = clean(lens)
    .split(/\s*(?:\+|>|\/|,|\band\b)\s*/i)
    .map((part) => clean(part).toLowerCase())
    .filter(Boolean);

  return { primary: parts[0] || "none", secondary: parts[1] };
}

function treatmentFor(
  lens: string,
  relation?: AuthorMetamorphicRelation,
): LensTreatment {
  const { primary: rawPrimary, secondary: rawSecondary } = lensParts(lens);
  const primary = LENS_ALIASES[rawPrimary] ?? rawPrimary;
  const secondary = rawSecondary ? LENS_ALIASES[rawSecondary] ?? rawSecondary : undefined;

  if (primary === "none") {
    return {
      primary: "none",
      secondary: undefined,
      pressure: [],
      relationId: relation?.id,
      feltEffect: relation?.feltEffect ?? "Make the supplied reality newly noticeable.",
      languageAim: relation?.languageAim ?? "Express the selected meaning without added framing.",
      guardrails: [
        "do not add facts",
        "do not add actors",
        "do not add places",
        "do not change chronology",
        "do not apply a creative lens",
        "do not turn the absence of a lens into a hidden genre",
        "do not let unstated creative taste become a replacement lens",
      ],
    };
  }

  const pressures = unique([
    ...(PRESSURE[primary] ?? []),
    ...(secondary ? PRESSURE[secondary] ?? [] : []),
  ]).slice(0, 8);

  return {
    primary,
    secondary,
    pressure: pressures,
    relationId: relation?.id,
    feltEffect: relation?.feltEffect ?? "Make the supplied reality newly noticeable.",
    languageAim: relation?.languageAim ?? "Express the selected meaning without explanation.",
    guardrails: [
      "do not add facts",
      "do not add actors",
      "do not add places",
      "do not change chronology",
      "do not let the lens select a different reality",
      "do not turn the lens into a domain-specific author",
    ],
  };
}

function rankOpportunities(
  relationSet: AuthorMetamorphicRelationSet,
  returning: boolean,
): CreativeOpportunity[] {
  return relationSet.relations
    .map((relation) => ({
      relationId: relation.id,
      opportunity: relation.creativeOpportunity,
      strength: Math.min(1, relation.score + (returning && relation.type.includes("callback") ? 0.08 : 0)),
      whyItWorks: `${relation.feltEffect}; ${relation.viewerShift}.`,
      evidenceEventIds: relation.evidenceEventIds,
    }))
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 8);
}

function operationFor(relation: AuthorMetamorphicRelation): LatentMovieCandidate["trajectory"][number]["operation"] {
  switch (relation.creativeOpportunity) {
    case "contrast_reframe":
      return "contrast";
    case "state_to_callback":
    case "callback_recontextualization":
      return "recur";
    case "status_turn":
      return "reframe";
    case "consequence":
      return "consequence";
    case "recognition":
      return "reveal";
    case "return_with_new_status":
      return "payoff";
    default:
      return "reframe";
  }
}

function candidateFromRelation(
  relation: AuthorMetamorphicRelation,
  graph: Parameters<typeof searchAuthorMetamorphicRelations>[0]["graph"],
  index: number,
): LatentMovieCandidate {
  const eventById = new Map(graph.events.map((event) => [event.id, event]));
  const evidence = relation.evidenceEventIds
    .map((id) => clean(eventById.get(id)?.label))
    .filter(Boolean);
  const primary = evidence[0] ?? relation.before;
  const secondary = evidence[1] ?? relation.after;
  const operation = operationFor(relation);

  return {
    id: `latent-${relation.id}`,
    lens: "NONE",
    anchorEventIds: relation.evidenceEventIds.slice(0, 4),
    supportingRelationKinds: relation.relation ? [relation.relation.kind] : [],
    trajectory: [
      {
        order: 1,
        operation: "establish",
        eventIds: relation.beforeEventIds.slice(0, 3),
        viewerChange: relation.viewerShift,
        nextQuestion: relation.after ? "What changes the reading?" : "What remains?",
      },
      {
        order: 2,
        operation,
        eventIds: relation.evidenceEventIds.slice(0, 4),
        viewerChange: relation.feltEffect,
        nextQuestion: "What does this mean now?",
      },
      {
        order: 3,
        operation: "payoff",
        eventIds: relation.afterEventIds.length ? relation.afterEventIds.slice(0, 3) : relation.evidenceEventIds.slice(0, 3),
        viewerChange: relation.languageAim,
        nextQuestion: "What lands?",
      },
    ].filter((step) => step.eventIds.length),
    payoff: relation.languageAim,
    unresolvedQuestion: relation.after ? "What does this become?" : "What lands?",
    evidence,
    hypothesis: [relation.feltEffect, relation.viewerShift].filter(Boolean),
    truthRisk: metric(1 - relation.confidence),
    novelty: metric(relation.score),
    specificity: metric(Math.min(1, relation.evidenceEventIds.length / 3)),
    informationValue: metric(relation.score),
    uncertainty: metric(1 - relation.confidence),
    attentionPotential: metric(relation.score),
    consequencePotential: metric(relation.creativeOpportunity === "consequence" ? relation.score : relation.score * 0.7),
    callbackPotential: metric(relation.type.includes("callback") ? relation.score : 0.2 * relation.score),
    compressionPotential: metric(0.7 + relation.score * 0.3),
    repetitionRisk: metric(relation.type.includes("callback") ? 0.15 : 0.05),
    distinctiveness: metric(Math.max(0.1, relation.score)),
    score: metric(relation.score),
  };
}

function metric(value: number): number {
  return Number(Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)).toFixed(3));
}

export function buildAuthorCreativeSpine(input: {
  graph: Parameters<typeof searchAuthorMetamorphicRelations>[0]["graph"];
  subject?: string;
  lens?: string;
  returning?: boolean;
}): AuthorCreativeSpine {
  const relationSet = searchAuthorMetamorphicRelations({
    graph: input.graph,
    subject: input.subject,
    limit: 16,
  });

  const latentMovieCandidates = relationSet.relations.map((relation, index) =>
    candidateFromRelation(relation, input.graph, index),
  );

  const opportunities = rankOpportunities(relationSet, Boolean(input.returning));
  const selectedRelationId = opportunities[0]?.relationId ?? relationSet.strongestRelationId;
  const selectedRelation = relationSet.relations.find((relation) => relation.id === selectedRelationId);

  return {
    version: 1,
    relationSet,
    latentMovieCandidates,
    opportunities,
    selectedRelationId,
    lensTreatment: treatmentFor(input.lens || "none", selectedRelation),
  };
}
