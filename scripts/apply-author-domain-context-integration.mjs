import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const F = {
  contracts: "packages/contracts/src/experience/authorBrain.ts",
  service: "apps/api/src/services/experienceService.ts",
  route: "apps/api/src/routes/experience.ts",
  brain: "apps/api/src/services/authorBrainCanonical.ts",
  cognition: "apps/api/src/services/authorCognition.ts",
  mouth: "apps/api/src/services/authorMouthCandidateSearchCanonical.ts",
};

const p = (name) => path.join(root, name);
const read = (name) => fs.readFileSync(p(name), "utf8");
const write = (name, text) => fs.writeFileSync(p(name), text, "utf8");

function replaceOnce(name, regex, replacement, label) {
  const text = read(name);
  const matches = [...text.matchAll(new RegExp(regex.source, regex.flags.includes("g") ? regex.flags : `${regex.flags}g`))];
  if (matches.length === 0) return false;
  if (matches.length > 1) throw new Error(`${name}: ${label}: expected 1 match, got ${matches.length}`);
  write(name, text.replace(regex, replacement));
  return true;
}

function ensure(name, condition, message) {
  if (!condition) throw new Error(`${name}: ${message}`);
}

function has(name, needle) {
  return read(name).includes(needle);
}

// ---------------------------------------------------------------------------
// CONTRACT
// ---------------------------------------------------------------------------
if (!has(F.contracts, "export type AuthorDomainContext")) {
  replaceOnce(
    F.contracts,
    /export type AuthorRhythm = [^;]+;\s*/,
    (m) => `${m}\nexport type AuthorDomainContext = {\n  category?: string;\n  businessType?: string;\n  businessName?: string;\n  businessDescription?: string;\n  serviceType?: string;\n  serviceName?: string;\n  subjectKind?: string;\n  knownCapabilities?: string[];\n  contextualSignals?: string[];\n};\n`,
    "add AuthorDomainContext",
  );
}
if (!has(F.contracts, "domainContext?: AuthorDomainContext")) {
  replaceOnce(
    F.contracts,
    /(RealityGraph\??:\s*RealityGraph;)/,
    "$1\n  domainContext?: AuthorDomainContext;",
    "add domainContext field",
  );
}

// ---------------------------------------------------------------------------
// EXPERIENCE SERVICE
// ---------------------------------------------------------------------------
if (!has(F.service, 'import { db } from "@qre/db";')) {
  replaceOnce(
    F.service,
    /import \{ buildPresenceContext \} from "@qre\/engine";\r?\n?/,
    (m) => `${m}import { db } from "@qre/db";\n`,
    "import db",
  );
}
if (!has(F.service, "AuthorDomainContext")) {
  replaceOnce(
    F.service,
    /(import type \{[\s\S]*?AuthorBrainTruth,[\s\S]*?MemoryContext,)(\r?\n\};)/,
    "$1\n  AuthorDomainContext,$2",
    "import AuthorDomainContext",
  );
}
if (!has(F.service, "function buildAssetDomainContext")) {
  replaceOnce(
    F.service,
    /(function unique\(values: readonly string\[\]\): string\[\] \{[\s\S]*?\r?\n\})/,
    (m) => `${m}\n\nfunction asRecord(value: unknown): Record<string, unknown> | undefined {\n  return value && typeof value === "object" && !Array.isArray(value)\n    ? value as Record<string, unknown>\n    : undefined;\n}\n\nfunction stringList(value: unknown): string[] {\n  if (typeof value === "string") return value.split(/[,|]/).map(clean).filter(Boolean);\n  return Array.isArray(value)\n    ? value.filter((item) => typeof item === "string").map(clean).filter(Boolean)\n    : [];\n}\n\nfunction buildAssetDomainContext(asset: any): AuthorDomainContext | undefined {\n  if (!asset) return undefined;\n  const data = asRecord(asset.templateData);\n  const context: AuthorDomainContext = {\n    category: clean(asset.category || data?.category),\n    businessType: clean(data?.businessType || asset.account?.type),\n    businessName: clean(data?.businessName || asset.account?.name || asset.displayName),\n    businessDescription: clean(data?.businessDescription || data?.description),\n    serviceType: clean(data?.serviceType || data?.service_type),\n    serviceName: clean(data?.serviceName || data?.service || data?.offering),\n    subjectKind: clean(data?.subjectKind || data?.subject_kind),\n    knownCapabilities: unique([\n      ...stringList(data?.services),\n      ...stringList(data?.capabilities),\n      ...stringList(data?.offerings),\n      ...stringList(data?.serviceNames),\n    ]).slice(0, 24),\n    contextualSignals: unique([\n      ...stringList(data?.contextualSignals),\n      ...stringList(data?.signals),\n    ]).slice(0, 24),\n  };\n  return Object.values(context).some((value) => Array.isArray(value) ? value.length > 0 : Boolean(value)) ? context : undefined;\n}\n`,
    "add persistent domain context projector",
  );
}
if (!/\blens\?: string;/.test(read(F.service))) {
  replaceOnce(
    F.service,
    /(movieMode\?: boolean;)(\s*\}\): Promise<CompiledExperienceResult> \{)/,
    "$1\n  lens?: string;$2",
    "add lens to compileExperience",
  );
}
if (!has(F.service, "let domainContext: AuthorDomainContext | undefined;")) {
  replaceOnce(
    F.service,
    /(const requestedMovieMode = input\.movieMode !== false;\s*const warnings: string\[\] = \[\];)/,
    (m) => `${m}\n\n  let domainContext: AuthorDomainContext | undefined;\n  if (input.assetId) {\n    try {\n      const asset = await db.asset.findUnique({\n        where: { id: input.assetId },\n        select: {\n          displayName: true,\n          category: true,\n          templateData: true,\n          account: { select: { name: true, type: true } },\n        },\n      });\n      domainContext = buildAssetDomainContext(asset);\n    } catch (error) {\n      console.warn("[QRE][AUTHORING] Domain context unavailable.", error);\n      warnings.push("domain_context_unavailable");\n    }\n  }`,
    "load persistent domain context",
  );
}
if (!has(F.service, "domainContext:")) {
  replaceOnce(
    F.service,
    /(\s+subjectTruth,)(\s+movieMode: requestedMovieMode,)/,
    "$1\n    lens: clean(input.lens),\n    domainContext,$2",
    "bind domain context to AuthorBrainTruth",
  );
}

