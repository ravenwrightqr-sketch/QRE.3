import type { AccessState, ExperienceMoment } from "@qre/contracts";

/** STATUS: CANONICAL runtime producer using ExperienceMoment. */
export function systemMoments(state: AccessState): ExperienceMoment[] {
  if (state === "UNLOCKED") return [];

  return [{
    type: "system",
    component: "system",
    title: "Demo experience",
    text: "Demo experience",
    editable: false,
    demo: true,
    order: 0,
    payload: { accessState: state },
    meta: { accessState: state },
  }];
}
