import type { AudienceUnderstanding } from "../models/understandingTypes.js";

const audienceSignals: Record<string, string[]> = {
  children: ["kid", "kids", "child", "children", "young", "school"],
  fans: ["fan", "follower", "artist", "music", "concert", "album"],
  family: ["family", "wedding", "relationship", "bride", "groom", "anniversary", "parents"],
  business_owner: ["business", "customer", "brand", "client", "store", "company", "customer"],
  creator: ["creator", "artist", "designer", "maker"],
  community: ["community", "club", "group", "crowd", "members"],
  pet_owner: ["pet", "dog", "cat", "animal"],
};

export function analyzeAudience(prompt: string): AudienceUnderstanding {
  const text = prompt.toLowerCase();
  const types = Object.entries(audienceSignals)
    .filter(([, signals]) => signals.some((signal) => text.includes(signal)))
    .map(([type]) => type);

  if (!types.length) types.push("individual");

  const social: AudienceUnderstanding["social"] =
    types.includes("community") || types.includes("fans")
      ? "community"
      : types.length > 1 || types.includes("family") || types.includes("children")
        ? "shared"
        : "solo";

  return {
    types,
    primary: types[0],
    social,
  };
}
