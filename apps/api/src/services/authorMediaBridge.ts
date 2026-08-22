import type { CognitiveAuthorMedia, MediaAsset } from "@qre/contracts";
import { buildRealityProvenance } from "./authorRealityProvenance.js";

export type AuthorMediaInput = MediaAsset & {
  observedAt?: string;
  place?: string;
  role?: CognitiveAuthorMedia["role"];
  source?: string;
};

export function buildAuthorMediaContext(
  media: AuthorMediaInput[] | undefined,
  options: { subject?: string; source?: string } = {},
): CognitiveAuthorMedia[] {
  return (media ?? [])
    .filter((asset) => Boolean(asset?.id && asset?.url && asset?.type))
    .map((asset) => ({
      ...asset,
      role: asset.role ?? "evidence",
      source: asset.source ?? options.source ?? "authoring",
      provenance: buildRealityProvenance(
        `media:${asset.id}`,
        "memory",
        {
          subject: options.subject,
          observedAt: asset.observedAt,
          confidence: 1,
        },
      ),
    }))
    .sort((a, b) => String(a.observedAt ?? "").localeCompare(String(b.observedAt ?? "")));
}
