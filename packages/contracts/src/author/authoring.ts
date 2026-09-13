import type { ExperienceBlueprint } from "../experience/blueprint.js";
import type { FlowStep } from "../runtime/flow.js";
import type { ExperienceBeat } from "../story/beat.js";
import type { SequencePlay } from "../sequence/sequencePlay.js";

export type ExperienceStatus = "draft" | "published" | "archived";

export type ExperienceAuthoring = {
  id: string;
  accountId: string;
  name: string;
  category: string;
  status: ExperienceStatus;
  activeVersion: number;
  createdAt: string;
  updatedAt: string;
};

export type ExperienceVersion = {
  id: string;
  experienceId: string;
  version: number;
  blueprint: ExperienceBlueprint;
  beats: ExperienceBeat[];
  moments: any[];
  sequence: SequencePlay | null;
  flowSteps: FlowStep[];
  createdAt: string;
};
