import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();

function file(name) {
  return path.join(root, name);
}

function read(name) {
  return fs.readFileSync(file(name), "utf8");
}

function write(name, value) {
  fs.writeFileSync(file(name), value, "utf8");
}

function replaceOnce(name, oldText, newText) {
  const value = read(name);
  const count = value.split(oldText).length - 1;
  if (count !== 1) {
    throw new Error(`${name}: expected exactly 1 match, found ${count}`);
  }
  write(name, value.replace(oldText, newText));
}

function assertContains(name, text) {
  if (!read(name).includes(text)) {
    throw new Error(`${name}: expected text not found: ${text}`);
  }
}

function patchContract() {
  replaceOnce(
    "packages/contracts/src/experience/authorBrain.ts",
    'export type AuthorRhythm = "hit" | "short" | "standard" | "long";\n\n',
    'export type AuthorRhythm = "hit" | "short" | "standard" | "long";\n\nexport type AuthorDomainContext = {\n  category?: string;\n  businessType?: string;\n  businessName?: string;\n  businessDescription?: string;\n  serviceType?: string;\n  serviceName?: string;\n  subjectKind?: string;\n  knownCapabilities?: string[];\n  contextualSignals?: string[];\n};\n\n',
  );
  replaceOnce(
    "packages/contracts/src/experience/authorBrain.ts",
    '  realityGraph?: RealityGraph;\n',
    '  realityGraph?: RealityGraph;\n  domainContext?: AuthorDomainContext;\n',
  );
}

function patchExperienceService() {
  replaceOnce(
    "apps/api/src/services/experienceService.ts",
    'import { buildPresenceContext } from "@qre/engine";\n',
    'import { buildPresenceContext } from "@qre/engine";\nimport { db } from "@qre/db";\n',
  );
  replaceOnce(
    "apps/api/src/services/experienceService.ts",
    '  MemoryContext,\n} from "@qre/contracts";\n',
    '  MemoryContext,\n  AuthorDomainContext,\n} from "@qre/contracts";\n',
  );
  replaceOnce(
    "apps/api/src/services/experienceService.ts",
    'function unique(values: readonly string[]): string[] {\n  return [...new Set(values.map(clean).filter(Boolean))];\n}\n\n',
    'function unique(values: readonly string[]): string[] {\n  return [...new Set(values.map(clean).filter(Boolean))];\n}\n\nfunction record(value: unknown): Record<string, unknown> | undefined {\n  return value && typeof value === "object" && !Array.isArray(value)\n    ? value as Record<string, unknown>\n    : undefined;\n}\n\nfunction stringList(value: unknown): string[] {\n  if (typeof value === "string") return value.split(/[,|]/).map(clean).filter(Boolean);\n  return Array.isArray(value)\n    ? value.filter((item) => typeof item === "string").map((item) => clean(item)).filter(Boolean)\n    : [];\n}\n\nfunction buildAssetDomainContext(asset: any): AuthorDomainContext | undefined {\n  if (!asset) return undefined;\n\n  const data = record(asset.templateData);\n  const category = clean(asset.category || asset.template?.category || data?.category);\n  const businessType = clean(data?.businessType || asset.account?.type || asset.template?.category);\n  const businessName = clean(data?.businessName || asset.account?.name || asset.displayName);\n  const businessDescription = clean(data?.businessDescription || asset.template?.description);\n  const serviceType = clean(data?.serviceType || data?.service_type);\n  const serviceName = clean(data?.serviceName || data?.service || data?.offering);\n  const subjectKind = clean(data?.subjectKind || data?.subject_kind);\n  const knownCapabilities = unique([\n    ...stringList(data?.services),\n    ...stringList(data?.capabilities),\n    ...stringList(data?.offerings),\n  ]).slice(0, 24);\n  const contextualSignals = unique([\n    ...stringList(data?.contextualSignals),\n    ...stringList(asset.template?.signals),\n  ]).slice(0, 24);\n\n  const context: AuthorDomainContext = {\n    category: category || undefined,\n    businessType: businessType || undefined,\n    businessName: businessName || undefined,\n    businessDescription: businessDescription || undefined,\n    serviceType: serviceType || undefined,\n    serviceName: serviceName || undefined,\n    subjectKind: subjectKind || undefined,\n    knownCapabilities,\n    contextualSignals,\n  };\n\n  return Object.values(context).some((value) =>\n    Array.isArray(value) ? value.length > 0 : Boolean(value),\n  )\n    ? context\n    : undefined;\n}\n\n',
  );
  replaceOnce(
    "apps/api/src/services/experienceService.ts",
    '  movieMode?: boolean;\n}): Promise<CompiledExperienceResult> {\n',
    '  movieMode?: boolean;\n  lens?: string;\n}): Promise<CompiledExperienceResult> {\n',
  );
  replaceOnce(
    "apps/api/src/services/experienceService.ts",
    '  const requestedMovieMode = input.movieMode !== false;\n  const warnings: string[] = [];\n',
    '  const requestedMovieMode = input.movieMode !== false;\n  const warnings: string[] = [];\n\n  let domainContext: AuthorDomainContext | undefined;\n  if (input.assetId) {\n    try {\n      const asset = await db.asset.findUnique({\n        where: { id: input.assetId },\n        select: {\n          displayName: true,\n          category: true,\n          templateData: true,\n          account: { select: { name: true, type: true } },\n          template: { select: { name: true, category: true, description: true, signals: true } },\n        },\n      });\n      domainContext = buildAssetDomainContext(asset);\n    } catch (error) {\n      console.warn("[QRE][AUTHORING] Domain context unavailable.", error);\n      warnings.push("domain_context_unavailable");\n    }\n  }\n',
  );
  replaceOnce(
    "apps/api/src/services/experienceService.ts",
    '    prompt,\n    subject,\n    place,\n    subjectTruth,\n',
    '    prompt,\n    subject,\n    place,\n    subjectTruth,\n    lens: clean(input.lens),\n    domainContext,\n',
  );
  replaceOnce(
    "apps/api/src/services/experienceService.ts",
    '          lens: canonical.brief.angle,\n          movieMode: requestedMovieMode,\n',
    '          lens: canonical.brief.angle,\n          requestedLens: clean(input.lens) || null,\n          domainContext: domainContext ?? null,\n          movieMode: requestedMovieMode,\n',
  );
}

