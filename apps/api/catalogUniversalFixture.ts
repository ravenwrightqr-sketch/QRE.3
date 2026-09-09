import { db } from "@qre/db";

const slug = process.argv[2] ?? "house-of-vape-and-smoke";

const syntheticItems = [
  { kind: "product", name: "Lost Mary OS5000 — Blue Razz Ice", brand: "Lost Mary", category: "disposable vape", attrs: [["flavor", "Blue Razz Ice"], ["format", "disposable"]] },
  { kind: "product", name: "Lost Mary BM600 — Strawberry Kiwi", brand: "Lost Mary", category: "disposable vape", attrs: [["flavor", "Strawberry Kiwi"], ["format", "disposable"]] },
  { kind: "product", name: "Lost Mary Watermelon Ice", brand: "Lost Mary", category: "disposable vape", attrs: [["flavor", "Watermelon Ice"], ["format", "disposable"]] },
  { kind: "product", name: "Marlboro Gold", brand: "Marlboro", category: "cigarettes", attrs: [["pack", "20 pack"], ["style", "gold"]] },
  { kind: "product", name: "Marlboro Red", brand: "Marlboro", category: "cigarettes", attrs: [["pack", "20 pack"], ["style", "red"]] },
  { kind: "product", name: "American Spirit Yellow", brand: "American Spirit", category: "cigarettes", attrs: [["pack", "20 pack"], ["style", "yellow"]] },
  { kind: "product", name: "RAW Classic King Size Papers", brand: "RAW", category: "rolling papers", attrs: [["size", "king size"], ["material", "classic"]] },
  { kind: "product", name: "RAW Black King Size Papers", brand: "RAW", category: "rolling papers", attrs: [["size", "king size"], ["material", "black"]] },
  { kind: "product", name: "Glass Spoon Pipe — Blue", brand: null, category: "pipes", attrs: [["pipeType", "spoon"], ["color", "blue"]] },
  { kind: "product", name: "Glass Sherlock Pipe — Green", brand: null, category: "pipes", attrs: [["pipeType", "sherlock"], ["color", "green"]] },
  { kind: "product", name: "Silicone Pocket Pipe", brand: null, category: "pipes", attrs: [["pipeType", "pocket"], ["material", "silicone"]] },
  { kind: "product", name: "Metal Grinder — 4 Piece", brand: null, category: "accessories", attrs: [["accessoryType", "grinder"], ["size", "4 piece"]] },
  { kind: "product", name: "Torch Lighter — Black", brand: null, category: "accessories", attrs: [["accessoryType", "lighter"], ["color", "black"]] },
  { kind: "product", name: "Holographic QRE Keychain", brand: "QRE", category: "keychains", attrs: [["accessoryType", "keychain"], ["finish", "holographic"]] },
  { kind: "product", name: "House Keychain — Neon Green", brand: "House of Vape and Smoke", category: "keychains", attrs: [["accessoryType", "keychain"], ["color", "neon green"]] },
  { kind: "product", name: "Black Metal Keychain", brand: null, category: "keychains", attrs: [["accessoryType", "keychain"], ["material", "metal"]] },
  { kind: "product", name: "Mint Cooling Pouches", brand: null, category: "nicotine pouches", attrs: [["flavor", "mint"], ["format", "pouch"]] },
  { kind: "product", name: "Citrus Pouches", brand: null, category: "nicotine pouches", attrs: [["flavor", "citrus"], ["format", "pouch"]] },
  { kind: "product", name: "Peach Ass Ravenbar", brand: "Ravenbar", category: "mystery trend", attrs: [["concept", "Peach Ass Ravenbar"], ["trend", "overnight"]] },
];

function normalize(value: string) {
  return value.trim().toLowerCase();
}

async function main() {
  const asset = await db.asset.findUnique({ where: { slug }, select: { id: true, slug: true, displayName: true } });
  if (!asset) throw new Error(`Asset not found: ${slug}`);

  const fogger = await db.catalogItem.findMany({
    where: { assetId: asset.id, name: { startsWith: "Fogger — " } },
    select: { id: true, name: true, brand: true, category: true },
  });

  for (const item of fogger) {
    await db.catalogItem.update({
      where: { id: item.id },
      data: { brand: item.brand ?? "Fogger", category: item.category ?? "disposable vape" },
    });
  }

  const created: string[] = [];
  for (const item of syntheticItems) {
    const existing = await db.catalogItem.findFirst({ where: { assetId: asset.id, name: item.name }, select: { id: true } });
    if (existing) continue;

    const catalogItem = await db.catalogItem.create({
      data: {
        assetId: asset.id,
        kind: item.kind,
        name: item.name,
        normalizedName: normalize(item.name),
        brand: item.brand,
        category: item.category,
        status: "active",
        metadata: { universalFixture: true },
      },
    });

    await db.knowledgeObservation.create({
      data: {
        assetId: asset.id,
        catalogItemId: catalogItem.id,
        type: "AVAILABILITY_UPDATE",
        value: { label: item.name, value: "available", source: "universal_fixture" },
        source: "universal_fixture",
        confidence: 1,
        observedAt: new Date(),
      },
    });

    for (const [key, value] of item.attrs) {
      await db.catalogAttribute.create({
        data: {
          catalogItemId: catalogItem.id,
          key,
          value,
          normalizedValue: normalize(value),
          confidence: 1,
        },
      });
    }
    created.push(item.name);
  }

  const total = await db.catalogItem.count({ where: { assetId: asset.id } });
  const brands = await db.catalogItem.findMany({ where: { assetId: asset.id }, distinct: ["brand"], select: { brand: true } });
  const categories = await db.catalogItem.findMany({ where: { assetId: asset.id }, distinct: ["category"], select: { category: true } });

  console.log(JSON.stringify({
    pass: true,
    asset: asset.displayName,
    slug: asset.slug,
    fixture: "universal-mixed-business",
    foggerEnriched: fogger.length,
    syntheticCreated: created.length,
    syntheticItems: created,
    totalCatalogItems: total,
    brandCount: brands.filter((row) => row.brand).length,
    categoryCount: categories.filter((row) => row.category && row.category !== "text").length,
  }, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({ pass: false, error: error instanceof Error ? error.message : String(error) }, null, 2));
  process.exitCode = 1;
}).finally(async () => {
  await db.$disconnect();
});
