import type { AuthorMetamorphicRelation, AuthorMetamorphicRelationSet } from "@qre/contracts";
import { searchAuthorMetamorphicRelations } from "./authorMetamorphicSearch.js";

/**
 * UNIVERSAL CREATIVE SPINE
 *
 * One universal path from supplied reality to a realizable creative treatment.
 *
 * Reality is not rewritten.
 * Relations are discovered before lenses are applied.
 * A lens changes pressure, not facts and not Movie selection authority.
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
  opportunities: CreativeOpportunity[];
  selectedRelationId?: string;
  lensTreatment: LensTreatment;
};

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const unique = <T>(values: readonly T[]): T[] => [...new Set(values)];

const PRESSURE: Record<string, string[]> = {
  comedy: ["contrast", "deadpan", "understatement", "timing"],
  noir: ["implication", "omission", "unease", "status"],
  romance: ["intimacy", "irrelevance_of_surroundings", "recognition", "tender_contrast"],
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
};

function lensParts(lens: string): { primary: string; secondary?: string } {
  const parts = clean(lens)
    .split(/\s*(?:\+|>|\/|,|\band\b)\s*/i)
    .map((part) => clean(part).toLowerCase())
    .filter(Boolean);
  return { primary: parts[0] || "none", secondary: parts[1] };
}

function treatmentFor(lens: string, relation?: AuthorMetamorphicRelation): LensTreatment {
  const { primary, secondary } = lensParts(lens);
  const pressures = unique([
    ...(PRESSURE[primary] ?? ["contrast", "specificity", "implication"]),
    ...(secondary ? (PRESSURE[secondary] ?? ["contrast", "specificity"]) : []),
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

function rankOpportunities(relationSet: AuthorMetamorphicRelationSet, returning: boolean): CreativeOpportunity[] {
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
  const opportunities = rankOpportunities(relationSet, Boolean(input.returning));
  const selectedRelationId = opportunities[0]?.relationId ?? relationSet.strongestRelationId;
  const selectedRelation = relationSet.relations.find((relation) => relation.id === selectedRelationId);
  return {
    version: 1,
    relationSet,
    opportunities,
    selectedRelationId,
    lensTreatment: treatmentFor(input.lens || "none", selectedRelation),
  };
}
