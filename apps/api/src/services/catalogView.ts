import { db } from "@qre/db";

export type CatalogViewConfig = {
  version: 1;
  title?: string;
  nameMode: "item" | "brand_item" | "attribute";
  nameAttributeKey?: string;
  showBrand: boolean;
  showCategory: boolean;
  showDescription: boolean;
  groupBy: "none" | "brand" | "category" | "attribute";
  groupAttributeKey?: string;
  scope: {
    kind: "all" | "brand" | "category" | "attribute";
    key?: string;
    value?: string;
  };
  sortBy: "name" | "brand" | "newest" | "merchant";
};

export type CatalogViewFacets = {
  brands: string[];
  categories: string[];
  attributes: Array<{ key: string; values: string[] }>;
};

export const DEFAULT_CATALOG_VIEW: CatalogViewConfig = {
  version: 1,
  nameMode: "item",
  showBrand: true,
  showCategory: false,
  showDescription: false,
  groupBy: "none",
  scope: { kind: "all" },
  sortBy: "name",
};

function cleanString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const clean = value.trim();
  return clean || undefined;
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export function normalizeCatalogView(input: unknown): CatalogViewConfig {
  const raw = input && typeof input === "object" && !Array.isArray(input) ? input as Record<string, unknown> : {};
  const scopeRaw = raw.scope && typeof raw.scope === "object" && !Array.isArray(raw.scope) ? raw.scope as Record<string, unknown> : {};
  const view: CatalogViewConfig = {
    version: 1,
    title: cleanString(raw.title),
    nameMode: raw.nameMode === "brand_item" || raw.nameMode === "attribute" ? raw.nameMode : "item",
    nameAttributeKey: cleanString(raw.nameAttributeKey),
    showBrand: raw.showBrand !== false,
    showCategory: raw.showCategory === true,
    showDescription: raw.showDescription === true,
    groupBy: raw.groupBy === "brand" || raw.groupBy === "category" || raw.groupBy === "attribute" ? raw.groupBy : "none",
    groupAttributeKey: cleanString(raw.groupAttributeKey),
    scope: {
      kind: scopeRaw.kind === "brand" || scopeRaw.kind === "category" || scopeRaw.kind === "attribute" ? scopeRaw.kind : "all",
      key: cleanString(scopeRaw.key),
      value: cleanString(scopeRaw.value),
    },
    sortBy: raw.sortBy === "brand" || raw.sortBy === "newest" || raw.sortBy === "merchant" ? raw.sortBy : "name",
  };
  if (view.nameMode === "attribute" && !view.nameAttributeKey) view.nameMode = "item";
  if (view.groupBy === "attribute" && !view.groupAttributeKey) view.groupBy = "none";
  if (view.scope.kind === "attribute" && (!view.scope.key || !view.scope.value)) view.scope = { kind: "all" };
  if ((view.scope.kind === "brand" || view.scope.kind === "category") && !view.scope.value) view.scope = { kind: "all" };
  return view;
}

function mergeView(templateData: unknown, view: CatalogViewConfig) {
  const base = templateData && typeof templateData === "object" && !Array.isArray(templateData) ? templateData as Record<string, unknown> : {};
  return { ...base, catalogView: view };
}

export async function getCatalogView(assetId: string): Promise<CatalogViewConfig> {
  const asset = await db.asset.findUnique({ where: { id: assetId }, select: { templateData: true } });
  if (!asset) throw new Error("Asset not found.");
  const templateData = asset.templateData && typeof asset.templateData === "object" && !Array.isArray(asset.templateData) ? asset.templateData as Record<string, unknown> : {};
  return normalizeCatalogView(templateData.catalogView);
}

export async function setCatalogView(assetId: string, input: unknown): Promise<CatalogViewConfig> {
  const view = normalizeCatalogView(input);
  const asset = await db.asset.findUnique({ where: { id: assetId }, select: { templateData: true } });
  if (!asset) throw new Error("Asset not found.");
  await db.asset.update({ where: { id: assetId }, data: { templateData: mergeView(asset.templateData, view) } });
  return view;
}

async function readCatalogItems(assetId: string) {
  return db.catalogItem.findMany({
    where: { assetId },
    orderBy: { name: "asc" },
    include: {
      attributes: { orderBy: { createdAt: "desc" }, select: { key: true, value: true, normalizedValue: true, createdAt: true } },
      observations: { orderBy: { observedAt: "desc" }, take: 1, select: { value: true } },
    },
  });
}

function latestAttributes(attributes: Array<{ key: string; value: string; normalizedValue: string | null; createdAt: Date }>) {
  const result = new Map<string, { value: string; normalizedValue: string }>();
  for (const attribute of attributes) {
    const key = normalize(attribute.key);
    if (!key || result.has(key)) continue;
    result.set(key, { value: attribute.value, normalizedValue: normalize(attribute.normalizedValue ?? attribute.value) });
  }
  return result;
}

