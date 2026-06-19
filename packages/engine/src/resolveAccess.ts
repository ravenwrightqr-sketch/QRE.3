export type AccessState =
  | "UNCLAIMED"
  | "LOCKED"
  | "UNLOCKED";

export function resolveAccess(input: {
  paid: boolean;
  owned: boolean;
}): AccessState {
  if (!input.paid) {
    return "UNCLAIMED";
  }

  if (!input.owned) {
    return "LOCKED";
  }

  return "UNLOCKED";
}