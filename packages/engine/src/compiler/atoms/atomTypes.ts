export type ExperienceAtomType =

  | "arrival"
  | "identity"
  | "location"
  | "story"
  | "media"
  | "activity"
  | "proof"
  | "completion"
  | "reward"
  | "review"
  | "share"
  | "replay"
  | "followup"
  | "product"
  | "education"
  | "terpene";

export type ExperienceAtom = {

  type:
    ExperienceAtomType;

  component:
    string;

  title:
    string;

  description?:
    string;

  required:
    boolean;

  payload:
    Record<string, unknown>;

};