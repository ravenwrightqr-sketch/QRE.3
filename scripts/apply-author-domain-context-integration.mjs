import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const targets = new Set([
  "apps/api/src/services/experienceService.ts",
  "apps/api/src/services/authorBrainCanonical.ts",
  "apps/api/src/services/authorCognition.ts",
  "apps/api/src/services/authorMouthCandidateSearchCanonical.ts",
]);

function p(relative) { return path.join(root, relative); }
function read(relative) { return fs.readFileSync(p(relative), "utf8"); }
function write(relative, content) { fs.writeFileSync(p(relative), content, "utf8"); }
function must(relative, condition, message) {
  if (!condition) throw new Error(`${relative}: ${message}`);
}
function replaceExactlyOnce(relative, needle, replacement, message) {
  const current = read(relative);
  const count = current.split(needle).length - 1;
  must(relative, count === 1, `${message}; expected one match, got ${count}`);
  write(relative, current.replace(needle, replacement));
}

// ---------- experienceService ----------
replaceExactlyOnce(
  "apps/api/src/services/experienceService.ts",
  'export type GeoAnchorInput = {',
  `function buildAuthorDomainContext(asset) {\n  const account = asset?.account;\n  const templateData =\n    asset?.templateData &&\n    typeof asset.templateData === "object" &&\n    !Array.isArray(asset.templateData)\n      ? asset.templateData\n      : {};\n\n  const text = (value) =>\n    typeof value === "string" ? value.trim() : "";\n\n  const values = (keys) =>\n    keys\n      .map((key) => text(templateData[key]))\n      .filter(Boolean);\n\n  const knownCapabilities = [\n    ...(Array.isArray(templateData.services) ? templateData.services : []),\n    ...(Array.isArray(templateData.capabilities) ? templateData.capabilities : []),\n    ...(Array.isArray(templateData.serviceNames) ? templateData.serviceNames : []),\n  ]\n    .filter((value) => typeof value === "string")\n    .map((value) => value.trim())\n    .filter(Boolean);\n\n  const contextualSignals = [\n    ...values(["businessDescription", "description", "serviceDescription", "intakeGuidance", "brandVoice"]),\n  ];\n\n  return {\n    category: text(asset?.category),\n    businessType: text(account?.type),\n    businessName: text(account?.name) || text(asset?.displayName) || text(templateData.businessName),\n    businessDescription: text(templateData.businessDescription) || text(templateData.description),\n    serviceType: text(templateData.serviceType),\n    serviceName: text(templateData.serviceName),\n    subjectKind: text(templateData.subjectKind),\n    knownCapabilities: [...new Set(knownCapabilities)].slice(0, 24),\n    contextualSignals: [...new Set(contextualSignals)].slice(0, 24),\n  };\n}\n\nexport type GeoAnchorInput = {`,
  "insert persistent Author domain-context projection",
);

replaceExactlyOnce(
  "apps/api/src/services/experienceService.ts",
  `  movieMode?: boolean;\n}): Promise<CompiledExperienceResult> {`,
  `  movieMode?: boolean;\n  lens?: string;\n}): Promise<CompiledExperienceResult> {`,
  "add explicit lens to compileExperience input",
);

replaceExactlyOnce(
  "apps/api/src/services/experienceService.ts",
  `  let memoryContext: MemoryContext | undefined;\n  if (input.assetId && input.memoryRepository) {`,
  `  let memoryContext: MemoryContext | undefined;\n  let authorDomainContext: AuthorBrainTruth["domainContext"] | undefined;\n\n  if (input.assetId) {\n    const asset = await db.asset.findUnique({\n      where: { id: input.assetId },\n      include: {\n        account: { select: { name: true, type: true } },\n      },\n    });\n    authorDomainContext = buildAuthorDomainContext(asset);\n  }\n\n  if (input.assetId && input.memoryRepository) {`,
  "load persistent Asset/Account context before Author",
);

replaceExactlyOnce(
  "apps/api/src/services/experienceService.ts",
  `    prompt,\n    subject,\n    place,\n    subjectTruth,\n    movieMode: requestedMovieMode,`,
  `    prompt,\n    subject,\n    place,\n    subjectTruth,\n    lens: clean(input.lens),\n    domainContext: authorDomainContext,\n    movieMode: requestedMovieMode,`,
  "bind lens and domain context to AuthorBrainTruth",
);

