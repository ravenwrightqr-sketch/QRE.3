import Stripe from "stripe";
import { db } from "@qre/db";
import { Prisma } from "@prisma/client";

/**
 * Payment execution boundary.
 * Stripe payment is truth; this service applies verified payment
 * to the already-reserved asset and creates the ownership record.
 */
export async function unlockAsset(
  assetId: string,
  session?: Stripe.Checkout.Session,
) {
  return db.$transaction(async (tx: Prisma.TransactionClient) => {
    const asset = await tx.asset.findUnique({
      where: { id: assetId },
    });

    if (!asset) {
      throw new Error("Asset not found");
    }

    if (!asset.accountId) {
      throw new Error("Asset has no reserved account ownership");
    }

    const metadataUserId = session?.metadata?.userId;
    const metadataAccountId = session?.metadata?.accountId;

    if (metadataAccountId && metadataAccountId !== asset.accountId) {
      throw new Error("Stripe purchaser account does not match reserved asset");
    }

    const updatedAsset = await tx.asset.update({
      where: { id: assetId },
      data: {
        paid: true,
        status: "active",
        totalUnlocks: asset.paid ? undefined : { increment: 1 },
        ...(session?.amount_total != null
          ? { totalRevenueCents: { increment: session.amount_total } }
          : {}),
      },
    });

    await tx.ownership.upsert({
      where: { assetId },
      update: {
        accountId: asset.accountId,
        userId: metadataUserId || undefined,
        status: "ACTIVE",
        claimedAt: new Date(),
        stripeSessionId: session?.id ?? undefined,
        paymentIntentId:
          typeof session?.payment_intent === "string"
            ? session.payment_intent
            : undefined,
      },
      create: {
        assetId,
        accountId: asset.accountId,
        userId: metadataUserId || undefined,
        status: "ACTIVE",
        claimedAt: new Date(),
        stripeSessionId: session?.id ?? undefined,
        paymentIntentId:
          typeof session?.payment_intent === "string"
            ? session.payment_intent
            : undefined,
      },
    });

    return updatedAsset;
  });
}
