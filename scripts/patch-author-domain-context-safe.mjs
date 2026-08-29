import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function file(relative) {
  return path.join(root, relative);
}

function read(relative) {
  return fs.readFileSync(file(relative), "utf8");
}

function write(relative, content) {
  fs.writeFileSync(file(relative), content, "utf8");
}

function replaceOnce(relative, pattern, replacement, label) {
  const current = read(relative);
  const matches = current.match(pattern);
  const count = matches?.length ?? 0;
  if (count !== 1) {
    throw new Error(`${relative}: ${label}: expected 1 match, got ${count}`);
  }
  write(relative, current.replace(pattern, replacement));
}

function ensureNotPresent(relative, needle) {
  if (read(relative).includes(needle)) {
    throw new Error(`${relative}: unexpected pre-existing marker: ${needle}`);
  }
}

ensureNotPresent("apps/api/src/services/experienceService.ts", "domainContextFromAsset");
ensureNotPresent("apps/api/src/services/authorCognition.ts", "domainContextText(input.domainContext)");

// 1. Experience service: derive persistent business/service context from the already-existing Asset relations.
replaceOnce(
  "apps/api/src/services/experienceService.ts",
  /export type GeoAnchorInput = \{/,
  `function domainContextFromAsset(asset) {\n  const account = asset?.account ?? undefined;\n  const template = asset?.template ?? undefined;\n  const templateData =\n    asset?.templateData &&\n    typeof asset.templateData === "object" &&\n    !Array.isArray(asset.templateData)\n      ? asset.templateData\n      : undefined;\n\n  const stringValue = (value) =>\n    typeof value === "string" ? value.trim() : "";\n\n  const capabilities = Array.isArray(templateData?.services)\n    ? templateData.services.map(stringValue).filter(Boolean)\n    : Array.isArray(templateData?.capabilities)\n      ? templateData.capabilities.map(stringValue).filter(Boolean)\n      : [];\n\n  const signals = [\n    stringValue(templateData?.businessDescription),\n    stringValue(templateData?.serviceDescription),\n    stringValue(templateData?.intakeGuidance),\n  ].filter(Boolean);\n\n  return {\n    category: stringValue(asset?.category),\n    businessType: stringValue(account?.type),\n    businessName:\n      stringValue(templateData?.businessName) ||\n      stringValue(account?.name) ||\n      stringValue(asset?.displayName),\n    businessDescription: stringValue(\n      templateData?.businessDescription,\n    ),\n    serviceType: stringValue(templateData?.serviceType),\n    serviceName: stringValue(templateData?.serviceName),\n    subjectKind: stringValue(templateData?.subjectKind),\n    knownCapabilities: [...new Set(capabilities)].slice(0, 24),\n    contextualSignals: [...new Set(signals)].slice(0, 24),\n  };\n}\n\nexport type GeoAnchorInput = {`,
  "insert domainContextFromAsset",
);

replaceOnce(
  "apps/api/src/services/experienceService.ts",
  /const authorInput: AuthorBrainTruth = \{([\s\S]*?)\n  \};/,
  (full, body) => {
    if (body.includes("domainContext:")) return full;
    return `const authorInput: AuthorBrainTruth = {${body}\n    domainContext: domainContextFromAsset((memoryContext)?.asset ?? undefined),\n  };`;
  },
  "add domainContext to AuthorBrainTruth",
);

// The memory context object does not currently expose Asset metadata in the canonical service,
// so add an explicit asset metadata read before authorInput when assetId is present.
replaceOnce(
  "apps/api/src/services/experienceService.ts",
  /let memoryContext: MemoryContext \| undefined;\n  if \(input\.assetId && input\.memoryRepository\) \{/,
  `let memoryContext: MemoryContext | undefined;\n  let authorDomainContext: AuthorBrainTruth["domainContext"] | undefined;\n\n  if (input.assetId) {\n    const asset = await db.asset.findUnique({\n      where: { id: input.assetId },\n      include: {\n        account: { select: { name: true, type: true, plan: true } },\n        template: true,\n      },\n    });\n    authorDomainContext = domainContextFromAsset(asset);\n  }\n\n  if (input.assetId && input.memoryRepository) {`,
  "load persistent Asset domain context",
);

replaceOnce(
  "apps/api/src/services/experienceService.ts",
  /domainContext: domainContextFromAsset\(\(memoryContext\)\?\.asset \?\? undefined\),/,
  "domainContext: authorDomainContext,",
  "bind loaded domain context",
);

// 2. Canonical Brain: preserve all upstream context instead of deleting it at the Cognition boundary.
replaceOnce(
  "apps/api/src/services/authorBrainCanonical.ts",
  /function buildCognition\(([\s\S]*?)\n\}\n\nfunction chooseMovie/, 
  (full, body) => {
    const replacement = body
      .replace(/memoryContext: \[\],\n    priorScenes: \[\],\n    priorStrategies: \[\],/, `memoryContext: input.memoryContext ?? [],\n    priorScenes: input.trajectory ?? [],\n    priorStrategies: input.creativeLearningContext ?? [],\n    domainContext: input.domainContext,`);
    if (replacement === body) {
      throw new Error("authorBrainCanonical: buildCognition body shape did not match");
    }
    return `function buildCognition(${replacement}\n}\n\nfunction chooseMovie`;
  },
  "preserve upstream context in buildCognition",
);

replaceOnce(
  "apps/api/src/services/authorBrainCanonical.ts",
  /const graph =\n    buildAuthorRealityGraph\(\{([\s\S]*?)\n    \}\);/,
  (full, body) => {
    if (body.includes("memoryContext: input.memoryContext")) return full;
    return `const graph =\n    buildAuthorRealityGraph({${body}\n      memoryContext: input.memoryContext ?? [],\n      trajectory: input.trajectory ?? [],\n    });`;
  },
  "preserve Brain context in RealityGraph projection",
);

// 3. Cognition input/output: domain context is contextual knowledge, never permanent truth.
replaceOnce(
  "apps/api/src/services/authorCognition.ts",
  /export type AuthorCognitionInput = \{([\s\S]*?)\n\};/,
  (full, body) => {
    if (body.includes("domainContext")) return full;
    return `export type AuthorCognitionInput = {${body}\n  domainContext?: AuthorBrainTruth["domainContext"];\n};`;
  },
  "add domainContext to cognition input",
);

replaceOnce(
  "apps/api/src/services/authorCognition.ts",
  /import type \{\n  AuthorExperienceState,([\s\S]*?)\n\} from "@qre\/contracts";/,
  (full, body) => {
    if (body.includes("AuthorBrainTruth")) return full;
    return `import type {\n  AuthorBrainTruth,${body}\n} from "@qre/contracts";`;
  },
  "import AuthorBrainTruth",
);

replaceOnce(
  "apps/api/src/services/authorCognition.ts",
  /function evidenceText\(\n  input: AuthorCognitionInput,\n\): string \{/,
  `function domainContextText(\n  context: AuthorCognitionInput["domainContext"],\n): string {\n  if (!context) return "";\n  return [\n    context.category,\n    context.businessType,\n    context.businessName,\n    context.businessDescription,\n    context.serviceType,\n    context.serviceName,\n    context.subjectKind,\n    ...(context.knownCapabilities ?? []),\n    ...(context.contextualSignals ?? []),\n  ]\n    .map(clean)\n    .filter(Boolean)\n    .join(" ");\n}\n\nfunction evidenceText(\n  input: AuthorCognitionInput,\n): string {`,
  "add contextual domain text helper",
);

replaceOnce(
  "apps/api/src/services/authorCognition.ts",
  /function nativeRealityStrength\(\n  input: AuthorCognitionInput,\n\): number \{/,
  `function nativeRealityStrength(\n  input: AuthorCognitionInput,\n): number {`,
  "native reality marker",
);

replaceOnce(
  "apps/api/src/services/authorCognition.ts",
  /const permanentTruths =\n    uniq\(\n      \[\n        \.\.\.input\.facts,/,
  `const permanentTruths =\n    uniq(\n      [\n        ...input.facts,`,
  "permanent truth guard",
);

// Add domain context to character/frame reasoning without adding it to permanentTruths/currentEvidence.
replaceOnce(
  "apps/api/src/services/authorCognition.ts",
  /function traits\(\n  input: AuthorCognitionInput,\n\): string\[\] \{\n  const all = \[/,
  `function traits(\n  input: AuthorCognitionInput,\n): string[] {\n  const all = [\n    domainContextText(input.domainContext),`,
  "use domain context for cognitive characterization",
);

replaceOnce(
  "apps/api/src/services/authorCognition.ts",
  /const frameSummary =\n    `FRAME: \$\{selectedFrame\}\. A frame changes perspective, never reality\.\`;/,
  `const frameSummary =\n    [\n      \`FRAME: ${selectedFrame}. A frame changes perspective, never reality.\`,\n      domainContextText(input.domainContext)\n        ? \`DOMAIN CONTEXT: ${domainContextText(input.domainContext)}. This is contextual world knowledge, not event evidence.\`\n        : "",\n    ].filter(Boolean).join(" ");`,
  "surface domain context in cognitive plan",
);

// 4. Canonical Mouth adapter: lens plus domain context, but domain context is NOT treated as event provenance.
replaceOnce(
  "apps/api/src/services/authorMouthCandidateSearchCanonical.ts",
  /export type MouthCandidateGenerationInput = \{([\s\S]*?)\n\};/,
  (full, body) => {
    if (body.includes("domainContext")) return full;
    return `export type MouthCandidateGenerationInput = {${body}\n  domainContext?: import("@qre/contracts").AuthorBrainTruth["domainContext"];\n};`;
  },
  "add domainContext to Mouth input",
);

replaceOnce(
  "apps/api/src/services/authorMouthCandidateSearchCanonical.ts",
  /const lensInstruction = \[/,
  `const domainInstruction = input.domainContext\n    ? [\n        \`DOMAIN CONTEXT: ${JSON.stringify(input.domainContext)}\`,\n        "Domain context describes the world/service the viewer is in. It is contextual knowledge, not an observed event.",\n        "Use domain knowledge only to recognize why supplied facts are meaningful; never turn an unstated service step into a factual event.",\n      ].join(" ")\n    : "";\n\n  const lensInstruction = [`,
  "add domain context to Mouth guidance",
);

replaceOnce(
  "apps/api/src/services/authorMouthCandidateSearchCanonical.ts",
  /const messages = buildLegacyMessages\(input\);/,
  `const messages = buildLegacyMessages(input);`,
  "messages marker",
);

replaceOnce(
  "apps/api/src/services/authorMouthCandidateSearchCanonical.ts",
  /return messages\.map\(\(message, index\) => \(\{([\s\S]*?)\n  \}\)\);/,
  (full, body) => {
    const replacement = body.replace(/`\$\{message\.content\}\\n\$\{lensInstruction\}`/g, "`${message.content}\\n${lensInstruction}\\n${domainInstruction}`");
    if (replacement === body) throw new Error("Mouth message return shape did not match");
    return `return messages.map((message, index) => {${replacement}\n  });`;
  },
  "append domain context to Mouth messages",
);

console.log("QRE domain-context wiring patch applied safely.");
console.log("Next: pnpm --filter @qre/api build && pnpm --filter @qre/api exec tsx author-lens-acceptance.ts");
