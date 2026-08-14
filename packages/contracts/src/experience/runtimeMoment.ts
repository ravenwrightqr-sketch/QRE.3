import type { MediaAsset } from "../media.js";
import type { GeoLocation } from "../geoStory.js";

/**
 * STATUS: CANONICAL / RUNTIME MOMENT
 *
 * ROLE: Atomic runtime unit consumed by the existing scan/runtime pipeline.
 *
 * This is the relocated successor to the former root contracts `moment.ts`.
 * Authoring `ExperienceMoment` remains in `experience/moment.ts`; these types
 * are intentionally separate so authoring and runtime contracts cannot drift
 * into one another.
 *
 * DO NOT add cognitive/compiler semantics here.
 */

export type RuntimeMomentMeta = Record<string, unknown> & {
  duration?: number;
};

export type RuntimeMoment =
  | {
      type: "system";
      order: number;
      text: string;
      meta?: RuntimeMomentMeta;
    }
  | {
      type: "message";
      order: number;
      text: string;
      meta?: RuntimeMomentMeta & { author?: string };
    }
  | {
      type: "action";
      order: number;
      action: "payment" | "redirect" | "unlock" | "flow" | "cta";
      text?: string;
      url?: string;
      label?: string;
      meta?: RuntimeMomentMeta & { suggestedAmount?: number };
    }
  | {
      type: "location";
      order: number;
      location: GeoLocation;
      meta?: RuntimeMomentMeta & {
        intensity?: number;
        timestamp?: string;
      };
    }
  | {
      type: "media";
      order: number;
      media: MediaAsset[];
      meta?: RuntimeMomentMeta & { text?: string };
    };

export type Moment = RuntimeMoment;
export type MomentMeta = RuntimeMomentMeta;
