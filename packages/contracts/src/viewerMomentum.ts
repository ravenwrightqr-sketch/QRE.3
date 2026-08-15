/**
 * Viewer Momentum is the compact cognitive state that governs why the next
 * cut should exist. It is not prose and it is not a screenplay template.
 *
 * MAGNET CIRCLE is the measurable attention loop inside this state:
 * novelty → uncertainty → information value → attention → tension →
 * information seeking → narrative engagement.
 * The loop is allowed to recur only when the current cut leaves a meaningful
 * unresolved state that the next cut can advance, answer, reframe, escalate,
 * or pay off.
 */
export type MagnetCircle = {
  novelty: number;
  uncertainty: number;
  informationValue: number;
  attention: number;
  tension: number;
  informationSeeking: number;
  narrativeEngagement: number;
  magnetStrength: number;
  unresolved?: string;
  nextNeed?: string;
};

/**
 * Persistent subject-space held in the viewer's working model.
 * Once established, the subject remains active without requiring repeated
 * naming. Re-identification is spent only when the reference itself carries
 * new information or restores clarity after a meaningful shift.
 */
export type SubjectContinuity = {
  established: boolean;
  subject: string;
  referenceMode: "name" | "pronoun" | "implicit" | "object";
  referenceCost: number;
  lastExplicitReference?: number;
};

/**
 * The information frontier is the edge of what the viewer already knows and
 * what is now worth discovering next.
 */
export type InformationFrontier = {
  known: string[];
  frontier: string;
  novelty: number;
  uncertainty: number;
  informationValue: number;
  tension: number;
  nextNeed?: string;
};

export type ViewerMomentum = {
  known: string[];
  expected?: string;
  activeQuestion?: string;
  curiosityGap?: string;
  predictionShift?: string;
  currentWant?: string;
  unresolved?: string;
  forwardPull?: string;
  payoffDebt?: string;
  /** Cognitive magnet governing why another cut is wanted. */
  magnet?: MagnetCircle;
  /** Persistent subject-space held in working memory across cuts. */
  subjectContinuity?: SubjectContinuity;
  /** The highest-value unresolved information frontier at this moment. */
  informationFrontier?: InformationFrontier;
};

export type CutNecessity = {
  necessary: boolean;
  reason: string;
  removalDamage?: string;
};

export type SequenceTransition = {
  before: ViewerMomentum;
  change: string;
  after: ViewerMomentum;
  nextPressure?: string;
  necessity?: CutNecessity;
};
