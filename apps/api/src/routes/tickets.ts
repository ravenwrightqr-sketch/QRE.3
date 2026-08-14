import express from "express";
import { db } from "@qre/db";
import QRCode from "qrcode";
import { nanoid } from "nanoid";
import { requireAuth, type AuthRequest } from "../middleware/requireAuth.js";

const router = express.Router();
const publicUrl = () => process.env.PUBLIC_URL ?? "http://localhost:3000";

router.post("/create", requireAuth, async (req: AuthRequest, res) => {
  try {
    const assetId = typeof req.body?.assetId === "string" ? req.body.assetId.trim() : "";
    const eventId = typeof req.body?.eventId === "string" ? req.body.eventId.trim() : null;
    const attendeeName = typeof req.body?.attendeeName === "string" ? req.body.attendeeName.trim() : null;
    const count = Math.max(1, Math.min(500, Number(req.body?.count ?? 1)));
    if (!assetId) return res.status(400).json({ success: false, error: "Asset id required." });

    const asset = await db.asset.findUnique({ where: { id: assetId }, select: { id: true, accountId: true, slug: true } });
    if (!asset) return res.status(404).json({ success: false, error: "Asset not found." });

    const rows = [];
    for (let i = 0; i < count; i += 1) {
      const ticketCode = nanoid(18);
      const url = `${publicUrl()}/ticket/${ticketCode}`;
      const qrSvg = await QRCode.toString(url, { type: "svg", errorCorrectionLevel: "H", margin: 1, scale: 6 });
      rows.push({ assetId, eventId, attendeeName: count === 1 ? attendeeName : null, ticketCode, qrUrl: url, qrSvg, status: "ACTIVE" as const, metadata: { createdBy: req.user?.userId ?? null } });
    }

    const tickets = await db.eventTicket.createManyAndReturn({ data: rows, select: { id: true, assetId: true, eventId: true, attendeeName: true, ticketCode: true, qrUrl: true, qrSvg: true, status: true } });
    await db.analyticsEvent.createMany({ data: tickets.map((ticket) => ({ assetId, type: "TICKET_CREATED", meta: { ticketId: ticket.id, eventId, attendeeName: ticket.attendeeName } })) });

    return res.status(201).json({ success: true, tickets });
  } catch (error) {
    console.error("Ticket creation failed:", error);
    return res.status(500).json({ success: false, error: "Failed to create ticket." });
  }
});

router.get("/:ticketCode", async (req, res) => {
  try {
    const ticketCode = String(req.params.ticketCode ?? "").trim();
    const ticket = await db.eventTicket.findUnique({ where: { ticketCode }, select: { id: true, assetId: true, eventId: true, attendeeName: true, status: true, createdAt: true } });
    if (!ticket) return res.status(404).json({ success: false, error: "Ticket not found." });
    await db.analyticsEvent.create({ data: { assetId: ticket.assetId, type: "TICKET_VIEWED", meta: { ticketId: ticket.id, eventId: ticket.eventId } } });
    return res.json({ success: true, ticket });
  } catch (error) {
    console.error("Ticket lookup failed:", error);
    return res.status(500).json({ success: false, error: "Failed to load ticket." });
  }
});

router.post("/:ticketCode/redeem", requireAuth, async (req: AuthRequest, res) => {
  try {
    const ticketCode = String(req.params.ticketCode ?? "").trim();
    const ticket = await db.eventTicket.findUnique({ where: { ticketCode } });
    if (!ticket) return res.status(404).json({ success: false, error: "Ticket not found." });
    if (ticket.status !== "ACTIVE") {
      await db.analyticsEvent.create({ data: { assetId: ticket.assetId, type: "TICKET_REJECTED", meta: { ticketId: ticket.id, eventId: ticket.eventId, reason: "not-active" } } });
      return res.status(409).json({ success: false, error: "Ticket is no longer active.", status: ticket.status });
    }

    const now = new Date();
    const updated = await db.$transaction(async (tx) => {
      const redeemed = await tx.eventTicket.updateMany({ where: { id: ticket.id, status: "ACTIVE" }, data: { status: "REDEEMED", redeemedAt: now, checkedInAt: now, userId: req.user?.userId ?? null } });
      if (redeemed.count !== 1) throw new Error("Ticket was already redeemed");
      await tx.eventAttendance.create({ data: { assetId: ticket.assetId, userId: req.user?.userId ?? null, eventId: ticket.eventId, ticketId: ticket.id, status: "CHECKED_IN", meta: { source: "qr-ticket" } } });
      await tx.analyticsEvent.create({ data: { assetId: ticket.assetId, type: "TICKET_REDEEMED", meta: { ticketId: ticket.id, eventId: ticket.eventId } } });
      return true;
    });

    return res.json({ success: updated, ticketId: ticket.id, status: "REDEEMED", checkedInAt: now.toISOString() });
  } catch (error) {
    console.error("Ticket redemption failed:", error);
    return res.status(409).json({ success: false, error: "Ticket could not be redeemed." });
  }
});

export default router;
