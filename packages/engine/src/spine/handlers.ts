import type { EngineEventType } from "@qre/contracts";

export type SpineHandler = (event: any) => Promise<void> | void;

const handlers: Partial<Record<EngineEventType, SpineHandler[]>> = {};

export function registerHandler(
  type: EngineEventType,
  handler: SpineHandler
) {
  if (!handlers[type]) handlers[type] = [];
  handlers[type]!.push(handler);
}

export async function emitToHandlers(event: {
  type: EngineEventType;
  [key: string]: any;
}) {
  const list = handlers[event.type];
  if (!list) return;

  await Promise.all(list.map((h) => h(event)));
}