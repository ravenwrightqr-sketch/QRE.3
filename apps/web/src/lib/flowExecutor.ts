import type { FlowAction } from "@qre/contracts";

type Runtime = {
  sessionId: string;
  onMessage: (text: string) => void;
  onRedirect: (url: string) => void;
  onUnlock: () => void;
};

export function runFlow(actions: FlowAction[], runtime: Runtime) {
  if (!actions?.length) return;

  let i = 0;

  const next = () => {
    if (i >= actions.length) return;

    const action = actions[i++];

    switch (action.type) {
      case "message":
        runtime.onMessage(action.text);
        break;

      case "delay":
        setTimeout(next, action.ms);
        return;

      case "redirect":
        runtime.onRedirect(action.url);
        break;

      case "unlock":
        runtime.onUnlock();
        break;

      case "cta":
        runtime.onMessage(action.text);
        break;
    }

    setTimeout(next, 900);
  };

  next();
}