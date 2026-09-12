export type MemoryTimelineItem = {
  label: string;
  timestamp: string;
};


export type EmotionalTone =
  | "positive"
  | "neutral"
  | "mixed"
  | "intense"
  | "luxury"
  | "friendly"
  | "energetic"
  | "professional";


export type MemoryType =
  | "generic"
  | "service"
  | "event"
  | "memorial"
  | "business"
  | "personal"
  | "relationship"
  | "location"
  | "experience";


export type MemorySnapshot = {

  id:string;

  type:MemoryType;

  title:string;

  summary:string;

  emotionalTone:EmotionalTone;

  highlights:string[];

  locationTags:string[];

  timeline:MemoryTimelineItem[];

  confidence?:number;

  themes?:string[];

  entities?:string[];

  meta?:Record<string,unknown>;

};