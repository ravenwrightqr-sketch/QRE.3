import { Request, Response } from "express";

export function adminToggle(req: Request, res: Response) {
  const { enabled } = req.body;

  process.env.QRE_ADMIN = enabled ? "true" : "false";

  return res.json({
    ok: true,
    admin: process.env.QRE_ADMIN === "true",
  });
}