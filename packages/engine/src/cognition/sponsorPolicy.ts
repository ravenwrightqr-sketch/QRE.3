import type { SponsorPolicy, SponsorPlacement } from "@qre/contracts";

export function buildSponsorPolicy(input: {
  enabled?: boolean;
  name?: string;
  role?: string;
  profileUrl?: string;
  brandMarkUrl?: string;
  usefulCta?: { label: string; url: string };
  placements?: SponsorPlacement[];
  frequency?: SponsorPolicy["frequency"];
  maxExposures?: number;
  disclosure?: SponsorPolicy["disclosure"];
}): SponsorPolicy | undefined {
  if (input.enabled === false || !input.name?.trim()) return undefined;

  return {
    enabled: true,
    name: input.name.trim(),
    role: input.role?.trim() || undefined,
    brandMarkUrl: input.brandMarkUrl,
    profileUrl: input.profileUrl,
    placements: input.placements?.length ? input.placements : ["quiet_badge", "end_card"],
    frequency: input.frequency ?? "end_only",
    maxExposures: Math.max(1, Math.min(5, input.maxExposures ?? 2)),
    respectUserFreedom: true,
    noForcedCapture: true,
    noInterruptiveAds: true,
    disclosure: input.disclosure ?? "created_by",
    usefulCta: input.usefulCta,
  };
}

export const REAL_ESTATE_SPONSOR_PLAYBOOK = [
  { use: "listing_memory", value: "property story / tour memory", sponsor: "listing_agent", placement: "quiet_badge" },
  { use: "open_house", value: "event ticket + neighborhood story", sponsor: "event_host", placement: "contextual_credit" },
  { use: "buyer_journey", value: "remember homes toured and why", sponsor: "listing_agent", placement: "end_card" },
  { use: "seller_handoff", value: "private property media timeline", sponsor: "listing_agent", placement: "useful_cta" },
  { use: "closing_memory", value: "home story / move-in experience", sponsor: "listing_agent", placement: "end_card" },
  { use: "neighborhood_guide", value: "place memories and local discoveries", sponsor: "listing_agent", placement: "contextual_credit" },
  { use: "referral_memory", value: "remember who introduced whom", sponsor: "listing_agent", placement: "quiet_badge" },
] as const;

export const BUSINESS_SPONSOR_PLAYBOOK = [
  { use: "service_story", value: "customer outcome video", sponsor: "business", placement: "end_card" },
  { use: "event_experience", value: "ticket + live memory", sponsor: "event_host", placement: "event_host" },
  { use: "hospitality_memory", value: "stay/dining memory", sponsor: "business", placement: "quiet_badge" },
  { use: "creator_delivery", value: "artist/client story", sponsor: "created_by", placement: "end_card" },
  { use: "return_visit", value: "remember the last visit", sponsor: "business", placement: "useful_cta" },
] as const;
