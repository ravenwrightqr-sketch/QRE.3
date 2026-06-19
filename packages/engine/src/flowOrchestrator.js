import { runAction } from "./actions.js";
import { getSession, updateSession } from "./sessionManager.js";
export async function runFlowActions(actions, sessionId, assetId) {
    if (!actions?.length)
        return;
    // 🔄 load session (DB source of truth)
    const session = await getSession(sessionId);
    // 🧠 IMPORTANT: session may NOT have stepIndex in your current schema
    const startIndex = session?.stepIndex ?? 0;
    for (let i = startIndex; i < actions.length; i++) {
        const action = actions[i];
        if (!action)
            continue;
        // 💾 persist progress BEFORE execution (crash-safe resume model)
        await updateSession(sessionId, {
            stepIndex: i,
        });
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
    });
}
