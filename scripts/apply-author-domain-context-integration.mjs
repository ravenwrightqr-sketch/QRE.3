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

function must(condition, message) {
  if (!condition) throw new Error(message);
}

function replaceOnce(name, regex, replacement, label) {
  const text = read(name);
  const matches = [...text.matchAll(new RegExp(regex.source, regex.flags.includes("g") ? regex.flags : `${regex.flags}g`))];
  if (matches.length === 0) return false;
  if (matches.length > 1) {
    throw new Error(`${name}: ${label}: expected 1 match, got ${matches.length}`);
  }
  write(name, text.replace(regex, replacement));
  return true;
}

function ensure(name, condition, message) {
  must(condition, `${name}: ${message}`);
}

// Contract is already present from the earlier commit; make the script safe either way.
if (!read(F.contracts).includes("export type AuthorDomainContext")) {
  replaceOnce(
    F.contracts,
    /export type AuthorRhythm = [^;]+;\s*/,
    (m) => `${m}\nexport type AuthorDomainContext = {\n  category?: string;\n  businessType?: string;\n  businessName?: string;\n  businessDescription?: string;\n  serviceType?: string;\n  serviceName?: string;\n  subjectKind?: string;\n  knownCapabilities?: string[];\n  contextualSignals?: string[];\n};\n`,
    "add AuthorDomainContext",
  );
}
if (!read(F.contracts).includes("domainContext?: AuthorDomainContext")) {
  replaceOnce(
    F.contracts,
    /(RealityGraph\??:\s*RealityGraph;)/,
    "$1\n  domainContext?: AuthorDomainContext;",
    "add domainContext field",
  );
}

