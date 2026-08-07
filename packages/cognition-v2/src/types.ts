export type CognitiveIntent =
  | "remember"
  | "celebrate"
  | "connect"
  | "discover"
  | "teach"
  | "sell"
  | "serve"
  | "reward"
  | "protect"
  | "create";

export interface CognitiveUnderstanding {
  prompt: string;

  intent: CognitiveIntent[];

  people: string[];
  places: string[];
  objects: string[];
  events: string[];
  dates: string[];
  times: string[];

  emotions: string[];

  memory: {
    past: boolean;
    present: boolean;
    future: boolean;
    legacy: boolean;
  };

  audience: {
    types: string[];
    social: "solo" | "shared" | "community";
  };

  world: {
    domains: string[];
    primary: string;
  };
}
