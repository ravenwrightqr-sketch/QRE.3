import { compileExperienceV16 } from "../experienceCompilerV16.js";

function assert(ok: unknown, message: string): asserts ok {
  if (!ok) throw new Error(`V16 STRESS FAILED: ${message}`);
}

type Case = {
  name: string;
  prompt: string;
  assetId: string;
  geo?: {
    timezone?: string;
    points: Array<{
      latitude: number;
      longitude: number;
      accuracyMeters?: number;
      capturedAt: string;
      placeName?: string;
      city?: string;
      region?: string;
      country?: string;
    }>;
  };
};

const cases: Case[] = [
  { name: "person-job", assetId: "person-job", prompt: "Alex started a new job in Portland and celebrated with friends." },
  { name: "person-birthday", assetId: "person-birthday", prompt: "Maria celebrated her birthday in San Diego with her family." },
  { name: "motorcycle", assetId: "motorcycle", prompt: "James bought his first motorcycle and rode it along the coast." },
  { name: "first-home", assetId: "first-home", prompt: "Sarah moved into her first apartment and painted the living room green." },
  { name: "marriage", assetId: "marriage", prompt: "John and Jane got married at the beach and returned there for their anniversary." },
  { name: "first-date", assetId: "first-date", prompt: "Mike and Chris returned to the restaurant where they had their first date." },
  { name: "anniversary", assetId: "anniversary", prompt: "A couple celebrated their tenth anniversary in Palm Springs with a quiet dinner." },
  { name: "coco", assetId: "coco", prompt: "Coco went to the groomer, had a bath, stole a bow, and left happy." },
  { name: "max", assetId: "max", prompt: "Max visited the dog park, chased a ball, and made a new friend." },
  { name: "luna", assetId: "luna", prompt: "Luna returned to the beach she loves and watched the sunset." },
  { name: "airbnb-arrival", assetId: "airbnb-arrival", prompt: "A guest arrived at an Airbnb in Palm Springs and settled in for the weekend." },
  { name: "water-heater", assetId: "water-heater", prompt: "The homeowner replaced the water heater and saved the receipt for the next owner." },
  { name: "guest-recommendation", assetId: "guest-recommendation", prompt: "Guests repeatedly recommended the same little taco shop near the house." },
  { name: "home-transfer", assetId: "home-transfer", prompt: "The house changed owners and its maintenance history stayed with the property." },
  { name: "surfboard", assetId: "surfboard", prompt: "My surfboard has traveled from Santa Monica to Malibu and Santa Barbara." },
  { name: "guitar", assetId: "guitar", prompt: "A guitar followed its owner across Los Angeles, Austin, and Nashville." },
  { name: "camera", assetId: "camera", prompt: "A camera traveled through Tokyo, Kyoto, and Osaka while documenting the trip." },
  { name: "wedding-ring", assetId: "wedding-ring", prompt: "A wedding ring was passed from a grandmother to her daughter as a family milestone." },
  { name: "coffee-shop", assetId: "coffee-shop", prompt: "A coffee shop opened downtown and quickly became a favorite morning stop." },
  { name: "barber", assetId: "barber", prompt: "A barber served the same customer every month for three years." },
  { name: "restaurant", assetId: "restaurant", prompt: "A restaurant hosted its first anniversary with regular customers and live music." },
  { name: "dispensary", assetId: "dispensary", prompt: "A cannabis dispensary introduced a new product and customers asked for evening recommendations." },
  { name: "flight", assetId: "flight", prompt: "Alex flew from Los Angeles to New York for a conference and stayed near the park." },
  { name: "roadtrip", assetId: "roadtrip", prompt: "A family road-tripped from California to Oregon and stopped at several beaches." },
  { name: "surf-hawaii", assetId: "surf-hawaii", prompt: "A surfboard made its first trip to Hawaii and returned home after three weeks." },
  { name: "camping", assetId: "camping", prompt: "A dog went camping in Yosemite and slept beside the tent every night." },
  { name: "return-beach", assetId: "return-beach", prompt: "They returned to the same beach one year later and watched another sunset there." },
  { name: "friday-restaurant", assetId: "friday-restaurant", prompt: "The couple visits the same restaurant every Friday and always orders the quietest table." },
  { name: "business-anniversary", assetId: "business-anniversary", prompt: "The business celebrates its anniversary every August with the same team." },
  { name: "grooming-return", assetId: "grooming-return", prompt: "Coco returned to the groomer two months later and immediately noticed the bows." },
  { name: "exact-beach", assetId: "exact-beach", prompt: "John and Jane stood together at this exact beach spot during their anniversary." },
  { name: "vehicle-stops", assetId: "vehicle-stops", prompt: "The vehicle stopped at three places before reaching the mountains." },
  { name: "boat-marinas", assetId: "boat-marinas", prompt: "The boat traveled between three marinas during the summer." },
  { name: "runner", assetId: "runner", prompt: "The runner repeatedly passed the same park before sunrise." },
  { name: "quiet-restaurants", assetId: "quiet-restaurants", prompt: "John prefers quiet restaurants where he can talk without loud music." },
  { name: "sunset-beaches", assetId: "sunset-beaches", prompt: "Jane loves sunset beaches and keeps returning to the same shoreline." },
  { name: "coffee-walk", assetId: "coffee-walk", prompt: "The guest recommends coffee shops within walking distance of the Airbnb." },
  { name: "coco-preference", assetId: "coco-preference", prompt: "Coco hates baths but loves treats and happily returns for grooming." },
  { name: "malibu-story", assetId: "malibu-story", prompt: "We finally took the old board down to Malibu and stayed until the waves disappeared." },
  { name: "coco-place", assetId: "coco-place", prompt: "Coco was back at that place again and somehow remembered exactly where the treats were." },
  { name: "marriage-memory", assetId: "marriage-memory", prompt: "We met there ten years ago and somehow ended up married." },
  { name: "taco-shop", assetId: "taco-shop", prompt: "The Airbnb guests kept telling us about this little taco place around the corner." },
  { name: "couple-beach", assetId: "couple-beach", prompt: "John and Jane celebrated their anniversary at the beach at sunset and returned to the same spot later." },
  { name: "pet-grooming", assetId: "pet-grooming", prompt: "Coco returned to the groomer, remembered the bath, and still decided the treats were worth it." },
  { name: "airbnb-local", assetId: "airbnb-local", prompt: "The Palm Springs Airbnb became known for guests recommending brunch, hiking, and a nearby coffee shop." },
  { name: "board-route", assetId: "board-route", prompt: "The surfboard traveled from Santa Monica through Malibu before reaching Santa Barbara." },
  { name: "house-history", assetId: "house-history", prompt: "The home accumulated years of repairs, family gatherings, and ownership changes." },
  { name: "person-travel", assetId: "person-travel", prompt: "Alex traveled through California, Oregon, and Washington and kept returning to the coast." },
  { name: "event", assetId: "event", prompt: "A wedding event began at the venue, moved to the beach, and ended with a family dinner." },
  { name: "product", assetId: "product", prompt: "A handmade product traveled from the maker to a shop, then to its new owner in another city." },
  { name: "miscellaneous", assetId: "miscellaneous", prompt: "The old camera, the dog, and the couple all ended up at the same beach before sunset." },
];

