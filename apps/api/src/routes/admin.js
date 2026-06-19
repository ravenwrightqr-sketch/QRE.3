import express from "express";
import { db } from "@qre/db";
const router = express.Router();
/**
 * =========================
 * ADMIN GUARD (DEV ONLY)
 * =========================
 */
function isAdmin(req) {
    return process.env.QRE_ADMIN === "true";
}
/**
 * =========================
 * NORMALIZE PARAM SAFETY
 * (fixes string | string[])
 * =========================
 */
function normalizeParam(param) {
    if (!param)
        return "";
    return Array.isArray(param) ? param[0] : param;
}
/**
 * =========================
 * GET ALL ASSETS
 * =========================
 */
router.get("/assets", async (req, res) => {
    if (!isAdmin(req)) {
        return res.status(403).json({ error: "Forbidden" });
    }
    const assets = await db.asset.findMany({
        orderBy: { createdAt: "desc" },
    });
    return res.json(assets);
});
/**
 * =========================
 * CREATE ASSET (QR PRODUCT)
 * =========================
 */
router.post("/assets", async (req, res) => {
    if (!isAdmin(req)) {
        return res.status(403).json({ error: "Forbidden" });
    }
    const { slug, flowId } = req.body;
    if (!slug) {
        return res.status(400).json({ error: "Missing slug" });
    }
    const asset = await db.asset.create({
        data: {
            slug,
            flowId: flowId ?? null,
            // 🔥 NEW SYSTEM DEFAULT
            paid: false,
            status: "active",
        },
    });
    return res.json(asset);
});
/**
 * =========================
 * UPDATE ASSET
 * =========================
 */
router.put("/assets/:id", async (req, res) => {
    if (!isAdmin(req)) {
        return res.status(403).json({ error: "Forbidden" });
    }
    const id = normalizeParam(req.params.id);
    const { flowId, status, paid } = req.body;
    if (!id) {
        return res.status(400).json({ error: "Missing id" });
    }
    const updated = await db.asset.update({
        where: { id },
        data: {
            flowId,
            status,
            paid,
        },
    });
    return res.json(updated);
});
export default router;
