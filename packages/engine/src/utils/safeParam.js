export function safeStringParam(value) {
    if (typeof value === "string")
        return value;
    if (Array.isArray(value))
        return value[0] ?? null;
    return null;
}
