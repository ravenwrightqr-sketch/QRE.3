import type { AdaptiveExperienceBrief, AdaptiveIntakeState } from "@qre/contracts";
import { compileCognitiveExperience } from "@qre/engine";
import { buildAuthorIdentityState } from "./authorIdentityState.js";
import { getAdaptiveState } from "./adaptiveIntakeEngine.js";

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const unique = (values: string[]): string[] => [...new Set(values.map(clean).filter(Boolean))];

function domainFromIdentity(kind: string | undefined): string | undefined {
  switch (kind) {
    case "pet": return "pet";
    case "property": return "property";
    case "business": return "business";
    case "event": return "event";
    case "memory": return "memory";
    case "person": return "identity";
    default: return undefined;
  }
}

function identityFacts(identity: Awaited<ReturnType<typeof buildAuthorIdentityState>>): string[] {
  return unique([
    ...identity.canonicalFacts.map((fact) => fact.text),
    ...identity.traits.map((fact) => fact.text),
    ...identity.preferences.map((fact) => fact.text),
    ...identity.activities.map((fact) => fact.text),
    ...identity.recentEvents,
    ...identity.recurringPatterns,
  ]).slice(0, 120);
}

function cognitivePrompt(brief: AdaptiveExperienceBrief, identityFactsList: string[]): string {
  return [
    `INTENT: ${brief.originalIntent}`,
    `DOMAIN: ${brief.domain ?? "unknown"}`,
    `SUBJECT: ${brief.subject ?? brief.fields.name ?? "unknown"}`,
    `TYPE: ${brief.subjectType ?? "unknown"}`,
    `GOAL: ${brief.goal ?? "unknown"}`,
    `OUTPUT: ${brief.output ?? "unknown"}`,
    `TONE: ${brief.tone.join(", ") || "neutral"}`,
    `CURRENT FACTS: ${brief.facts.join(" | ") || "none"}`,
    `KNOWN ASSET FACTS: ${identityFactsList.join(" | ") || "none"}`,
    `FIELDS: ${JSON.stringify(brief.fields)}`,
  ].join("\n");
}

export async function getAdaptiveCognitiveState(
  briefInput: AdaptiveExperienceBrief,
  userId?: string,
): Promise<AdaptiveIntakeState & {
  cognitiveQuestions: string[];
  discoveries: string[];
  learningSignals: string[];
  identityConfidence: number;
}> {
  let brief = briefInput;
  let identity: Awaited<ReturnType<typeof buildAuthorIdentityState>> | null = null;

  if (brief.assetId) {
    try {
      identity = await buildAuthorIdentityState({
        assetId: brief.assetId,
        userId,
        subject: brief.subject,
        kind: brief.domain,
      });

      const persistedFacts = identityFacts(identity);
      const inferredDomain = domainFromIdentity(identity.kind);
      const inferredSubject = clean(identity.subject?.value);
      const enrichedFacts = unique([...persistedFacts, ...brief.facts]);

      brief = {
        ...brief,
        domain: brief.domain ?? inferredDomain,
        subject: brief.subject || inferredSubject || undefined,
        subjectType: brief.subjectType || (identity.kind === "pet" ? "animal" : undefined),
        facts: enrichedFacts,
        preferences: unique([
          ...brief.preferences,
          ...identity.creativeLearning.preferences,
        ]),
      };
    } catch {
      // Adaptive intake remains functional from the current session/intent.
    }
  }

  let cognitiveQuestions: string[] = [];
  let discoveries: string[] = [];
  let learningSignals: string[] = [];

  try {
    const persistedFacts = identity ? identityFacts(identity) : [];
    const cognitive = compileCognitiveExperience(cognitivePrompt(brief, persistedFacts), {
      memorySummary: persistedFacts,
      analytics: identity?.behavioralLearning,
      creativePreferences: identity?.creativeLearning.preferences ?? brief.preferences,
      feedback: {
        accepted: identity?.creativeLearning.accepted ?? [],
        rejected: identity?.creativeLearning.rejected ?? [],
      },
      location: identity?.locations?.[0]?.label
        ? { label: identity.locations[0].label, source: "identity-state" }
        : undefined,
    });

    const worldFacts = unique([
      ...(cognitive.world?.evidence ?? [])
        .filter((item) => String(item.source) !== "creative_realization")
        .map((item) => item.detail),
      ...(cognitive.world?.events ?? []).map((event) => event.raw),
    ]).slice(0, 80);

    brief = {
      ...brief,
      facts: unique([...brief.facts, ...worldFacts]),
    };

    cognitiveQuestions = cognitive.adaptiveQuestions.slice(0, 8);
    discoveries = cognitive.discoveries.slice(0, 12);
    learningSignals = cognitive.learningSignals.slice(0, 20);
  } catch {
    // The deterministic adaptive engine remains the safe fallback.
  }

  let state = await getAdaptiveState(brief);

  if (cognitiveQuestions.length > 0 && state.step.field === "facts" && !state.brief.facts.length) {
    state = {
      ...state,
      step: {
        ...state.step,
        title: cognitiveQuestions[0] ?? state.step.title,
        explanation: "QRE is asking for the next real detail that will make the experience more meaningful.",
      },
    };
  }

  if (identity && state.brief.domain === undefined) {
    state = {
      ...state,
      brief: {
        ...state.brief,
        domain: domainFromIdentity(identity.kind),
      },
    };
  }

  return {
    ...state,
    cognitiveQuestions,
    discoveries,
    learningSignals,
    identityConfidence: identity?.confidence ?? 0,
  };
}
