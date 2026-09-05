import { randomUUID } from "node:crypto";
import { Prisma, db } from "@qre/db";
import type { MemoryContext } from "@qre/contracts";

import { compileExperience } from "./src/services/experienceService.js";
import { createMemoryRepository } from "./src/repositories/memoryRepository.js";
import { buildAuthorRealityGraph } from "./src/services/authorRealityGraph.js";
import { buildExperienceMemoryBatch } from "./src/services/memoryProjection.js";
import { extractAuthorExperienceStates } from "./src/services/authorExperienceMemory.js";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`AUTHOR RUNTIME UNIVERSAL ACCEPTANCE FAILED: ${message}`);
}

function truthKeys(context: MemoryContext): Set<string> {
  const keys = new Set<string>();
  for (const entity of context.entities) keys.add(`E|${entity.kind}|${entity.canonicalKey}`);
  for (const fact of context.facts) keys.add(`F|${fact.kind}|${fact.predicate}|${fact.value}|${fact.status}`);
  for (const relation of context.relations) keys.add(`R|${relation.fromEntityId}|${relation.relation}|${relation.toEntityId}`);
  return keys;
}

function textOf(result: Awaited<ReturnType<typeof compileExperience>>): string[] {
  return result.cinematicScenes
    .map((scene: any) => String(scene?.moment?.payload?.text ?? "").replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function validateCompiled(name: string, result: Awaited<ReturnType<typeof compileExperience>>): void {
  assert(result.authorDiagnostics?.complete === true, `${name}: Author incomplete`);
  assert(result.authorDiagnostics?.renderable === true, `${name}: Author result not renderable`);
  assert(result.authorExperienceState, `${name}: missing Author Experience State`);
  const state: any = result.authorExperienceState;
  assert(state.worldSimulation, `${name}: missing World Simulation`);
  assert(Array.isArray(state.worldSimulation.relations), `${name}: missing world relations`);
  assert(Array.isArray(state.worldSimulation.questions), `${name}: missing world questions`);
  assert(result.momentCount > 0, `${name}: no moments`);
  const texts = textOf(result);
  assert(new Set(texts.map((value) => value.toLowerCase())).size === texts.length, `${name}: duplicate authored text`);
  assert(result.cinematicScenes.every((scene: any) => Array.isArray(scene?.moment?.payload?.sourceIds) && scene.moment.payload.sourceIds.length > 0), `${name}: provenance missing`);
}

async function seedReality(assetId: string, subject: string, place: string | undefined, facts: string[]): Promise<void> {
  const graph = buildAuthorRealityGraph({
    prompt: facts.join(" "),
    subject,
    place,
    facts,
    sourceMoments: facts,
  });
  await createMemoryRepository().writeBatch(
    buildExperienceMemoryBatch({
      operationId: `seed:${assetId}`,
      assetId,
      graph,
      source: "user",
    }),
  );
}

const assetIds: string[] = [];

try {
  const makeAsset = async (displayName: string): Promise<string> => {
    const asset = await db.asset.create({
      data: {
        slug: `author-universal-${randomUUID()}`,
        displayName,
        status: "active",
        paid: false,
      },
      select: { id: true },
    });
    assetIds.push(asset.id);
    return asset.id;
  };

  // WORLD 1 — real service receipt + GAME lens + return/recontextualization.
  const mariaAsset = await makeAsset("Maria Housekeeping");
  const mariaFacts = [
    "Maria arrived at 10:10 AM.",
    "Maria was the housekeeper.",
    "Maria cleaned two bathrooms.",
    "Maria cleaned the kitchen.",
    "Maria left at 12:12 PM.",
  ];
  await seedReality(mariaAsset, "Maria", "the house", mariaFacts);

  const mariaRepo = createMemoryRepository();
  const mariaBefore = await mariaRepo.loadContext({ assetId: mariaAsset });
  const mariaTruthBefore = truthKeys(mariaBefore);
  assert(mariaBefore.entities.some((entity) => entity.name.toLowerCase() === "maria"), "Maria identity was not persisted");

  const mariaGame = await compileExperience({
    prompt: "Create the owner's compact GAME-like experience from Maria's real housekeeping visit. Do not invent service facts.",
    assetId: mariaAsset,
    memoryRepository: mariaRepo,
    movieMode: true,
    lens: "game",
  });
  validateCompiled("maria/game", mariaGame);
  assert(/Maria/i.test(textOf(mariaGame).join(" ")), "maria/game: identity disappeared from realization");

  const mariaNoir = await compileExperience({
    prompt: "Show the same Maria housekeeping reality through a NOIR lens. The lens changes presentation, never reality.",
    assetId: mariaAsset,
    memoryRepository: mariaRepo,
    movieMode: true,
    lens: "noir",
  });
  validateCompiled("maria/noir", mariaNoir);
  assert(textOf(mariaNoir).join(" ") !== textOf(mariaGame).join(" "), "maria/noir: lens did not change realization");
  const mariaAfterNoir = truthKeys(await mariaRepo.loadContext({ assetId: mariaAsset }));
  assert([...mariaTruthBefore].every((key) => mariaAfterNoir.has(key)), "maria/noir: lens mutated established reality");

  const mariaReturn = await compileExperience({
    prompt: "Maria returned to the same house for another service visit. The earlier service remains true; this new visit may change what the owner notices.",
    assetId: mariaAsset,
    memoryRepository: mariaRepo,
    movieMode: true,
    lens: "game",
  });
  validateCompiled("maria/return", mariaReturn);
  const mariaAfterReturn = await mariaRepo.loadContext({ assetId: mariaAsset });
  const mariaTruthAfterReturn = truthKeys(mariaAfterReturn);
  assert([...mariaTruthBefore].every((key) => mariaTruthAfterReturn.has(key)), "maria/return: old reality was lost");
  assert(mariaTruthAfterReturn.size >= mariaTruthBefore.size, "maria/return: world regressed");
  assert(textOf(mariaReturn).join(" ") !== textOf(mariaGame).join(" "), "maria/return: new visit did not change experience");
  assert((mariaReturn.authorExperienceState as any).worldSimulation.reentry.meaningCanChange === true, "maria/return: meaning is frozen");

  // WORLD 2 — pet identity/tag/preferences persist without invented biography.
  const petAsset = await makeAsset("Milo Pet Tag");
  const petFacts = ["Milo is a dog.", "Milo has a pet tag.", "Milo likes bacon.", "Milo likes walks.", "Milo likes small dogs."];
  await seedReality(petAsset, "Milo", undefined, petFacts);
  const petRepo = createMemoryRepository();
  const pet = await compileExperience({
    prompt: "Create a discoverable pet-tag experience from Milo's identity and supplied likes. Do not invent biography.",
    assetId: petAsset,
    memoryRepository: petRepo,
    movieMode: true,
  });
  validateCompiled("pet/tag", pet);
  const petMemory = await petRepo.loadContext({ assetId: petAsset });
  const petText = JSON.stringify(petMemory);
  assert(petMemory.entities.some((entity) => entity.name.toLowerCase() === "milo"), "pet/tag: Milo identity missing");
  assert(/bacon/i.test(petText), "pet/tag: bacon preference missing");
  assert(/walk/i.test(petText), "pet/tag: walk preference missing");
  assert(/small dogs/i.test(petText), "pet/tag: small-dog preference missing");

  // WORLD 3 — wedding is a living shared world, not a fixed wedding story.
  const weddingAsset = await makeAsset("Wedding Living Memory");
  const weddingFacts = [
    "The wedding took place at the venue.",
    "Guests were present.",
    "A photograph from the wedding was kept.",
    "The couple returned to the venue later.",
    "The returned visit added another memory to the same wedding world.",
  ];
  await seedReality(weddingAsset, "the wedding", "the wedding venue", weddingFacts);
  const weddingRepo = createMemoryRepository();
  const wedding = await compileExperience({
    prompt: "Treat the wedding as a living shared memory. Different people can encounter different pieces of the same event-world over time.",
    assetId: weddingAsset,
    memoryRepository: weddingRepo,
    movieMode: true,
  });
  validateCompiled("wedding/living-memory", wedding);
  const weddingStates = extractAuthorExperienceStates(await weddingRepo.loadContext({ assetId: weddingAsset }));
  assert(weddingStates.length > 0, "wedding/living-memory: Author state did not persist");
  assert((wedding.authorExperienceState as any).worldSimulation, "wedding/living-memory: World Simulation missing");

  console.log("AUTHOR RUNTIME UNIVERSAL ACCEPTANCE: PASS");
  console.log("REAL_COMPILE_PATH=TRUE");
  console.log("POSTGRES_MEMORY=TRUE");
  console.log("MARIA_SERVICE_RECEIPT=TRUE");
  console.log("GAME_LENS=TRUE");
  console.log("LENS_DOES_NOT_MUTATE_TRUTH=TRUE");
  console.log("RETURN_RECONTEXTUALIZATION=TRUE");
  console.log("PET_TAG_IDENTITY_AND_LIKES=TRUE");
  console.log("WEDDING_LIVING_MEMORY=TRUE");
  console.log(`AssetsTested=${assetIds.length}`);
} finally {
  for (const assetId of assetIds) {
    await db.$executeRaw(Prisma.sql`DELETE FROM "qre_memory_audit" WHERE "asset_id" = ${assetId}`);
    await db.$executeRaw(Prisma.sql`DELETE FROM "qre_memory_relation" WHERE "asset_id" = ${assetId}`);
    await db.$executeRaw(Prisma.sql`DELETE FROM "qre_memory_fact" WHERE "asset_id" = ${assetId}`);
    await db.$executeRaw(Prisma.sql`DELETE FROM "qre_memory_event" WHERE "asset_id" = ${assetId}`);
    await db.$executeRaw(Prisma.sql`DELETE FROM "qre_memory_entity" WHERE "asset_id" = ${assetId}`);
    await db.analyticsEvent.deleteMany({ where: { assetId } });
    await db.asset.delete({ where: { id: assetId } });
  }
  await db.$disconnect();
}
