import type { TheState } from "@qre/contracts";

export type TheStateAsset = {
  id: string;
  slug: string;
  category?: string | null;
  experience?: {
    id: string;
    title: string | null;
    createdAt?: string;
  } | null;
  experiences?: Array<{
    id: string;
    title: string | null;
    createdAt?: string;
  }>;
};

export function buildTheState(asset: TheStateAsset): TheState {
  const experiences = Array.isArray(asset.experiences)
    ? asset.experiences
    : asset.experience
      ? [asset.experience]
      : [];

  return {
    identity: {
      id: asset.id,
      slug: asset.slug,
      label:
        asset.experience?.title?.trim() ||
        experiences[0]?.title?.trim() ||
        asset.slug,
      category: asset.category ?? undefined,
    },
    capabilities: experiences.map((experience) => ({
      id: `experience:${experience.id}`,
      key: "experience",
      label: experience.title?.trim() || experience.id,
      enabled: true,
      config: {
        experienceId: experience.id,
      },
    })),
    modes: [],
    current: {
      activeModeId: null,
    },
    activeExperienceId:
      asset.experience?.id ?? experiences[0]?.id ?? null,
    experiences: experiences.map((experience) => ({
      id: experience.id,
      title: experience.title,
      createdAt: experience.createdAt,
      available: true,
    })),
    history: [],
    measurements: [],
    patterns: [],
  };
}
