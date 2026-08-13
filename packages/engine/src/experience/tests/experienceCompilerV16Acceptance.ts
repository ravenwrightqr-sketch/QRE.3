import { compileExperienceV16 } from "../experienceCompilerV16.js";

function assert(ok: unknown, message: string): asserts ok {
  if (!ok) throw new Error(`V16 ACCEPTANCE FAILED: ${message}`);
}

console.log("\n===== V16 SPATIOTEMPORAL MEMORY =====\n");

const coupleFirst = compileExperienceV16(
  "John and Jane stood together at the beach during their anniversary and stayed there for sunset.",
  {
    memoryScope: { assetId: "couple-v16" },
    geo: {
      timezone: "America/Los_Angeles",
      points: [{
        latitude: 33.7701,
        longitude: -118.1937,
        accuracyMeters: 4,
        capturedAt: "2026-08-13T18:42:00-07:00",
        placeName: "Long Beach",
        city: "Long Beach",
        region: "CA",
        country: "US",
      }],
    },
  },
);

const coupleSecond = compileExperienceV16(
  "John and Jane came back to the same beach for another anniversary memory.",
  {
    memoryScope: { assetId: "couple-v16" },
    memory: coupleFirst.memory,
    spatialMemory: coupleFirst.memory.spatial,
    geo: {
      timezone: "America/Los_Angeles",
      points: [{
        latitude: 33.77011,
        longitude: -118.19372,
        accuracyMeters: 4,
        capturedAt: "2027-08-13T18:44:00-07:00",
        placeName: "Long Beach",
        city: "Long Beach",
        region: "CA",
        country: "US",
      }],
    },
  },
);

const surfboard = compileExperienceV16(
  "My surfboard has traveled from Santa Monica to Malibu and Santa Barbara.",
  {
    memoryScope: { assetId: "surfboard-v16" },
    geo: {
      points: [
        { latitude: 34.0195, longitude: -118.4912, accuracyMeters: 6, capturedAt: "2026-06-01T09:00:00-07:00", placeName: "Santa Monica", city: "Santa Monica", region: "CA", country: "US" },
        { latitude: 34.0259, longitude: -118.7798, accuracyMeters: 6, capturedAt: "2026-07-04T08:30:00-07:00", placeName: "Malibu", city: "Malibu", region: "CA", country: "US" },
        { latitude: 34.4208, longitude: -119.6982, accuracyMeters: 7, capturedAt: "2026-08-01T07:45:00-07:00", placeName: "Santa Barbara", city: "Santa Barbara", region: "CA", country: "US" },
      ],
    },
  },
);

const semanticOnly = compileExperienceV16(
  "The Airbnb is in Palm Springs and guests love brunch nearby.",
  { memoryScope: { assetId: "airbnb-v16" } },
);

console.log("COUPLE POINTS:", coupleSecond.memory.spatial.points.map((x) => ({ lat: x.latitude, lon: x.longitude, at: x.capturedAt })));
console.log("COUPLE REPEATED SPOTS:", coupleSecond.memory.spatial.repeatedSpots.map((x) => ({ lat: x.latitude, lon: x.longitude, occurrences: x.occurrences })));
console.log("SURFBOARD POINTS:", surfboard.memory.spatial.points.map((x) => x.placeName));
console.log("SURFBOARD TRAILS:", surfboard.memory.spatial.trails.map((x) => Math.round(x.distanceMeters)));
console.log("SURFBOARD SIGNALS:", surfboard.memorySpatialSignals);
console.log("AIRBNB GPS POINTS:", semanticOnly.memory.spatial.points.length);
console.log("AIRBNB SEMANTIC PLACES:", semanticOnly.memory.world.locations.map((x) => x.name));

assert(coupleSecond.memory.spatial.points.length === 2, "exact physical points accumulate across visits");
assert(coupleSecond.memory.spatial.points[0]?.latitude === 33.7701, "latitude is preserved");
assert(coupleSecond.memory.spatial.points[0]?.longitude === -118.1937, "longitude is preserved");
assert(coupleSecond.memory.spatial.points[0]?.accuracyMeters === 4, "GPS accuracy is preserved");
assert(coupleSecond.memory.spatial.points[0]?.capturedAt.includes("18:42"), "exact capture time is preserved");
assert(coupleSecond.memory.spatial.repeatedSpots.some((x) => x.occurrences === 2), "returning within the same physical spot becomes a repeated spot");
assert(surfboard.memory.spatial.points.length === 3, "surfboard journey keeps every physical point");
assert(surfboard.memory.spatial.trails.length >= 2, "surfboard journey creates spatial trail segments");
assert(surfboard.memory.spatial.trails.reduce((sum, trail) => sum + trail.distanceMeters, 0) > 100_000, "travel distance is accumulated from coordinates");
assert(semanticOnly.memory.spatial.points.length === 0, "semantic locations never fabricate GPS");
assert(semanticOnly.memory.world.locations.some((x) => /Palm Springs/i.test(x.name)), "semantic place remains available without GPS");
assert([...coupleSecond.movie.beats, ...surfboard.movie.beats].every((beat) => !/mechanic|compiler|memory thread|trajectory|experience design/i.test(beat.text)), "internals never leak into prose");

console.log("\nV16 ACCEPTANCE: PASS\n");
