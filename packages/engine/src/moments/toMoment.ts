import type { ExperienceMoment } from "@qre/contracts";

export function toMessageMoment(input: { order: number; text?: unknown }): ExperienceMoment | null {
  if (typeof input.text !== "string") return null;
  return {
    type: "message",
    component: "story",
    title: input.text,
    text: input.text,
    editable: false,
    demo: false,
    order: input.order,
    payload: { text: input.text },
  };
}

export function toActionMoment(input: {
  order: number;
  text?: unknown;
  url?: unknown;
  label?: unknown;
  duration?: unknown;
}): ExperienceMoment | null {
  const text = typeof input.text === "string" ? input.text : "Continue";
  const url = typeof input.url === "string" ? input.url : undefined;
  const label = typeof input.label === "string" ? input.label : text;
  const duration = typeof input.duration === "number" ? input.duration : undefined;
  return {
    type: "action",
    component: "interaction",
    title: text,
    text,
    action: "cta",
    url,
    label,
    editable: false,
    demo: false,
    order: input.order,
    payload: { text, url, label, duration },
    meta: { text, url, label, duration },
  };
}
