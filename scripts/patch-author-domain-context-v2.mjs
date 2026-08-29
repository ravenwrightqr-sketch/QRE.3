import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const p = (name) => path.join(root, name);
const read = (name) => fs.readFileSync(p(name), "utf8");
const write = (name, text) => fs.writeFileSync(p(name), text, "utf8");

function replaceOnce(name, oldText, newText) {
  const text = read(name);
  const count = text.split(oldText).length - 1;
  if (count !== 1) throw new Error(`${name}: expected exactly 1 literal match, got ${count}`);
  write(name, text.replace(oldText, newText));
}

function regexReplaceOnce(name, regex, replacement) {
  const text = read(name);
  const matches = [...text.matchAll(new RegExp(regex.source, regex.flags.includes("g") ? regex.flags : `${regex.flags}g`))];
  if (matches.length !== 1) throw new Error(`${name}: expected exactly 1 regex match, got ${matches.length}`);
  write(name, text.replace(regex, replacement));
}

function patchExperienceContract() {
  const name = "packages/contracts/src/experience/authorBrain.ts";
  const text = read(name);
  if (!text.includes("export type AuthorDomainContext")) {
    replaceOnce(name,
      'export type AuthorRhythm = "hit" | "short" | "standard" | "long";\n\n',
      'export type AuthorRhythm = "hit" | "short" | "standard" | "long";\n\nexport type AuthorDomainContext = {\n  category?: string;\n  businessType?: string;\n  businessName?: string;\n  businessDescription?: string;\n  serviceType?: string;\n  serviceName?: string;\n  subjectKind?: string;\n  knownCapabilities?: string[];\n  contextualSignals?: string[];\n};\n\n',
    );
  }
  if (!read(name).includes("  domainContext?: AuthorDomainContext;")) {
    replaceOnce(name,
      '  realityGraph?: RealityGraph;\n',
      '  realityGraph?: RealityGraph;\n  domainContext?: AuthorDomainContext;\n',
    );
  }
}

function patchExperienceService() {
  const name = "apps/api/src/services/experienceService.ts";
  replaceOnce(name,
    'import { buildPresenceContext } from "@qre/engine";\n',
    'import { buildPresenceContext } from "@qre/engine";\nimport { db } from "@qre/db";\n',
  );
  replaceOnce(name,
    '  MemoryContext,\n} from "@qre/contracts";\n',
    '  MemoryContext,\n  AuthorDomainContext,\n} from "@qre/contracts";\n',
  );
  replaceOnce(name,
    'function unique(values: readonly string[]): string[] {\n  return [...new Set(values.map(clean).filter(Boolean))];\n}\n\n',
    `function unique(values: readonly string[]): string[] {\n  return [...new Set(values.map(clean).filter(Boolean))];\n}\n\nfunction objectRecord(value: unknown): Record<string, unknown> | undefined {\n  return value && typeof value === "object" && !Array.isArray(value)\n    ? value as Record<string, unknown>\n    : undefined;\n}\n\nfunction stringList(value: unknown): string[] {\n  if (typeof value === "string") return value.split(/[,|]/).map(clean).filter(Boolean);\n  return Array.isArray(value)\n    ? value.filter((item) => typeof item === "string").map((item) => clean(item)).filter(Boolean)\n    : [];\n}\n\nfunction buildAssetDomainContext(asset: any): AuthorDomainContext | undefined {\n  if (!asset) return undefined;\n  const data = objectRecord(asset.templateData);\n  const context: AuthorDomainContext = {\n    category: clean(asset.category || asset.template?.category || data?.category) || undefined,\n    businessType: clean(data?.businessType || asset.account?.type) || undefined,\n    businessName: clean(data?.businessName || asset.account?.name || asset.displayName) || undefined,\n    businessDescription: clean(data?.businessDescription || asset.template?.description) || undefined,\n    serviceType: clean(data?.serviceType || data?.service_type) || undefined,\n    serviceName: clean(data?.serviceName || data?.service || data?.offering || asset.template?.name) || undefined,\n    subjectKind: clean(data?.subjectKind || data?.subject_kind) || undefined,\n    knownCapabilities: unique([\n      ...stringList(data?.services),\n      ...stringList(data?.capabilities),\n      ...stringList(data?.offerings),\n    ]).slice(0, 24),\n    contextualSignals: unique([\n      ...stringList(data?.contextualSignals),\n      ...stringList(asset.template?.signals),\n    ]).slice(0, 24),\n  };\n  return Object.values(context).some((value) => Array.isArray(value) ? value.length > 0 : Boolean(value))\n    ? context\n    : undefined;\n}\n\n`,
  );
  replaceOnce(name,
    '  movieMode?: boolean;\n}): Promise<CompiledExperienceResult> {\n',
    '  movieMode?: boolean;\n  lens?: string;\n}): Promise<CompiledExperienceResult> {\n',
  );
  replaceOnce(name,
    '  const requestedMovieMode = input.movieMode !== false;\n  const warnings: string[] = [];\n',
    `  const requestedMovieMode = input.movieMode !== false;\n  const warnings: string[] = [];\n\n  let domainContext: AuthorDomainContext | undefined;\n  if (input.assetId) {\n    try {\n      const asset = await db.asset.findUnique({\n        where: { id: input.assetId },\n        select: {\n          displayName: true,\n          category: true,\n          templateData: true,\n          account: { select: { name: true, type: true } },\n          template: { select: { name: true, category: true, description: true, signals: true } },\n        },\n      });\n      domainContext = buildAssetDomainContext(asset);\n    } catch (error) {\n      console.warn("[QRE][AUTHORING] Domain context unavailable.", error);\n      warnings.push("domain_context_unavailable");\n    }\n  }\n`,
  );
  replaceOnce(name,
    '    subjectTruth,\n    movieMode: requestedMovieMode,\n',
    '    subjectTruth,\n    lens: clean(input.lens),\n    domainContext,\n    movieMode: requestedMovieMode,\n',
  );
  replaceOnce(name,
    '          lens: canonical.brief.angle,\n          movieMode: requestedMovieMode,\n',
    '          lens: canonical.brief.angle,\n          requestedLens: clean(input.lens) || null,\n          domainContext: domainContext ?? null,\n          movieMode: requestedMovieMode,\n',
  );
}

