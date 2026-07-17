import type { Moment } from "./moment.js";

export const MomentFactory = {

  message(
    order: number,
    text: string
  ): Moment {
    return {
      type: "message",
      order,
      text,
      meta: {},
    };
  },


  action(
    order: number,
    action: "payment" | "redirect" | "unlock" | "flow" | "cta",
    meta: Record<string, unknown> = {}
  ): Moment {
    return {
      type: "action",
      order,
      action,
      meta,
    };
  },


  system(
    order: number,
    text: string,
    meta: Record<string, unknown> = {}
  ): Moment {
    return {
      type: "system",
      order,
      text,
      meta,
    };
  },


  location(
    order: number,
    location: {
      lat: number;
      lng: number;
      label?: string;
      city?: string;
      region?: string;
      country?: string;
    },
    meta: Record<string, unknown> = {}
  ): Moment {
    return {
      type: "location",
      order,
      location,
      meta,
    };
  },


  media(
    order: number,
    media: NonNullable<Extract<Moment, { type: "media" }>["media"]>,
    meta: Record<string, unknown> = {}
  ): Moment {
    return {
      type: "media",
      order,
      media,
      meta,
    };
  },

};