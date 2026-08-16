import type { ExperienceGenome } from "@qre/contracts";
import type { ExperienceScene, ExperienceSceneType } from "./experienceTypes.js";

function sceneTypeForJourney(journey: string): ExperienceSceneType {
  switch (journey) {
    case "arrival": return "arrival";
    case "discovery": return "discovery";
    case "memory": return "memory";
    case "transformation": return "transformation";
    case "share":
    case "peak": return "connection";
    case "return": return "return";
    default: return "reflection";
  }
}

function titleForScene(type: ExperienceSceneType, genome: ExperienceGenome): string {
  const subject = genome.entities.people[0]
    ?? genome.entities.places[0]
    ?? genome.entities.events[0]
    ?? genome.entities.products[0];

  switch (type) {
    case "arrival": return subject ? `Before ${subject}` : "Before the Story Begins";
    case "discovery": return subject ? `Discover ${subject}` : "Something Worth Discovering";
    case "memory": return genome.meaning.memories[0] ? `Remember ${genome.meaning.memories[0]}` : "What We Carry Forward";
    case "connection": return "The Moment Connects Us";
    case "transformation": return "What This Changes";
    case "return": return "Take the Story With You";
    default: return "A Moment to Reflect";
  }
}

function atmosphereForScene(type: ExperienceSceneType, genome: ExperienceGenome): string {
  if (type === "memory") return "memory";
  if (type === "discovery") return genome.environments[0] ?? "wonder";
  if (type === "transformation") return "change";
  return genome.energy;
}

export function compileScenes(genome: ExperienceGenome): ExperienceScene[] {
  const journey = genome.journey.length ? genome.journey : ["arrival", "discovery", "return"];

  return journey.map((journeyStep, index) => {
    const type = sceneTypeForJourney(journeyStep);
    const emotion = genome.emotions[index % Math.max(genome.emotions.length, 1)] ?? "wonder";

    return {
      id: `${type}-${index + 1}`,
      type,
      title: titleForScene(type, genome),
      atmosphere: atmosphereForScene(type, genome),
      emotionalIntent: emotion,
      duration: type === "arrival" || type === "return" ? 25 : 45,
    };
  });
}
