import type {
  CinematicScene,
  ExperienceMoment,
  GeoStory,
  MemorySnapshot,
} from "@qre/contracts";
import { buildMemorySnapshot } from "../../geo/buildMemorySnapshot.js";

type RuntimeMemoryInput = {
  assetId: string;
  moments: ExperienceMoment[];
  geoStory: GeoStory | null;
  cinematicScenes: CinematicScene[];
  prior?: MemorySnapshot | null;
};

export function buildRuntimeMemorySnapshot(
  input: RuntimeMemoryInput,
): MemorySnapshot {
  return buildMemorySnapshot(input);
}