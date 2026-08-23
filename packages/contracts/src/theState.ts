export type TheStateIdentity = {
  id: string;
  slug: string;
  label: string;
  category?: string;
};

export type TheStateCapability = {
  id: string;
  label: string;
  description?: string;
  enabled: boolean;
  metadata?: Record<string, unknown>;
};

export type TheStateMode = {
  id: string;
  label: string;
  description?: string;
  enabled: boolean;
  metadata?: Record<string, unknown>;
};

export type TheStateCurrent = {
  modeId: string | null;
  status?: string | null;
  since?: string | null;
  context?: Record<string, unknown>;
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
  metadata?: Record<string, unknown>;
};

export type TheStateMeasurement = {
  id: string;
  metric: string;
  value: number;
  unit?: string;
  observedAt: string;
  source?: string;
};

export type TheStatePattern = {
  id: string;
  pattern: string;
  summary?: string;
  confidence?: number;
  metadata?: Record<string, unknown>;
};

/**
 * Canonical identity/state container beneath experiences.
 *
 * TheState is intentionally domain-neutral. Animals, surfboards,
 * vehicles, properties, businesses, physical QR Art, equipment,
 * and other identity-bearing assets use the same shape.
 *
 * Capabilities and modes describe what an asset can do.
 * Current describes what is active now.
 * History, measurements, and patterns describe accumulated state
 * only when authoritative sources provide that information.
 *
 * Domain-specific UI modes are experiences over this state;
 * they are not separate engines.
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
