import { db } from "@qre/db";
export async function createSession(assetId, flowId) {
    return db.scanSession.create({
        data: {
            assetId,
            startedAt: new Date(),
        },
    });
}
export async function getSession(sessionId) {
    return db.scanSession.findUnique({
        where: { id: sessionId },
    });
}
export async function updateSession(sessionId, data) {
    return db.scanSession.update({
        where: { id: sessionId },
        data,
    });
}
