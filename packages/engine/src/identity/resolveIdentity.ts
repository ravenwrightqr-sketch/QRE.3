import { db } from "@qre/db";

export async function resolveIdentity(input: {
  userId?: string;
  assetId?: string;
}) {
  let user = null;

  if (input.userId) {
    user = await db.user.findUnique({
      where: { id: input.userId },
    });
  }

  if (!user && input.assetId) {
    const ownership = await db.ownership.findUnique({
      where: { assetId: input.assetId },
      include: { user: true },
    });

    if (ownership?.user) {
      user = ownership.user;
    }
  }

  return {
    userId: user?.id ?? null,
    tier: user?.tier ?? "BASIC",
    isGuest: !user,
  };
}