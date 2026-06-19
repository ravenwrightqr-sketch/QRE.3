import { db } from "@qre/db";

export async function createSession(assetId: string, flowId?: string) {
  return db.scanSession.create({
    data: {
      assetId,
      startedAt: new Date(),
    },
  });
}

export async function getSession(sessionId: string) {
  return db.scanSession.findUnique({
    where: { id: sessionId },
  });
}

export async function updateSession(
  sessionId: string,
  data: Partial<{ stepIndex: number; status: string }>
) {
  return db.scanSession.update({
    where: { id: sessionId },
    data,
  });
}