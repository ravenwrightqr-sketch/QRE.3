import fs from "node:fs";

const files = {
  service: "apps/api/src/services/experienceService.ts",
  route: "apps/api/src/routes/experience.ts",
  web: "apps/web/src/lib/experienceApi.ts",
};

function read(path) {
  return fs.readFileSync(path, "utf8");
}
function write(path, source) {
  fs.writeFileSync(path, source, "utf8");
}
function replaceOnce(source, from, to, label) {
  const count = source.split(from).length - 1;
  if (count !== 1) {
    throw new Error(`${label}: expected exactly 1 anchor, found ${count}`);
  }
  return source.replace(from, to);
}

let service = read(files.service);
let route = read(files.route);
let web = read(files.web);

service = replaceOnce(
  service,
  'import { persistAuthorLearning } from "./authorLearningLoop.js";\n',
  'import { persistAuthorLearning } from "./authorLearningLoop.js";\nimport { buildAuthorMediaContext, type AuthorMediaInput } from "./authorMediaBridge.js";\n',
  "service import",
);
service = replaceOnce(
  service,
  "  geoAnchor?: GeoAnchorInput;\n}): Promise<CompiledExperienceResult> {",
  "  geoAnchor?: GeoAnchorInput;\n  media?: AuthorMediaInput[];\n}): Promise<CompiledExperienceResult> {",
  "service media input",
);
service = replaceOnce(
  service,
  '  ).trim();\n\n  const facts = [',
  '  ).trim();\n\n  const authorMedia = buildAuthorMediaContext(input.media, {\n    subject,\n    source: "authoring",\n  });\n\n  const facts = [',
  "service media bridge",
);
service = replaceOnce(
  service,
  "    provenanceFacts: [],\n    media: [],\n    authorizedCreativeInstructions: [],",
  "    provenanceFacts: [],\n    media: authorMedia,\n    authorizedCreativeInstructions: [],",
  "service media context",
);

route = replaceOnce(
  route,
  'const rawGeo=parseGeoAnchor(req.body?.geo);',
  'const rawGeo=parseGeoAnchor(req.body?.geo);const media=Array.isArray(req.body?.media)?req.body.media:undefined;',
  "route media input",
);
route = replaceOnce(
  route,
  'memoryRepository:assetId?createMemoryRepository():undefined,geoAnchor:geo});',
  'memoryRepository:assetId?createMemoryRepository():undefined,geoAnchor:geo,media});',
  "route media pass-through",
);

web = replaceOnce(
  web,
  'import type { Experience } from "@qre/contracts";\n',
  'import type { Experience, MediaAsset } from "@qre/contracts";\n',
  "web media import",
);
web = replaceOnce(
  web,
  'type ExperienceIntent = { prompt: string; assetId?: string; geo?: GeoAnchor };',
  'export type ExperienceMediaInput = MediaAsset & { observedAt?: string; place?: string; role?: "evidence" | "memory" | "photo_beat" | "reference"; source?: string };\ntype ExperienceIntent = { prompt: string; assetId?: string; geo?: GeoAnchor; media?: ExperienceMediaInput[] };',
  "web media type",
);
web = replaceOnce(
  web,
  '    ...(intent.geo ? { geo: intent.geo } : {}),\n',
  '    ...(intent.geo ? { geo: intent.geo } : {}),\n    ...(intent.media?.length ? { media: intent.media } : {}),\n',
  "web media payload",
);

write(files.service, service);
write(files.route, route);
write(files.web, web);

console.log("LIVE MEDIA BRIDGE WIRED: service + API route + web client");
console.log("media -> authorMediaBridge -> CognitiveAuthorContext -> MovieBeatPlan");
