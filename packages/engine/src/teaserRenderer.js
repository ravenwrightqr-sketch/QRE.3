export function renderTeaser(teaserId, slug) {
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
