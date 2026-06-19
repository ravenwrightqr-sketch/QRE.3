import type { FlowAction } from "../types/flow";

export type FlowRuntimeContext = {
  sessionId: string;
  onMessage: (text: string) => void;
  onRedirect: (url: string) => void;
  onUnlock: () => void;
};

export async function runFlow(
  actions: FlowAction[],
  ctx: FlowRuntimeContext
) {
  for (const action of actions) {
    switch (action.type) {
      case "message":
        ctx.onMessage(action.text);
        break;

      case "delay":
        await new Promise((r) => setTimeout(r, action.ms));
        break;

      case "redirect":
        ctx.onRedirect(action.url);
        return;

      case "unlock_preview":
        ctx.onUnlock();
        break;
    }
  }
}