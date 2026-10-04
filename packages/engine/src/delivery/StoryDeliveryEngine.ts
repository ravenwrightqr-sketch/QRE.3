import type { StoryDeliveryRepository } from "../repositories/index.js";
import type {
  CreationReceiver,
  ExperienceMoment,
  ExperiencePlayout,
  GeoStory,
  SequencePlay,
} from "@qre/contracts";

type StoryInput = {
  assetId: string;
  sessionId: string;
  userId?: string | null;
  recipient?: CreationReceiver;
  playout?: ExperiencePlayout;
  moments?: ExperienceMoment[];
  geoStory?: GeoStory | null;
  sequence?: SequencePlay;
};

export async function createStoryDelivery(
  input: StoryInput,
  repo: StoryDeliveryRepository,
) {
  const asset = await repo.findAsset(input.assetId);
  if (!asset) throw new Error("Asset not found");

  const existing = await repo.findExistingStory({
    assetId: input.assetId,
    sessionId: input.sessionId,
  });

  if (existing) {
    return {
      storyId: existing.id,
      shareUrl: `/share/${existing.id}`,
      delivered: false,
      reason: "ALREADY_DELIVERED",
    };
  }

  const safePlayout =
    input.playout === undefined
      ? undefined
      : structuredClone(input.playout);
  const safeGeoStory =
    input.geoStory === undefined
      ? undefined
      : structuredClone(input.geoStory);
  const safeMoments =
    input.moments === undefined
      ? undefined
      : structuredClone(input.moments);
  const safeSequence =
    input.sequence === undefined
      ? undefined
      : structuredClone(input.sequence);

  const snapshot = await repo.createStorySnapshot({
    assetId: input.assetId,
    sessionId: input.sessionId,
    playout: safePlayout,
    moments: safeMoments,
    geoStory: safeGeoStory,
    sequence: safeSequence,
  });

  const shareUrl = `/share/${snapshot.id}`;
  const delivered = Boolean(
    input.recipient?.email ||
    input.recipient?.phone,
  );

  if (delivered) {
    await queueExperienceDelivery({
      snapshotId: snapshot.id,
      assetId: asset.id,
      email: input.recipient?.email,
      phone: input.recipient?.phone,
      shareUrl,
    });
  }

  return {
    storyId: snapshot.id,
    shareUrl,
    delivered,
    reason: delivered ? "DELIVERY_QUEUED" : "CREATED",
  };
}

async function queueExperienceDelivery(payload: {
  snapshotId: string;
  assetId: string;
  email?: string;
  phone?: string;
  shareUrl: string;
}) {
  console.log("[EXPERIENCE DELIVERY QUEUED]", payload);
}
