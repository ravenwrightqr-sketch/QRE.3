import type { ExperienceMoment } from "@qre/contracts";

export function executeAction(moment: ExperienceMoment) {
  if (moment.type !== "action") return;
  const url = moment.url ?? (typeof moment.meta?.url === "string" ? moment.meta.url : undefined);
  const text = moment.text ?? moment.title ?? (typeof moment.meta?.text === "string" ? moment.meta.text : "");

  switch (moment.action) {
    case "redirect":
    case "payment":
      if (url) window.location.href = url;
      break;
    case "unlock":
      console.log("UNLOCK:", text);
      break;
    case "flow":
    case "cta":
      if (url) window.location.href = url;
      break;
    default:
      break;
  }
}
