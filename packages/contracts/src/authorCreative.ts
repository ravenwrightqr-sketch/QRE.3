export type CreativeFrameId =
  | "neutral"
  | "noir"
  | "heist"
  | "courtroom"
  | "spy"
  | "horror"
  | "deadpan"
  | "absurd"
  | "romance"
  | "military"
  | "mockumentary"
  | "game";

/**
 * Universal Author candidate: presentation freedom is open, source reality is not.
 * The candidate does not encode a domain; it encodes how supplied reality is framed.
 */
export type UniversalCreativeCandidate = {
  frame: CreativeFrameId | string;
  operation: string;
  lines: string[];
};

export type UniversalCreativeCandidateResult = UniversalCreativeCandidate & {
  validation: {
    ok: boolean;
    score: number;
    reasons: string[];
  };
};

export type UniversalCreativeMouthResult = {
  candidates: UniversalCreativeCandidateResult[];
  winner?: UniversalCreativeCandidateResult;
  model: string;
  modelCalls: number;
  recoveryRequired: boolean;
};

/**
 * Universal product invariant:
 * any entity + supplied reality + experience goal + presentation intent
 * enters the same Author/Mouth contract.
 */
export type UniversalExperienceInput = {
  subject: string;
  subjectKind?: string;
  facts: string[];
  events?: string[];
  experienceGoal?: string;
  presentation?: string;
};
