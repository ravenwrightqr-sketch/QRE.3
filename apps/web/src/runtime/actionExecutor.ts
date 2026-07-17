import type { Moment } from "@qre/contracts";

export function executeAction(moment: Moment) {
  if (moment.type !== "action") return;

  switch (moment.action) {
    case "redirect":
      if (moment.meta?.url) {
        window.location.href = moment.meta.url;
      }
      break;

    case "payment":
      if (moment.meta?.url) {
        window.location.href = moment.meta.url;
      }
      break;

    case "unlock":
      // v1: just UI signal (later upgrade to state engine)
      console.log("UNLOCK:", moment.meta?.text);
      break;
  }
}