// ---------------------------------------------------------------------------
// ROUTE
// ---------------------------------------------------------------------------
if (!has(F.route, "const lens = typeof req.body?.lens")) {
  replaceOnce(
    F.route,
    /(const movieMode = req\.body\?\.movieMode !== false;)/,
    "$1\n    const lens = typeof req.body?.lens === \"string\" ? req.body.lens.trim() : undefined;",
    "read lens from compile request",
  );
}
if (!/\n\s*lens,\s*\n\s*\}\);/.test(read(F.route))) {
  replaceOnce(
    F.route,
    /(\n\s*movieMode,)(\n\s*\}\);)/,
    "$1\n      lens,$2",
    "pass lens to compileExperience",
  );
}

// ---------------------------------------------------------------------------
// CANONICAL BRAIN
// ---------------------------------------------------------------------------
if (!has(F.brain, "memoryContext: input.memoryContext ?? []")) {
  replaceOnce(
    F.brain,
    /memoryContext:\s*\[\],\s*\n\s*priorScenes:\s*\[\],\s*\n\s*priorStrategies:\s*\[\],/,
    "memoryContext: input.memoryContext ?? [],\n    priorScenes: input.trajectory ?? [],\n    priorStrategies: input.creativeLearningContext ?? [],",
    "preserve Cognition context",
  );
}
if (!has(F.brain, "domainContext: input.domainContext")) {
  replaceOnce(
    F.brain,
    /(memoryContext: input\.memoryContext \?\? \[\],\s*\n)/,
    "$1    domainContext: input.domainContext,\n",
    "pass domain context to Cognition",
  );
}
replaceOnce(
  F.brain,
  /memoryContext:\s*\[\],\s*\n\s*trajectory:\s*\[\],/,
  "memoryContext: input.memoryContext ?? [],\n      trajectory: input.trajectory ?? [],",
  "preserve context in RealityGraph projection",
);

