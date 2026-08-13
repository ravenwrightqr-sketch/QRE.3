export type ExperienceCompilerContext = {
  businessName?: string;
  businessDomain?: string;
  ownerKey?: string;
  entityKey?: string;
  memorySummary?: string[];

  location?: {
    label?: string;
    city?: string;
  };

  event?: {
    venue?: string;
    participants?: string[];
  };

  memories?: unknown[];
};