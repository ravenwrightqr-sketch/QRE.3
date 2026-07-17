import type { AccessState } from "./types.js";

type Params = {
  assetId: string;
  userId?: string;
  paid: boolean;
  owned: boolean;
};

export function resolveAccess(params: Params): AccessState {
  if (!params.paid) return "UNCLAIMED";
  if (params.owned) return "UNLOCKED";
  return "LOCKED";
}