// Experience service: persistent business/service context is loaded once from Asset/Account.
if (!read(F.service).includes('import { db } from "@qre/db";')) {
  replaceOnce(
    F.service,
    /import \{ buildPresenceContext \} from "@qre\/engine";\r?\n/,
    (m) => `${m}import { db } from "@qre/db";\n`,
    "import db",
  );
}
if (!read(F.service).includes("AuthorDomainContext")) {
  replaceOnce(
    F.service,
    /(import type \{[\s\S]*?AuthorBrainTruth,[\s\S]*?MemoryContext,)(\r?\n\};)/,
    "$1\n  AuthorDomainContext,$2",
    "import AuthorDomainContext",
  );
}
if (!read(F.service).includes("function buildAssetDomainContext")) {
  replaceOnce(
    F.service,
    /(function unique\(values: readonly string\[\]\): string\[\] \{[\s\S]*?\r?\n\})/,
    (m) => `${m}\n\nfunction asRecord(value: unknown): Record<string, unknown> | undefined {\n  return value && typeof value === "object" && !Array.isArray(value)\n    ? value as Record<string, unknown>\n    : undefined;\n}\n\nfunction stringList(value: unknown): string[] {\n  if (typeof value === "string") return value.split(/[,|]/).map(clean).filter(Boolean);\n  return Array.isArray(value)\n    ? value.filter((item) => typeof item === "string").map(clean).filter(Boolean)\n    : [];\n}\n\nfunction buildAssetDomainContext(asset: any): AuthorDomainContext | undefined {\n  if (!asset) return undefined;\n  const data = asRecord(asset.templateData);\n  const context: AuthorDomainContext = {\n    category: clean(asset.category || data?.category),\n    businessType: clean(data?.businessType || asset.account?.type),\n    businessName: clean(data?.businessName || asset.account?.name || asset.displayName),\n    businessDescription: clean(data?.businessDescription || data?.description),\n    serviceType: clean(data?.serviceType || data?.service_type),\n    serviceName: clean(data?.serviceName || data?.service || data?.offering),\n    subjectKind: clean(data?.subjectKind || data?.subject_kind),\n    knownCapabilities: unique([\n      ...stringList(data?.services),\n      ...stringList(data?.capabilities),\n      ...stringList(data?.offerings),\n      ...stringList(data?.serviceNames),\n    ]).slice(0, 24),\n    contextualSignals: unique([\n      ...stringList(data?.contextualSignals),\n      ...stringList(data?.signals),\n    ]).slice(0, 24),\n  };\n  return Object.values(context).some((value) => Array.isArray(value) ? value.length > 0 : Boolean(value)) ? context : undefined;\n}",
    "add persistent domain context projector",
  );
}

// The current service already has the complete signature; only add lens when absent.
if (!read(F.service).match(/\blens\?: string;/)) {
  replaceOnce(
    F.service,
    /(movieMode\?: boolean;)(\r?\n\s*\}\): Promise<CompiledExperienceResult> \{)/,
    "$1\n  lens?: string;$2",
    "add lens to compileExperience",
  );
}
if (!read(F.service).includes("let domainContext: AuthorDomainContext | undefined;")) {
  replaceOnce(
    F.service,
    /(const requestedMovieMode = input\.movieMode !== false;\s*const warnings: string\[\] = \[\];)/,
    (m) => `${m}\n\n  let domainContext: AuthorDomainContext | undefined;\n  if (input.assetId) {\n    try {\n      const asset = await db.asset.findUnique({\n        where: { id: input.assetId },\n        select: {\n          displayName: true,\n          category: true,\n          templateData: true,\n          account: { select: { name: true, type: true } },\n        },\n      });\n      domainContext = buildAssetDomainContext(asset);\n    } catch (error) {\n      console.warn("[QRE][AUTHORING] Domain context unavailable.", error);\n      warnings.push("domain_context_unavailable");\n    }\n  }`,
    "load persistent domain context",
  );
}
if (!read(F.service).includes("domainContext,")) {
  replaceOnce(
    F.service,
    /(\s+subjectTruth,)(\s+movieMode: requestedMovieMode,)/,
    "$1\n    lens: clean(input.lens),\n    domainContext,$2",
    "bind domain context and lens",
  );
}

// Route: accept lens from frontend. Business context itself is loaded server-side.
if (!read(F.route).includes("const lens = typeof req.body?.lens")) {
  replaceOnce(
    F.route,
    /(const movieMode = req\.body\?\.movieMode !== false;)/,
    "$1\n    const lens = typeof req.body?.lens === \"string\" ? req.body.lens.trim() : undefined;",
    "read lens from request",
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

// Brain: preserve existing upstream context and pass domain context into Mouth.
if (!read(F.brain).includes("memoryContext: input.memoryContext ?? []")) {
  replaceOnce(
    F.brain,
    /memoryContext:\s*\[\],\s*\n\s*priorScenes:\s*\[\],\s*\n\s*priorStrategies:\s*\[\],/,
    "memoryContext: input.memoryContext ?? [],\n    priorScenes: input.trajectory ?? [],\n    priorStrategies: input.creativeLearningContext ?? [],",
    "preserve Cognition context",
  );
}
if (!read(F.brain).includes("domainContext: input.domainContext")) {
  replaceOnce(
    F.brain,
    /(memoryContext: input\.memoryContext \?\? \[\],\s*\n)/,
    "$1    domainContext: input.domainContext,\n",
    "pass domain context to Cognition",
  );
}
if (!read(F.brain).includes("memoryContext: input.memoryContext ?? []") || !read(F.brain).includes("domainContext: input.domainContext")) {
  throw new Error("authorBrainCanonical: failed to wire Cognition context");
}

// The graph itself remains supplied-reality only. Carrying memory here is existing context behavior.
replaceOnce(
  F.brain,
  /memoryContext:\s*\[\],\s*\n\s*trajectory:\s*\[\],/,
  "memoryContext: input.memoryContext ?? [],\n      trajectory: input.trajectory ?? [],",
  "preserve Brain context in RealityGraph",
);

// Mouth receives domainContext as contextual guidance; it does not enter world/event provenance.
if (!read(F.mouth).match(/domainContext\?: import\("@qre\/contracts"\)\.AuthorDomainContext;/)) {
  replaceOnce(
    F.mouth,
    /(lens\?: string;)/,
    "$1\n  domainContext?: import(\"@qre/contracts\").AuthorDomainContext;",
    "add domain context to Mouth input",
  );
}
if (!read(F.mouth).includes("domainContextText")) {
  replaceOnce(
    F.mouth,
    /(const lensInstruction = \[[\s\S]*?\n  \]\.join\(" "\);)/,
    (m) => `${m}\n\nfunction domainContextText(context: MouthCandidateGenerationInput["domainContext"]): string {\n  if (!context) return "";\n  return [\n    context.category,\n    context.businessType,\n    context.businessName,\n    context.businessDescription,\n    context.serviceType,\n    context.serviceName,\n    context.subjectKind,\n    ...(context.knownCapabilities ?? []),\n    ...(context.contextualSignals ?? []),\n  ].map(clean).filter(Boolean).join(" ");\n}`,
    "add Mouth domain-context helper",
  );
}

// Inject a concise context rule into the actual generated message without treating context as evidence.
if (!read(F.mouth).includes("DOMAIN CONTEXT IS CONTEXT, NOT FACT")) {
  replaceOnce(
    F.mouth,
    /(const lensInstruction = \[[\s\S]*?"Prefer a line with a recognizable semantic anchor and a surprising realization over a merely poetic line\."[,]?\s*)/, 
    (m) => `${m}    "DOMAIN CONTEXT IS CONTEXT, NOT FACT: use it to understand the service/world and discover better framing, but never convert an unstated service step into a new factual event.",\n`,
    "add Mouth domain-context rule",
  );
}

// Author Brain -> Mouth handoff.
if (!/domainContext:\s*input\.domainContext,/.test(read(F.brain))) {
  replaceOnce(
    F.brain,
    /(buildMouthCandidateMessages\(\{[\s\S]*?lens,)/,
    "$1\n      domainContext: input.domainContext,",
    "pass domain context to Mouth",
  );
}

// Envelope support is intentionally optional. Do not mutate its schema here because its current shape is
// already consumed safely by the canonical CandidateSearch and domain context can be passed directly to Mouth.

for (const stale of [
  "scripts/patch-author-domain-context.mjs",
  "scripts/patch-author-domain-context-v2.mjs",
  ".github/workflows/qre-author-domain-context-once.yml",
]) {
  if (fs.existsSync(p(stale))) fs.unlinkSync(p(stale));
}

ensure(F.service, read(F.service).includes("domainContext:"), "domain context is not bound to AuthorBrainTruth");
ensure(F.route, read(F.route).includes("lens,"), "lens is not passed to compileExperience");
ensure(F.brain, read(F.brain).includes("domainContext: input.domainContext"), "Brain domain context handoff missing");
ensure(F.mouth, read(F.mouth).includes("domainContext?:"), "Mouth domain context input missing");

console.log("QRE Author domain-context integration patched successfully.");
console.log("Domain context is contextual knowledge, never a RealityGraph event.");
console.log("Next: pnpm --filter @qre/api build");
