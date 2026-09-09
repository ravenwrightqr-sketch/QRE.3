import express, { Response } from "express";

import { db } from "@qre/db";

import { requireAuth, type AuthRequest } from "../middleware/requireAuth.js";
import { createExperience } from "../services/experienceCreationServices.js";

const router = express.Router();

router.use(requireAuth);

/**
 * Create a QRE business/world and optionally compile its first experience.
 *
 * The business itself is valid without an experience. The first experience is
 * an optional creative seed while we refine that part of the operator UX.
 *
 * Idempotency rule:
 * - the business slug is the durable create key;
 * - retrying the same slug within the same account reuses the existing Asset;
 * - if that Asset already has an experience, return it rather than creating
 *   another one;
 * - if compilation fails, the Asset remains available for a later retry instead
 *   of creating a second Asset on the next attempt.
 */
router.post(
  "/assets/create-experience",
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const {
        displayName,
        businessName,
        businessType,
        businessDescription,
        services,
        capabilities,
        audience,
        objective,
        creativePreferences,
        slug,
        prompt,
        priceCents,
      } = req.body;

      const normalizedSlug = typeof slug === "string" ? slug.trim() : "";
      const normalizedPrompt = typeof prompt === "string" ? prompt.trim() : "";

      if (!normalizedSlug) {
        return res.status(400).json({ error: "slug required" });
      }

      const membership = await db.accountUser.findFirst({
        where: {
          userId,
          role: {
            in: ["OWNER", "ADMIN"],
          },
        },
        select: {
          accountId: true,
        },
      });

      if (!membership) {
        return res.status(403).json({ error: "No account available" });
      }

      const accountId = membership.accountId;

      let asset = await db.asset.findUnique({
        where: { slug: normalizedSlug },
        include: {
          experiences: {
            orderBy: { createdAt: "asc" },
            take: 1,
          },
          flows: {
            orderBy: { priority: "asc" },
            include: { flow: true },
            take: 1,
          },
        },
      });

      if (asset && asset.accountId !== accountId) {
        return res.status(409).json({
          error: "That business slug is already in use.",
        });
      }

      if (!asset) {
        try {
          asset = await db.asset.create({
            data: {
              accountId,
              displayName:
                typeof displayName === "string" && displayName.trim()
                  ? displayName.trim()
                  : typeof businessName === "string"
                    ? businessName.trim()
                    : normalizedSlug,
              slug: normalizedSlug,
              status: "active",
              paid: false,
              saleChannel: "ADMIN",
              priceCents:
                typeof priceCents === "number" && Number.isFinite(priceCents)
                  ? Math.max(0, Math.round(priceCents))
                  : 999,
              templateData: {
                businessName:
                  typeof businessName === "string" ? businessName.trim() : "",
                businessType:
                  typeof businessType === "string" ? businessType.trim() : "",
                businessDescription:
                  typeof businessDescription === "string"
                    ? businessDescription.trim()
                    : "",
                services: Array.isArray(services)
                  ? services.filter(
                      (value: unknown): value is string =>
                        typeof value === "string" && value.trim().length > 0,
                    )
                  : [],
                capabilities: Array.isArray(capabilities)
                  ? capabilities.filter(
                      (value: unknown): value is string =>
                        typeof value === "string" && value.trim().length > 0,
                    )
                  : [],
                audience: Array.isArray(audience)
                  ? audience.filter(
                      (value: unknown): value is string =>
                        typeof value === "string" && value.trim().length > 0,
                    )
                  : [],
                objective:
                  typeof objective === "string" ? objective.trim() : "",
                creativePreferences: Array.isArray(creativePreferences)
                  ? creativePreferences.filter(
                      (value: unknown): value is string =>
                        typeof value === "string" && value.trim().length > 0,
                    )
                  : [],
              },
            },
            include: {
              experiences: {
                orderBy: { createdAt: "asc" },
                take: 1,
              },
              flows: {
                orderBy: { priority: "asc" },
                include: { flow: true },
                take: 1,
              },
            },
          });
        } catch (error: any) {
          // The slug is the durable idempotency key. If another request won the
          // race, re-read and reuse that Asset rather than returning a generic
          // Prisma unique-constraint failure or creating another record.
          if (error?.code !== "P2002") {
            throw error;
          }

          asset = await db.asset.findUnique({
            where: { slug: normalizedSlug },
            include: {
              experiences: {
                orderBy: { createdAt: "asc" },
                take: 1,
              },
              flows: {
                orderBy: { priority: "asc" },
                include: { flow: true },
                take: 1,
              },
            },
          });

          if (!asset || asset.accountId !== accountId) {
            return res.status(409).json({
              error: "That business slug is already in use.",
            });
          }
        }
      }

      const existingExperience = asset.experiences[0];
      const existingFlow = asset.flows[0]?.flow;

      if (!normalizedPrompt) {
        return res.json({
          success: true,
          accountId,
          assetId: asset.id,
          experienceId: existingExperience?.id ?? null,
          flowId: existingFlow?.id ?? null,
          slug: asset.slug,
          scanUrl: `/api/scan/${asset.slug}`,
          createdExperience: false,
        });
      }

      if (existingExperience && existingFlow) {
        return res.json({
          success: true,
          accountId,
          assetId: asset.id,
          experienceId: existingExperience.id,
          flowId: existingFlow.id,
          slug: asset.slug,
          scanUrl: `/api/scan/${asset.slug}`,
          createdExperience: false,
        });
      }

      const result = await createExperience({
        assetId: asset.id,
        prompt: normalizedPrompt,
        userId,
      });

      return res.json({
        success: true,
        accountId,
        assetId: asset.id,
        experienceId: result.experience.id,
        flowId: result.flow.id,
        slug: asset.slug,
        scanUrl: `/api/scan/${asset.slug}`,
        createdExperience: true,
      });
    } catch (error: any) {
      console.error("CREATE EXPERIENCE ERROR", error);

      const message =
        error instanceof Error && error.message
          ? error.message
          : "QRE could not finish creating this business.";

      return res.status(500).json({ error: message });
    }
  },
);

export default router;