function patchRoute() {
  replaceOnce(
    "apps/api/src/routes/experience.ts",
    '    const movieMode = req.body?.movieMode !== false;\n',
    '    const movieMode = req.body?.movieMode !== false;\n    const lens =\n      typeof req.body?.lens === "string"\n        ? req.body.lens.trim()\n        : undefined;\n',
  );
  replaceOnce(
    "apps/api/src/routes/experience.ts",
    '      movieMode,\n    });\n',
    '      movieMode,\n      lens,\n    });\n',
  );
}

function patchCognition() {
  const name = "apps/api/src/services/authorCognition.ts";
  replaceOnce(
    name,
    '  RealityGraph,\n} from "@qre/contracts";\n',
    '  RealityGraph,\n  AuthorDomainContext,\n} from "@qre/contracts";\n',
  );
  replaceOnce(
    name,
    '  realityGraph?: RealityGraph;\n  memoryContext?: string[];\n',
    '  realityGraph?: RealityGraph;\n  domainContext?: AuthorDomainContext;\n  memoryContext?: string[];\n',
  );
  replaceOnce(
    name,
    'const PRIOR_STATE_PREFIX =\n  "QRE_AUTHOR_EXPERIENCE_STATE::";\n\n',
    'const PRIOR_STATE_PREFIX =\n  "QRE_AUTHOR_EXPERIENCE_STATE::";\n\nfunction domainContextText(context?: AuthorDomainContext): string[] {\n  if (!context) return [];\n  return [\n    context.category ? `domain category: ${context.category}` : "",\n    context.businessType ? `business type: ${context.businessType}` : "",\n    context.businessName ? `business name: ${context.businessName}` : "",\n    context.businessDescription ? `business description: ${context.businessDescription}` : "",\n    context.serviceType ? `service type: ${context.serviceType}` : "",\n    context.serviceName ? `service: ${context.serviceName}` : "",\n    context.subjectKind ? `subject kind: ${context.subjectKind}` : "",\n    ...(context.knownCapabilities ?? []).map((item) => `known capability: ${item}`),\n    ...(context.contextualSignals ?? []).map((item) => `contextual signal: ${item}`),\n  ].filter(Boolean);\n}\n\n',
  );
  replaceOnce(
    name,
    '    ...(input.memoryContext ?? []),\n    ...(input.realityGraph?.events ?? [])\n',
    '    ...(input.memoryContext ?? []),\n    ...domainContextText(input.domainContext),\n    ...(input.realityGraph?.events ?? [])\n',
  );
  replaceOnce(
    name,
    '    const text =\n    evidenceText(input);\n',
    '  const text =\n    evidenceText(input);\n',
  );
}

