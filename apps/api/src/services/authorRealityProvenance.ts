import { typeRealityFact, type RealityFactType } from "./authorRealityTyping.js";
import type { RealityFactType as ContractFactType, RealityProvenance } from "@qre/contracts";

type Source = RealityProvenance["source"];

const UNIQUE = <T>(values: T[]): T[] => [...new Set(values)];

function mapFactType(type: RealityFactType): ContractFactType {
  switch (type) {
    case "identity": return "identity";
    case "event": return "event";
    case "state": return "state";
    case "trait": return "trait";
    case "preference": return "preference";
    case "relationship": return "relationship";
    case "place": return "place";
    case "object": return "object";
    case "outcome": return "outcome";
    case "recurrence": return "recurrence";
    default: return "unknown";
  }
}

function permissionsFor(type: ContractFactType): RealityProvenance["permissions"] {
  const base: RealityProvenance["permissions"] = ["compress", "reframe"];
  switch (type) {
    case "event": return [...base, "reorder", "derive_state", "derive_significance"];
    case "state": return [...base, "derive_state", "derive_significance"];
    case "trait": return [...base, "derive_significance"];
    case "preference": return [...base, "callback", "derive_significance"];
    case "activity": return [...base, "callback", "derive_recurrence", "derive_significance"];
    case "social_preference": return [...base, "callback", "derive_relationship", "derive_significance"];
    case "relationship": return [...base, "callback", "derive_relationship", "derive_significance"];
    case "place": return [...base, "callback", "derive_recurrence", "derive_significance"];
    case "recurrence": return [...base, "callback", "derive_recurrence", "derive_significance"];
    case "outcome": return [...base, "derive_state", "derive_significance"];
    case "goal":
    case "intention": return [...base, "derive_significance"];
    default: return base;
  }
}

const forbidden: RealityProvenance["forbiddenExpansions"] = [
  "invent_person",
  "invent_relationship",
  "invent_place",
  "invent_object",
  "invent_body_detail",
  "invent_dialogue",
  "invent_literal_event",
  "invent_chronology",
  "invent_business_fact",
  "invent_private_fact",
];

export function buildRealityProvenance(
  text: string,
  source: Source,
  options: { subject?: string; observedAt?: string; entity?: string; confidence?: number } = {},
): RealityProvenance {
  const typed = typeRealityFact(text, options.subject ?? "");
  const factType = mapFactType(typed.type);
  const adjustedType: ContractFactType =
    factType === "event" && /\b(?:walk|walking|played|plays|eats|eating|visits|visiting|works|working|travels|traveling|calls|calling)\b/i.test(text)
      ? "activity"
      : factType;

  return {
    factType: adjustedType,
    source,
    observedAt: options.observedAt,
    entity: options.entity,
    confidence: Math.max(0, Math.min(1, options.confidence ?? typed.confidence)),
    permissions: UNIQUE(permissionsFor(adjustedType)),
    forbiddenExpansions: forbidden,
  };
}

export function provenanceAllows(provenance: RealityProvenance, permission: RealityProvenance["permissions"][number]): boolean {
  return provenance.permissions.includes(permission);
}

export function provenanceForbids(provenance: RealityProvenance, expansion: RealityProvenance["forbiddenExpansions"][number]): boolean {
  return provenance.forbiddenExpansions.includes(expansion);
}
