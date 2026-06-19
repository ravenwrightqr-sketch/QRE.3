export function adminToggle(req, res) {
    const { enabled } = req.body;
    process.env.QRE_ADMIN = enabled ? "true" : "false";
    return res.json({
        ok: true,
        admin: process.env.QRE_ADMIN === "true",
    });
}