const geoByAsset: Record<string, Case["geo"]> = {
  "marriage": { timezone: "America/Los_Angeles", points: [{ latitude: 33.7701, longitude: -118.1937, accuracyMeters: 4, capturedAt: "2026-08-13T18:42:00-07:00", placeName: "Long Beach", city: "Long Beach", region: "CA", country: "US" }] },
  "surfboard": { timezone: "America/Los_Angeles", points: [
    { latitude: 34.0195, longitude: -118.4912, accuracyMeters: 6, capturedAt: "2026-06-01T09:00:00-07:00", placeName: "Santa Monica", city: "Santa Monica", region: "CA", country: "US" },
    { latitude: 34.0259, longitude: -118.7798, accuracyMeters: 6, capturedAt: "2026-07-04T08:30:00-07:00", placeName: "Malibu", city: "Malibu", region: "CA", country: "US" },
    { latitude: 34.4208, longitude: -119.6982, accuracyMeters: 7, capturedAt: "2026-08-01T07:45:00-07:00", placeName: "Santa Barbara", city: "Santa Barbara", region: "CA", country: "US" },
  ] },
  "exact-beach": { timezone: "America/Los_Angeles", points: [{ latitude: 33.7701, longitude: -118.1937, accuracyMeters: 4, capturedAt: "2026-08-13T18:42:00-07:00", placeName: "Long Beach", city: "Long Beach", region: "CA", country: "US" }] },
  "vehicle-stops": { timezone: "America/Los_Angeles", points: [
    { latitude: 33.9533, longitude: -117.3962, accuracyMeters: 8, capturedAt: "2026-08-01T07:00:00-07:00", placeName: "Riverside", city: "Riverside", region: "CA", country: "US" },
    { latitude: 34.0195, longitude: -118.4912, accuracyMeters: 8, capturedAt: "2026-08-01T09:00:00-07:00", placeName: "Santa Monica", city: "Santa Monica", region: "CA", country: "US" },
    { latitude: 34.4208, longitude: -119.6982, accuracyMeters: 8, capturedAt: "2026-08-01T11:00:00-07:00", placeName: "Santa Barbara", city: "Santa Barbara", region: "CA", country: "US" },
  ] },
  "boat-marinas": { timezone: "America/Los_Angeles", points: [
    { latitude: 33.7405, longitude: -118.2781, accuracyMeters: 10, capturedAt: "2026-07-01T08:00:00-07:00", placeName: "San Pedro", city: "Los Angeles", region: "CA", country: "US" },
    { latitude: 33.6757, longitude: -118.0025, accuracyMeters: 10, capturedAt: "2026-07-02T10:00:00-07:00", placeName: "Huntington Harbour", city: "Huntington Beach", region: "CA", country: "US" },
    { latitude: 33.9806, longitude: -118.4517, accuracyMeters: 10, capturedAt: "2026-07-03T09:00:00-07:00", placeName: "Marina del Rey", city: "Los Angeles", region: "CA", country: "US" },
  ] },
  "return-beach": { timezone: "America/Los_Angeles", points: [{ latitude: 33.77011, longitude: -118.19372, accuracyMeters: 4, capturedAt: "2027-08-13T18:44:00-07:00", placeName: "Long Beach", city: "Long Beach", region: "CA", country: "US" }] },
};

