import type { Moment } from "@qre/contracts";

export function toMessageMoment(input: {
  order: number;
  text?: unknown;
}): Moment | null {
  if (typeof input.text !== "string") return null;

  return {
    type: "message",
    order: input.order,
    text: input.text,
  };
}

export function toActionMoment(input: {
  order: number;
  text?: unknown;
  url?: unknown;
  label?: unknown;
  duration?: unknown;
}): Moment | null {
  const base: any = {
    type: "action",
    order: input.order,
  };

  if (typeof input.text === "string") base.text = input.text;
  if (typeof input.url === "string") base.url = input.url;
  if (typeof input.label === "string") base.label = input.label;
  if (typeof input.duration === "number") base.duration = input.duration;

  return base;
}