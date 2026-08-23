import type {
  CinematicScene,
  ExperienceMoment,
  GeoStory,
} from "@qre/contracts";
import { cinematicRuntime } from "./cinematicRuntime.js";

type BlueprintRecord = Record<string, unknown>;

type AuthoredSceneRecord = CinematicScene & {
  meta?: Record<string, unknown>;
};

type ExperienceChapterRecord = {
  id: string;
  createdAt?: string;
  blueprint?: unknown;
};

type CinematicAsset = {
  experiences?: ExperienceChapterRecord[];
};

type CinematicSelectionInput = {
  accessState: string;
  asset: CinematicAsset;
  moments: ExperienceMoment[];
  geoStory: GeoStory | null;
};

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function acceptedAuthoredScenes(
  asset: CinematicAsset,
): CinematicScene[] {
  const records = Array.isArray(asset.experiences)
    ? asset.experiences
    : [];

  const scenes: AuthoredSceneRecord[] =
    records.flatMap(
      (
        record,
      ): AuthoredSceneRecord[] => {
        const blueprint: BlueprintRecord =
          isRecord(record.blueprint)
            ? record.blueprint
            : {};

        const collaboration =
          isRecord(blueprint.collaboration)
            ? blueprint.collaboration
            : undefined;

        if (
          collaboration?.kind ===
            "collaborative_memory_contribution" &&
          collaboration.status !== "ACCEPTED"
        ) {
          return [];
        }

        const cinematicSequence =
          isRecord(
            blueprint.cinematicSequence,
          )
            ? blueprint.cinematicSequence
            : undefined;

        const clip =
          cinematicSequence &&
          isRecord(cinematicSequence.clip)
            ? cinematicSequence.clip
            : undefined;

        const rawScenes = clip?.scenes;

        if (!Array.isArray(rawScenes)) {
          return [];
        }

        return rawScenes
          .filter(
            (
              scene,
            ): scene is AuthoredSceneRecord =>
              isRecord(scene) &&
              typeof scene.id === "string" &&
              typeof scene.type === "string" &&
              typeof scene.duration === "number" &&
              isRecord(scene.moment),
          )
          .map((scene) => ({
            ...scene,
            meta: {
              ...(scene.meta ?? {}),
              chapterId: record.id,
              chapterCreatedAt:
                record.createdAt ?? null,
            },
          }));
      },
    );

  return scenes.map(
    (
      scene: AuthoredSceneRecord,
      index: number,
    ): CinematicScene => ({
      ...scene,
      id: `world-scene-${index + 1}`,
      order: index,
    }),
  );
}

export function selectCinematicScenes(
  input: CinematicSelectionInput,
): CinematicScene[] {
  const generatedScenes =
    cinematicRuntime({
      moments: input.moments,
      geoStory: input.geoStory,
    });

  const authoredScenes =
    input.accessState === "UNLOCKED"
      ? acceptedAuthoredScenes(input.asset)
      : [];

  return authoredScenes.length
    ? authoredScenes
    : generatedScenes;
}