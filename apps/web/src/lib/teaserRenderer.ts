export type TeaserId =
  | "unclaimed_default"
  | "preview_mode"
  | "unlocked";

export type TeaserBlock =
  | { type: "story"; text: string }
  | { type: "cta"; text: string; url: string }
  | { type: "hint"; text: string }
  | { type: "divider" };

export function renderTeaser(
  teaserId: TeaserId,
  slug: string
): TeaserBlock[] {
  if (teaserId === "unclaimed_default") {
    return [
      {
        type: "story",
        text: "This asset has not been activated."
      },
      {
        type: "story",
        text: "Purchase is required before ownership can be claimed."
      },
      {
        type: "divider"
      },
      {
        type: "cta",
        text: "Unlock this asset",
        url: `/unlock/${slug}`
      }
    ];
  }

  if (teaserId === "preview_mode") {
    return [
      {
        type: "story",
        text: "This asset is already owned."
      },
      {
        type: "hint",
        text: "Only the owner can access the full experience."
      }
    ];
  }

  return [
    {
      type: "story",
      text: "Owner verified."
    },
    {
      type: "hint",
      text: "Full experience available."
    }
  ];
}