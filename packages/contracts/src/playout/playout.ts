export type PlayoutTextItem = {
  kind: "TEXT";
  text: string;
  sourceSceneIndex: number;
  revealIndex: number;
  sourceEventIds: string[];
  durationMs: number;
};

export type PlayoutImageItem = {
  kind: "IMAGE";
  mediaId: string;
  url: string;
  sourceEventIds: string[];
};

export type PlayoutItem =
  | PlayoutTextItem
  | PlayoutImageItem;

export type ExperiencePlayout = {
  items: PlayoutItem[];
};
