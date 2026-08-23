import type {
  TheState,
  TheStateConfiguration,
} from "@qre/contracts";

export type TheStateAsset = {
  id: string;
  slug: string;
  category?: string | null;
  stateConfig?: TheStateConfiguration | null;
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

  const config = asset.stateConfig ?? {};
  const modes = config.modes ?? [];
  const capabilities = config.capabilities ?? [];
  const configuredCurrent = config.current ?? {};

  const activeModeId = configuredCurrent.modeId ?? config.defaultModeId ?? null;
  const activeMode = activeModeId
    ? modes.find((mode) => mode.id === activeModeId && mode.enabled)
    : undefined;

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
    capabilities,
    modes,
    current: {
      ...configuredCurrent,
      modeId: activeMode?.id ?? null,
      status: configuredCurrent.status ?? (activeMode ? "active" : "idle"),
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
