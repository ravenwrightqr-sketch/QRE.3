import type { CognitiveAuthorContext, IdentityState } from "@qre/contracts";
import { buildRealityProvenance } from "./authorRealityProvenance.js";

export function buildAuthorProvenanceFacts(
  identityState: IdentityState | null,
  subject: string,
): NonNullable<CognitiveAuthorContext["provenanceFacts"]> {
  return (identityState?.canonicalFacts ?? []).map((fact) => ({
    text: fact.text,
    provenance: fact.provenance ?? buildRealityProvenance(fact.text, fact.source === "prompt" ? "prompt" : "memory", {
      subject,
      observedAt: fact.observedAt,
      entity: fact.entity,
      confidence: fact.confidence,
    }),
  }));
}
