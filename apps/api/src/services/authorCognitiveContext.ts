import type { AuthorBrainTruth, CognitiveAuthorContext, IdentityState, ExperiencePresenceContext } from "@qre/contracts";

export function buildCognitiveAuthorContext(input: {
  identityState?: IdentityState | null;
  geo?: CognitiveAuthorContext["geo"];
  presence?: ExperiencePresenceContext | null;
  analytics?: CognitiveAuthorContext["analytics"];
  domain?: CognitiveAuthorContext["domain"];
  creativeLearning?: CognitiveAuthorContext["creativeLearning"];
  creativeSafety?: CognitiveAuthorContext["creativeSafety"];
  provenanceFacts?: CognitiveAuthorContext["provenanceFacts"];
  media?: CognitiveAuthorContext["media"];
  authorizedCreativeInstructions?: string[];
  textBeatTarget?: number;
}): CognitiveAuthorContext {
  return {
    identityState: input.identityState ?? null,
    geo: input.geo ?? null,
    presence: input.presence ?? null,
    analytics: input.analytics ?? null,
    domain: input.domain ?? null,
    creativeLearning: input.creativeLearning ?? input.identityState?.creativeLearning ?? null,
    creativeSafety: input.creativeSafety ?? null,
    provenanceFacts: input.provenanceFacts ?? [],
    media: input.media ?? [],
    authorizedCreativeInstructions: input.authorizedCreativeInstructions ?? [],
    textBeatTarget: input.textBeatTarget ?? 5,
    photoBeatsAreSilent: true,
  };
}

export function augmentAuthorTruth(
  truth: AuthorBrainTruth,
  context: CognitiveAuthorContext,
): AuthorBrainTruth {
  return {
    ...truth,
    cognitiveContext: context,
    facts: truth.facts,
    sourceMoments: truth.sourceMoments,
  };
}