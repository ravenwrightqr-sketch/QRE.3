import { Router } from "express";
import { db } from "@qre/db";
const router = Router();
/**
 * GET /store
 * returns all assets available for purchase
 */
router.get("/", async (_req, res) => {
    const assets = await db.asset.findMany({
        orderBy: { createdAt: "desc" },
    });
    res.json({ assets });
});
export default router;
