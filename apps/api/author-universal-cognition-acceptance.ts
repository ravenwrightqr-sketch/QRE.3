import { buildAuthorRealityGraph } from "./src/services/authorRealityGraph.js";
import { buildAuthorCognitivePlan } from "./src/services/authorCognition.js";
import { movieCandidateDiversity } from "./src/services/authorMovieDifferentiation.js";

const cases = [
  ["PET", "Coco", "Coco came in for grooming. She hates the dryer. She stole an apple from the counter. She wore a blue bow home.", ["Coco came in for grooming", "Coco hates the dryer", "Coco stole an apple from the counter", "Coco wore a blue bow home"]],
  ["HOUSEKEEPING", "Maria", "Maria cleaned the kitchen, then bathroom one, then bathroom two. She finished at 11:47 AM.", ["Maria cleaned the kitchen", "Maria cleaned bathroom one", "Maria cleaned bathroom two", "Maria finished at 11:47 AM"]],
  ["PERSON", "Paul", "Paul restores old radios. He repaired 17 this year. The first one belonged to his grandfather. He keeps that radio on his desk.", ["Paul restores old radios", "Paul repaired 17 radios this year", "The first radio belonged to his grandfather", "Paul keeps that radio on his desk"]],
  ["PLACE", "the old gas station", "An old gas station was closed for twenty years. A new coffee shop opened inside. The original sign still hangs above the door.", ["The gas station was closed for twenty years", "A new coffee shop opened inside", "The original sign still hangs above the door"]],
  ["EVENT", "the event", "Doors opened at 9. The bass system failed at 11:20. The crowd waited. The system returned. The DJ restarted exactly where the track had stopped.", ["Doors opened at 9", "The bass system failed at 11:20", "The crowd waited", "The system returned", "The DJ restarted exactly where the track had stopped"]],
  ["OBJECT", "the red toolbox", "A scratched red toolbox was bought in 1998. It was used by the user's father. It is now used by the user. The handle has been replaced twice.", ["The scratched red toolbox was bought in 1998", "The toolbox was used by the user's father", "The toolbox is now used by the user", "The handle has been replaced twice"]],
  ["BUSINESS", "the dog groomer", "The dog groomer started with one table. There are now three tables. The same old metal scissors are still used from opening day.", ["The dog groomer started with one table", "There are now three tables", "The same old metal scissors are still used from opening day"]],
];

const fail = (message: string): never => { throw new Error(message); };

for (const [domain, subject, prompt, facts] of cases) {
  const graph = buildAuthorRealityGraph({ prompt, subject, facts, sourceMoments: [] });
  const plan = await buildAuthorCognitivePlan({ prompt, subject, facts, sourceMoments: [], realityGraph: graph, movieMode: false });
  if (!plan.latentMovieCandidates.length) fail(`${domain}: no candidates`);

  const eventIds = new Set(graph.events.map((event) => event.id));
  for (const candidate of plan.latentMovieCandidates) {
    if (!candidate.hypothesis.length) fail(`${domain}: candidate ${candidate.id} has no hypothesis`);
    for (const step of candidate.trajectory) {
      if (step.eventIds.some((id) => !eventIds.has(id))) fail(`${domain}: candidate ${candidate.id} contains invented event ids`);
    }
  }

  if (graph.events.length > 1 && plan.latentMovieCandidates.length < 3) fail(`${domain}: cognition collapsed below three hypotheses`);

  const sample = plan.latentMovieCandidates.slice(0, Math.min(5, plan.latentMovieCandidates.length));
  let materiallyDifferent = 0;
  for (let i = 0; i < sample.length; i += 1) {
    for (let j = i + 1; j < sample.length; j += 1) {
      if (movieCandidateDiversity(sample[i]!, sample[j]!) >= 0.34) materiallyDifferent += 1;
    }
  }
  if (sample.length >= 3 && materiallyDifferent === 0) fail(`${domain}: semantic candidates are cosmetic variants`);

  if (graph.events.length >= 3 && !plan.latentMovieCandidates.some((candidate) => candidate.trajectory.some((step) => step.eventIds.length >= 2))) {
    fail(`${domain}: no multi-event semantic bridge candidate`);
  }

  console.log(`PASS ${domain}: events=${graph.events.length} candidates=${plan.latentMovieCandidates.length} selected=${plan.selectedMovie?.id ?? "none"}`);
}

console.log("UNIVERSAL COGNITION ACCEPTANCE: PASS");
