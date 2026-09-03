/**
 * QRE MOUTH REALIZATION AUTHORITY
 *
 * One compact authority object passed from canonical cognition into Mouth.
 *
 * Reality answers: "what concrete world claims are licensed?"
 * Meaning answers: "what changed in meaning and what should be felt?"
 * Moves answer: "what kinds of language transformations are invited?"
 *
 * These authorities are intentionally separate. Meaning and creative moves
 * can transform language, but they can never create new concrete reality.
 */

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
  creativeMoves: string[];
  forbiddenMoves: string[];
  evidenceEventIds: string[];
};
