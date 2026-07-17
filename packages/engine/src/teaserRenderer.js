export function renderTeaser(access, slug) {
    switch (access) {
        /**
         * NOT PAID / NOT ACTIVATED
         */
        case "UNCLAIMED":
            return [
                { type: "story", text: "This asset is not activated yet." },
                {
                    type: "cta",
                    text: "Unlock this experience",
                    url: `/unlock/${slug}`,
                },
            ];
        /**
         * PAID BUT NOT OWNER
         */
        case "LOCKED":
            return [
                { type: "story", text: "This asset is owned by another user." },
                { type: "hint", text: "Only the owner can access full content." },
            ];
        /**
         * OWNER ACCESS
         */
        case "UNLOCKED":
            return [
                { type: "story", text: "Owner verified." },
                { type: "hint", text: "Full experience unlocked." },
            ];
        /**
         * SAFETY FALLBACK
         */
        default:
            return [
                { type: "story", text: "Preview unavailable." },
            ];
    }
}
