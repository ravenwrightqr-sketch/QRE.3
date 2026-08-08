export type Prompt = {
  text: string;
};

export type Person = {
  text: string;
  role?: string;
};

export type Place = {
  text: string;
  kind?: string;
};

export type Moment = {
  text: string;
  significance: string[];
};

export type Relationship = {
  subject: string;
  relation: string;
  object: string;
};

export type Understanding = {
  prompt: Prompt;

  people: Person[];
  places: Place[];
  moments: Moment[];
  relationships: Relationship[];

  emotions: string[];
  desires: string[];

  objects: string[];
  themes: string[];

  temporal: {
    past: boolean;
    present: boolean;
    future: boolean;
    markers: string[];
  };

  narrative: {
    hasBeginning: boolean;
    hasTransformation: boolean;
    hasRelationship: boolean;
    hasMemory: boolean;
    hasConflict: boolean;
    hasMilestone: boolean;
    hasDiscovery: boolean;
  };
};