function patchExperienceRoute() {
  const name = "apps/api/src/routes/experience.ts";
  replaceOnce(name,
    '    const movieMode = req.body?.movieMode !== false;\n',
    '    const movieMode = req.body?.movieMode !== false;\n    const lens = typeof req.body?.lens === "string" ? req.body.lens.trim() : undefined;\n',
  );
  replaceOnce(name,
    '      movieMode,\n    });\n',
    '      movieMode,\n      lens,\n    });\n',
  );
}

function patchCognition() {
  const name = "apps/api/src/services/authorCognition.ts";
  replaceOnce(name,
    '  RealityGraph,\n} from "@qre/contracts";\n',
    '  RealityGraph,\n  AuthorDomainContext,\n} from "@qre/contracts";\n',
  );
  replaceOnce(name,
    '  realityGraph?: RealityGraph;\n  memoryContext?: string[];\n',
    '  realityGraph?: RealityGraph;\n  domainContext?: AuthorDomainContext;\n  memoryContext?: string[];\n',
  );
  replaceOnce(name,
    'const PRIOR_STATE_PREFIX =\n  "QRE_AUTHOR_EXPERIENCE_STATE::";\n\n',
    `const PRIOR_STATE_PREFIX =\n  "QRE_AUTHOR_EXPERIENCE_STATE::";\n\nfunction domainContextText(context?: AuthorDomainContext): string[] {\n  if (!context) return [];\n  return [\n    context.category ? \`domain category: \${context.category}\` : "",\n    context.businessType ? \`business type: \${context.businessType}\` : "",\n    context.businessName ? \`business name: \${context.businessName}\` : "",\n    context.businessDescription ? \`business description: \${context.businessDescription}\` : "",\n    context.serviceType ? \`service type: \${context.serviceType}\` : "",\n    context.serviceName ? \`service: \${context.serviceName}\` : "",\n    context.subjectKind ? \`subject kind: \${context.subjectKind}\` : "",\n    ...(context.knownCapabilities ?? []).map((item) => \`known capability: \${item}\`),\n    ...(context.contextualSignals ?? []).map((item) => \`contextual signal: \${item}\`),\n  ].filter(Boolean);\n}\n\n`,
  );
  replaceOnce(name,
    '    ...(input.memoryContext ?? []),\n    ...(input.realityGraph?.events ?? [])\n',
    '    ...(input.memoryContext ?? []),\n    ...domainContextText(input.domainContext),\n    ...(input.realityGraph?.events ?? [])\n',
  );
}

