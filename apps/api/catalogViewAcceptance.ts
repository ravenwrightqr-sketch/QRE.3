import { db } from "@qre/db";
import { applyCatalogView, getCatalogView, getCatalogViewFacets, setCatalogView } from "./src/services/catalogView.js";

const slug = process.argv[2] ?? "house-of-vape-and-smoke";

function fail(message: string): never {
  throw new Error(message);
}

async function main() {
  const asset = await db.asset.findUnique({ where: { slug }, select: { id: true, slug: true, displayName: true } });
  if (!asset) fail(`Asset not found: ${slug}`);

  const items = await db.catalogItem.findMany({
    where: { assetId: asset.id },
    select: { id: true, name: true, brand: true, category: true, attributes: { select: { key: true, value: true, normalizedValue: true }, orderBy: { createdAt: "desc" } } },
  });
  if (items.length < 2) fail(`Expected at least 2 catalog items; found ${items.length}.`);

  const original = await getCatalogView(asset.id);
  const facets = await getCatalogViewFacets(asset.id);
  const firstBrand = facets.brands[0];
  const firstCategory = facets.categories[0];
  const firstAttribute = facets.attributes.find((entry) => entry.values.length > 0);

  try {
    await setCatalogView(asset.id, { ...original, nameMode: "item", showBrand: true, showCategory: false, showDescription: false, groupBy: "none", scope: { kind: "all" }, sortBy: "name" });
    const all = await applyCatalogView(asset.id);
    if (all.count < 2) fail("Default all-items view lost catalog items.");

    await setCatalogView(asset.id, { ...original, showBrand: false, scope: { kind: "all" } });
    const hiddenBrand = await applyCatalogView(asset.id);
    if (hiddenBrand.products.some((product) => product.brand !== null)) fail("Brand presentation was not removed from the visible product payload.");
    const originalBrandItem = items.find((item) => item.brand);
    if (originalBrandItem) {
      const hidden = hiddenBrand.products.find((product) => product.id === originalBrandItem.id);
      if (!hidden?.searchText?.includes(originalBrandItem.brand!.toLowerCase())) fail("Hidden brand remained unsearchable after presentation removal.");
    }

    await setCatalogView(asset.id, { ...original, showBrand: true, nameMode: "brand_item", scope: { kind: "all" } });
    const brandedNames = await applyCatalogView(asset.id);
    if (firstBrand && !brandedNames.products.some((product) => product.name.startsWith(`${firstBrand} — `))) fail("Brand + item naming mode failed.");

    if (firstBrand) {
      await setCatalogView(asset.id, { ...original, showBrand: false, scope: { kind: "brand", value: firstBrand } });
      const oneBrand = await applyCatalogView(asset.id);
      if (oneBrand.count === 0) fail(`Brand scope produced no items for ${firstBrand}.`);
      if (oneBrand.products.some((product) => !product.searchText?.includes(firstBrand.toLowerCase()))) fail("Brand scope returned an item outside the selected brand.");
    }

    if (firstCategory) {
      await setCatalogView(asset.id, { ...original, showBrand: false, showCategory: true, groupBy: "category", scope: { kind: "category", value: firstCategory } });
      const oneCategory = await applyCatalogView(asset.id);
      if (oneCategory.count === 0) fail(`Category scope produced no items for ${firstCategory}.`);
      if (oneCategory.products.some((product) => product.category !== firstCategory)) fail("Category scope returned an item outside the selected category.");
    }

    if (firstAttribute) {
      const attributeValue = firstAttribute.values[0];
      await setCatalogView(asset.id, { ...original, nameMode: "attribute", nameAttributeKey: firstAttribute.key, groupBy: "attribute", groupAttributeKey: firstAttribute.key, scope: { kind: "attribute", key: firstAttribute.key, value: attributeValue } });
      const oneAttribute = await applyCatalogView(asset.id);
      if (oneAttribute.count === 0) fail(`Attribute scope produced no items for ${firstAttribute.key}=${attributeValue}.`);
      if (oneAttribute.products.some((product) => product.groupValue !== attributeValue)) fail("Attribute grouping/scope did not stay on the selected value.");
      if (oneAttribute.products.some((product) => product.name !== attributeValue)) fail("Attribute naming mode did not render the selected attribute.");
    }

    const reset = await setCatalogView(asset.id, { ...original, scope: { kind: "all" }, groupBy: "none" });
    const resetResult = await applyCatalogView(asset.id);
    if (resetResult.count !== all.count) fail("Resetting the view did not restore the original catalog count.");
    if (reset.nameMode !== original.nameMode || reset.scope.kind !== "all") fail("Reset configuration did not persist cleanly.");

    console.log(JSON.stringify({
      pass: true,
      asset: asset.displayName,
      slug: asset.slug,
      catalogItems: items.length,
      facets: { brands: facets.brands.length, categories: facets.categories.length, attributes: facets.attributes.length },
      tested: {
        allItems: true,
        removeAllBrandPresentation: true,
        brandSearchPreservedWhenHidden: Boolean(originalBrandItem),
        brandPlusItem: Boolean(firstBrand),
        singleBrandScope: Boolean(firstBrand),
        categoryScope: Boolean(firstCategory),
        arbitraryAttributeScope: Boolean(firstAttribute),
        resetToAll: true,
      },
      view: reset,
    }, null, 2));
  } finally {
    await setCatalogView(asset.id, original);
  }
}

main()
  .catch((error) => {
    console.error(JSON.stringify({ pass: false, error: error instanceof Error ? error.message : String(error) }, null, 2));
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
