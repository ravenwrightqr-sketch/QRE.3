export function resolveAccess(input) {
    if (!input.paid) {
        return "UNCLAIMED";
    }
    if (!input.owned) {
        return "LOCKED";
    }
    return "UNLOCKED";
}
