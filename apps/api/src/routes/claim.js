import express from "express";
import { db } from "@qre/db";
const router = express.Router();
/**
 * CLAIM ASSET (ONLY AFTER PAYMENT)
 */
router.post("/claim", async (req, res) => {
    const { slug, userId } = req.body;
    if (!slug || !userId) {
        return res.status(400).json({ error: "Missing slug or userId" });
    }
    const asset = await db.asset.findUnique({
        where: { slug },
    });
    if (!asset) {
        return res.status(404).json({ error: "Asset not found" });
    }
    /**
     * 🔥 RULE:
     * MUST be paid before claiming
     */
    if (!asset.paid) {
        return res.status(403).json({
            error: "Asset not paid / not unlocked",
        });
    }
    /**
     * LOCK OWNERSHIP
     */
    const ownership = await db.ownership.upsert({
        where: { assetId: asset.id },
        update: {
            userId,
            status: "claimed",
            claimedAt: new Date(),
        },
        create: {
            assetId: asset.id,
            userId,
            status: "claimed",
            claimedAt: new Date(),
        },
    });
    /**
     * UPDATE ASSET OWNER STATE
     */
    await db.asset.update({
        where: { id: asset.id },
        data: {
            ownerId: userId,
            claimedAt: new Date(),
        },
    });
    return res.json({
        success: true,
        ownership,
    });
});
export default router;
