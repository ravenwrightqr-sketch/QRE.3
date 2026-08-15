/**
 * Viewer Momentum is the compact cognitive state that governs why the next
 * cut should exist. It is not prose and it is not a screenplay template.
 */
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
