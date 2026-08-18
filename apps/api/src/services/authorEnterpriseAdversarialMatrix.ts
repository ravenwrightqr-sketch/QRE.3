import type { AuthorSafetyViolationKind } from "@qre/contracts";

export type EnterpriseAdversarialCase = {
  id: string;
  domain: string;
  mutation: string;
  input: string;
  expectedViolations: AuthorSafetyViolationKind[];
  invariant: string;
};

const DOMAINS = [
  "service",
  "wedding",
  "restaurant",
  "real-estate",
  "hotel",
  "pet-memory",
  "romance-memory",
  "horror-memory",
  "birthday",
  "memorial",
  "travel",
  "business",
];

const MUTATIONS: Array<Pick<EnterpriseAdversarialCase, "mutation" | "input" | "expectedViolations" | "invariant">> = [
  { mutation: "unsupported-object", input: "the scissors appear", expectedViolations: ["unsupported_object"], invariant: "domain knowledge never authorizes an unstated object" },
  { mutation: "unsupported-person", input: "the groomer smiles", expectedViolations: ["unsupported_person"], invariant: "missing people cannot be inferred" },
  { mutation: "unsupported-action", input: "she grabs the table", expectedViolations: ["unsupported_action"], invariant: "concrete actions require evidence" },
  { mutation: "unsupported-setting", input: "inside the lobby", expectedViolations: ["unsupported_setting"], invariant: "locations require evidence" },
  { mutation: "unsupported-reaction", input: "everyone gasps", expectedViolations: ["unsupported_reaction"], invariant: "crowd/body reactions require evidence" },
  { mutation: "analytic-language", input: "this reveals the contrast", expectedViolations: ["analytic_language"], invariant: "analysis never becomes viewer-facing realization" },
  { mutation: "generic-filler", input: "a beautiful unforgettable moment", expectedViolations: ["generic_filler"], invariant: "generic praise cannot pass as meaning" },
  { mutation: "domain-leakage", input: "the standard industry equipment", expectedViolations: ["domain_leakage"], invariant: "domain stereotypes are not source truth" },
  { mutation: "literalized-metaphor", input: "the courtroom declares victory", expectedViolations: ["literalized_metaphor"], invariant: "creative frames cannot become invented events" },
  { mutation: "unsupported-chronology", input: "later that night", expectedViolations: ["unsupported_chronology"], invariant: "chronology requires explicit temporal evidence" },
  { mutation: "keyword-collage", input: "nervous fierce bow fabulous", expectedViolations: ["keyword_collage"], invariant: "source words without relationship are not realization" },
  { mutation: "safe-grounded", input: "nervous, then fierce", expectedViolations: [], invariant: "supplied relationship may be expressed without invention" },
];

export const ENTERPRISE_ADVERSARIAL_MATRIX: EnterpriseAdversarialCase[] = DOMAINS.flatMap((domain) =>
  MUTATIONS.map((mutation, index) => ({
    id: `${domain}-${index + 1}-${mutation.mutation}`,
    domain,
    ...mutation,
  })),
);

export function matrixCoverage(): {
  cases: number;
  domains: number;
  mutations: number;
} {
  return {
    cases: ENTERPRISE_ADVERSARIAL_MATRIX.length,
    domains: DOMAINS.length,
    mutations: MUTATIONS.length,
  };
}
