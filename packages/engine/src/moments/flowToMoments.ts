import type { FlowStep, ExperienceMoment } from "@qre/contracts";

/**
 * STATUS: CANONICAL runtime projection.
 * Flow steps are translated into the unified ExperienceMoment contract.
 */
export function flowToMoment(steps: FlowStep[]): ExperienceMoment[] {
  return steps.map((step) => {
    const payload = (step.payload ?? {}) as Record<string, unknown>;
    const text = String(payload.text ?? payload.title ?? payload.description ?? "Experience moment");

    if (step.type === "location") {
      return {
        type: "location",
        component: "geo_memory",
        title: String(payload.title ?? "Location"),
        text,
        editable: false,
        demo: false,
        order: step.order,
        payload,
        location: {
          lat: Number(payload.lat ?? 0),
          lng: Number(payload.lng ?? 0),
          label: String(payload.label ?? payload.title ?? "Location"),
          city: typeof payload.city === "string" ? payload.city : undefined,
          region: typeof payload.region === "string" ? payload.region : undefined,
          country: typeof payload.country === "string" ? payload.country : undefined,
        },
        meta: {
          ...payload,
          geoMemory: payload.geoMemory === true,
          captureSnapshot: payload.captureSnapshot === true || payload.snapshot === true,
          timeline: payload.timeline === true,
        },
      };
    }

    if (step.type === "redirect" || step.type === "payment") {
      const action = step.type === "payment" ? "payment" : "redirect";
      return {
        type: "action",
        component: step.type === "payment" ? "payment" : "interaction",
        title: text,
        text,
        action,
        url: typeof payload.url === "string" ? payload.url : undefined,
        label: typeof payload.label === "string" ? payload.label : text,
        editable: false,
        demo: false,
        order: step.order,
        payload,
        meta: { ...payload, url: payload.url, label: payload.label },
      };
    }

    if (step.type === "timer") {
      return {
        type: "system",
        component: "system",
        title: "Pause",
        text: "Pause",
        editable: false,
        demo: false,
        order: step.order,
        payload,
        meta: { event: "DELAY", duration: Number(payload.duration ?? 0), ...payload },
      };
    }

    const semanticType = (() => {
      switch (step.type) {
        case "gallery": return "photos" as const;
        case "geo_memory": return "location" as const;
        case "map": return "location" as const;
        case "replay": return "replay" as const;
        case "story": return "story" as const;
        case "hero": return "welcome" as const;
        case "timeline": return "timeline" as const;
        case "video": return "video" as const;
        case "soundtrack": return "soundtrack" as const;
        default: return step.type as ExperienceMoment["type"];
      }
    })();

    return {
      type: semanticType,
      component: semanticType === "photos" ? "gallery" : semanticType === "video" ? "video" : semanticType === "location" ? "geo_memory" : "story",
      title: String(payload.title ?? text),
      text,
      description: typeof payload.description === "string" ? payload.description : undefined,
      editable: false,
      demo: false,
      order: step.order,
      payload,
      meta: payload,
    };
  });
}