let compiled = 0;
let failures = 0;
let entities = 0;
let events = 0;
let locations = 0;
let exactPoints = 0;
let times = 0;
let relationships = 0;
let preferences = 0;
let milestones = 0;
let patterns = 0;
let associations = 0;
let trails = 0;
let repeatedSpots = 0;
let leaked = 0;
const failuresByCase: string[] = [];

for (const [index, testCase] of cases.entries()) {
  try {
    const result = compileExperienceV16(testCase.prompt, {
      memoryScope: { assetId: testCase.assetId },
      ...(geoByAsset[testCase.assetId] ? { geo: geoByAsset[testCase.assetId] } : {}),
    });

    compiled += 1;
    entities += result.memory.entities.length;
    events += result.memory.events.length;
    locations += result.memory.world.locations.length;
    exactPoints += result.memory.spatial.points.length;
    times += result.memory.world.time.length;
    relationships += result.memory.relations.length;
    preferences += result.memory.world.preferences.length;
    milestones += result.memory.world.milestones.length;
    patterns += result.memory.world.patterns.length;
    associations += result.memory.intelligence.associations.length;
    trails += result.memory.spatial.trails.length;
    repeatedSpots += result.memory.spatial.repeatedSpots.length;

    if ([...result.movie.beats].some((beat) => /mechanic|compiler|memory thread|trajectory|experience design/i.test(beat.text))) {
      leaked += 1;
      failuresByCase.push(`${index + 1}. ${testCase.name}: internal language leaked into prose`);
    }
  } catch (error) {
    failures += 1;
    failuresByCase.push(`${index + 1}. ${testCase.name}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Explicit continuity test: the same identity accumulates time + exact location across visits.
const continuityFirst = compileExperienceV16(
  "John and Jane returned to their anniversary beach spot and watched the sunset.",
  {
    memoryScope: { assetId: "continuity-50" },
    geo: { timezone: "America/Los_Angeles", points: [{ latitude: 33.7701, longitude: -118.1937, accuracyMeters: 4, capturedAt: "2026-08-13T18:42:00-07:00", placeName: "Long Beach", city: "Long Beach", region: "CA", country: "US" }] },
  },
);
const continuitySecond = compileExperienceV16(
  "John and Jane came back to the same beach spot one year later for another anniversary.",
  {
    memoryScope: { assetId: "continuity-50" },
    memory: continuityFirst.memory,
    spatialMemory: continuityFirst.memory.spatial,
    geo: { timezone: "America/Los_Angeles", points: [{ latitude: 33.77011, longitude: -118.19372, accuracyMeters: 4, capturedAt: "2027-08-13T18:44:00-07:00", placeName: "Long Beach", city: "Long Beach", region: "CA", country: "US" }] },
  },
);

assert(cases.length === 50, "exactly 50 prompts are exercised");
assert(compiled === 50, `all prompts compile (${compiled}/50)`);
assert(failures === 0, `no prompt throws (${failures} failures)`);
assert(leaked === 0, `no internal language leaks (${leaked})`);
assert(continuitySecond.memory.events.length > continuityFirst.memory.events.length, "memory accumulates events across visits");
assert(continuitySecond.memory.spatial.points.length === 2, "exact geographic points accumulate across visits");
assert(continuitySecond.memory.spatial.repeatedSpots.some((spot) => spot.occurrences >= 2), "same physical spot becomes a repeated spot");

console.log("\n===== V16 UNIVERSAL 50-PROMPT STRESS TEST =====\n");
console.log("PROMPTS:", cases.length);
console.log("COMPILED:", compiled);
console.log("FAILED:", failures);
console.log("ENTITIES:", entities);
console.log("EVENTS:", events);
console.log("RELATIONSHIPS:", relationships);
console.log("SEMANTIC LOCATIONS:", locations);
console.log("EXACT GPS POINTS:", exactPoints);
console.log("TIME OBSERVATIONS:", times);
console.log("PREFERENCES:", preferences);
console.log("MILESTONES:", milestones);
console.log("RECURRING PATTERNS:", patterns);
console.log("ASSOCIATIONS:", associations);
console.log("TRAVEL TRAILS:", trails);
console.log("REPEATED SPOTS:", repeatedSpots);
console.log("INTERNAL LANGUAGE LEAKS:", leaked);
console.log("CONTINUITY POINTS:", continuitySecond.memory.spatial.points.map((point) => ({ lat: point.latitude, lon: point.longitude, at: point.capturedAt })));
console.log("CONTINUITY REPEATED SPOTS:", continuitySecond.memory.spatial.repeatedSpots.map((spot) => ({ lat: spot.latitude, lon: spot.longitude, occurrences: spot.occurrences })));

if (failuresByCase.length) {
  console.log("\nFAILURES:");
  for (const failure of failuresByCase) console.log("-", failure);
}

console.log("\nV16 50-PROMPT STRESS TEST: PASS\n");