if (!/domainContext:\s*input\.domainContext,/.test(read(F.brain))) {
  replaceOnce(
    F.brain,
    /(buildMouthCandidateMessages\(\{[\s\S]*?lens,)/,
    "$1\n      domainContext: input.domainContext,",
    "pass domain context to Mouth",
  );
} else if (!/buildMouthCandidateMessages\(\{[\s\S]*?domainContext:\s*input\.domainContext/.test(read(F.brain))) {
  replaceOnce(
    F.brain,
    /(buildMouthCandidateMessages\(\{[\s\S]*?lens,)/,
    "$1\n      domainContext: input.domainContext,",
    "pass domain context to Mouth",
  );
}

// ---------------------------------------------------------------------------
// COGNITION
// ---------------------------------------------------------------------------
if (!has(F.cognition, "AuthorDomainContext")) {
  replaceOnce(
    F.cognition,
    /(import type \{[\s\S]*?RealityGraph,)(\n\} from "@qre\/contracts";)/,
    "$1\n  AuthorDomainContext,$2",
    "import AuthorDomainContext into Cognition",
  );
}
if (!/domainContext\?: AuthorDomainContext;/.test(read(F.cognition))) {
  replaceOnce(
    F.cognition,
    /(realityGraph\?: RealityGraph;)/,
    "$1\n  domainContext?: AuthorDomainContext;",
    "add domain context to Cognition input",
  );
}
if (!has(F.cognition, "function domainContextText")) {
  replaceOnce(
    F.cognition,
    /(const PRIOR_STATE_PREFIX =\s*[\s\S]*?;\s*)\n/,
    (m) => `${m}\nfunction domainContextText(context?: AuthorDomainContext): string[] {\n  if (!context) return [];\n  return [\n    context.category ? \`domain category: \${context.category}\` : "",\n    context.businessType ? \`business type: \${context.businessType}\` : "",\n    context.businessName ? \`business name: \${context.businessName}\` : "",\n    context.businessDescription ? \`business description: \${context.businessDescription}\` : "",\n    context.serviceType ? \`service type: \${context.serviceType}\` : "",\n    context.serviceName ? \`service: \${context.serviceName}\` : "",\n    context.subjectKind ? \`subject kind: \${context.subjectKind}\` : "",\n    ...(context.knownCapabilities ?? []).map((item) => \`known capability: \${item}\`),\n    ...(context.contextualSignals ?? []).map((item) => \`contextual signal: \${item}\`),\n  ].filter(Boolean);\n}\n`,
    "add Cognition domain context helper",
  );
}
if (!has(F.cognition, "...domainContextText(input.domainContext)")) {
  replaceOnce(
    F.cognition,
    /(function evidenceText\([\s\S]*?return \[\s*\n)/,
    "$1    ...domainContextText(input.domainContext),\n",
    "consume domain context in Cognition evidence text",
  );
}

// ---------------------------------------------------------------------------
// MOUTH
// ---------------------------------------------------------------------------
if (!/domainContext\?: import\("@qre\/contracts"\)\.AuthorDomainContext;/.test(read(F.mouth))) {
  replaceOnce(
    F.mouth,
    /(lens\?: string;)/,
    "$1\n  domainContext?: import(\"@qre/contracts\").AuthorDomainContext;",
    "add domain context to Mouth input",
  );
}
if (!has(F.mouth, "domainContextText(context")) {
  replaceOnce(
    F.mouth,
    /(const lensInstruction = \[[\s\S]*?\n  \]\.join\(" "\);)/,
    (m) => `${m}\n\n  const domainContextText = (context: MouthCandidateGenerationInput["domainContext"]): string => context\n    ? [\n        context.category,\n        context.businessType,\n        context.businessName,\n        context.businessDescription,\n        context.serviceType,\n        context.serviceName,\n        context.subjectKind,\n        ...(context.knownCapabilities ?? []),\n        ...(context.contextualSignals ?? []),\n      ].map(clean).filter(Boolean).join(" | ")\n    : "";`,
    "add Mouth domain context helper",
  );
}
if (!has(F.mouth, "DOMAIN CONTEXT IS CONTEXT, NOT FACT")) {
  replaceOnce(
    F.mouth,
    /(const messages = buildLegacyMessages\(input\);)/,
    `$1\n\n  const domainContextInstruction = domainContextText(input.domainContext)\n    ? [\n        \"DOMAIN CONTEXT IS CONTEXT, NOT FACT.\",\n        \`DOMAIN CONTEXT: \${domainContextText(input.domainContext)}\`,\n        \"Use this context to understand the service/world and discover better framing. Never convert an unstated service step into a new factual event.\",\n      ].join(" ")\n    : \"\";`,
    "build Mouth domain context instruction",
  );
}
if (!has(F.mouth, "${domainContextInstruction}")) {
  replaceOnce(
    F.mouth,
    /(content:\s*\n\s*index === 0\s*\n\s*\? `\$\{message\.content\}\\n\$\{lensInstruction\}`\s*\n\s*: `\$\{message\.content\}\\n\$\{lensInstruction\}`)/,
    "content:\n      `${message.content}\\n${lensInstruction}\\n${domainContextInstruction}`",
    "append domain context to Mouth messages",
  );
}

// Remove obsolete patch machinery; it must not become production architecture.
for (const stale of [
  "scripts/patch-author-domain-context.mjs",
  "scripts/patch-author-domain-context-v2.mjs",
  ".github/workflows/qre-author-domain-context-once.yml",
]) {
  if (fs.existsSync(p(stale))) fs.unlinkSync(p(stale));
}

ensure(F.service, has(F.service, "domainContext:"), "AuthorBrainTruth domain context missing");
ensure(F.route, has(F.route, "const lens = typeof req.body?.lens"), "compile route lens input missing");
ensure(F.brain, has(F.brain, "domainContext: input.domainContext"), "Brain domain context handoff missing");
ensure(F.cognition, has(F.cognition, "...domainContextText(input.domainContext)"), "Cognition domain context consumption missing");
ensure(F.mouth, has(F.mouth, "domainContext?:"), "Mouth domain context input missing");
ensure(F.mouth, has(F.mouth, "DOMAIN CONTEXT IS CONTEXT, NOT FACT"), "Mouth domain context instruction missing");

console.log("QRE Author domain-context integration applied successfully.");
console.log("Boundary: domain context informs Cognition/Mouth but never becomes RealityGraph event evidence.");
console.log("Next: pnpm --filter @qre/api build");
