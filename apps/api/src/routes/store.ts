import { Router, Request, Response } from "express";
import { db } from "@qre/db";

const router = Router();

/**
 * GET /store
 * returns all assets available for purchase
 */
router.get("/", async (_req: Request, res: Response) => {
  const assets = await db.asset.findMany({
    orderBy: { createdAt: "desc" },
  });

  res.json({ assets });
});

export default router;