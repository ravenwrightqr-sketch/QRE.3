export type RecognitionPurpose =
  | "catalog"
  | "inventory"
  | "receipt"
  | "reality"
  | "document"
  | "product_lookup"
  | "custom";

export type RecognitionEvidenceKind =
  | "printed_text"
  | "logo"
  | "shape"
  | "package"
  | "position"
  | "catalog_match"
  | "provided_context"
  | "unknown";

export type RecognitionCandidateState =
  | "matched"
  | "new"
  | "ambiguous"
  | "unreadable"
  | "rejected";

export type RecognitionEvidence = {
  kind: RecognitionEvidenceKind;
  value?: string;
  confidence: number;
  source?: string;
};

export type RecognitionVocabulary = {
  brands?: string[];
  products?: string[];
  variants?: string[];
  categories?: string[];
  attributes?: string[];
  aliases?: Record<string, string[]>;
};

export type RecognitionKnownEntity = {
  id: string;
  name: string;
  brand?: string;
  category?: string;
  attributes?: Record<string, string>;
};

export type RecognitionBrief = {
  purpose: RecognitionPurpose;
  task: string;
  businessName?: string;
  businessType?: string;
  knownVocabulary?: RecognitionVocabulary;
  knownEntities?: RecognitionKnownEntity[];
  allowNewEntities: boolean;
  allowOpenWorld: boolean;
};

export type RecognitionCandidate = {
  state: RecognitionCandidateState;
  name?: string;
  brand?: string;
  product?: string;
  variant?: string;
  category?: string;
  attributes?: Record<string, string>;
  evidence: RecognitionEvidence[];
  confidence: number;
};

export type RecognitionObservation = {
  observationId: string;
  candidate: RecognitionCandidate;
  location?: {
    section?: string;
    shelf?: string;
    row?: string;
    position?: string;
    bbox?: [number, number, number, number];
  };
  sourceId?: string;
};

export type RecognitionResult = {
  purpose: RecognitionPurpose;
  observations: RecognitionObservation[];
  warnings: string[];
  model?: {
    provider: string;
    model: string;
  };
};
