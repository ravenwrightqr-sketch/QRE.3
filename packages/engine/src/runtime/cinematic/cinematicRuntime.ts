import type { CinematicScene, ExperienceMoment, GeoStory } from "@qre/contracts";

type CinematicInput = {
  moments: ExperienceMoment[];
  geoStory?: GeoStory | null;
};

/**
 * Pure sequence projection.
 *
 * The runtime does not invent visual scenes, imagery, animation, or audio.
 * It preserves supplied/captured experience moments and orders them for the player.
 */
export function cinematicRuntime(input: CinematicInput): CinematicScene[] {
  const scenes: CinematicScene[] = input.moments.map((moment, index) => ({
    id: `scene-${index}`,
    type: sceneTypeFor(moment),
    duration: moment.meta?.duration ?? 2200,
    moment,
    order: index,
    transition: "none",
    preload: false,
    meta: { source: "canonical_experience_moment" },
  }));

  if (input.geoStory?.scenes?.length) {
    for (const [index, geo] of input.geoStory.scenes.entries()) {
      const order = scenes.length + index;
      const moment: ExperienceMoment = {
        type: "location",
        component: "geo_memory",
        title: geo.location?.label ?? "Location",
        editable: false,
        demo: false,
        order,
        payload: {
          source: "geo_context",
          intensity: geo.intensity,
          timestamp: geo.timestamp,
        },
        location: {
          lat: geo.location?.lat ?? 0,
          lng: geo.location?.lng ?? 0,
          label: geo.location?.label,
          city: geo.location?.city,
          region: geo.location?.region,
          country: geo.location?.country,
        },
        meta: {
          intensity: geo.intensity,
          timestamp: geo.timestamp,
          source: "geo_context",
        },
      };
      scenes.push({
        id: `geo-${geo.id}`,
        type: "memory",
        duration: 2600,
        order,
        transition: "none",
        moment,
        preload: false,
        meta: { source: "geo_context" },
      });
    }
  }

  return scenes;
}

function sceneTypeFor(moment: ExperienceMoment): CinematicScene["type"] {
  switch (moment.type) {
    case "system": return "system";
    case "action": return "action";
    case "location":
    case "media": return "memory";
    case "memory":
    case "timeline": return "memory";
    default: return "emotion";
  }
}
