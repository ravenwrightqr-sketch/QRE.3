/**
 * SUPER COG LONG-TERM MEMORY CONTRACT
 *
 * Memory is a governed world-state layer, not a bag of prose.
 * Every durable assertion carries provenance, confidence, temporal state, and
 * visibility. Immutable events remain available for replay; facts are the
 * consolidated current view used by cognition.
 */

export type MemoryEntityKind =
  | "person"
  | "animal"
  | "place"
  | "organization"
  | "event"
  | "object"
  | "property"
  | "service"
  | "experience"
  | "other";

export type MemoryFactKind =
  | "identity"
  | "attribute"
  | "relationship"
  | "preference"
  | "history"
  | "event"
  | "outcome"
  | "behavior"
  | "context";

export type MemorySource =
  | "prompt"
  | "user"
  | "event"
  | "scan"
  | "location"
  | "system"
  | "import";

export type MemoryVisibility = "private" | "shared" | "public";
export type MemoryFactStatus = "active" | "superseded" | "retracted" | "quarantined";

export type MemoryEntity = {
  id: string;
  kind: MemoryEntityKind;
  name: string;
  canonicalKey: string;
  confidence: number;
  visibility: MemoryVisibility;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type MemoryFact = {
  id: string;
  entityId?: string;
  kind: MemoryFactKind;
  predicate: string;
  value: string;
  confidence: number;
  source: MemorySource;
  sourceRef?: string;
  status: MemoryFactStatus;
  observedAt: string;
  validFrom?: string;
  validTo?: string;
  visibility: MemoryVisibility;
  metadata?: Record<string, unknown>;
};

export type MemoryRelation = {
  id: string;
  fromEntityId: string;
  toEntityId: string;
  relation: string;
  confidence: number;
  source: MemorySource;
  sourceRef?: string;
  observedAt: string;
  visibility: MemoryVisibility;
  metadata?: Record<string, unknown>;
};

export type MemoryEvent = {
  id: string;
  type: string;
  summary: string;
  occurredAt: string;
  source: MemorySource;
  confidence: number;
  entityIds: string[];
  sessionId?: string;
  metadata?: Record<string, unknown>;
};

export type MemoryContext = {
  assetId: string;
  generatedAt: string;
  entities: MemoryEntity[];
  facts: MemoryFact[];
  relations: MemoryRelation[];
  events: MemoryEvent[];
};

export type MemoryFactWrite = Omit<MemoryFact, "id"> & { id?: string };
export type MemoryRelationWrite = Omit<MemoryRelation, "id"> & { id?: string };
export type MemoryEventWrite = Omit<MemoryEvent, "id"> & { id?: string };

export type MemoryWriteBatch = {
  assetId: string;
  userId?: string;
  entities: Array<Omit<MemoryEntity, "id" | "createdAt" | "updatedAt"> & { id?: string }>;
  facts: MemoryFactWrite[];
  relations: MemoryRelationWrite[];
  events: MemoryEventWrite[];
};