function patchBrain() {
  const name = "apps/api/src/services/authorBrainCanonical.ts";
  replaceOnce(name,
    '    realityGraph: graph,\n    memoryContext: [],\n    priorScenes: [],\n    priorStrategies: [],\n',
    '    realityGraph: graph,\n    domainContext: input.domainContext,\n    memoryContext: input.memoryContext ?? [],\n    priorScenes: input.trajectory ?? [],\n    priorStrategies: input.creativeLearningContext ?? [],\n',
  );
  replaceOnce(name,
    '      {\n        graph,\n        subject,\n      },\n',
    '      {\n        graph,\n        subject,\n        domainContext: input.domainContext,\n      },\n',
  );
}

function patchEnvelope() {
  const name = "apps/api/src/services/authorRealityEnvelope.ts";
  replaceOnce(name,
    'import type {\n  RealityGraph,\n  RealityRelation,\n} from "@qre/contracts";\n',
    'import type {\n  AuthorDomainContext,\n  RealityGraph,\n  RealityRelation,\n} from "@qre/contracts";\n',
  );
  replaceOnce(name,
    '  subject: string;\n  events: RealityEnvelopeEvent[];\n',
    '  subject: string;\n  domainContext?: AuthorDomainContext;\n  events: RealityEnvelopeEvent[];\n',
  );
  replaceOnce(name,
    'export function buildAuthorRealityEnvelope(input: {\n  graph: RealityGraph;\n  subject?: string;\n}): RealityEnvelope {\n',
    'export function buildAuthorRealityEnvelope(input: {\n  graph: RealityGraph;\n  subject?: string;\n  domainContext?: AuthorDomainContext;\n}): RealityEnvelope {\n',
  );
  replaceOnce(name,
    '  return {\n    subject,\n    events: events.map((event) => ({\n',
    '  return {\n    subject,\n    domainContext: input.domainContext\n      ? {\n          ...input.domainContext,\n          knownCapabilities: [...(input.domainContext.knownCapabilities ?? [])],\n          contextualSignals: [...(input.domainContext.contextualSignals ?? [])],\n        }\n      : undefined,\n    events: events.map((event) => ({\n',
  );
}

function patchMouth() {
  const name = "apps/api/src/services/authorMouthCandidateSearchCanonical.ts";
  const before = read(name);
  if (!before.includes("domainContext?.businessType")) {
    replaceOnce(name,
      '  const worldAnchor = overlap(\n    candidateTokens,\n    worldTokens,\n  );\n\n  const semanticDistance',
      `  const worldAnchor = overlap(\n    candidateTokens,\n    worldTokens,\n  );\n\n  const domainTokens = tokenSet(\n    [\n      envelope.domainContext?.category,\n      envelope.domainContext?.businessType,\n      envelope.domainContext?.businessName,\n      envelope.domainContext?.businessDescription,\n      envelope.domainContext?.serviceType,\n      envelope.domainContext?.serviceName,\n      envelope.domainContext?.subjectKind,\n      ...(envelope.domainContext?.knownCapabilities ?? []),\n      ...(envelope.domainContext?.contextualSignals ?? []),\n    ].filter(Boolean).join(" "),\n  );\n\n  const domainAnchor = overlap(\n    candidateTokens,\n    domainTokens,\n  );\n\n  const semanticDistance`,
    );
    replaceOnce(name,
      '    semanticDistance * 0.22 +\n      recognition * 0.26 +\n      lensFit * 0.22 +\n',
      '    semanticDistance * 0.20 +\n      recognition * 0.24 +\n      domainAnchor * 0.08 +\n      lensFit * 0.22 +\n',
    );
  }

  replaceOnce(name,
    '    "Prefer a line with a recognizable semantic anchor and a surprising realization over a merely poetic line.",\n  ].join(" ");\n',
    '    "Prefer a line with a recognizable semantic anchor and a surprising realization over a merely poetic line.",\n    "DOMAIN CONTEXT IS CONTEXT, NOT FACT: use it to understand the service/world and discover better framing, but never convert a typical service step into a new factual event unless it is supplied.",\n    ...envelopeDomainContextGuidance(input.envelope),\n  ].join(" ");\n',
  );

  const text = read(name);
  const marker = 'export function scoreMouthCandidate(input: {';
  const index = text.indexOf(marker);
  if (index < 0) throw new Error(`${name}: score marker not found`);
  const head = text.slice(0, index);
  const scoreFn = `export function scoreMouthCandidate(input: {\n  text: string;\n  beat: MouthCandidateBeat;\n  envelope: RealityEnvelope;\n  priorTexts?: readonly string[];\n}): MouthCandidate {\n  const legacy = scoreLegacyCandidate(input);\n  const sourceLabels = sourceLabelsForBeat(input.beat, input.envelope);\n  const interpretation = evaluateMouthInterpretation({\n    text: input.text,\n    sourceLabels,\n    envelope: input.envelope,\n    beat: input.beat,\n  });\n\n  const lensInput = activeLensByBeat.get(input.beat as object) || undefined;\n  const lensFit = lensFitForCandidate(input.text, lensInput);\n  const groundedSurprise = groundedSurpriseForCandidate(\n    input.text,\n    input.beat,\n    input.envelope,\n    legacy,\n    interpretation,\n    lensInput,\n  );\n\n  const strongLensRealization =\n    interpretation.accepted &&\n    interpretation.unsupportedConcreteRisk === 0 &&\n    lensFit >= 0.46 &&\n    groundedSurprise >= 0.62;\n\n  const reasons = [\n    ...new Set([\n      ...legacy.reasons,\n      ...(strongLensRealization\n        ? ["lens-realization", "grounded-surprise"]\n        : []),\n    ]),\n  ];\n\n  const meaningLift = metric(\n    interpretation.accepted\n      ? interpretation.creativeFraming * 0.38 +\n        lensFit * 0.18 +\n        groundedSurprise * 0.44\n      : legacy.meaningScore,\n  );\n\n  const transitionLift = metric(\n    legacy.transitionScore * 0.56 +\n      groundedSurprise * 0.24 +\n      lensFit * 0.20,\n  );\n\n  const scoreLift = metric(\n    legacy.score * 0.58 +\n      groundedSurprise * 0.25 +\n      lensFit * 0.17,\n  );\n\n  return {\n    ...legacy,\n    meaningScore: Math.max(legacy.meaningScore, meaningLift),\n    transitionScore: Math.max(legacy.transitionScore, transitionLift),\n    reasons,\n    score: Math.max(legacy.score, scoreLift),\n  };\n}\n`;
  write(name, head + scoreFn);
}

