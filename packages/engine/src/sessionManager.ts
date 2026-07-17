import type {
  SessionRepository,
} from "./repositories/index.js";


export function createSessionManager(
  repo: SessionRepository
) {

  return {

    async createSession(
      assetId:string,
      flowId?:string|null
    ) {

      return repo.create({

        assetId,

        flowId:
          flowId ?? null,

      });

    },


    async updateSession(
      sessionId:string,
      data:Record<string,unknown>
    ) {

      return repo.update(
        sessionId,
        data
      );

    },

  };

}