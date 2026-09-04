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

function collect(sourceFile, predicate, root = sourceFile) {
  const found = [];
  const visit = (node) => {
    if (predicate(node)) found.push(node);
    ts.forEachChild(node, visit);
  };
  ts.forEachChild(root, visit);
  return found;
}

function lineIndent(source, position) {
  const lineStart = source.lastIndexOf("\n", position - 1) + 1;
  return source.slice(lineStart, position).match(/^\s*/)?.[0] ?? "";
}

function insertBefore(source, position, text) {
  return source.slice(0, position) + text + source.slice(position);
}

function addImportAfterLastImport(sourceFile, source, importText, importPath) {
  const imports = sourceFile.statements.filter(ts.isImportDeclaration);
  if (
    imports.some(
      (node) =>
        node.moduleSpecifier &&
        ts.isStringLiteral(node.moduleSpecifier) &&
        node.moduleSpecifier.text === importPath,
    )
  ) {
    return source;
  }

  const insertionPoint = imports.length
    ? imports[imports.length - 1].getEnd()
    : 0;
  return insertBefore(source, insertionPoint, `\n${importText}`);
}

function addTypeProperty(sourceFile, source, typeName, propertyText, propertyName) {
  const declaration = findExactly(
    collect(
      sourceFile,
      (node) =>
        ts.isTypeAliasDeclaration(node) && node.name.text === typeName,
    ),
    () => true,
    `${typeName} declaration`,
  );

  if (!ts.isTypeLiteralNode(declaration.type)) {
    fail(`${typeName} must be a type literal`);
  }

  const exists = declaration.type.members.some(
    (member) =>
      ts.isPropertySignature(member) &&
      member.name &&
      member.name.getText(sourceFile) === propertyName,
  );
  if (exists) return source;

  const closeBrace = declaration.type.getEnd() - 1;
  const baseIndent = lineIndent(source, declaration.type.getStart(sourceFile));
  return insertBefore(
    source,
    closeBrace,
    `\n${baseIndent}  ${propertyText}\n${baseIndent}`,
  );
}

function addVariableBefore(sourceFile, source, functionName, variableName, statementText) {
  const fn = findExactly(
    collect(
      sourceFile,
      (node) =>
        ts.isFunctionDeclaration(node) && node.name?.text === functionName,
    ),
    () => true,
    `${functionName} declaration`,
  );

  const variableStatements = collect(
    sourceFile,
    (node) =>
      ts.isVariableStatement(node) &&
      node.declarationList.declarations.some(
        (declaration) =>
          ts.isIdentifier(declaration.name) &&
          declaration.name.text === variableName,
      ),
    fn,
  );

  const variable = findExactly(
    variableStatements,
    () => true,
    `${functionName}.${variableName}`,
  );

  if (source.includes("const mindState = buildAuthorMindState({")) {
    return source;
  }

  return insertBefore(
    source,
    variable.getStart(sourceFile),
    `${statementText}\n\n`,
  );
}

