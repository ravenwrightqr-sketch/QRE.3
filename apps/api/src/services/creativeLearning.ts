import { db } from "@qre/db";
import { getAutonomousLearning } from "./autonomousLearning.js";

export type CreativeFeedbackDecision = "accepted" | "rejected" | "selected";

export type CreativeLearningContext = {
  signals: string[];
  acceptedPatterns: string[];
  rejectedPatterns: string[];
  recentFeedback: string[];
  autonomousSignals: string[];
  autonomousWinners: string[];
  autonomousWeaknesses: string[];
  autonomousConfidence: number;
};

function clean(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function unique(values: string[]): string[] {
  return [...new Set(values.map(clean).filter(Boolean))];
}

function safeMeta(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

export async function recordCreativeFeedback(input: {
  assetId: string;
  userId?: string;
  prompt: string;
  draft: string;
  decision: CreativeFeedbackDecision;
  feedback?: string;
  styleTags?: string[];
  trajectory?: string;
  score?: number;
}): Promise<void> {
  const type = input.decision === "accepted"
    ? "AI_CREATIVE_ACCEPTED"
    : input.decision === "selected"
      ? "AI_VARIATION_SELECTED"
      : "AI_CREATIVE_REJECTED";

  await db.analyticsEvent.create({
    data: {
      assetId: input.assetId,
      type,
      meta: {
        userId: input.userId ?? null,
        prompt: clean(input.prompt).slice(0, 4000),
        draft: clean(input.draft).slice(0, 12000),
        feedback: clean(input.feedback).slice(0, 4000),
        styleTags: unique(input.styleTags ?? []).slice(0, 20),
        trajectory: clean(input.trajectory).slice(0, 120),
        score: typeof input.score === "number" && Number.isFinite(input.score) ? input.score : null,
        recordedAt: new Date().toISOString(),
      },
    },
  });
}

export async function getCreativeLearningContext(input: {
  assetId: string;
  userId?: string;
  limit?: number;
}): Promise<CreativeLearningContext> {
  const limit = Math.max(10, Math.min(150, input.limit ?? 80));

  const asset = await db.asset.findUnique({
    where: { id: input.assetId },
    select: { id: true },
  });

  if (!asset) {
    return {
      signals: [],
      acceptedPatterns: [],
      rejectedPatterns: [],
      recentFeedback: [],
      autonomousSignals: [],
      autonomousWinners: [],
      autonomousWeaknesses: [],
      autonomousConfidence: 0,
    };
  }

  // Creative learning is identity-scoped to the physical QRE asset.
  // ownerId/accountId describe administration and organizational ownership;
  // they must never implicitly widen creative learning to unrelated assets.
  const scopeAssetIds = [asset.id];

  const events = await db.analyticsEvent.findMany({
    where: {
      assetId: { in: scopeAssetIds },
      type: {
        in: ["AI_CREATIVE_ACCEPTED", "AI_CREATIVE_REJECTED", "AI_VARIATION_SELECTED"],
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  const accepted: string[] = [];
  const rejected: string[] = [];
  const signals: string[] = [];
  const recentFeedback: string[] = [];

  for (const event of events) {
    const meta = safeMeta(event.meta);
    const draft = clean(meta.draft);
    const feedback = clean(meta.feedback);
    const trajectory = clean(meta.trajectory);
    const tags = Array.isArray(meta.styleTags)
      ? meta.styleTags.map(clean).filter(Boolean)
      : [];
    const userId = clean(meta.userId);
    const sameUser = Boolean(input.userId && userId && userId === input.userId);
    const prefix = sameUser ? "your preference" : "recorded preference";
    const source = event.type.startsWith("AI_") ? "explicit" : "observed";

    if (event.type === "AI_CREATIVE_REJECTED") {
      if (feedback) rejected.push(`${prefix}: avoid ${feedback}`);
      if (trajectory) rejected.push(`${prefix}: rejected trajectory ${trajectory}`);
      if (tags.length) rejected.push(`${prefix}: rejected styles ${tags.join(", ")}`);
    } else {
      if (feedback) accepted.push(`${prefix}: liked ${feedback}`);
      if (trajectory) accepted.push(`${prefix}: preferred trajectory ${trajectory}`);
      if (tags.length) accepted.push(`${prefix}: preferred styles ${tags.join(", ")}`);
      if (draft) recentFeedback.push(`this asset accepted draft: ${draft.slice(0, 500)}`);
    }

    const timestamp = event.createdAt.toISOString();
    if (draft) signals.push(`${source.toUpperCase()} ${event.type} at ${timestamp}: ${draft.slice(0, 350)}`);
    if (feedback) recentFeedback.push(`${source.toUpperCase()} ${event.type}: ${feedback.slice(0, 350)}`);
  }

  const autonomous = await getAutonomousLearning({
    assetId: input.assetId,
    userId: input.userId,
    limit,
  });

  signals.push(...autonomous.signals);
  accepted.push(...autonomous.winningPatterns);
  rejected.push(...autonomous.weakPatterns);

  return {
    signals: unique(signals).slice(0, 40),
    acceptedPatterns: unique(accepted).slice(0, 40),
    rejectedPatterns: unique(rejected).slice(0, 40),
    recentFeedback: unique(recentFeedback).slice(0, 30),
    autonomousSignals: unique(autonomous.signals).slice(0, 20),
    autonomousWinners: unique(autonomous.winningPatterns).slice(0, 20),
    autonomousWeaknesses: unique(autonomous.weakPatterns).slice(0, 20),
    autonomousConfidence: autonomous.confidence,
  };
}

export function learningContextLines(context: CreativeLearningContext): string[] {
  return [
    ...context.acceptedPatterns.map((value) => `LEARNED_PREFERENCE: ${value}`),
    ...context.rejectedPatterns.map((value) => `LEARNED_AVOIDANCE: ${value}`),
    ...context.autonomousWinners.map((value) => `AUTO_LEARNED_WINNER: ${value}`),
    ...context.autonomousWeaknesses.map((value) => `AUTO_LEARNED_WEAKNESS: ${value}`),
    ...context.recentFeedback.map((value) => `RECENT_FEEDBACK: ${value}`),
    ...context.signals.slice(0, 10).map((value) => `LEARNING_SIGNAL: ${value}`),
  ].slice(0, 100);
}
