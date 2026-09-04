/**
 * Canonical realization obligations carried into ONE MOUTH.
 *
 * This contract describes what the final language realization MUST preserve
 * without granting the realization layer permission to invent concrete reality.
 *
 * Authority:
 *   RealityGraph / Cognition / Movie
 *        ↓
 *   RealizationObligations
 *        ↓
 *   ONE MOUTH
 */
export type RealizationObligations = {
  openingIdentity: {
    required: boolean;
    subject: string;
  };

  requiredAnchors: string[];

  explanationPolicy: {
    forbidden: boolean;
  };

  endpointPolicy: {
    mode: "preserve" | "none";
  };
};