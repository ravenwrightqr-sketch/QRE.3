import type {
  ExperienceTier,
} from "./experience/tier.js";

/**
 * =========================
 * FLOW CONTRACTS
 * =========================
 * Runtime compiler contracts.
 * These are NOT Prisma models.
 */

export type ActionContext = {
  assetId: string;
  sessionId: string;
  userId?: string | null;
};

export type FlowStepType =
  | "message"
  | "story"
  | "hero"
  | "timeline"
  | "gallery"
  | "video"
  | "soundtrack"
  | "replay"
  | "location"
  | "geo_memory"
  | "map"
  | "product"
  | "menu"
  | "booking"
  | "payment"
  | "offer"
  | "reward"
  | "review"
  | "social"
  | "share"
  | "profile"
  | "guestbook"
  | "redirect"
  | "timer";

export type FlowPayload = Record<string, unknown>;

export type FlowStep = {
  id: string;
  order: number;
  type: FlowStepType;
  payload: Record<string, unknown>;
};