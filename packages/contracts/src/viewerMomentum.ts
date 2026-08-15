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
