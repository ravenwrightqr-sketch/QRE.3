import { db } from "@qre/db";
export async function resolveTier(userId) {
    if (!userId) {
        return "BASIC";
    }
    const user = await db.user.findUnique({
        where: { id: userId },
        select: {
            tier: true,
            tierActive: true,
        },
    });
    if (!user || !user.tierActive) {
        return "BASIC";
    }
    switch (user.tier) {
        case "PRO":
            return "PRO";
        case "BUSINESS":
            return "BUSINESS";
        default:
            return "BASIC";
    }
}
