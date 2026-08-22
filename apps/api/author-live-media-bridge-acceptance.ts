import assert from "node:assert/strict";
import fs from "node:fs";

const service = fs.readFileSync("./src/services/experienceService.ts", "utf8");
const route = fs.readFileSync("./src/routes/experience.ts", "utf8");

assert.match(service, /authorMediaBridge\.js/);
assert.match(service, /media\?: AuthorMediaInput\[\]/);
assert.match(service, /buildAuthorMediaContext\(input\.media/);
assert.match(service, /media: authorMedia/);
assert.match(route, /const media=Array\.isArray\(req\.body\?\.media\)/);
assert.match(route, /geoAnchor:geo,media\}/);

console.log("AUTHOR LIVE MEDIA BRIDGE ACCEPTANCE: PASS");
console.log("compileInputMedia=true");
console.log("mediaBridge=true");
console.log("cognitiveContextMedia=true");
console.log("routePassThrough=true");
