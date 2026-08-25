import type { AuthorExperienceState } from "@qre/contracts";
import type { AuthorBehaviorProfile } from "./authorBehaviorProfile.js";

const metric = (value: number): number =>
  Number(Math.max(0, Math.min(1, value)).toFixed(3));

export function adaptAuthorExperienceState(
  state: AuthorExperienceState,
  profile: AuthorBehaviorProfile,
): AuthorExperienceState {
  const preferenceConfidence = profile.confidence;
  if (preferenceConfidence <= 0) return state;

  const revisitBias = profile.revisitAffinity * preferenceConfidence;
  const accelerationBias = profile.accelerationPreference * preferenceConfidence;
  const callbackBias = profile.callbackAffinity * preferenceConfidence;
  const compressionBias = profile.compressionPreference * preferenceConfidence;
  const surpriseBias = profile.surprisePreference * preferenceConfidence;

  let mode = state.tempo.mode;
  let reason = state.tempo.reason;
  let arc = [...state.tempo.arc];

  if (
    state.tempo.mode !== "release" &&
    accelerationBias >= 0.48 &&
    state.lookaheadValue >= 0.2
  ) {
    mode = "accelerate";
    reason = "Learned preference favors earlier movement and the current world has a viable next thread.";
    arc = ["hook", "accelerate", "reveal", "open"];
  } else if (
    state.tempo.mode !== "release" &&
    revisitBias >= 0.48 &&
    state.revisitedEventIds.length > 0
  ) {
    mode = "revisit";
    reason = "Learned preference favors meaningful callbacks to established material.";
    arc = ["revisit", "reframe", state.lookaheadValue > 0.45 ? "tighten" : "hold"];
  }

  const urgency = metric(
    state.tempo.urgency * 0.62 +
      accelerationBias * 0.18 +
      callbackBias * 0.1 +
      state.lookaheadValue * 0.1,
  );

  const compression = metric(
    state.tempo.compression * 0.58 +
      compressionBias * 0.24 +
      surpriseBias * 0.08 +
      accelerationBias * 0.1,
  );

  const revealSpacing = metric(
    Math.max(
      0.18,
      state.tempo.revealSpacing * 0.72 -
        accelerationBias * 0.2 -
        surpriseBias * 0.08,
    ),
  );

  const holdPressure = metric(
    Math.max(
      0.08,
      state.tempo.holdPressure * 0.72 +
        revisitBias * 0.08 -
        accelerationBias * 0.16,
    ),
  );

  const nextBeatPull = metric(
    state.tempo.nextBeatPull * 0.58 +
      state.lookaheadValue * 0.12 +
      callbackBias * 0.12 +
      accelerationBias * 0.1 +
      revisitBias * 0.08,
  );

  return {
    ...state,
    tempo: {
      ...state.tempo,
      mode,
      urgency,
      compression,
      revealSpacing,
      holdPressure,
      nextBeatPull,
      reason,
      arc,
    },
    memoryHooks: Array.from(
      new Set([
        ...state.memoryHooks,
        `learned:confidence:${preferenceConfidence}`,
        `learned:compression:${profile.compressionPreference}`,
        `learned:callback:${profile.callbackAffinity}`,
        `learned:surprise:${profile.surprisePreference}`,
        `learned:acceleration:${profile.accelerationPreference}`,
        `learned:revisit:${profile.revisitAffinity}`,
        `adapted-tempo:${mode}`,
      ]),
    ).slice(-48),
  };
}