function patchBrain() {
  const name = "apps/api/src/services/authorBrainCanonical.ts";
  replaceOnce(
    name,
    '    realityGraph: graph,\n    memoryContext: [],\n    priorScenes: [],\n    priorStrategies: [],\n',
    '    realityGraph: graph,\n    domainContext: input.domainContext,\n    memoryContext: input.memoryContext ?? [],\n    priorScenes: input.trajectory ?? [],\n    priorStrategies: input.creativeLearningContext ?? [],\n',
  );
  replaceOnce(
    name,
    '      {\n        graph,\n        subject,\n      },\n',
    '      {\n        graph,\n        subject,\n        domainContext: input.domainContext,\n      },\n',
  );
}

function patchEnvelope() {
  const name = "apps/api/src/services/authorRealityEnvelope.ts";
  replaceOnce(
    name,
    'import type {\n  RealityGraph,\n  RealityRelation,\n} from "@qre/contracts";\n',
    'import type {\n  AuthorDomainContext,\n  RealityGraph,\n  RealityRelation,\n} from "@qre/contracts";\n',
  );
  replaceOnce(
    name,
    '  subject: string;\n  events: RealityEnvelopeEvent[];\n',
    '  subject: string;\n  domainContext?: AuthorDomainContext;\n  events: RealityEnvelopeEvent[];\n',
  );
  replaceOnce(
    name,
    'export function buildAuthorRealityEnvelope(input: {\n  graph: RealityGraph;\n  subject?: string;\n}): RealityEnvelope {\n',
    'export function buildAuthorRealityEnvelope(input: {\n  graph: RealityGraph;\n  subject?: string;\n  domainContext?: AuthorDomainContext;\n}): RealityEnvelope {\n',
  );
  replaceOnce(
    name,
    '  return {\n    subject,\n    events: events.map((event) => ({\n',
    '  return {\n    subject,\n    domainContext: input.domainContext\n      ? {\n          ...input.domainContext,\n          knownCapabilities: [...(input.domainContext.knownCapabilities ?? [])],\n          contextualSignals: [...(input.domainContext.contextualSignals ?? [])],\n        }\n      : undefined,\n    events: events.map((event) => ({\n',
  );
}

