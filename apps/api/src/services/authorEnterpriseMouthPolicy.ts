/**
 * QRE ENTERPRISE MOUTH POLICY · EXECUTION BUDGET
 *
 * Centralizes development/production generation budgets so orchestration code
 * does not grow its own ad-hoc latency rules.
 *
 * Modes:
 *   dev-fast → one primary + one batched recovery, no revision
 *   model    → one real model pass, intended for model-quality probes
 *   full     → bounded primary/recovery/revision path
 *   no-model → deterministic harness mode; the orchestrator should bypass the
 *               transport entirely when a fixture provider is available
 */
export type EnterpriseMouthMode =
  | "dev-fast"
  | "model"
  | "full"
  | "no-model";

export type EnterpriseMouthExecutionPolicy = {
  mode: EnterpriseMouthMode;
  maxBeats: number;
  variantsPerBeat: number;
  numPredict: number;
  temperature: number;
  maxPrimaryCalls: number;
  maxRecoveryCalls: number;
  maxRevisionCalls: number;
  maxTotalModelCalls: number;
  beamWidth: number;
  beamCandidatesPerBeat: number;
  verbose: boolean;
};

function parseMode(): EnterpriseMouthMode {
  if (process.env.QRE_ENTERPRISE_MOUTH_NO_MODEL === "true") {
    return "no-model";
  }

  const raw = String(
    process.env.QRE_ENTERPRISE_MOUTH_MODE ?? "",
  )
    .trim()
    .toLowerCase();

  if (
    raw === "dev-fast" ||
    raw === "model" ||
    raw === "full" ||
    raw === "no-model"
  ) {
    return raw;
  }

  if (
    process.env.QRE_ENTERPRISE_MOUTH_DEV_FAST === "true"
  ) {
    return "dev-fast";
  }

  return "full";
}

export function getEnterpriseMouthPolicy(): EnterpriseMouthExecutionPolicy {
  const mode = parseMode();

  switch (mode) {
    case "no-model":
      return {
        mode,
        maxBeats: 6,
        variantsPerBeat: 8,
        numPredict: 0,
        temperature: 0,
        maxPrimaryCalls: 0,
        maxRecoveryCalls: 0,
        maxRevisionCalls: 0,
        maxTotalModelCalls: 0,
        beamWidth: 8,
        beamCandidatesPerBeat: 8,
        verbose:
          process.env.QRE_ENTERPRISE_MOUTH_VERBOSE !== "false",
      };

    case "dev-fast":
      return {
        mode,
        maxBeats: 6,
        variantsPerBeat: 3,
        numPredict: 384,
        temperature: 0.45,
        maxPrimaryCalls: 1,
        maxRecoveryCalls: 1,
        maxRevisionCalls: 0,
        maxTotalModelCalls: 2,
        beamWidth: 4,
        beamCandidatesPerBeat: 3,
        verbose:
          process.env.QRE_ENTERPRISE_MOUTH_VERBOSE !== "false",
      };

    case "model":
      return {
        mode,
        maxBeats: 6,
        variantsPerBeat: 5,
        numPredict: 512,
        temperature: 0.62,
        maxPrimaryCalls: 1,
        maxRecoveryCalls: 0,
        maxRevisionCalls: 0,
        maxTotalModelCalls: 1,
        beamWidth: 6,
        beamCandidatesPerBeat: 5,
        verbose:
          process.env.QRE_ENTERPRISE_MOUTH_VERBOSE !== "false",
      };

    default:
      return {
        mode: "full",
        maxBeats: 6,
        variantsPerBeat: 5,
        numPredict: 768,
        temperature: 0.68,
        maxPrimaryCalls: 1,
        maxRecoveryCalls: 1,
        maxRevisionCalls: 1,
        maxTotalModelCalls: 3,
        beamWidth: 8,
        beamCandidatesPerBeat: 8,
        verbose:
          process.env.QRE_ENTERPRISE_MOUTH_VERBOSE !== "false",
      };
  }
}

export function enterpriseMouthPolicySummary(
  policy: EnterpriseMouthExecutionPolicy =
    getEnterpriseMouthPolicy(),
): string {
  return [
    `mode=${policy.mode}`,
    `maxBeats=${policy.maxBeats}`,
    `variantsPerBeat=${policy.variantsPerBeat}`,
    `numPredict=${policy.numPredict}`,
    `temperature=${policy.temperature}`,
    `maxModelCalls=${policy.maxTotalModelCalls}`,
  ].join(" ");
}
