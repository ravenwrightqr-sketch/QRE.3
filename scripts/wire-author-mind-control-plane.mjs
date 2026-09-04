import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const ROOT = process.cwd();

const TARGETS = {
  cognition: "apps/api/src/services/authorCognition.ts",
  brain: "apps/api/src/services/authorBrainCanonical.ts",
  mouth: "apps/api/src/services/authorMouth.ts",
  workflow: ".github/workflows/qre-ci.yml",
};

function abs(relativePath) {
  return path.join(ROOT, relativePath);
}

function read(relativePath) {
  return fs.readFileSync(abs(relativePath), "utf8");
}

function write(relativePath, source) {
  fs.writeFileSync(abs(relativePath), source, "utf8");
}

function parse(relativePath, source) {
  return ts.createSourceFile(
    relativePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
}

function fail(message) {
  throw new Error(`AUTHOR_MIND_WIRING_FAILED: ${message}`);
}

function findExactly(nodes, predicate, description) {
  const matches = nodes.filter(predicate);
  if (matches.length !== 1) {
    fail(`${description}; expected=1; found=${matches.length}`);
  }
  return matches[0];
}

function collect(sourceFile, predicate) {
  const found = [];
  const visit = (node) => {
    if (predicate(node)) found.push(node);
    ts.forEachChild(node, visit);
  };
  ts.forEachChild(sourceFile, visit);
  return found;
}

function lineIndent(source, position) {
  const lineStart = source.lastIndexOf("\n", position - 1) + 1;
  return source.slice(lineStart, position).match(/^\s*/)?.[0] ?? "";
}

function insertBefore(source, position, text) {
  return source.slice(0, position) + text + source.slice(position);
}

function objectLiteralInsertion(source, objectLiteral, propertyText) {
  const closeBrace = objectLiteral.getEnd() - 1;
  const properties = objectLiteral.properties;
  if (properties.length === 0) {
    return insertBefore(source, closeBrace, `\n${propertyText}\n`);
  }
  const last = properties[properties.length - 1];
  const lastEnd = last.getEnd();
  const comma = source.slice(lastEnd, closeBrace).includes(",") ? "" : ",";
  const indent = lineIndent(source, last.getStart(sourceFileFor(source)));
  return insertBefore(
    source,
    closeBrace,
    `${comma}\n${indent}${propertyText}\n`,
  );
}

let sourceFileForObject = null;
function sourceFileFor() {
  return sourceFileForObject;
}

function addImportAfterLastImport(sourceFile, source, importText) {
  const imports = sourceFile.statements.filter(ts.isImportDeclaration);
  if (imports.some((node) => source.slice(node.getStart(sourceFile), node.getEnd()).includes('"./authorMindControlPlane.js"'))) {
    return source;
  }
  const insertionPoint = imports.length
    ? imports[imports.length - 1].getEnd()
    : 0;
  return insertBefore(source, insertionPoint, `\n${importText}`);
}

function propertyExists(typeLiteral, name) {
  return typeLiteral.members.some(
    (member) => ts.isPropertySignature(member) && member.name && member.name.getText(sourceFileFor()) === name,
  );
}

function addTypeProperty(sourceFile, source, typeName, propertyText, propertyName) {
  const declaration = findExactly(
    collect(sourceFile, (node) => ts.isTypeAliasDeclaration(node) && node.name.text === typeName),
    () => true,
    `${typeName} declaration`,
  );
  if (!ts.isTypeLiteralNode(declaration.type)) fail(`${typeName} must be a type literal`);
  sourceFileForObject = sourceFile;
  if (propertyExists(declaration.type, propertyName)) return source;
  const closeBrace = declaration.type.getEnd() - 1;
  const indent = lineIndent(source, declaration.type.getStart(sourceFile)) + "  ";
  return insertBefore(source, closeBrace, `\n${indent}${propertyText}\n${lineIndent(source, declaration.type.getStart(sourceFile))}`);
}

function addObjectProperty(sourceFile, source, functionName, propertyText, propertyName) {
  const fn = findExactly(
    collect(sourceFile, (node) => ts.isFunctionDeclaration(node) && node.name?.text === functionName),
    () => true,
    `${functionName} declaration`,
  );
  const returns = collect(fn, (node) => ts.isReturnStatement(node) && node.expression && ts.isObjectLiteralExpression(node.expression));
  const returnStatement = findExactly(returns, () => true, `${functionName} return object`);
  const object = returnStatement.expression;
  sourceFileForObject = sourceFile;
  const exists = object.properties.some(
    (property) =>
      ts.isPropertyAssignment(property) &&
      ts.isIdentifier(property.name) &&
      property.name.text === propertyName,
  );
  if (exists) return source;

  const closeBrace = object.getEnd() - 1;
  const baseIndent = lineIndent(source, object.getStart(sourceFile));
  const propertyIndent = `${baseIndent}  `;
  const prefix = object.properties.length ? "," : "";
  return insertBefore(
    source,
    closeBrace,
    `${prefix}\n${propertyIndent}${propertyText}\n${baseIndent}`,
  );
}

function addVariableBefore(sourceFile, source, functionName, variableName, statementText) {
  const fn = findExactly(
    collect(sourceFile, (node) => ts.isFunctionDeclaration(node) && node.name?.text === functionName),
    () => true,
    `${functionName} declaration`,
  );
  const variableStatements = collect(
    fn,
    (node) =>
      ts.isVariableStatement(node) &&
      node.declarationList.declarations.some(
        (declaration) => ts.isIdentifier(declaration.name) && declaration.name.text === variableName,
      ),
  );
  const variable = findExactly(variableStatements, () => true, `${functionName}.${variableName}`);
  if (source.includes("const mindState = buildAuthorMindState({")) return source;
  return insertBefore(source, variable.getStart(sourceFile), `${statementText}\n\n`);
}

function addAuthorBriefLines(sourceFile, source) {
  if (source.includes("MIND CONTROL: primary=${mindState.decision.primaryCapability}")) return source;
  const fn = findExactly(
    collect(sourceFile, (node) => ts.isFunctionDeclaration(node) && node.name?.text === "buildAuthorCognitivePlan"),
    () => true,
    "buildAuthorCognitivePlan declaration",
  );
  const arrays = collect(
    fn,
    (node) => ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === "authorBrief" && ts.isArrayLiteralExpression(node.initializer),
  );
  const authorBrief = findExactly(arrays, () => true, "authorBrief array").initializer;
  const closeBrace = authorBrief.getEnd() - 1;
  const indent = lineIndent(source, authorBrief.getStart(sourceFile)) + "  ";
  return insertBefore(
    source,
    closeBrace,
    `\n${indent}\`MIND CONTROL: primary=\${mindState.decision.primaryCapability}; mechanism=\${mindState.decision.primaryMechanism}; active=\${mindState.selectedCapabilityIds.join(",")} .\`,\n${indent}\`FRONTIER: \${mindState.frontier.nextCutObjective}\`,`
      .replace('join(",")} .', 'join(",")}.'),
  );
}

function wireCognition(source) {
  let next = source;
  let sf = parse(TARGETS.cognition, next);
  next = addImportAfterLastImport(
    sf,
    next,
    'import type { AuthorMindState } from "./authorMindControlPlane.js";\nimport {\n  assertAuthorMindState,\n  buildAuthorMindState,\n} from "./authorMindControlPlane.js";\n',
  );

  sf = parse(TARGETS.cognition, next);
  next = addTypeProperty(sf, next, "AuthorCognitivePlan", "mindState: AuthorMindState;", "mindState");

  sf = parse(TARGETS.cognition, next);
  next = addVariableBefore(
    sf,
    next,
    "buildAuthorCognitivePlan",
    "permanentTruths",
    `  const mindState = buildAuthorMindState({\n    graph: input.realityGraph ?? {\n      evidence: [],\n      events: [],\n      relations: [],\n      unresolvedTensions: [],\n      recurringSignals: [],\n      sensorySignals: [],\n    },\n    subject: input.subject,\n    selectedLens,\n    round: input.round,\n    priorScenes: input.priorScenes,\n    movieCandidates: movie.latentMovieCandidates,\n    selectedMovie,\n    experienceState,\n  });\n\n  assertAuthorMindState(mindState);`,
  );

  sf = parse(TARGETS.cognition, next);
  next = addObjectProperty(sf, next, "buildAuthorCognitivePlan", "mindState", "mindState");

  sf = parse(TARGETS.cognition, next);
  next = addAuthorBriefLines(sf, next);
  return next;
}

function addBrainProperty(source) {
  if (source.includes("mindState: cognition.mindState")) return source;
  const sf = parse(TARGETS.brain, source);
  const calls = collect(sf, (node) => ts.isCallExpression(node) && node.expression.getText(sf) === "buildMouthCandidateMessages");
  const call = findExactly(calls, () => true, "buildMouthCandidateMessages call");
  const object = call.arguments[0];
  if (!object || !ts.isObjectLiteralExpression(object)) fail("buildMouthCandidateMessages first argument must be an object literal");
  sourceFileForObject = sf;
  const closeBrace = object.getEnd() - 1;
  const indent = lineIndent(source, object.getStart(sf)) + "  ";
  return insertBefore(source, closeBrace, `\n${indent}mindState: cognition.mindState,`);
}

function wireMouth(source) {
  let next = source;
  let sf = parse(TARGETS.mouth, next);
  next = addImportAfterLastImport(
    sf,
    next,
    'import type { AuthorMindState } from "./authorMindControlPlane.js";\nimport { buildSelectiveAuthorContext } from "./authorMindControlPlane.js";\n',
  );

  sf = parse(TARGETS.mouth, next);
  next = addTypeProperty(sf, next, "MouthCandidateGenerationInput", "mindState?: AuthorMindState;", "mindState");

  if (!next.includes("authorMind: input.mindState ? buildSelectiveAuthorContext(input.mindState) : undefined")) {
    sf = parse(TARGETS.mouth, next);
    const props = collect(sf, (node) => ts.isPropertyAssignment(node) && ts.isIdentifier(node.name) && node.name.text === "task");
    const task = findExactly(props, () => true, "Mouth REALIZE_AUTHORIZED_MATERIAL task");
    const value = source.slice(task.getStart(sf), task.getEnd());
    if (!value.includes('"REALIZE_AUTHORIZED_MATERIAL"')) fail("Mouth task property not found");
    const insertionPoint = task.getEnd();
    next = insertBefore(next, insertionPoint, `,\n${lineIndent(next, task.getStart(sf))}  authorMind: input.mindState ? buildSelectiveAuthorContext(input.mindState) : undefined`);
  }
  return next;
}

function wireWorkflow(source) {
  if (source.includes("author-mind-control-plane-acceptance.ts")) return source;
  const matches = [...source.matchAll(/^\s*- name: Production gate\s*$/gm)];
  if (matches.length !== 1) fail(`CI Production gate step; expected=1; found=${matches.length}`);
  const match = matches[0];
  const indent = match[0].match(/^\s*/)?.[0] ?? "      ";
  const position = match.index;
  const step = `${indent}- name: Author mind control plane acceptance\n${indent}  run: pnpm exec tsx apps/api/author-mind-control-plane-acceptance.ts\n`;
  return insertBefore(source, position, step);
}

const files = Object.values(TARGETS);
const backups = new Map(files.map((relativePath) => [relativePath, read(relativePath)]));

try {
  const cognition = wireCognition(backups.get(TARGETS.cognition));
  const brain = addBrainProperty(backups.get(TARGETS.brain));
  const mouth = wireMouth(backups.get(TARGETS.mouth));
  const workflow = wireWorkflow(backups.get(TARGETS.workflow));

  write(TARGETS.cognition, cognition);
  write(TARGETS.brain, brain);
  write(TARGETS.mouth, mouth);
  write(TARGETS.workflow, workflow);

  console.log("AUTHOR MIND CONTROL PLANE WIRING: PASS");
  console.log("  cognition=CONNECTED");
  console.log("  canonical-brain=CONNECTED");
  console.log("  mouth=CONNECTED_SELECTIVE_CONTEXT");
  console.log("  ci=CONNECTED");
} catch (error) {
  for (const [relativePath, contents] of backups) write(relativePath, contents);
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
