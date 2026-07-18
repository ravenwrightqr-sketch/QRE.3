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

      return db.analyticsEvent.findMany({

        where: {

          assetId:
            input.assetId,

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