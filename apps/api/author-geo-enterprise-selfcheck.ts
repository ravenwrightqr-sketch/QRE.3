import {
  buildGeoSpatialIntelligenceV17,
  haversineDistanceMetersV17,
  initialBearingDegreesV17,
  redactGeoObservationV17,
} from "@qre/engine";

const points = [
  {
    latitude: 33.6595,
    longitude: -117.9988,
    accuracyMeters: 6,
    capturedAt: "2026-08-18T18:00:00.000Z",
    source: "runtime" as const,
  },
  {
    latitude: 33.65955,
    longitude: -117.99882,
    accuracyMeters: 8,
    capturedAt: "2026-08-18T18:05:00.000Z",
    source: "runtime" as const,
  },
  {
    latitude: 33.6596,
    longitude: -117.9989,
    accuracyMeters: 9,
    capturedAt: "2026-08-18T18:10:00.000Z",
    source: "runtime" as const,
  },
];

const spatial = buildGeoSpatialIntelligenceV17(points);
const distance = haversineDistanceMetersV17(points[0], points[1]);
const bearing = initialBearingDegreesV17(points[0], points[1]);
const city = redactGeoObservationV17(spatial.points[0], "city");

if (spatial.points.length !== 3) throw new Error("expected 3 normalized geo points");
if (spatial.repeatedSpots.length !== 1) throw new Error("expected one repeated spot cluster");
if (spatial.segments.length !== 2) throw new Error("expected two movement segments");
if (spatial.totalDistanceMeters <= 0) throw new Error("expected positive movement distance");
if (!Number.isFinite(distance) || distance <= 0) throw new Error("haversine distance failed");
if (!Number.isFinite(bearing) || bearing < 0 || bearing >= 360) throw new Error("bearing failed");
if (city.latitude === points[0].latitude && city.longitude === points[0].longitude) {
  throw new Error("city-level redaction did not reduce precision");
}

console.log("QRE GEO ENTERPRISE SELF-CHECK: PASS");
console.log(`points=${spatial.points.length}`);
console.log(`segments=${spatial.segments.length}`);
console.log(`repeatedSpots=${spatial.repeatedSpots.length}`);
console.log(`distanceMeters=${spatial.totalDistanceMeters}`);
console.log(`quality=${spatial.quality}`);
