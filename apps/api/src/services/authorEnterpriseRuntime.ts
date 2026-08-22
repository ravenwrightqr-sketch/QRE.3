import type {
  AuthorAuditEntry,
  AuthorCreativeProfile,
  AuthorMemoryDelta,
  AuthorStyleMemory,
  AuthorVersionSnapshot,
} from "@qre/contracts";

function clean(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values.map(clean).filter(Boolean))];
}

export function createVersionSnapshot(input: {
  realityVersion: string;
  movieVersion: string;
  beatVersion: string;
  realizationVersion: string;
  parentVersion?: string;
  now?: string;
}): AuthorVersionSnapshot {
  const createdAt = input.now ?? new Date().toISOString();
  return {
    version: `${input.realityVersion}:${input.movieVersion}:${input.beatVersion}:${input.realizationVersion}`,
    realityVersion: input.realityVersion,
    movieVersion: input.movieVersion,
    beatVersion: input.beatVersion,
    realizationVersion: input.realizationVersion,
    createdAt,
    parentVersion: input.parentVersion,
  };
}

export function appendAuthorAudit(
  audit: readonly AuthorAuditEntry[],
  entry: Omit<AuthorAuditEntry, "id" | "timestamp"> & { id?: string; timestamp?: string },
): AuthorAuditEntry[] {
  const next: AuthorAuditEntry = {
    ...entry,
    id: entry.id ?? `audit-${audit.length + 1}`,
    timestamp: entry.timestamp ?? new Date().toISOString(),
  };
  return [...audit, next];
}

export function mergeMemoryDelta(
  previous: AuthorMemoryDelta | undefined,
  next: AuthorMemoryDelta,
): AuthorMemoryDelta {
  if (!previous || previous.memoryId !== next.memoryId) return next;
  return {
    memoryId: next.memoryId,
    addedEvidence: unique([...previous.addedEvidence, ...next.addedEvidence]),
    recurringSignals: unique([...previous.recurringSignals, ...next.recurringSignals]),
    callbacks: unique([...previous.callbacks, ...next.callbacks]),
    characterChanges: unique([...previous.characterChanges, ...next.characterChanges]),
    preferredLenses: [...new Set([...previous.preferredLenses, ...next.preferredLenses])],
    confidence: Number(Math.max(previous.confidence, next.confidence).toFixed(3)),
  };
}

export function updateStyleMemory(
  previous: AuthorStyleMemory | undefined,
  input: {
    acceptedMotifs?: readonly string[];
    rejectedPatterns?: readonly string[];
    preferredStrategies?: AuthorStyleMemory["preferredStrategies"];
    profile?: Partial<AuthorCreativeProfile>;
    now?: string;
  },
): AuthorStyleMemory {
  const base: AuthorCreativeProfile = previous?.profile ?? {};
  return {
    profile: {
      ...base,
      ...input.profile,
    },
    acceptedMotifs: unique([
      ...(previous?.acceptedMotifs ?? []),
      ...(input.acceptedMotifs ?? []),
    ]).slice(-64),
    rejectedPatterns: unique([
      ...(previous?.rejectedPatterns ?? []),
      ...(input.rejectedPatterns ?? []),
    ]).slice(-128),
    preferredStrategies: [
      ...new Set([
        ...(previous?.preferredStrategies ?? []),
        ...(input.preferredStrategies ?? []),
      ]),
    ],
    updatedAt: input.now ?? new Date().toISOString(),
  };
}

export function deterministicAuthorSeed(parts: readonly string[]): number {
  let hash = 2166136261 >>> 0;
  for (const part of parts) {
    for (const char of clean(part)) {
      hash ^= char.charCodeAt(0);
      hash = Math.imul(hash, 16777619);
    }
  }
  return hash >>> 0;
}