// ---------- experience route ----------
replaceExactlyOnce(
  "apps/api/src/routes/experience.ts",
  `    const movieMode = req.body?.movieMode !== false;\n    const rawGeo = parseGeoAnchor(req.body?.geo);`,
  `    const movieMode = req.body?.movieMode !== false;\n    const lens =\n      typeof req.body?.lens === "string"\n        ? req.body.lens.trim()\n        : undefined;\n    const rawGeo = parseGeoAnchor(req.body?.geo);`,
  "read lens from compile request",
);

replaceExactlyOnce(
  "apps/api/src/routes/experience.ts",
  `      geoAnchor: geo,\n      movieMode,`,
  `      geoAnchor: geo,\n      movieMode,\n      lens,`,
  "pass lens into compileExperience",
);

// ---------- authorBrainCanonical ----------
replaceExactlyOnce(
  "apps/api/src/services/authorBrainCanonical.ts",
  `    memoryContext: [],\n    priorScenes: [],\n    priorStrategies: [],\n    movieMode: input.movieMode,`,
  `    memoryContext: input.memoryContext ?? [],\n    priorScenes: input.trajectory ?? [],\n    priorStrategies: input.creativeLearningContext ?? [],\n    domainContext: input.domainContext,\n    round: input.visitNumber,\n    movieMode: input.movieMode,`,
  "preserve upstream context at Cognition boundary",
);

replaceExactlyOnce(
  "apps/api/src/services/authorBrainCanonical.ts",
  `      envelope,\n      beats,\n      lens,\n    });`,
  `      envelope,\n      beats,\n      lens,\n      domainContext: input.domainContext,\n    });`,
  "pass domain context into canonical Mouth",
);

// ---------- authorCognition ----------
replaceExactlyOnce(
  "apps/api/src/services/authorCognition.ts",
  `import type {\n  AuthorExperienceState,`,
  `import type {\n  AuthorBrainTruth,\n  AuthorExperienceState,`,
  "import domain-context contract into Cognition",
);

replaceExactlyOnce(
  "apps/api/src/services/authorCognition.ts",
  `  realityGraph?: RealityGraph;\n  memoryContext?: string[];`,
  `  realityGraph?: RealityGraph;\n  domainContext?: AuthorBrainTruth["domainContext"];\n  memoryContext?: string[];`,
  "add domainContext to AuthorCognitionInput",
);

replaceExactlyOnce(
  "apps/api/src/services/authorCognition.ts",
  `function evidenceText(\n  input: AuthorCognitionInput,\n): string {`,
  `function domainContextText(\n  context: AuthorCognitionInput["domainContext"],\n): string {\n  if (!context) return "";\n  return [\n    context.category,\n    context.businessType,\n    context.businessName,\n    context.businessDescription,\n    context.serviceType,\n    context.serviceName,\n    context.subjectKind,\n    ...(context.knownCapabilities ?? []),\n    ...(context.contextualSignals ?? []),\n  ]\n    .map(clean)\n    .filter(Boolean)\n    .join(" ");\n}\n\nfunction evidenceText(\n  input: AuthorCognitionInput,\n): string {`,
  "add contextual domain text helper",
);

replaceExactlyOnce(
  "apps/api/src/services/authorCognition.ts",
  `    ...(input.memoryContext ?? []),\n    ...(\n      input.realityGraph?.events ?? []\n    ).map(\n      (event) => event.label,\n    ),`,
  `    ...(input.memoryContext ?? []),\n    domainContextText(input.domainContext),\n    ...(\n      input.realityGraph?.events ?? []\n    ).map(\n      (event) => event.label,\n    ),`,
  "make domain context available to lens/character inference",
);

replaceExactlyOnce(
  "apps/api/src/services/authorCognition.ts",
  `      ...input.sourceMoments,\n      ...(input.memoryContext ?? []),\n    ];`,
  `      ...input.sourceMoments,\n      ...(input.memoryContext ?? []),\n      domainContextText(input.domainContext),\n    ];`,
  "make domain context available to character read",
);

// Keep domain context out of permanentTruths: contextual knowledge is not event evidence.
replaceExactlyOnce(
  "apps/api/src/services/authorCognition.ts",
  `  const permanentTruths =\n    uniq(\n      [\n        ...input.facts,\n        ...(input.memoryContext ??\n          []),`,
  `  const permanentTruths =\n    uniq(\n      [\n        ...input.facts,\n        ...(input.memoryContext ??\n          []),`,
  "assert domain context stays out of permanent truths",
);

