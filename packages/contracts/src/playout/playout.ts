export type PlayoutTextItem = {
  kind: "TEXT";
  text: string;
  sourceSceneIndex: number;
  revealIndex: number;
  sourceEventIds: string[];
  durationMs: number;
};

export type PlayoutItem = PlayoutTextItem;

export type ExperiencePlayout = {
  items: PlayoutItem[];
};
