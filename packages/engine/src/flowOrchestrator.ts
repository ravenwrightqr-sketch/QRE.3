import { getSession, updateSession } from "./sessionManager.js";
import { runAction } from "./actions.js";
import type { FlowAction } from "@qre/contracts";

export async function runFlowActions(
  actions: FlowAction[],
  sessionId: string,
  assetId: string
) {
  const session = await getSession(sessionId);
  if (!session) throw new Error("Session not found");

  let currentIndex = session.stepIndex ?? 0;

  for (let i = currentIndex; i < actions.length; i++) {
    const action = actions[i];
    if (!action) continue;

    const latest = await getSession(sessionId);
    if (!latest) throw new Error("Session lost");

    if ((latest.stepIndex ?? 0) > i) continue;

    await updateSession(sessionId, {
      stepIndex: i,
      status: "running",
    });

    const result = await runAction(action, {
      sessionId,
      assetId,
    });

    await updateSession(sessionId, {
      stepIndex: i + 1,
      status: "active",
      lastAction: result,
    });
  }

  await updateSession(sessionId, {
    stepIndex: actions.length,
    status: "completed",
  });
}