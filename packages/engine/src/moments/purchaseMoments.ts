import type { AccessState, ExperienceMoment } from "@qre/contracts";

/** STATUS: CANONICAL runtime producer using ExperienceMoment. */
export function purchaseMoments(state: AccessState, slug: string): ExperienceMoment[] {
  if (state === "UNLOCKED") return [];

  const text = state === "DEMO" ? "Create your own experience" : state === "LOCKED" ? "Activate this experience" : "Get this experience";
  const url = state === "DEMO" ? `/store/${slug}` : `/checkout/${slug}`;

  return [{
    type: "action",
    component: "payment",
    title: text,
    text,
    action: "payment",
    url,
    label: text,
    order: 100,
    editable: false,
    demo: state === "DEMO",
    payload: { state, slug, url, text, label: text },
    meta: { text, url, label: text },
  }];
}
