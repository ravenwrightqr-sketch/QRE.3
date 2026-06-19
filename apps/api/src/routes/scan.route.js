import { Router } from "express";
import { scanEngine } from "@qre/engine";
const router = Router();
router.get("/scan/:slug", async (req, res) => {
    try {
        const result = await scanEngine(req.params.slug);
        res.json(result);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
export default router;