function patchMouth() {
  const name = "apps/api/src/services/authorMouthCandidateSearchCanonical.ts";
  replaceOnce(
    name,
    '  const worldTokens = tokenSet(\n    [\n',
    '  const worldTokens = tokenSet(\n    [\n',
  );
  replaceOnce(
    name,
    '      ...envelope.unresolvedTensions,\n    ].join(" "),\n  );\n\n  const localAnchor',
    '      ...envelope.unresolvedTensions,\n    ].join(" "),\n  );\n\n  const domainTokens = tokenSet(\n    [\n      envelope.domainContext?.category,\n      envelope.domainContext?.businessType,\n      envelope.domainContext?.businessName,\n      envelope.domainContext?.businessDescription,\n      envelope.domainContext?.serviceType,\n      envelope.domainContext?.serviceName,\n      envelope.domainContext?.subjectKind,\n      ...(envelope.domainContext?.knownCapabilities ?? []),\n      ...(envelope.domainContext?.contextualSignals ?? []),\n    ].filter(Boolean).join(" "),\n  );\n\n  const localAnchor',
  );
  replaceOnce(
    name,
    '  const worldAnchor = overlap(\n    candidateTokens,\n    worldTokens,\n  );\n\n  const semanticDistance',
    '  const worldAnchor = overlap(\n    candidateTokens,\n    worldTokens,\n  );\n\n  const domainAnchor = overlap(\n    candidateTokens,\n    domainTokens,\n  );\n\n  const semanticDistance',
  );
  replaceOnce(
    name,
    '    semanticDistance * 0.22 +\n      recognition * 0.26 +\n      lensFit * 0.22 +\n',
    '    semanticDistance * 0.20 +\n      recognition * 0.24 +\n      domainAnchor * 0.08 +\n      lensFit * 0.22 +\n',
  );
  replaceOnce(
    name,
    '    "Prefer a line with a recognizable semantic anchor and a surprising realization over a merely poetic line.",\n',
    '    "Prefer a line with a recognizable semantic anchor and a surprising realization over a merely poetic line.",\n    "DOMAIN CONTEXT IS CONTEXT, NOT FACT: use it to understand the service/world and discover better framing, but never convert a typical service step into a new factual event unless it is supplied.",\n    ...(envelopeDomainContextGuidance(input.envelope)),\n',
  );
  replaceOnce(
    name,
    '  return messages.map((message, index) => ({\n',
    '  return messages.map((message) => ({\n',
  );

  // Replace the helper/function tail in one deterministic operation.
  const value = read(name);
  const marker = 'export function scoreMouthCandidate(input: {';
  const index = value.indexOf(marker);
  if (index < 0) throw new Error(`${name}: score function marker not found`);

  const head = value.slice(0, index);
  const scoreFn = `export function scoreMouthCandidate(input: {\n  text: string;\n  beat: MouthCandidateBeat;\n  envelope: RealityEnvelope;\n  priorTexts?: readonly string[];\n}): MouthCandidate {\n  const legacy = scoreLegacyCandidate(input);\n  const sourceLabels = sourceLabelsForBeat(input.beat, input.envelope);\n  const interpretation = evaluateMouthInterpretation({\n    text: input.text,\n    sourceLabels,\n    envelope: input.envelope,\n    beat: input.beat,\n  });\n\n  const lensInput = activeLensByBeat.get(input.beat as object) || undefined;\n  const lensFit = lensFitForCandidate(input.text, lensInput);\n  const groundedSurprise = groundedSurpriseForCandidate(\n    input.text,\n    input.beat,\n    input.envelope,\n    legacy,\n    interpretation,\n    lensInput,\n  );\n\n  const strongLensRealization =\n    interpretation.accepted &&\n    interpretation.unsupportedConcreteRisk === 0 &&\n    lensFit >= 0.46 &&\n    groundedSurprise >= 0.62;\n\n  const reasons = [...new Set([\n    ...legacy.reasons,\n    ...(strongLensRealization ? [\"lens-realization\", \"grounded-surprise\"] : []),\n  ])];\n\n  const meaningLift = metric(\n    interpretation.accepted\n      ? interpretation.creativeFraming * 0.38 + lensFit * 0.18 + groundedSurprise * 0.44\n      : legacy.meaningScore,\n  );\n\n  const transitionLift = metric(\n    legacy.transitionScore * 0.56 +\n      groundedSurprise * 0.24 +\n      lensFit * 0.20,\n  );\n\n  const scoreLift = metric(\n    legacy.score * 0.58 +\n      groundedSurprise * 0.25 +\n      lensFit * 0.17,\n  );\n\n  return {\n    ...legacy,\n    meaningScore: Math.max(legacy.meaningScore, meaningLift),\n    transitionScore: Math.max(legacy.transitionScore, transitionLift),\n    reasons,\n    score: Math.max(legacy.score, scoreLift),\n  };\n}\n`;
  write(name, head + scoreFn);
}

