/**
 * QRE MOUTH REALIZATION AUTHORITY
 * One compact authority object passed from canonical cognition into Mouth.
 * Reality answers: what concrete world claims are licensed?
 * Meaning answers: what changed in meaning and what should be felt?
 * Earned interpretation answers: what may the viewer reasonably infer?
 * Moves answer: what kinds of language transformations are invited?
 */
import type { AuthorMetamorphicRelationSet } from "../cognition/metamorphic.js";

export type MouthInferenceBudget = "direct" | "compressed" | "interpretive" | "strongly-interpretive";

export type MouthRealizationAuthority = {
  reality: {
    eventIds: string[];
    entities: string[];
    actions: string[];
    objects: string[];
    states: string[];
  };
  meaning: {
    mechanism?: string;
    before?: string;
    after?: string;
    relationKind?: string;
    realizationMove?: string;
    creativeOpportunity?: string;
    feltEffect?: string;
    viewerShift?: string;
    realizationDirection?: string;
    languageAim?: string;
  };
  metamorphicRelationSet: AuthorMetamorphicRelationSet;
  earnedInterpretations: string[];
  permittedRealizationModes: string[];
  inferenceBudget: MouthInferenceBudget;
  creativeMoves: string[];
  forbiddenMoves: string[];
  evidenceEventIds: string[];
};
