import type {
  ExperienceBlueprint,
  ExperienceGenome,
  ExperienceMoment,
  ExperienceMomentType,
  ExperienceComponent,
  ExperienceTone,
  ExperienceGoal,
  ExperienceType,
  ExperienceIndustry,
} from "@qre/contracts";

const components: Partial<Record<ExperienceMomentType, ExperienceComponent>> = {
  welcome: "hero",
  introduction: "hero",
  story: "story",
  memory: "memory",
  photos: "gallery",
  video: "video",
  location: "geo_memory",
  product: "product",
  reward: "reward",
  share: "social",
  profile: "profile",
  timeline: "timeline",
  followup: "cta",
  care_instructions: "education",
};

function resolveComponent(type: ExperienceMomentType): ExperienceComponent {
  return components[type] ?? "cta";
}

function resolveGoal(genome: ExperienceGenome): ExperienceGoal {
  if (genome.commerce >= 0.7) return "conversion";
  if (genome.memory >= 0.7) return "memory";
  if (genome.intent.includes("teach")) return "educate";
  if (genome.intent.includes("connect")) return "storytelling";
  if (genome.replay >= 0.7) return "retention";
  return "welcome";
}

function resolveIndustry(genome: ExperienceGenome): ExperienceIndustry {
  if (genome.commerce >= 0.7) return "business";
  if (genome.memory >= 0.7) return "personal";
  if (genome.intent.includes("connect")) return "relationship";
  if (genome.themes.some((value) => /event|culture|performance/i.test(value))) return "event";
  return "generic";
}

function resolveType(genome: ExperienceGenome): ExperienceType {
  if (genome.memory >= 0.7) return "story";
  if (genome.commerce >= 0.7) return "business";
  return "journey";
}

function createTitle(genome: ExperienceGenome): string {
  const entity = genome.entities.people[0]
    ?? genome.entities.places[0]
    ?? genome.entities.organizations[0]
    ?? genome.entities.events[0]
    ?? genome.entities.products[0];

  if (entity && genome.memory >= 0.7) return `${entity}: A Living Memory`;
  if (entity) return `${entity}: An Experience`;
  if (genome.intent.includes("remember")) return "A Story Worth Remembering";
  if (genome.intent.includes("discover")) return "The World Behind the Moment";
  if (genome.intent.includes("celebrate")) return "A Moment Worth Celebrating";
  if (genome.intent.includes("teach")) return "A Journey Into Understanding";
  return "A Story Made From Your Idea";
}

function generateMomentSequence(genome: ExperienceGenome): ExperienceMomentType[] {
  const moments: ExperienceMomentType[] = ["welcome"];
  const add = (type: ExperienceMomentType) => {
    if (!moments.includes(type)) moments.push(type);
  };

  if (genome.memory >= 0.5) add("memory");
  if (genome.entities.places.length || genome.environments.length) add("location");
  if (genome.entities.media.length) add("photos");
  if (genome.entities.products.length) add("product");
  if (genome.immersion >= 0.7) add("video");
  if (genome.intent.includes("reward")) add("reward");
  if (genome.interaction >= 0.5 || genome.journey.includes("discovery")) add("story");
  if (genome.intent.includes("connect")) add("share");
  if (genome.replay >= 0.7) add("timeline");
  add("followup");
  return moments;
}

function buildMoment(
  type: ExperienceMomentType,
  index: number,
  genome: ExperienceGenome,
): ExperienceMoment {
  const subject = genome.entities.people[0]
    ?? genome.entities.places[0]
    ?? genome.entities.events[0]
    ?? genome.entities.products[0];

  const titles: Partial<Record<ExperienceMomentType, string>> = {
    welcome: subject ? `Enter ${subject}` : "Enter the Experience",
    memory: genome.meaning.memories[0] ? `Remember ${genome.meaning.memories[0]}` : "Bring the Past Forward",
    location: genome.entities.places[0] ? `Return to ${genome.entities.places[0]}` : "Step Into the World",
    photos: "See What Was There",
    video: "Watch the Story Unfold",
    product: genome.entities.products[0] ? `Discover ${genome.entities.products[0]}` : "Discover the Offering",
    reward: "Unlock Something Extra",
    story: "The Moment Becomes a Story",
    share: "Carry It With You",
    timeline: "Watch Time Connect",
    followup: "What Happens Next",
  };

  return {
    type,
    component: resolveComponent(type),
    title: titles[type] ?? `${type} moment`,
    subtitle: genome.meaning.why,
    order: index,
    editable: true,
    demo: false,
    payload: {
      entities: genome.entities,
      relationships: genome.relationships,
      meaning: genome.meaning,
      genome,
    },
  };
}

export function composeBlueprint(genome: ExperienceGenome): ExperienceBlueprint {
  const momentTypes = generateMomentSequence(genome);
  const moments = momentTypes.map((type, index) => buildMoment(type, index, genome));
  const tone = [genome.energy, ...genome.emotions] as ExperienceTone[];

  return {
    title: createTitle(genome),
    type: resolveType(genome),
    tone,
    meaning: genome.meaning,
    moments,
    entities: genome.entities,
    industry: resolveIndustry(genome),
    goal: resolveGoal(genome),
  };
}