replaceExactlyOnce(
  "apps/api/src/services/authorCognition.ts",
  `  const frameSummary =\n    \`FRAME: ${selectedFrame}. A frame changes perspective, never reality.\`;`,
  `  const frameSummary =\n    [\n      \`FRAME: \${selectedFrame}. A frame changes perspective, never reality.\`,\n      domainContextText(input.domainContext)\n        ? \`DOMAIN CONTEXT: \${domainContextText(input.domainContext)}. Context only; not event evidence.\`\n        : "",\n    ].filter(Boolean).join(" ");`,
  "surface domain context in cognition summary",
);

// ---------- canonical Mouth ----------
replaceExactlyOnce(
  "apps/api/src/services/authorMouthCandidateSearchCanonical.ts",
  `  lens?: string;\n};`,
  `  lens?: string;\n  domainContext?: import("@qre/contracts").AuthorBrainTruth["domainContext"];\n};`,
  "add domainContext to Mouth generation input",
);

replaceExactlyOnce(
  "apps/api/src/services/authorMouthCandidateSearchCanonical.ts",
  `  const character = buildCharacterProfile(\n    input.envelope,\n  );\n\n  const lensInstruction = [`,
  `  const character = buildCharacterProfile(\n    input.envelope,\n  );\n\n  const domainInstruction = input.domainContext\n    ? [\n        \"DOMAIN CONTEXT (NOT EVENT EVIDENCE):\",\n        JSON.stringify(input.domainContext),\n        \"Use this to understand what kind of world/service the supplied events belong to. Do not convert unstated service steps into facts.\",\n      ].join(" ")\n    : "";\n\n  const lensInstruction = [`,
  "add domain context as non-provenance Mouth guidance",
);

replaceExactlyOnce(
  "apps/api/src/services/authorMouthCandidateSearchCanonical.ts",
  `    "The lens may change attitude, framing, status, implication, rhythm, or emotional interpretation; it may not add concrete reality.",`,
  `    "The lens may change attitude, framing, status, implication, rhythm, or emotional interpretation; it may not add concrete reality.",\n    domainInstruction,`,
  "include domain context in canonical Mouth instructions",
);

// ---------- remove brittle temporary patchers ----------
for (const relative of [
  "scripts/patch-author-domain-context.mjs",
  "scripts/patch-author-domain-context-v2.mjs",
  ".github/workflows/qre-author-domain-context-once.yml",
]) {
  if (fs.existsSync(p(relative))) fs.unlinkSync(p(relative));
}

// ---------- verification ----------
for (const relative of targets) {
  must(relative, fs.existsSync(p(relative)), "target file missing after patch");
}

must(
  "apps/api/src/services/experienceService.ts",
  read("apps/api/src/services/experienceService.ts").includes("domainContext: authorDomainContext") &&
    read("apps/api/src/services/experienceService.ts").includes("lens: clean(input.lens)"),
  "Author input is missing lens/domain context wiring",
);

must(
  "apps/api/src/services/authorBrainCanonical.ts",
  read("apps/api/src/services/authorBrainCanonical.ts").includes("domainContext: input.domainContext") &&
    read("apps/api/src/services/authorBrainCanonical.ts").includes("memoryContext: input.memoryContext ?? []"),
  "Cognition/Mouth handoff is missing context wiring",
);

must(
  "apps/api/src/services/authorCognition.ts",
  read("apps/api/src/services/authorCognition.ts").includes("domainContext?: AuthorBrainTruth[\"domainContext\"]") &&
    read("apps/api/src/services/authorCognition.ts").includes("domainContextText(input.domainContext)"),
  "Cognition does not consume domain context",
);

must(
  "apps/api/src/services/authorMouthCandidateSearchCanonical.ts",
  read("apps/api/src/services/authorMouthCandidateSearchCanonical.ts").includes("domainContext?: import(\"@qre/contracts\").AuthorBrainTruth[\"domainContext\"]") &&
    read("apps/api/src/services/authorMouthCandidateSearchCanonical.ts").includes("DOMAIN CONTEXT (NOT EVENT EVIDENCE)"),
  "Mouth does not receive contextual domain knowledge",
);

console.log("QRE Author domain/lens integration applied and verified.");
console.log("Important boundary: domainContext is contextual knowledge, not RealityGraph event evidence.");
