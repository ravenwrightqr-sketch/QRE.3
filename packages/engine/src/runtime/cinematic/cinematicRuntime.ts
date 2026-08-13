import type {
  CinematicScene,
  Moment,
  GeoStory,
} from "@qre/contracts";

type CinematicInput = {
  moments: Moment[];
  geoStory: GeoStory | null;
  includeCta?: boolean;
};

export function cinematicRuntime(
  input: CinematicInput,
): CinematicScene[] {
  const scenes: CinematicScene[] = [];

  for (const moment of input.moments) {
    scenes.push({
      id: `scene-${moment.order}`,
      type: mapMomentType(moment.type),
      duration: getDuration(moment),
      moment,
    });
  }

  if (input.geoStory?.scenes) {
    input.geoStory.scenes.forEach((geoScene, index) => {
      scenes.push({
        id: `geo-${geoScene.id}`,
        type: "memory",
        duration: 3500,
        moment: {
          type: "location",
          order: 1000 + index,
          location: {
            lat: geoScene.location?.lat ?? 0,
            lng: geoScene.location?.lng ?? 0,
            label: geoScene.location?.label,
            city: geoScene.location?.city,
            region: geoScene.location?.region,
            country: geoScene.location?.country,
          },
          meta: {
            intensity: geoScene.intensity,
            timestamp: geoScene.timestamp,
          },
        },
      });
    });
  }

  if (input.includeCta === true) {
    scenes.push({
      id: "cta",
      type: "cta",
      duration: 3000,
      moment: {
        type: "system",
        order: 9999,
        text: "Continue Experience",
        meta: {},
      },
    });
  }

  return scenes;
}

function mapMomentType(type: string): CinematicScene["type"] {
  switch (type) {
    case "system":
      return "system";
    case "action":
    case "product":
    case "reward":
    case "payment":
    case "booking":
      return "action";
    case "location":
    case "photos":
    case "video":
    case "media":
    case "replay":
    case "cinematic_replay":
      return "memory";
    case "story":
    case "message":
    case "education":
    case "social":
    case "profile":
      return "emotion";
    default:
      return "emotion";
  }
}

function getDuration(moment: Moment): number {
  switch (moment.type) {
    case "system":
      return 1200;
    case "action":
      return 2000;
    case "location":
      return 3000;
    case "media":
      return 4000;
    default:
      return 1500;
  }
}
