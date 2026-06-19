export function compileFlow(input) {
    const lines = input
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
    const actions = [];
    for (const line of lines) {
        const lower = line.toLowerCase();
        // STORY / MESSAGE
        if (lower.startsWith("show") || lower.startsWith("story") || lower.startsWith("message")) {
            actions.push({
                type: "message",
                text: line.replace(/^(show|story|message)\s*/i, ""),
            });
            continue;
        }
        // DELAY
        if (lower.includes("wait") || lower.includes("delay")) {
            const ms = parseInt(line.match(/\d+/)?.[0] ?? "1000", 10);
            actions.push({ type: "delay", ms });
            continue;
        }
        // UNLOCK
        if (lower.includes("unlock")) {
            actions.push({ type: "unlock_preview" });
            continue;
        }
        // REDIRECT
        if (lower.includes("redirect") || lower.includes("go to") || lower.includes("open")) {
            const url = line.split(" ").pop() ?? "/";
            actions.push({ type: "redirect", url });
            continue;
        }
        // fallback → message
        actions.push({
            type: "message",
            text: line,
        });
    }
    return actions;
}
