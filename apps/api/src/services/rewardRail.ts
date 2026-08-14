import { db } from "@qre/db";
import { nanoid } from "nanoid";

const PROGRAM_TYPE = "REWARD_PROGRAM";
const ATTRIBUTION_TYPE = "REWARD_ATTRIBUTION";
const EARNED_TYPE = "REWARD_POINTS_EARNED";
const REDEEMED_TYPE = "REWARD_POINTS_REDEEMED";

type RewardProgram = {
  id: string;
  name: string;
  pointsPerCurrencyUnit: number;
  currency: string;
  purchaseVerificationRequired: boolean;
  ageGateRequired?: boolean;
  active: boolean;
  metadata?: Record<string, unknown>;
};

function normalize(value: unknown): string { return typeof value === "string" ? value.trim() : ""; }
function now() { return new Date(); }

function parseProgram(signal: any): RewardProgram {
  const data = (signal?.data ?? {}) as Record<string, unknown>;
  return {
    id: signal.id,
    name: normalize(signal.label) || "Sponsor Reward",
    pointsPerCurrencyUnit: Math.max(0, Number(data.pointsPerCurrencyUnit ?? 1)),
    currency: normalize(data.currency) || "USD",
    purchaseVerificationRequired: data.purchaseVerificationRequired !== false,
    ageGateRequired: data.ageGateRequired === true,
    active: signal.active !== false,
    metadata: typeof data.metadata === "object" && data.metadata ? data.metadata as Record<string, unknown> : undefined,
  };
}

export async function createAttribution(input: { assetId: string; programId: string; sessionId?: string; userId?: string; metadata?: Record<string, unknown> }) {
  const signal = await db.merchantSignal.findFirst({ where: { id: input.programId, type: PROGRAM_TYPE, active: true } });
  if (!signal) throw new Error("Reward program not found or disabled");
  const token = nanoid(24);
  const meta = { ...(input.metadata ?? {}), programId: input.programId, attributionToken: token, expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString() };
  await db.scanEvent.create({ data: { assetId: input.assetId, sessionId: input.sessionId, userId: input.userId ?? undefined, type: ATTRIBUTION_TYPE, meta: meta as any } });
  return { attributionToken: token, program: parseProgram(signal), expiresAt: meta.expiresAt };
}

export async function awardVerifiedPurchase(input: { assetId: string; programId: string; attributionToken: string; purchaseReference: string; amount: number; currency?: string; userId?: string; metadata?: Record<string, unknown> }) {
  const signal = await db.merchantSignal.findFirst({ where: { id: input.programId, type: PROGRAM_TYPE, active: true } });
  if (!signal) throw new Error("Reward program not found or disabled");
  const program = parseProgram(signal);
  if (!program.purchaseVerificationRequired) throw new Error("Reward program requires purchase verification");

  const attribution = await db.scanEvent.findFirst({ where: { assetId: input.assetId, type: ATTRIBUTION_TYPE, meta: { path: ["attributionToken"], equals: input.attributionToken } }, orderBy: { createdAt: "desc" } });
  if (!attribution) throw new Error("Reward attribution not found");
  const expiresAt = new Date(String(((attribution.meta as Record<string, unknown>)?.expiresAt ?? 0)));
  if (Number.isNaN(expiresAt.getTime()) || expiresAt < now()) throw new Error("Reward attribution expired");

  const points = Math.max(0, Math.floor(Math.max(0, input.amount) * program.pointsPerCurrencyUnit));
  if (points <= 0) return { points: 0, program };

  await db.scanEvent.create({
    data: {
      assetId: attribution.assetId,
      sessionId: attribution.sessionId,
      userId: input.userId ?? attribution.userId ?? undefined,
      type: EARNED_TYPE,
      meta: ({
        programId: program.id,
        attributionToken: input.attributionToken,
        purchaseReference: input.purchaseReference,
        amount: input.amount,
        currency: input.currency ?? program.currency,
        points,
        metadata: input.metadata ?? {},
      }) as any,
    },
  });

  return { points, program };
}

export async function getRewardBalance(input: { assetId: string; programId: string; userId: string }) {
  const events = await db.scanEvent.findMany({ where: { assetId: input.assetId, userId: input.userId, type: { in: [EARNED_TYPE, REDEEMED_TYPE] } }, orderBy: { createdAt: "desc" }, take: 500 });
  let balance = 0;
  for (const event of events) {
    const meta = (event.meta ?? {}) as Record<string, unknown>;
    const points = Math.max(0, Number(meta.points ?? 0));
    balance += event.type === EARNED_TYPE ? points : -points;
  }
  return { programId: input.programId, userId: input.userId, balance: Math.max(0, balance) };
}

export function rewardEventTypes() {
  return { PROGRAM_TYPE, ATTRIBUTION_TYPE, EARNED_TYPE, REDEEMED_TYPE };
}
