import { db } from "@qre/db";
import { AnalyticsEventTypes, type AnalyticsEventType } from "@qre/contracts";
import { normalizeExperienceOutcome } from "./authorOutcomeLearning.js";

export type AutonomousLearning = {
  signals: string[];
  winningPatterns: string[];
  weakPatterns: string[];
  confidence: number;
  measuredExperiences: number;
  measuredEvents: number;
};

type FlowActions = {
  category?: unknown;
  sourcePrompt?: unknown;
  generativeAuthor?: unknown;
  learningProfile?: {
    lens?: unknown;
    promptShape?: unknown;
    promptSignals?: unknown;
  };
};

function text(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function short(value: string, max = 180): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

function groupKey(actions: FlowActions): string {
  const lens = text(actions.learningProfile?.lens) || text(actions.category) || "neutral";
  const shape = text(actions.learningProfile?.promptShape) || "general";
  const signals = Array.isArray(actions.learningProfile?.promptSignals)
    ? actions.learningProfile?.promptSignals.map(text).filter(Boolean).slice(0, 4).sort().join("+")
    : "";
  return `${lens} / ${shape}${signals ? ` / ${signals}` : ""}`;
}

export async function getAutonomousLearning(input: {
  assetId: string;
  userId?: string;
  limit?: number;
}): Promise<AutonomousLearning> {
  const base = await db.asset.findUnique({
    where: { id: input.assetId },
    select: { id: true },
  });
  if (!base) return { signals: [], winningPatterns: [], weakPatterns: [], confidence: 0, measuredExperiences: 0, measuredEvents: 0 };

  // Autonomous creative learning is identity-scoped to the current physical QRE asset.
  // ownerId/accountId are administrative/organizational relationships, not permission
  // to blend unrelated assets into this asset's learning state.
  const assetIds = [base.id];

  const take = Math.max(20, Math.min(500, input.limit ?? 240));
  const flows = await db.flow.findMany({
    where: { experiences: { some: { assetId: { in: assetIds } } } },
    orderBy: { createdAt: "desc" },
    take,
    select: { id: true, actions: true },
  });

  if (!flows.length) return { signals: [], winningPatterns: [], weakPatterns: [], confidence: 0, measuredExperiences: 0, measuredEvents: 0 };

  const events = await db.analyticsEvent.findMany({
    where: { assetId: { in: assetIds }, flowId: { in: flows.map((flow) => flow.id) } },
    orderBy: { createdAt: "desc" },
    take: Math.min(5000, take * 20),
    select: { flowId: true, type: true },
  });

  const byFlow = new Map<string, { actions: FlowActions; scans: number; positives: number; negatives: number; completes: number; replays: number; saves: number; shares: number; abandons: number; errors: number }>();
  for (const flow of flows) {
    byFlow.set(flow.id, {
      actions: (flow.actions && typeof flow.actions === "object" ? flow.actions : {}) as FlowActions,
      scans: 0,
      positives: 0,
      negatives: 0,
      completes: 0,
      replays: 0,
      saves: 0,
      shares: 0,
      abandons: 0,
      errors: 0,
    });
  }

  for (const event of events) {
    if (!event.flowId) continue;
    const bucket = byFlow.get(event.flowId);
    if (!bucket) continue;
    if (event.type === AnalyticsEventTypes.SCAN) bucket.scans += 1;
    const normalized = normalizeExperienceOutcome(event.type as AnalyticsEventType);
    if (normalized === "positive") bucket.positives += 1;
    if (normalized === "negative") bucket.negatives += 1;
    if (event.type === AnalyticsEventTypes.FLOW_COMPLETE) bucket.completes += 1;
    if (event.type === AnalyticsEventTypes.EXPERIENCE_REPLAY) bucket.replays += 1;
    if (event.type === AnalyticsEventTypes.EXPERIENCE_SAVED) bucket.saves += 1;
    if (event.type === AnalyticsEventTypes.EXPERIENCE_SHARED) bucket.shares += 1;
    if (event.type === AnalyticsEventTypes.FLOW_ABANDON) bucket.abandons += 1;
    if (event.type === AnalyticsEventTypes.ERROR) bucket.errors += 1;
  }

  const groups = new Map<string, { flows: number; scans: number; completes: number; positives: number; negatives: number }>();
  for (const bucket of byFlow.values()) {
    if (!bucket.actions.generativeAuthor && !text(bucket.actions.sourcePrompt)) continue;
    const key = groupKey(bucket.actions);
    const group = groups.get(key) ?? { flows: 0, scans: 0, completes: 0, positives: 0, negatives: 0 };
    group.flows += 1;
    group.scans += bucket.scans;
    group.completes += bucket.completes;
    group.positives += bucket.positives;
    group.negatives += bucket.negatives;
    groups.set(key, group);
  }

  const candidates = [...groups.entries()].map(([key, value]) => {
    const completionRate = value.scans > 0 ? value.completes / value.scans : 0;
    const positivePerScan = value.scans > 0 ? value.positives / value.scans : 0;
    const negativePerScan = value.scans > 0 ? value.negatives / value.scans : 0;
    const score = completionRate + positivePerScan - negativePerScan;
    return { key, ...value, completionRate, positivePerScan, negativePerScan, score };
  }).filter((value) => value.scans >= 2 || value.flows >= 2).sort((a, b) => b.score - a.score);

  const measuredExperiences = candidates.reduce((sum, value) => sum + value.flows, 0);
  const measuredEvents = events.length;
  const confidence = Math.min(1, Math.max(0, measuredEvents / 250));

  const winningPatterns = candidates.slice(0, 6).map((value) =>
    `BEHAVIORAL_WINNER: ${value.key} — ${(value.completionRate * 100).toFixed(0)}% completion, ${value.positivePerScan.toFixed(2)} positive actions/scan across ${value.scans} scans.`,
  );
  const weakPatterns = candidates.slice(-4).filter((value) => value.negativePerScan > 0 || value.completionRate < 0.35).map((value) =>
    `BEHAVIORAL_WEAKNESS: ${value.key} — ${(value.completionRate * 100).toFixed(0)}% completion, ${value.negativePerScan.toFixed(2)} negative actions/scan.`,
  );
  const signals = candidates.slice(0, 10).map((value) =>
    `AUTO_SIGNAL: ${value.key} | scans=${value.scans} completes=${value.completes} positive=${value.positives} negative=${value.negatives}`,
  );

  return {
    signals: signals.map((value) => short(value, 260)),
    winningPatterns,
    weakPatterns,
    confidence,
    measuredExperiences,
    measuredEvents,
  };
}
