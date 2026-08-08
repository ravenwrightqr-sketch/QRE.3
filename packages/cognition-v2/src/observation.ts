export type CognitiveObservationKind =
  | "user_stated"
  | "scan"
  | "location"
  | "time"
  | "event"
  | "interaction"
  | "media"
  | "external_record"
  | "system_detected";

export type CognitiveObservation = {
  id: string;

  kind: CognitiveObservationKind;

  subjectId: string;

  predicate: string;

  objectValue?: string;

  observedAt: string;

  source?: string;

  locationId?: string;

  eventId?: string;

  metadata?: Record<string, unknown>;
};

export type CognitiveObservationStore = {
  observations: CognitiveObservation[];
};

export function createObservationStore(
  observations: CognitiveObservation[] = []
): CognitiveObservationStore {
  return {
    observations: [...observations]
  };
}

export function addObservation(
  store: CognitiveObservationStore,
  observation: CognitiveObservation
): CognitiveObservationStore {
  return {
    observations: [
      ...store.observations,
      observation
    ]
  };
}

export function getObservationsForSubject(
  store: CognitiveObservationStore,
  subjectId: string
): CognitiveObservation[] {
  return store.observations.filter(
    observation =>
      observation.subjectId === subjectId
  );
}

export function getObservationsForEvent(
  store: CognitiveObservationStore,
  eventId: string
): CognitiveObservation[] {
  return store.observations.filter(
    observation =>
      observation.eventId === eventId
  );
}

export function getObservationsForLocation(
  store: CognitiveObservationStore,
  locationId: string
): CognitiveObservation[] {
  return store.observations.filter(
    observation =>
      observation.locationId === locationId
  );
}
