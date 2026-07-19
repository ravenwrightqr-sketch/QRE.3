/**
 * =====================================================
 * QRE BEAST
 * =====================================================
 *
 * Central Cognitive Engine
 *
 * Observe
 * Understand
 * Reason
 * Plan
 * Learn
 * Evolve
 *
 * =====================================================
 */

export type BeastObservation = {

  prompt: string;

  industry?: string;

  goal?: string;

  userId?: string;

  assetId?: string;

  location?: {

    lat: number;

    lng: number;

  };

  timestamp: Date;

};

export class Beast {

  public readonly version = "0.2";

  observe(
    observation: BeastObservation
  ) {

    return {

      observation,

      awareness: {

        hasPrompt:
          observation.prompt.length > 0,

        hasLocation:
          !!observation.location,

        hasUser:
          !!observation.userId,

        hasAsset:
          !!observation.assetId,

        hasIndustry:
          !!observation.industry,

        hasGoal:
          !!observation.goal,

      },

    };

  }

}