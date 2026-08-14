import type { ExperienceMoment } from "@qre/contracts";
import { executeAction } from "./actionExecutor";

export async function runScanRuntime(
  moments: ExperienceMoment[],
  setCurrent: (m: ExperienceMoment | null) => void,
) {
  const sorted = [...moments].sort((a, b) => a.order - b.order);

  for (const moment of sorted) {
    setCurrent(moment);
    const duration = typeof moment.meta?.duration === "number" ? moment.meta.duration : 800;
    await new Promise((resolve) => setTimeout(resolve, duration));
    if (moment.type === "action") executeAction(moment);
  }
}
