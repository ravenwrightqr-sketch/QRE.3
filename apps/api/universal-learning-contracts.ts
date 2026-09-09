export const LEARNING_MACHINE_VERSION = "1" as const;

export const LEARNING_MACHINE_STATES = [
  "observed",
  "reconciled",
  "patterned",
  "forecasted",
  "recommended",
  "acted",
  "learned",
] as const;

export type LearningMachineState = typeof LEARNING_MACHINE_STATES[number];

export type LearningMachineInvariant = {
  name: string;
  statement: string;
};

export const LEARNING_MACHINE_INVARIANTS: LearningMachineInvariant[] = [
  { name: "truth", statement: "Evidence remains distinct from inference." },
  { name: "provenance", statement: "Every durable inference can identify its supporting evidence." },
  { name: "identity", statement: "Ambiguous entities are never silently merged." },
  { name: "temporal", statement: "Predictions are derived from timestamped observations." },
  { name: "confidence", statement: "Confidence is carried through every inference boundary." },
  { name: "recovery", statement: "A worker failure cannot silently destroy source evidence." },
  { name: "idempotency", statement: "Retrying the same source cannot create uncontrolled duplicate truth." },
];
