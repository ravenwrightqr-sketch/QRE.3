import fs from "node:fs";

const files = {
  service: "apps/api/src/services/experienceService.ts",
  route: "apps/api/src/routes/experience.ts",
  web: "apps/web/src/lib/experienceApi.ts",
};

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function write(path, source, eol) {
  fs.writeFileSync(path, source.replace(/\r?\n/g, eol), "utf8");
}

function replaceOnce(source, pattern, replacement, label) {
  const matches = source.match(pattern);
  const count = matches ? matches.length : 0;
  if (count !== 1) {
    throw new Error(`${label}: expected exactly 1 anchor, found ${count}`);
  }
  return source.replace(pattern, replacement);
}

let service = read(files.service);
let route = read(files.route);
let web = read(files.web);

const eols = {
  service: service.includes("\r\n") ? "\r\n" : "\n",
  route: route.includes("\r\n") ? "\r\n" : "\n",
  web: web.includes("\r\n") ? "\r\n" : "\n",
};

service = replaceOnce(
  service,
  /import \{ persistAuthorLearning \} from "\.\/authorLearningLoop\.js";\r?\n/,
  'import { persistAuthorLearning } from "./authorLearningLoop.js";\nimport { buildAuthorMediaContext, type AuthorMediaInput } from "./authorMediaBridge.js";\n',
  "service import",
);
service = replaceOnce(
  service,
  /  geoAnchor\?: GeoAnchorInput;\r?\n\}([\r\n])\): Promise<CompiledExperienceResult> \{/,
  "  geoAnchor?: GeoAnchorInput;\n  media?: AuthorMediaInput[];\n}$1): Promise<CompiledExperienceResult> {",
  "service media input",
);
service = replaceOnce(
  service,
  /  \)\.trim\(\);\r?\n\r?\n  const facts = \[/,
  '  ).trim();\n\n  const authorMedia = buildAuthorMediaContext(input.media, {\n    subject,\n    source: "authoring",\n  });\n\n  const facts = [',
  "service media bridge",
);
service = replaceOnce(
  service,
  /    provenanceFacts: \[\],\r?\n    media: \[\],\r?\n    authorizedCreativeInstructions: \[\],/,
  "    provenanceFacts: [],\n    media: authorMedia,\n    authorizedCreativeInstructions: [],",
  "service media context",
);

route = replaceOnce(
  route,
  /const rawGeo=parseGeoAnchor\(req\.body\?\.geo\);/,
  "const rawGeo=parseGeoAnchor(req.body?.geo);const media=Array.isArray(req.body?.media)?req.body.media:undefined;",
  "route media input",
);
route = replaceOnce(
  route,
  /memoryRepository:assetId\?createMemoryRepository\(\):undefined,geoAnchor:geo\}\);/,
  "memoryRepository:assetId?createMemoryRepository():undefined,geoAnchor:geo,media});",
  "route media pass-through",
);

web = replaceOnce(
  web,
  /import type \{ Experience \} from "@qre\/contracts";\r?\n/,
  'import type { Experience, MediaAsset } from "@qre/contracts";\n',
  "web media import",
);
web = replaceOnce(
  web,
  /type ExperienceIntent = \{ prompt: string; assetId\?: string; geo\?: GeoAnchor \};/,
  'export type ExperienceMediaInput = MediaAsset & { observedAt?: string; place?: string; role?: "evidence" | "memory" | "photo_beat" | "reference"; source?: string };\ntype ExperienceIntent = { prompt: string; assetId?: string; geo?: GeoAnchor; media?: ExperienceMediaInput[] };',
  "web media type",
);
web = replaceOnce(
  web,
  /    \Q...(intent.geo ? { geo: intent.geo } : {}),\E\r?\n/,
  '    ...(intent.geo ? { geo: intent.geo } : {}),\n    ...(intent.media?.length ? { media: intent.media } : {}),\n',
  "web media payload",
);

write(files.service, service, eols.service);
write(files.route, route, eols.route);
write(files.web, web, eols.web);

console.log("LIVE MEDIA BRIDGE WIRED: service + API route + web client");
console.log("media -> authorMediaBridge -> CognitiveAuthorContext -> MovieBeatPlan");