function availability(item: { observations: Array<{ value: unknown }> }) {
  const raw = item.observations[0]?.value;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return "observed";
  const value = typeof (raw as Record<string, unknown>).value === "string" ? String((raw as Record<string, unknown>).value).trim().toLowerCase() : "";
  if (value === "unavailable" || value.includes("sold")) return "unavailable";
  if (value === "available") return "available";
  return "observed";
}

export async function getCatalogViewFacets(assetId: string): Promise<CatalogViewFacets> {
  const items = await readCatalogItems(assetId);
  const brands = new Set<string>();
  const categories = new Set<string>();
  const attributes = new Map<string, Set<string>>();
  for (const item of items) {
    if (item.brand?.trim()) brands.add(item.brand.trim());
    if (item.category?.trim() && item.category.trim().toLowerCase() !== "text") categories.add(item.category.trim());
    for (const attribute of item.attributes) {
      const key = attribute.key.trim();
      const value = attribute.value.trim();
      if (!key || !value) continue;
      if (!attributes.has(key.toLowerCase())) attributes.set(key.toLowerCase(), new Set<string>());
      attributes.get(key.toLowerCase())!.add(value);
    }
  }
  return {
    brands: [...brands].sort((a, b) => a.localeCompare(b)),
    categories: [...categories].sort((a, b) => a.localeCompare(b)),
    attributes: [...attributes.entries()].map(([key, values]) => ({ key, values: [...values].sort((a, b) => a.localeCompare(b)) })).sort((a, b) => a.key.localeCompare(b.key)),
  };
}

function matchesScope(item: { brand: string | null; category: string | null; attributes: Array<{ key: string; value: string; normalizedValue: string | null; createdAt: Date }> }, scope: CatalogViewConfig["scope"]): boolean {
  if (scope.kind === "all") return true;
  const target = normalize(scope.value ?? "");
  if (!target) return true;
  if (scope.kind === "brand") return normalize(item.brand ?? "") === target;
  if (scope.kind === "category") return normalize(item.category ?? "") === target;
  const key = normalize(scope.key ?? "");
  return item.attributes.some((attribute) => normalize(attribute.key) === key && normalize(attribute.normalizedValue ?? attribute.value) === target);
}

export async function applyCatalogView(assetId: string, input?: unknown) {
  const view = input === undefined ? await getCatalogView(assetId) : normalizeCatalogView(input);
  const items = await readCatalogItems(assetId);
  const visible = items.filter((item) => availability(item) === "available").filter((item) => matchesScope(item, view.scope));
  const rendered = visible.map((item) => {
    const attributes = latestAttributes(item.attributes);
    const attributeValue = view.nameAttributeKey ? attributes.get(normalize(view.nameAttributeKey))?.value : undefined;
    const name = view.nameMode === "attribute" && attributeValue ? attributeValue : view.nameMode === "brand_item" && item.brand ? `${item.brand} — ${item.name}` : item.name;
    const merchantOrderRaw = item.metadata && typeof item.metadata === "object" && !Array.isArray(item.metadata) ? (item.metadata as Record<string, unknown>).merchantOrder : undefined;
    const merchantOrder = typeof merchantOrderRaw === "number" ? merchantOrderRaw : Number.MAX_SAFE_INTEGER;
    const searchText = [item.name, item.brand, item.category, item.description, ...item.attributes.flatMap((attribute) => [attribute.key, attribute.value])].filter(Boolean).join(" ").toLowerCase();
    return {
      id: item.id,
      kind: item.kind,
      name,
      brand: view.showBrand ? item.brand : null,
      category: view.showCategory ? item.category : null,
      description: view.showDescription ? item.description : null,
      groupValue: view.groupBy === "brand" ? item.brand ?? "" : view.groupBy === "category" ? item.category ?? "" : view.groupBy === "attribute" ? attributes.get(normalize(view.groupAttributeKey ?? ""))?.value ?? "" : null,
      searchText,
      _name: item.name,
      _brand: item.brand ?? "",
      _createdAt: item.createdAt.getTime(),
      _merchantOrder: merchantOrder,
    };
  });
  rendered.sort((a, b) => {
    if (view.groupBy !== "none") {
      const groupCompare = (a.groupValue ?? "").localeCompare(b.groupValue ?? "");
      if (groupCompare !== 0) return groupCompare;
    }
    if (view.sortBy === "brand") return a._brand.localeCompare(b._brand) || a._name.localeCompare(b._name);
    if (view.sortBy === "newest") return b._createdAt - a._createdAt || a._name.localeCompare(b._name);
    if (view.sortBy === "merchant") return a._merchantOrder - b._merchantOrder || a._name.localeCompare(b._name);
    return a._name.localeCompare(b._name);
  });
  return {
    view,
    products: rendered.map(({ _name: _n, _brand: _b, _createdAt: _c, _merchantOrder: _m, ...product }) => product),
    count: rendered.length,
  };
}
