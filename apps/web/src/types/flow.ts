export type FlowAction =
  | { type: "message"; text: string }
  | { type: "delay"; ms: number }
  | { type: "redirect"; url: string }
  | { type: "unlock_preview" };

export type Flow = {
  actions: FlowAction[];
};