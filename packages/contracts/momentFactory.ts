import type { ExperienceMoment, ExperienceAction } from "./experience/moment.js";
import type { MediaAsset } from "./media.js";

/** STATUS: CANONICAL compatibility factory for ExperienceMoment. */
export const MomentFactory = {
  message(order: number, text: string): ExperienceMoment {
    return {
      type: "message",
      component: "story",
      title: text,
      text,
      editable: false,
      demo: false,
      order,
      payload: { text },
      meta: {},
    };
  },

  action(
    order: number,
    action: ExperienceAction,
    meta: Record<string, unknown> = {},
  ): ExperienceMoment {
    const text = typeof meta.text === "string" ? meta.text : action;
    return {
      type: "action",
      component: action === "payment" ? "payment" : "interaction",
      title: text,
      text,
      action,
      url: typeof meta.url === "string" ? meta.url : undefined,
      label: typeof meta.label === "string" ? meta.label : undefined,
      editable: false,
      demo: false,
      order,
      payload: meta,
      meta,
    };
  },

  system(order: number, text: string, meta: Record<string, unknown> = {}): ExperienceMoment {
    return {
      type: "system",
      component: "system",
      title: text,
      text,
      editable: false,
      demo: false,
      order,
      payload: meta,
      meta,
    };
  },

  location(
    order: number,
    location: { lat: number; lng: number; label?: string; city?: string; region?: string; country?: string },
    meta: Record<string, unknown> = {},
  ): ExperienceMoment {
    return {
      type: "location",
      component: "geo_memory",
      title: location.label ?? "Location",
      editable: false,
      demo: false,
      order,
      payload: { ...location, ...meta },
      location,
      meta,
    };
  },

  media(order: number, media: MediaAsset[], meta: Record<string, unknown> = {}): ExperienceMoment {
    return {
      type: "media",
      component: "gallery",
      title: typeof meta.title === "string" ? meta.title : "Media",
      text: typeof meta.text === "string" ? meta.text : undefined,
      editable: false,
      demo: false,
      order,
      payload: meta,
      media,
      meta,
    };
  },
};
