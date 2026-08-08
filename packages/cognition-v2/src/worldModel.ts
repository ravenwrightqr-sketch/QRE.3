export type CognitiveEntity = {
  id?: string;
  text: string;
  kind?: string;
  attributes?: Record<string, unknown>;
};

export type CognitiveEvent = {
  id?: string;
  text: string;
  kind?: string;
  date?: string;
  time?: string;
  place?: string;
  participants?: string[];
  significance?: string[];
};

export type CognitiveRelationship = {
  subject: string;
  relation: string;
  object: string;
  confidence?: number;
};

export type CognitivePlace = {
  text: string;
  kind?: string;
  latitude?: number;
  longitude?: number;
};

export type CognitiveTemporal = {
  past: boolean;
  present: boolean;
  future: boolean;
  markers: string[];
};

export type CognitiveNarrative = {
  hasBeginning: boolean;
  hasTransformation: boolean;
  hasRelationship: boolean;
  hasMemory: boolean;
  hasConflict: boolean;
  hasMilestone: boolean;
  hasDiscovery: boolean;
};

export type CognitiveWorldModel = {
  entities: CognitiveEntity[];
  events: CognitiveEvent[];
  relationships: CognitiveRelationship[];
  places: CognitivePlace[];

  emotions: string[];
  desires: string[];
  objects: string[];
  themes: string[];

  temporal: CognitiveTemporal;
  narrative: CognitiveNarrative;

  domains: string[];
  primaryDomain: string;
};
