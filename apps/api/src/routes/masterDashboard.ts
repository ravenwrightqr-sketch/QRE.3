import express, { Response } from "express";
import { db } from "@qre/db";

const router = express.Router();

/**
 * =====================================================
 * MASTER DASHBOARD
 * =====================================================
 *
 * Global operational dashboard.
 *
 * This endpoint is the primary business snapshot for QRE.
 *
 * Sources of truth:
 *
 * AnalyticsEvent
 *      → scans
 *
 * ScanSession
 *      → active sessions
 *
 * Asset
 *      → revenue
 *      → unlocks
 *      → paid assets
 *
 * Flow
 *      → experiences
 *
 * =====================================================
 */
router.get(
  "/master",
  async (_req: any, res: Response) => {

    try {

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      /**
       * =====================================================
       * LIVE OPERATIONS
       * =====================================================
       */
      const [
        scansToday,
        activeSessions,
        totalAssets,
        paidAssets,
        totalFlows,
        totalEvents,
        revenueTotals,
      ] = await Promise.all([

        db.analyticsEvent.count({
          where: {
            type: "SCAN",
            createdAt: {
              gte: todayStart,
              lte: todayEnd,
            },
          },
        }),

        db.scanSession.count({
          where: {
            status: "active",
          },
        }),

        db.asset.count(),

        db.asset.count({
          where: {
            paid: true,
          },
        }),

        db.flow.count(),

        db.analyticsEvent.count(),

        db.asset.aggregate({

          _sum: {

            totalRevenueCents: true,

            totalUnlocks: true,

          },

        }),

      ]);

      /**
       * =====================================================
       * TOP ASSETS
       * =====================================================
       */
      const topAssetsRaw =
        await db.analyticsEvent.groupBy({

          by: ["assetId"],

          where: {
            type: "SCAN",
          },

          _count: {
            assetId: true,
          },

          orderBy: {
            _count: {
              assetId: "desc",
            },
          },

          take: 5,

        });

      const topAssets =
        topAssetsRaw.map((asset) => ({

          assetId: asset.assetId,

          scans: asset._count.assetId,

        }));

      /**
       * =====================================================
       * RECENT SCANS
       * =====================================================
       */
      const recentActivity =
        await db.analyticsEvent.findMany({

          where: {
            type: "SCAN",
          },

          orderBy: {
            createdAt: "desc",
          },

          take: 10,

        });

      /**
       * =====================================================
       * RESPONSE
       * =====================================================
       */
      return res.json({

        summary: {

          scansToday,

          activeSessions,

          totalAssets,

          paidAssets,

          totalFlows,

          totalEvents,

        },

        revenue: {

          totalRevenueCents:
            revenueTotals._sum.totalRevenueCents ?? 0,

          totalRevenueDollars:
            (revenueTotals._sum.totalRevenueCents ?? 0) / 100,

          totalUnlocks:
            revenueTotals._sum.totalUnlocks ?? 0,

        },

        topAssets,

        recentActivity,

        status: "LIVE",

        timestamp:
          new Date().toISOString(),

      });

    }
    catch (error: any) {

      console.error(
        "[MASTER DASHBOARD]",
        error
      );

      return res.status(500).json({

        error:
          error.message,

      });

    }

  }
);

export default router;