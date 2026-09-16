export type TheStateIdentity = {
  id: string;
  slug: string;
  label: string;
  category?: string;
};

export type TheStateCapability = {
  id: string;
  key: string;
  label: string;
  enabled: boolean;
  config?: Record<string, unknown>;
};

export type TheStateMode = {
  id: string;
  key: string;
  label: string;
  active: boolean;
  config?: Record<string, unknown>;
};

export type TheStateCurrent = {
  activeModeId: string | null;
  status?: string;
  since?: string;
};

export type TheStateExperience = {
  id: string;
  title?: string | null;
  createdAt?: string;
  available: boolean;
};

export type TheStateHistoryEntry = {
  id: string;
  type: string;
  occurredAt: string;
  source?: string;
  data?: Record<string, unknown>;
};

export type TheStateMeasurement = {
  key: string;
  value: number;
  unit?: string;
  observedAt: string;
};

export type TheStatePattern = {
  key: string;
  value: string | number | boolean;
  confidence: number;
  sampleCount?: number;
  updatedAt: string;
};

/**
 * Canonical identity/state container beneath experiences.
 *
 * TheState is intentionally domain-neutral. Animals, surfboards,
 * vehicles, properties, businesses, and other physical/digital assets
 * use the same shape. Domain-specific UI modes are configurations over
 * this state; they are not separate engines.
 *
 * Capabilities describe what this identity can do.
 * Modes describe configurable ways the identity can currently behave.
 * Current describes what is active now.
 * History contains observed state-changing events.
 * Measurements contain observed quantities.
 * Patterns contain derived, confidence-scored behavior learned from history.
 */
export type TheState = {
  identity: TheStateIdentity;
  capabilities: TheStateCapability[];
  modes: TheStateMode[];
  current: TheStateCurrent;
  activeExperienceId: string | null;
  experiences: TheStateExperience[];
  history: TheStateHistoryEntry[];
  measurements: TheStateMeasurement[];
  patterns: TheStatePattern[];
};
