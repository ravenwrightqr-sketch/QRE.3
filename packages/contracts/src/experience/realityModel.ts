/**
 * Domain-neutral model of observable reality.
 *
 * The cognitive system does not need to know whether the subject is a dog,
 * couple, house, car, wedding, place, workout, rescue animal, or object.
 * Everything useful for cinematic realization is reduced to entities,
 * observations, relations, place/time context, and provenance.
 */
export type RealityProvenance =
  | "prompt"
  | "runtime"
  | "memory"
  | "geo"
  | "derived"
  | "creative";

export type RealityEntityKind =
  | "person"
  | "animal"
  | "object"
  | "place"
  | "organization"
  | "event"
  | "unknown";

export type RealityEntity = {
  id: string;
  name: string;
  kind: RealityEntityKind;
  confidence: number;
  provenance: RealityProvenance;
};

export type RealityObservation = {
  id: string;
  order: number;
  text: string;
  subjectIds: string[];
  placeId?: string;
  before?: string;
  after?: string;
  confidence: number;
  provenance: RealityProvenance;
};

export type RealityRelation = {
  fromId: string;
  toId: string;
  type: string;
  confidence: number;
  provenance: RealityProvenance;
};

export type RealityModel = {
  subjectId: string;
  entities: RealityEntity[];
  observations: RealityObservation[];
  relations: RealityRelation[];
  places: string[];
  temporal: string[];
  constraints: string[];
};
