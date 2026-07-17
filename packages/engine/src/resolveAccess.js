export function resolveAccess(params) {
    if (!params.paid)
        return "UNCLAIMED";
    if (params.owned)
        return "UNLOCKED";
    return "LOCKED";
}
