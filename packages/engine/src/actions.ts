import type { ExperienceMoment, ActionContext } from "@qre/contracts";

export type Action = ExperienceMoment;

export async function runAction(action: Action, ctx: ActionContext) {
  switch (action.type) {
    case "message":
      return { event: "message", text: action.text ?? action.description ?? action.title };
    case "action":
      return {
        event: "action",
        text: action.text ?? action.description ?? action.title,
        url: action.url ?? action.meta?.url,
        label: action.label ?? action.meta?.label,
      };
    case "media":
      return {
        event: "media",
        url: action.url ?? action.meta?.url,
        media: action.media,
        meta: action.meta,
      };
    case "location":
      return {
        event: "location",
        text: action.text ?? action.description ?? action.title,
        location: action.location,
        meta: action.meta,
      };
    case "system":
      return { event: "system", text: action.text ?? action.description ?? action.title };
    default:
      return {
        event: "experience",
        type: action.type,
        text: action.text ?? action.description ?? action.title,
        payload: action.payload,
      };
  }
}
