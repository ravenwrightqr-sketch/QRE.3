/**
 * QRE CREATIVE SPINE — SEQUENCE-TEXT ONLY
 *
 * Current artifact: text moving as a sequence of attention-changing screens.
 * The spine discovers semantic opportunities and optional perceptual pressure.
 * It does not define genres, productions, shots, cameras, sound, transitions,
 * or any separate artistic artifact.
 *
 * Relations are discovered before optional lens pressure is applied.
 * A lens changes emphasis, never facts or source authority.
 */
import type { AuthorMetamorphicRelation, AuthorMetamorphicRelationSet } from "@qre/contracts";
import { searchAuthorMetamorphicRelations } from "./authorMetamorphicSearch.js";
import { rankCreativeLensCandidates, type CreativeLensCandidate } from "./authorCreativeLens.js";

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
  lensCandidates: CreativeLensCandidate[];
  selectedRelationId?: string;
  lensTreatment: LensTreatment;
};
const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const unique = <T>(values: readonly T[]): T[] => [...new Set(values)];
const PRESSURE: Record<string, string[]> = {
  NONE: [], contrast: ["contrast", "specificity"], implication: ["implication", "omission"], intimacy: ["specificity", "recognition"],
  consequence: ["consequence", "escalation"], recurrence: ["recurrence", "changed_meaning"], precision: ["precision", "compression"],
  absurdity: ["mismatch", "contrast", "understatement"], humor: ["contrast", "understatement", "timing"], tenderness: ["intimacy", "specificity", "recognition"],
  menace: ["implication", "anomaly", "restraint"], irony: ["contrast", "double_meaning", "reversal"], play: ["contrast", "curiosity", "surprise"],
};
function lensParts(lens: string) { const parts = clean(lens).split(/\s*(?:\+|>|\/|,|\band\b)\s*/i).map((part) => clean(part).toLowerCase()).filter(Boolean); return { primary: parts[0] || "none", secondary: parts[1] }; }
function treatmentFor(lens: string, relation?: AuthorMetamorphicRelation): LensTreatment {
  const { primary, secondary } = lensParts(lens);
  return {
    primary, secondary,
    pressure: unique([...(PRESSURE[primary] ?? ["specificity", "contrast", "implication"]), ...(secondary ? PRESSURE[secondary] ?? ["specificity"] : [])]).slice(0, 8),
    relationId: relation?.id,
    feltEffect: relation?.feltEffect ?? "Make the supplied reality newly noticeable.",
    languageAim: relation?.languageAim ?? "Express the selected meaning without explanation.",
    guardrails: ["do not add facts", "do not add actors", "do not add places", "do not change chronology", "do not turn identity traits into invented events", "do not force a lens when NONE is stronger"],
  };
}
function rankOpportunities(relationSet: AuthorMetamorphicRelationSet, returning: boolean): CreativeOpportunity[] {
  return relationSet.relations.map((relation) => ({ relationId: relation.id, opportunity: relation.creativeOpportunity, strength: Math.min(1, relation.score + (returning && relation.type.includes("callback") ? .08 : 0)), whyItWorks: `${relation.feltEffect}; ${relation.viewerShift}.`, evidenceEventIds: relation.evidenceEventIds })).sort((a, b) => b.strength - a.strength).slice(0, 8);
}
function graphSignals(graph: Parameters<typeof searchAuthorMetamorphicRelations>[0]["graph"]): string[] { return unique([...graph.events.flatMap((event) => [clean(event.label), ...(event.entities ?? [])]), ...graph.relations.map((relation) => clean(relation.kind))]).slice(0, 80); }
function strongGraphSignals(graph: Parameters<typeof searchAuthorMetamorphicRelations>[0]["graph"], relationSet: AuthorMetamorphicRelationSet): string[] { return unique([...relationSet.relations.slice(0, 8).flatMap((relation) => [clean(relation.type), clean(relation.creativeOpportunity), clean(relation.feltEffect)]), ...graph.events.filter((event) => (event.entities?.length ?? 0) >= 2).map((event) => clean(event.label))]).slice(0, 40); }
export function buildAuthorCreativeSpine(input: { graph: Parameters<typeof searchAuthorMetamorphicRelations>[0]["graph"]; subject?: string; lens?: string; returning?: boolean; businessSignals?: string[] }): AuthorCreativeSpine {
  const relationSet = searchAuthorMetamorphicRelations({ graph: input.graph, subject: input.subject, limit: 16 });
  const opportunities = rankOpportunities(relationSet, Boolean(input.returning));
  const lensCandidates = rankCreativeLensCandidates({ signals: graphSignals(input.graph), strongSignals: strongGraphSignals(input.graph, relationSet), businessSignals: input.businessSignals, requestedLens: input.lens, maxCandidates: 10 });
  const selectedRelationId = opportunities[0]?.relationId ?? relationSet.strongestRelationId;
  const selectedRelation = relationSet.relations.find((relation) => relation.id === selectedRelationId);
  const selectedLens = clean(input.lens) || lensCandidates[0]?.lens || "NONE";
  return { version: 1, relationSet, opportunities, lensCandidates, selectedRelationId, lensTreatment: treatmentFor(selectedLens, selectedRelation) };
}