function addReturnProperty(sourceFile, source, functionName, propertyText, propertyName) {
  const fn = findExactly(
    collect(
      sourceFile,
      (node) =>
        ts.isFunctionDeclaration(node) && node.name?.text === functionName,
    ),
    () => true,
    `${functionName} declaration`,
  );

  const returns = collect(
    sourceFile,
    (node) =>
      ts.isReturnStatement(node) &&
      node.expression &&
      ts.isObjectLiteralExpression(node.expression),
    fn,
  );

  const returnStatement = findExactly(
    returns,
    () => true,
    `${functionName} return object`,
  );
  const object = returnStatement.expression;

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

function addBrainProperty(source) {
  if (source.includes("mindState: cognition.mindState")) return source;

  const sf = parse(TARGETS.brain, source);
  const calls = collect(
    sf,
    (node) =>
      ts.isCallExpression(node) &&
      node.expression.getText(sf) === "buildMouthCandidateMessages",
  );

  const call = findExactly(calls, () => true, "buildMouthCandidateMessages call");
  const object = call.arguments[0];
  if (!object || !ts.isObjectLiteralExpression(object)) {
    fail("buildMouthCandidateMessages first argument must be an object literal");
  }

  const closeBrace = object.getEnd() - 1;
  const baseIndent = lineIndent(source, object.getStart(sf));
  return insertBefore(
    source,
    closeBrace,
    `\n${baseIndent}  mindState: cognition.mindState,\n${baseIndent}`,
  );
}

function addMouthProperty(source) {
  let next = source;
  let sf = parse(TARGETS.mouth, next);

  next = addImportAfterLastImport(
    sf,
    next,
    'import {\n  buildSelectiveAuthorContext,\n  type AuthorMindState,\n} from "./authorMindControlPlane.js";\n',
    "./authorMindControlPlane.js",
  );

  sf = parse(TARGETS.mouth, next);
  next = addTypeProperty(
    sf,
    next,
    "MouthCandidateGenerationInput",
    "mindState?: AuthorMindState;",
    "mindState",
  );

  if (next.includes("authorMind: input.mindState ? buildSelectiveAuthorContext(input.mindState) : undefined")) {
    return next;
  }

  sf = parse(TARGETS.mouth, next);
  const taskProperties = collect(
    sf,
    (node) =>
      ts.isPropertyAssignment(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === "task" &&
      ts.isStringLiteral(node.initializer) &&
      node.initializer.text === "REALIZE_AUTHORIZED_MATERIAL",
  );
  const task = findExactly(
    taskProperties,
    () => true,
    "Mouth REALIZE_AUTHORIZED_MATERIAL task",
  );

  const insertionPoint = task.getEnd();
  const indent = lineIndent(next, task.getStart(sf));
  return insertBefore(
    next,
    insertionPoint,
    `,\n${indent}  authorMind: input.mindState ? buildSelectiveAuthorContext(input.mindState) : undefined`,
  );
}

function wireCognition(source) {
  let next = source;
  let sf = parse(TARGETS.cognition, next);

  next = addImportAfterLastImport(
    sf,
    next,
    'import type { AuthorMindState } from "./authorMindControlPlane.js";\nimport {\n  assertAuthorMindState,\n  buildAuthorMindState,\n} from "./authorMindControlPlane.js";\n',
    "./authorMindControlPlane.js",
  );

  sf = parse(TARGETS.cognition, next);
  next = addTypeProperty(
    sf,
    next,
    "AuthorCognitivePlan",
    "mindState: AuthorMindState;",
    "mindState",
  );

  sf = parse(TARGETS.cognition, next);
  next = addVariableBefore(
    sf,
    next,
    "buildAuthorCognitivePlan",
    "permanentTruths",
    `  const mindState = buildAuthorMindState({\n    graph: input.realityGraph ?? {\n      evidence: [],\n      events: [],\n      relations: [],\n      unresolvedTensions: [],\n      recurringSignals: [],\n      sensorySignals: [],\n    },\n    subject: input.subject,\n    selectedLens,\n    round: input.round,\n    priorScenes: input.priorScenes,\n    movieCandidates: movie.latentMovieCandidates,\n    selectedMovie,\n    experienceState,\n  });\n\n  assertAuthorMindState(mindState);`,
  );

  sf = parse(TARGETS.cognition, next);
  next = addReturnProperty(
    sf,
    next,
    "buildAuthorCognitivePlan",
    "mindState",
    "mindState",
  );

  return next;
}

function wireWorkflow(source) {
  if (source.includes("author-mind-control-plane-acceptance.ts")) return source;

  const matches = [...source.matchAll(/^\s*- name: Production gate\s*$/gm)];
  if (matches.length !== 1) {
    fail(`CI Production gate step; expected=1; found=${matches.length}`);
  }

  const match = matches[0];
  const indent = match[0].match(/^\s*/)?.[0] ?? "      ";
  const step = `${indent}- name: Author mind control plane acceptance\n${indent}  run: pnpm exec tsx apps/api/author-mind-control-plane-acceptance.ts\n`;
  return insertBefore(source, match.index, step);
}

const files = Object.values(TARGETS);
const backups = new Map(
  files.map((relativePath) => [relativePath, read(relativePath)]),
);

try {
  const cognition = wireCognition(backups.get(TARGETS.cognition));
  const brain = addBrainProperty(backups.get(TARGETS.brain));
  const mouth = addMouthProperty(backups.get(TARGETS.mouth));
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
