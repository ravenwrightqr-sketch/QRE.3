import type { FlowStep } from "@qre/contracts";

/**
 * DB → Engine safe conversion
 * Removes DB-specific fields
 */
export function normalizeFlowSteps(
  steps: unknown
): FlowStep[] {

  if (!Array.isArray(steps)) return [];

  return steps
    .filter(
      (s): s is Record<string, any> =>
        s !== null &&
        typeof s === "object"
    )
    .map((s) => {

      return {
        id: String(
          s.id ?? crypto.randomUUID()
        ),

        type: String(
          s.type ?? ""
        ) as FlowStep["type"],

        order: Number(
          s.order ?? 0
        ),

        payload:
          s.payload &&
          typeof s.payload === "object"

            ? s.payload

            : {},
      };

    })
    .filter(
      (s) =>
        s.id &&
        s.type
    );
}