import { db } from "@qre/db";
import { nanoid } from "nanoid";

const PROGRAM_TYPE = "SPONSOR_REWARD_PROGRAM";
const ATTRIBUTION_TYPE = "REWARD_ATTRIBUTION";
const EARNED_TYPE = "REWARD_EARNED";
const REDEEMED_TYPE = "REWARD_REDEEMED";

function now() {
  return new Date();
}

function parseProgram(signal: any) {
  return {
    id: signal.id,
    sponsorName: signal.data?.sponsorName ?? signal.label ?? signal.merchantId,
    assetId: signal.assetId ?? undefined,
    rewardKind: signal.data?.rewardKind ?? "points",
    pointsPerCurrencyUnit: Number(signal.data?.pointsPerCurrencyUnit ?? 1),
    currency: signal.data?.currency ?? "USD",
    attributionWindowHours: Math.max(1, Number(signal.data?.attributionWindowHours ?? 168)),
    purchaseVerificationRequired: signal.data?.purchaseVerificationRequired !== false,
    regulated: signal.data?.regulated === true,
    minimumAge: signal.data?.minimumAge ? Number(signal.data.minimumAge) : undefined,
    ageGateRequired: signal.data?.ageGateRequired === true,
    prohibitedRedemptions: Array.isArray(signal.data?.prohibitedRedemptions) ? signal.data.prohibitedRedemptions : [],
    disclosure: signal.data?.disclosure ?? "sponsored experience",
    enabled: signal.active !== false,
  };
}

export async function createRewardProgram(input: {
  assetId: string;
  merchantId: string;
  sponsorName: string;
  regulated?: boolean;
  pointsPerCurrencyUnit?: number;
  attributionWindowHours?: number;
  minimumAge?: number;
}) {
  const regulated = input.regulated === true;
  const signal = await db.merchantSignal.create({
    data: {
      id: nanoid(16),
      merchantId: input.merchantId,
      assetId: input.assetId,
      type: PROGRAM_TYPE,
      label: input.sponsorName,
      active: true,
      priority: 50,
      isPublic: true,
      updatedAt: now(),
      data: {
        sponsorName: input.sponsorName,
        rewardKind: "points",
        pointsPerCurrencyUnit: Math.max(0, Number(input.pointsPerCurrencyUnit ?? 1)),
        attributionWindowHours: Math.max(1, Number(input.attributionWindowHours ?? 168)),
        purchaseVerificationRequired: true,
        regulated,
        minimumAge: regulated ? Math.max(21, Number(input.minimumAge ?? 21)) : undefined,
        ageGateRequired: regulated,
        prohibitedRedemptions: regulated
          ? ["free_cannabis_goods", "free_cannabis_accessories", "raffle", "sweepstakes"]
          : [],
        disclosure: regulated ? "sponsored experience" : "sponsored by",
      },
    },
  });
  return parseProgram(signal);
}

export async function attributeScan(input: {
  assetId: string;
  sessionId?: string;
  userId?: string;
  programId: string;
}) {
  const programSignal = await db.merchantSignal.findFirst({ where: { id: input.programId, assetId: input.assetId, type: PROGRAM_TYPE, active: true } });
  if (!programSignal) throw new Error("Reward program not found or disabled");

  const program = parseProgram(programSignal);
  const token = nanoid(24);
  const createdAt = now();
  const expiresAt = new Date(createdAt.getTime() + program.attributionWindowHours * 60 * 60 * 1000);

  await db.scanEvent.create({
    data: {
      assetId: input.assetId,
      sessionId: input.sessionId,
      userId: input.userId,
      type: ATTRIBUTION_TYPE,
      meta: { token, programId: program.id, expiresAt: expiresAt.toISOString() },
    },
  });

  return { token, program, expiresAt: expiresAt.toISOString() };
}

export async function recordVerifiedPurchase(input: {
  attributionToken: string;
  purchaseReference: string;
  amount: number;
  currency?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}) {
  const attribution = await db.scanEvent.findFirst({
    where: { type: ATTRIBUTION_TYPE, meta: { path: ["token"], equals: input.attributionToken } },
    orderBy: { createdAt: "desc" },
  });
  if (!attribution) throw new Error("Reward attribution not found");

  const programId = typeof attribution.meta === "object" && attribution.meta !== null && "programId" in attribution.meta
    ? String((attribution.meta as Record<string, unknown>).programId)
    : "";
  const programSignal = await db.merchantSignal.findFirst({ where: { id: programId, type: PROGRAM_TYPE, active: true } });
  if (!programSignal) throw new Error("Reward program not found or disabled");

  const program = parseProgram(programSignal);
  const expiresAt = new Date(String((attribution.meta as Record<string, unknown>)?.expiresAt ?? 0));
  if (Number.isNaN(expiresAt.getTime()) || expiresAt < now()) throw new Error("Reward attribution expired");
  if (!program.purchaseVerificationRequired) throw new Error("Reward program requires purchase verification");

  const points = Math.max(0, Math.floor(Math.max(0, input.amount) * program.pointsPerCurrencyUnit));
  if (points <= 0) return { points: 0, program };

  await db.scanEvent.create({
    data: {
      assetId: attribution.assetId,
      sessionId: attribution.sessionId,
      userId: input.userId ?? attribution.userId ?? undefined,
      type: EARNED_TYPE,
      meta: {
        programId: program.id,
        attributionToken: input.attributionToken,
        purchaseReference: input.purchaseReference,
        amount: input.amount,
        currency: input.currency ?? program.currency,
        points,
        metadata: input.metadata ?? {},
      },
    },
  });

  return { points, program };
}

export async function getRewardBalance(input: { assetId: string; programId: string; userId: string }) {
  const events = await db.scanEvent.findMany({ where: { assetId: input.assetId, userId: input.userId, type: { in: [EARNED_TYPE, REDEEMED_TYPE] } }, orderBy: { createdAt: "desc" }, take: 500 });
  const transactions = events
    .filter((event) => String((event.meta as Record<string, unknown> | null)?.programId ?? "") === input.programId)
    .map((event) => ({
      id: event.id,
      type: event.type,
      points: Number((event.meta as Record<string, unknown> | null)?.points ?? 0),
      purchaseReference: String((event.meta as Record<string, unknown> | null)?.purchaseReference ?? ""),
      createdAt: event.createdAt.toISOString(),
      metadata: event.meta ?? {},
    }));
  const points = transactions.reduce((sum, transaction) => sum + (transaction.type === EARNED_TYPE ? transaction.points : -transaction.points), 0);
  return { userId: input.userId, programId: input.programId, points: Math.max(0, points), transactions };
}
