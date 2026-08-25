import { db } from "@qre/db";

import type {
  AnalyticsRepository,
} from "@qre/engine";


export function createAnalyticsRepository(): AnalyticsRepository {

  return {

    async trackEvent(input) {

      await db.analyticsEvent.create({

        data: {

          assetId:
            input.assetId,

          sessionId:
            input.sessionId ?? null,

          flowId:
            input.flowId ?? null,

          stepIndex:
            input.stepIndex ?? null,

          type:
            input.type as any,

          meta:
            (input.meta ?? {}) as any,

        },

      });

    },



    async findEvents(input) {

      const asset =
        await db.asset.findUnique({

          where: {
            id: input.assetId,
          },

          select: {
            id: true,
            ownerId: true,
            accountId: true,
          },

        });

      let scopeAssetIds = [
        input.assetId,
      ];

      if (asset) {
        const accountIds = asset.accountId
          ? [asset.accountId]
          : asset.ownerId
            ? (
                await db.accountUser.findMany({
                  where: {
                    userId: asset.ownerId,
                  },
                  select: {
                    accountId: true,
                  },
                })
              ).map(
                (row) => row.accountId,
              )
            : [];

        const relatedAssets =
          await db.asset.findMany({
            where: {
              OR: [
                ...(asset.ownerId
                  ? [
                      {
                        ownerId:
                          asset.ownerId,
                      },
                    ]
                  : []),
                ...(accountIds.length
                  ? [
                      {
                        accountId: {
                          in: accountIds,
                        },
                      },
                    ]
                  : []),
              ],
            },
            select: {
              id: true,
            },
          });

        if (relatedAssets.length) {
          scopeAssetIds = [
            ...new Set([
              ...scopeAssetIds,
              ...relatedAssets.map(
                (row) => row.id,
              ),
            ]),
          ];
        }
      }

      return db.analyticsEvent.findMany({

        where: {
          assetId: {
            in: scopeAssetIds,
          },
        },

        orderBy: {

          createdAt:
            "desc",

        },

        take:
          input.limit,

      });

    },



    async countByType(assetId) {

      const events =
        await db.analyticsEvent.groupBy({

          by: [
            "type",
          ],

          where: {

            assetId,

            type: {
              in: [
                "SCAN",
                "FLOW_COMPLETE",
                "ERROR",
              ],
            },

          },

          _count: true,

        });



      return Object.fromEntries(

        events.map((event) => [

          event.type,

          event._count,

        ])

      );

    },



    async getDashboardMetrics(assetId) {

      const [

        scans,

        completions,

        errors,

      ] =
        await Promise.all([

          db.analyticsEvent.count({

            where: {

              assetId,

              type: "SCAN",

            },

          }),


          db.analyticsEvent.count({

            where: {

              assetId,

              type: "FLOW_COMPLETE",

            },

          }),


          db.analyticsEvent.count({

            where: {

              assetId,

              type: "ERROR",

            },

          }),

        ]);



      return {

        scans,

        completions,

        errors,

        conversionRate:

          scans > 0

            ? completions / scans

            : 0,

      };

    },

  };

}