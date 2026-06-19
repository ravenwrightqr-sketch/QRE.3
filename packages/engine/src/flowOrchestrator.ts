import { runAction } from "./actions.js";
import { getSession, updateSession } from "./sessionManager.js";
import type { Action } from "./types.js";

export async function runFlowActions(
  actions: Action[],
  sessionId: string,
  assetId: string
) {
  if (!actions?.length) return;

  // 🔄 load session (DB source of truth)
  const session = await getSession(sessionId);

  // 🧠 IMPORTANT: session may NOT have stepIndex in your current schema
  const startIndex = (session as any)?.stepIndex ?? 0;

  for (let i = startIndex; i < actions.length; i++) {
    const action = actions[i];
    if (!action) continue;

    // 💾 persist progress BEFORE execution (crash-safe resume model)
    await updateSession(sessionId, {
      stepIndex: i,
    } as any);

    // ⚡ execute atomic action
    await runAction(action, {
      sessionId,
      assetId,
    });
  }

  // 🏁 finalize session
  await updateSession(sessionId, {
    status: "completed",
    stepIndex: actions.length,
  } as any);
}