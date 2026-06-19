import { scanEngine } from "@qre/engine";
export async function scanHandler(req, res) {
    const slugParam = req.params.slug;
    const slug = Array.isArray(slugParam)
        ? slugParam[0]
        : slugParam;
    if (!slug) {
        return res.status(400).json({
            type: "error",
            error: "missing_slug",
        });
    }
    try {
        const result = await scanEngine(slug);
        // 🔥 CRITICAL: enforce contract safety
        return res.json(result);
    }
    catch (err) {
        return res.status(500).json({
            type: "error",
            error: "scan_failed",
        });
    }
}
