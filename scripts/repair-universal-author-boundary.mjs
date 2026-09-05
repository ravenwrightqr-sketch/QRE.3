import { readFile, writeFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);

async function replaceExact(relativePath, replacements) {
  const url = new URL(relativePath, root);
  let text = await readFile(url, "utf8");

  for (const { from, to, label } of replacements) {
    const count = text.split(from).length - 1;
    if (count !== 1) {
      throw new Error(`${relativePath}: expected exactly one match for ${label}, found ${count}`);
    }
    text = text.replace(from, to);
  }

  await writeFile(url, text, "utf8");
  console.log(`PATCHED ${relativePath}`);
}

await replaceExact("apps/api/src/services/experienceService.ts", [
  {
    label: "compile input contract",
    from: `  analyticsEvents?: unknown[];\n  geoAnchor?: GeoAnchorInput;\n  movieMode?: boolean;\n  lens?: string;`,
    to: `  analyticsEvents?: unknown[];\n  geoAnchor?: GeoAnchorInput;\n  facts?: string[];\n  sourceMoments?: string[];\n  movieMode?: boolean;\n  lens?: string;`,
  },
  {
    label: "fresh authoring facts",
    from: `  const sourceMoments = unique([prompt, ...(memoryContext?.events ?? []).map((event) => clean(event.summary))]).slice(0, 40);\n  const facts = unique([...(memoryContext?.facts ?? []).filter((fact) => fact.status === "active" && fact.confidence >= 0.7).map((fact) => \`${clean(fact.predicate)}: ${clean(fact.value)}\`)]).slice(0, 80);`,
    to: `  // Universal boundary: prompt is authoring intent; only explicit fact/moment inputs and authorized memory are reality.\n  const sourceMoments = unique([...(input.sourceMoments ?? []), ...(memoryContext?.events ?? []).map((event) => clean(event.summary))]).slice(0, 40);\n  const facts = unique([...(input.facts ?? []), ...(memoryContext?.facts ?? []).filter((fact) => fact.status === "active" && fact.confidence >= 0.7).map((fact) => \`${clean(fact.predicate)}: ${clean(fact.value)}\`)]).slice(0, 80);`,
  },
  {
    label: "graph prompt leakage",
    from: `    sourceMoments: [prompt, ...sourceMoments],`,
    to: `    sourceMoments,`,
  },
]);

await replaceExact("apps/api/src/routes/experience.ts", [
  {
    label: "compile intake arrays",
    from: `    const movieMode = req.body?.movieMode !== false;\n    const lens = typeof req.body?.lens === "string" ? req.body.lens.trim() : undefined;\n    const rawGeo = parseGeoAnchor(req.body?.geo);`,
    to: `    const movieMode = req.body?.movieMode !== false;\n    const lens = typeof req.body?.lens === "string" ? req.body.lens.trim() : undefined;\n    const facts = Array.isArray(req.body?.facts)\n      ? req.body.facts.filter((value: unknown): value is string => typeof value === "string").map((value: string) => value.trim()).filter(Boolean)\n      : [];\n    const sourceMoments = Array.isArray(req.body?.sourceMoments)\n      ? req.body.sourceMoments.filter((value: unknown): value is string => typeof value === "string").map((value: string) => value.trim()).filter(Boolean)\n      : [];\n    const rawGeo = parseGeoAnchor(req.body?.geo);`,
  },
  {
    label: "compile author input",
    from: `  movieMode,\n  lens,\n});`,
    to: `  movieMode,\n  lens,\n  facts,\n  sourceMoments,\n});`,
  },
]);

await replaceExact("apps/api/src/services/aiProvider.ts", [
  {
    label: "ai world lock",
    from: `    "SOURCE-WORLD LOCK: the supplied prompt, facts, sourceMoments, and memoryContext define the factual world.",`,
    to: `    "REQUEST/REALITY SEPARATION: prompt is authoring intent and output request; it is not factual evidence by itself. facts and sourceMoments are supplied reality. memoryContext is prior-world context. Only concrete claims supported by those evidence channels may be rendered as factual.",`,
  },
  {
    label: "ai author truth rule",
    from: `    "The source facts are the world truth. Never invent a person, place, brand, date, object, action, purchase, relationship, motive, physical setting, or outcome as if it were true.",`,
    to: `    "The evidence channels are world truth. Never promote prompt wording, output-format labels, UI labels, service labels, template names, or internal instructions into factual reality. Never invent a person, place, brand, date, object, action, purchase, relationship, motive, physical setting, or outcome as if it were true.",`,
  },
]);

console.log("UNIVERSAL AUTHOR REALITY BOUNDARY REPAIR COMPLETE");
