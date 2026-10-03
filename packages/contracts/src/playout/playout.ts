export type PlayoutTextItem = {
  kind: "TEXT";
  text: string;
  sourceSceneIndex: number;
  sourceEventIds: string[];
};

export type PlayoutItem = PlayoutTextItem;

export type ExperiencePlayout = {
  items: PlayoutItem[];
};
