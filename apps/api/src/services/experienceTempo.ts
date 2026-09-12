import type { ExperienceState } from "@qre/contracts";
import type { ExperienceBehaviorProfile } from "./experienceBehavior.js";

const metric = (value: number): number =>
  Number(Math.max(0, Math.min(1, value)).toFixed(3));

/**
 * Applies learned viewer behavior to the current Author state.
 * Learning changes tempo and re-entry behavior; it never changes factual reality.
 */
export function adaptExperienceTempo(
  state: ExperienceState,
  profile: ExperienceBehaviorProfile,
): ExperienceState {
  const confidence = Math.max(0, Math.min(1, profile.confidence));
  if (confidence <= 0) return state;

  const revisit = profile.revisitAffinity * confidence;
  const acceleration = profile.accelerationPreference * confidence;
  const callback = profile.callbackAffinity * confidence;
  const compression = profile.compressionPreference * confidence;
  const surprise = profile.surprisePreference * confidence;

  let mode = state.tempo.mode;
  let reason = state.tempo.reason;
  let arc = [...state.tempo.arc];

  if (mode !== "release" && acceleration >= 0.48 && state.lookaheadValue >= 0.2) {
    mode = "accelerate";
    reason = "Learned behavior favors earlier movement and the current reality has a viable next thread.";
    arc = ["hook", "accelerate", "reveal", "open"];
  } else if (mode !== "release" && revisit >= 0.48 && state.revisitedEventIds.length > 0) {
    mode = "revisit";
    reason = "Learned behavior favors meaningful callbacks to established reality.";
    arc = ["revisit", "reframe", state.lookaheadValue > 0.45 ? "tighten" : "hold"];
  } else if (mode === "hold" && surprise >= 0.55 && state.attentionPotential >= 0.55) {
    mode = "accelerate";
    reason = "Learned behavior supports stronger early surprise when the current reality can sustain it.";
    arc = ["hook", "surprise", "reframe", "payoff"];
  }

  return {
    ...state,
    tempo: {
      ...state.tempo,
      mode,
      urgency: metric(
        state.tempo.urgency * 0.58 +
          acceleration * 0.18 +
          callback * 0.1 +
          state.lookaheadValue * 0.14,
      ),
      compression: metric(
        state.tempo.compression * 0.52 +
          compression * 0.25 +
          surprise * 0.1 +
          acceleration * 0.13,
      ),
      revealSpacing: metric(
        Math.max(0.18, state.tempo.revealSpacing * 0.7 - acceleration * 0.18 - surprise * 0.1),
      ),
      holdPressure: metric(
        Math.max(0.08, state.tempo.holdPressure * 0.72 + revisit * 0.1 - acceleration * 0.18),
      ),
      nextBeatPull: metric(
        state.tempo.nextBeatPull * 0.54 +
          state.lookaheadValue * 0.15 +
          callback * 0.12 +
          acceleration * 0.1 +
          revisit * 0.09,
      ),
      reason,
      arc,
    },
    memoryHooks: [
      ...new Set([
        ...state.memoryHooks,
        `learned:confidence:${confidence.toFixed(3)}`,
        `learned:compression:${profile.compressionPreference.toFixed(3)}`,
        `learned:callback:${profile.callbackAffinity.toFixed(3)}`,
        `learned:surprise:${profile.surprisePreference.toFixed(3)}`,
        `learned:acceleration:${profile.accelerationPreference.toFixed(3)}`,
        `learned:revisit:${profile.revisitAffinity.toFixed(3)}`,
        `adapted-tempo:${mode}`,
      ]),
    ].slice(-48),
  };
}
