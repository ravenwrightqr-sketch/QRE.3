import type { Request, Response } from "express";
import { db } from "@qre/db";

export async function createFlow(req: Request, res: Response) {
  try {
    const { name, actions } = req.body;

    console.log("FLOW INPUT:", { name, actions });

    const flow = await db.flow.create({
      data: {
        name,
        actions: actions ?? [],
      },
    });

    console.log("FLOW CREATED:", flow);

    return res.json(flow);
  } catch (err: any) {
    console.error("FLOW ERROR:", err); // THIS IS KEY
    return res.status(500).json({
      error: "flow_create_failed",
      detail: err?.message || err
    });
  }
}