function addMouthContextGuidanceHelper() {
  const name = "apps/api/src/services/authorMouthCandidateSearchCanonical.ts";
  const marker = 'function lensFitForCandidate(\n';
  const value = read(name);
  if (value.includes('function envelopeDomainContextGuidance(')) return;
  const helper = `function envelopeDomainContextGuidance(envelope: RealityEnvelope): string[] {\n  const context = envelope.domainContext;\n  if (!context) return [];\n  const lines = [\n    context.businessType ? \`BUSINESS TYPE: \${context.businessType}.\` : \"\",\n    context.businessName ? \`BUSINESS NAME: \${context.businessName}.\` : \"\",\n    context.serviceType ? \`SERVICE TYPE: \${context.serviceType}.\` : \"\",\n    context.serviceName ? \`SERVICE NAME: \${context.serviceName}.\` : \"\",\n    context.subjectKind ? \`SUBJECT KIND: \${context.subjectKind}.\` : \"\",\n    ...(context.knownCapabilities ?? []).map((item) => \`KNOWN CAPABILITY: \${item}.\`),\n    ...(context.contextualSignals ?? []).map((item) => \`CONTEXTUAL SIGNAL: \${item}.\`),\n  ].filter(Boolean);\n  return lines.length\n    ? [\n        \"CONTEXTUAL DOMAIN KNOWLEDGE:\",\n        ...lines,\n      ]\n    : [];\n}\n\n`;
  if (value.indexOf(marker) < 0) throw new Error(`${name}: lens helper marker not found`);
  write(name, value.slice(0, value.indexOf(marker)) + helper + value.slice(value.indexOf(marker)));
}

function patchMouthContext() {
  const name = "apps/api/src/services/authorMouthCandidateSearchCanonical.ts";
  const value = read(name);
  replaceOnce(
    name,
    '  const lensInstruction = [\n    `ACTIVE LENS: ${lens.label || "custom"}.`,\n',
    '  const lensInstruction = [\n    `ACTIVE LENS: ${lens.label || "custom"}.`,\n',
  );
  // Add domain instructions before the instruction array is joined.
  replaceOnce(
    name,
    '    "Prefer a line with a recognizable semantic anchor and a surprising realization over a merely poetic line.",\n  ].join(" ");\n',
    '    "Prefer a line with a recognizable semantic anchor and a surprising realization over a merely poetic line.",\n    ...envelopeDomainContextGuidance(input.envelope),\n  ].join(" ");\n',
  );
  replaceOnce(
    name,
    '  const character = buildCharacterProfile(\n    input.envelope,\n  );\n\n',
    '  const character = buildCharacterProfile(\n    input.envelope,\n  );\n\n',
  );
  void value;
}

function gitCommit() {
  execFileSync("git", ["add", "packages/contracts/src/experience/authorBrain.ts", "apps/api/src/services/authorCognition.ts", "apps/api/src/services/authorBrainCanonical.ts", "apps/api/src/services/authorRealityEnvelope.ts", "apps/api/src/services/authorMouthCandidateSearchCanonical.ts", "apps/api/src/services/experienceService.ts", "apps/api/src/routes/experience.ts"], { stdio: "inherit" });
  execFileSync("git", ["commit", "-m", "Wire persistent domain context through Author stack [skip ci]"], { stdio: "inherit" });
  execFileSync("git", ["push"], { stdio: "inherit" });
}

patchContract();
patchExperienceService();
patchRoute();
patchCognition();
patchBrain();
patchEnvelope();
addMouthContextGuidanceHelper();
patchMouth();
patchMouthContext();

gitCommit();

console.log("AUTHOR DOMAIN CONTEXT PATCH COMPLETE");
