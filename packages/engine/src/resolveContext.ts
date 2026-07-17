import type {
  ExperienceTier,
} from "@qre/contracts";

import type {
  UserRepository,
} from "./repositories/index.js";


export type UserContext = {

  userId: string | null;

  tier: ExperienceTier;

  isGuest: boolean;

};



function normalizeTier(
  tier: unknown
): ExperienceTier {

  switch (tier) {

    case "PRO":
      return "PRO";

    case "BUSINESS":
      return "BUSINESS";

    case "BASIC":
      return "BASIC";

    default:
      return "BASIC";

  }

}



export async function resolveContext(
  input: {
    userId?: string;
  },
  repo: UserRepository
): Promise<UserContext> {


  /**
   * No authenticated user.
   *
   * This is a store/demo visitor.
   *
   * Allowed:
   * - play demo experiences
   *
   * Not allowed:
   * - save flows
   * - own assets
   * - dashboard access
   */
  if (!input.userId) {

    return {

      userId: null,

      tier: "BASIC",

      isGuest: true,

    };

  }



  const user =
    await repo.findUserContext(
      input.userId
    );



  /**
   * Invalid session/user.
   *
   * Treat as guest.
   */
  if (!user) {

    return {

      userId: null,

      tier: "BASIC",

      isGuest: true,

    };

  }



  return {

    userId: user.id,

    tier:
      normalizeTier(
        user.tier
      ),

    isGuest: false,

  };

}