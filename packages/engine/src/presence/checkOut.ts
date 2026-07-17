import { db } from "@qre/db";
import { emitSpineEvent } from "../spine/eventSpine.js";

export async function checkOut(sessionId: string, assetId: string, userId?: string) {
  const session = await db.presenceSession.update({
    where: { id: sessionId },
    data: {
      status: "LEFT",
      exitedAt: new Date(),
    },
  });

  await emitSpineEvent({
    type: "CHECK_OUT",
    assetId,
    sessionId,
    userId,
  });

  return session;
}