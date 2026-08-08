import type { CinematicScene, Moment, GeoStory } from "@qre/contracts";

type CinematicInput = {
  moments: Moment[];
  geoStory?: GeoStory | null;
};

/** Pure presentation projection. It never invents narrative meaning. */
export function cinematicRuntime(input: CinematicInput): CinematicScene[] {
  const scenes: CinematicScene[] = input.moments.map((moment, index) => ({
    id: `scene-${index}`,
    type: sceneTypeFor(moment),
    duration: moment.meta?.duration ?? 2200,
    moment,
    order: index,
    transition: transitionFor(moment, index),
    visual: {
      theme: "cinematic",
      animation: index === 0 ? "slow_zoom" : "none",
    },
    preload: index < input.moments.length - 1,
    meta: { source: "compiled_moment" },
  }));

  if (input.geoStory?.scenes?.length) {
    for (const [index, geo] of input.geoStory.scenes.entries()) {
      const order = scenes.length + index;
      scenes.push({
        id: `geo-${geo.id}`,
        type: "memory",
        duration: 2600,
        order,
        transition: "fade",
        moment: {
          type: "location",
          order,
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
        },
        visual: {
          theme: "cinematic",
          animation: "parallax",
        },
        preload: false,
        meta: { source: "geo_context" },
      });
    }
  }

  return scenes;
}

function sceneTypeFor(moment: Moment): CinematicScene["type"] {
  switch (moment.type) {
    case "system":
      return "system";
    case "action":
      return "action";
    case "location":
    case "media":
      return "memory";
    case "message":
    default:
      return "emotion";
  }
}

function transitionFor(moment: Moment, index: number): CinematicScene["transition"] {
  if (moment.type === "system") return "none";
  if (index === 0) return "zoom";
  if (moment.type === "action") return "slide";
  return "fade";
}
