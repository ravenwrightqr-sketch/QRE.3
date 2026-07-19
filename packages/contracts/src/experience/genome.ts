import type { ExperienceEntities } from "./entityExtractor.js";


export type ExperienceEnergy =
  | "calm"
  | "intense"
  | "playful"
  | "mysterious"
  | "emotional"
  | "premium";


export type ExperiencePacing =
  | "slow"
  | "medium"
  | "fast";


export type ExperienceSocial =
  | "solo"
  | "shared"
  | "community";


export type ExperienceJourney =
  | "arrival"
  | "discovery"
  | "reveal"
  | "transformation"
  | "peak"
  | "memory"
  | "share"
  | "return";


export interface ExperienceGenome {

  intent: string[];

  archetypes: string[];

  themes: string[];

  emotions: string[];

  energy: ExperienceEnergy;

  pacing: ExperiencePacing;

  social: ExperienceSocial;

  journey: ExperienceJourney[];

  discovery: number;

  memory: number;

  commerce: number;

  immersion: number;

  interaction: number;

  replay: number;

  entities: ExperienceEntities;

  environments: string[];

  audience: string[];

}