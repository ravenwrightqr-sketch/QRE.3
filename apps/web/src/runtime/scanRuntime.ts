import type { Moment } from "@qre/contracts";
import { executeAction } from "./actionExecutor";

export async function runScanRuntime(
  moments: Moment[],
  setCurrent: (m: Moment | null) => void
) {
  const sorted = [...moments].sort((a, b) => a.order - b.order);

  for (const moment of sorted) {
    setCurrent(moment);

    // timing layer (simple v1 delay)
    await new Promise((r) => setTimeout(r, 800));

    // execute actions immediately (no delay)
    if (moment.type === "action") {
      executeAction(moment);
    }
  }
}