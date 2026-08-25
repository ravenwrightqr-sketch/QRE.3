/**
 * QRE AUTHOR EXPERIENCE STATE
 *
 * The durable semantic state of an authored experience chapter.
 * This is interpretation state, never source truth.
 *
 * The state records what the current experience has established,
 * changed, carried forward, opened for later, revisited, and earned.
 * It is intentionally domain-neutral so the same engine can author
 * pets, people, services, weddings, cities, concerts, neighborhoods,
 * and cross-world connections.
 */
export type AuthorExperienceState = {
  version: 1;

  establishedEventIds: string[];
  changedEventIds: string[];
  carrierEventIds: string[];

  activeTensionKeys: string[];
  resolvedTensionKeys: string[];

  setupEventIds: string[];
  callbackEventIds: string[];
  revisitedEventIds: string[];

  unresolvedQuestions: string[];
  carryThreads: string[];

  futureEventIds: string[];
  futureThreadKeys: string[];

  semanticTurnKeys: string[];
  relationKinds: string[];

  continuationValue: number;
  lookaheadValue: number;
  endpointPressure: number;
  attentionPotential: number;

  selectedLens: string;
  selectedMovieId?: string;
  payoffEventIds: string[];
  earnedByEventIds: string[];

  chapter: {
    openingEventIds: string[];
    finalEventIds: string[];
    semanticTurns: string[];
    operations: string[];
  };

  memoryHooks: string[];
};
