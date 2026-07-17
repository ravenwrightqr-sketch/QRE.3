import type { Moment } from "./moment.js";
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

  // core
  | "message"
  | "story"
  | "hero"
  | "timeline"

  // media
  | "gallery"
  | "video"
  | "soundtrack"
  | "replay"

  // location
  | "location"
  | "geo_memory"
  | "map"

  // commerce
  | "product"
  | "menu"
  | "booking"
  | "payment"
  | "offer"

  // engagement
  | "reward"
  | "review"
  | "social"
  | "share"

  // identity
  | "profile"
  | "guestbook"

  // system
  | "redirect"
  | "timer";




export type FlowPayload =
  Record<string, unknown>;


/**
 * Runtime flow instruction.
 *
 * This mirrors what the engine needs,
 * not the database row.
 */
export type FlowStep = {

  id: string;

  order: number;

  type: FlowStepType;

 payload: Record<string, unknown>;
};