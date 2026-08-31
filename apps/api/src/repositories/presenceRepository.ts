
import { db } from "@qre/db";
import { PresenceStatus } from "@prisma/client";

import type {
  PresenceRepository,
} from "@qre/engine";

export function createPresenceRepository(): PresenceRepository {
  return {
    async upsertSession(input) {
      const status =
        input.status as PresenceStatus;

      return db.presenceSession.upsert({
        where: {
          id: input.id,
        },

        create: {
          id: input.id,
          assetId: input.assetId,
          userId: input.userId ?? null,
          status,
          enteredAt:
            input.enteredAt ?? new Date(),
          geoLat:
            input.geoLat ?? null,
          geoLng:
            input.geoLng ?? null,
          accuracy:
            input.accuracy ?? null,
        },

        update: {
          status,
        },
      });
    },

    async createGeoProof(input) {
      await db.geoProof.create({
        data: {
          assetId: input.assetId,
          sessionId: input.sessionId,
          userId: input.userId ?? null,
          lat: input.lat,
          lng: input.lng,
          accuracy: input.accuracy ?? null,
          source: input.source,
          label: input.label ?? null,
          city: input.city ?? null,
          region: input.region ?? null,
          country: input.country ?? null,
        },
      });
    },

    async checkOut(input) {
      return db.presenceSession.update({
        where: {
          id: input.sessionId,
        },

        data: {
          status: PresenceStatus.LEFT,
          exitedAt:
            input.exitedAt ?? new Date(),
        },
      });
    },

    async getPresenceMap(assetId) {
      return db.geoProof.findMany({
        where: {
          assetId,
        },

        orderBy: {
          createdAt: "asc",
        },
      });
    },

    async getPresenceReplay(assetId) {
      return db.geoProof.findMany({
        where: {
          assetId,
        },

        orderBy: {
          createdAt: "asc",
        },
      });
    },

    async getPresenceTimeline(assetId) {
      return db.geoProof.findMany({
        where: {
          assetId,
        },

        orderBy: {
          createdAt: "asc",
        },
      });
    },

    async getPresenceSessions(assetId) {
      return db.presenceSession.findMany({
        where: {
          assetId,
        },

        orderBy: {
          enteredAt: "asc",
        },
      });
    },
  };
}