function addMouthHelper() {
  const name = "apps/api/src/services/authorMouthCandidateSearchCanonical.ts";
  const text = read(name);
  if (text.includes("function envelopeDomainContextGuidance(")) return;
  const marker = 'function lensFitForCandidate(\n';
  const index = text.indexOf(marker);
  if (index < 0) throw new Error(`${name}: lens helper marker not found`);
  const helper = `function envelopeDomainContextGuidance(envelope: RealityEnvelope): string[] {\n  const context = envelope.domainContext;\n  if (!context) return [];\n  const lines = [\n    context.businessType ? \`BUSINESS TYPE: \${context.businessType}.\` : "",\n    context.businessName ? \`BUSINESS NAME: \${context.businessName}.\` : "",\n    context.serviceType ? \`SERVICE TYPE: \${context.serviceType}.\` : "",\n    context.serviceName ? \`SERVICE NAME: \${context.serviceName}.\` : "",\n    context.subjectKind ? \`SUBJECT KIND: \${context.subjectKind}.\` : "",\n    ...(context.knownCapabilities ?? []).map((item) => \`KNOWN CAPABILITY: \${item}.\`),\n    ...(context.contextualSignals ?? []).map((item) => \`CONTEXTUAL SIGNAL: \${item}.\`),\n  ].filter(Boolean);\n  return lines.length ? [\"CONTEXTUAL DOMAIN KNOWLEDGE:\", ...lines] : [];\n}\n\n`;
  write(name, text.slice(0, index) + helper + text.slice(index));
}

function cleanup() {
  for (const name of [
    "scripts/patch-author-domain-context.mjs",
    "scripts/patch-author-domain-context-v2.mjs",
    ".github/workflows/qre-author-domain-context-once.yml",
  ]) {
    const target = file(name);
    if (fs.existsSync(target)) fs.unlinkSync(target);
  }
}

patchExperienceContract();
patchExperienceService();
patchExperienceRoute();
patchCognition();
patchBrain();
patchEnvelope();
addMouthHelper();
patchMouth();
cleanup();

execFileSync("git", ["add", "-A"], { stdio: "inherit" });
execFileSync("git", ["commit", "-m", "Wire persistent domain context through Author stack [skip ci]"], { stdio: "inherit" });
execFileSync("git", ["push"], { stdio: "inherit" });
console.log("AUTHOR DOMAIN CONTEXT WIRING COMPLETE");
