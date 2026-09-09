import { useEffect, useMemo, useState } from "react";
import { getCatalogView, getCustomerCatalog, setCatalogView, type CatalogViewConfig } from "../../lib/api";

type Facets = {
  brands: string[];
  categories: string[];
  attributes: Array<{ key: string; values: string[] }>;
};

type Product = {
  id: string;
  name: string;
  brand: string | null;
  category: string | null;
  description: string | null;
  searchText: string;
};

type Props = { slug: string };

const baseInputStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 46,
  boxSizing: "border-box",
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,.14)",
  background: "rgba(255,255,255,.04)",
  color: "#fff",
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export default function CatalogViewPanel({ slug }: Props) {
  const [view, setView] = useState<CatalogViewConfig | null>(null);
  const [facets, setFacets] = useState<Facets>({ brands: [], categories: [], attributes: [] });
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    void Promise.all([getCatalogView(slug), getCustomerCatalog(slug)])
      .then(([viewResult, catalogResult]) => {
        setView(viewResult.view);
        setFacets(viewResult.facets ?? { brands: [], categories: [], attributes: [] });
        setProducts(catalogResult.products ?? []);
        setQuery(viewResult.view.query ?? "");
      })
      .catch((error) => setStatus(error instanceof Error ? error.message : "Could not load catalog view."));
  }, [slug]);

  function patch(next: Partial<CatalogViewConfig>) {
    setView((current) => current ? { ...current, ...next } : current);
  }

  function narrow(next: CatalogViewConfig["scope"]) {
    setView((current) => current ? { ...current, scope: next } : current);
  }

  const normalizedQuery = normalize(query);
  const matches = useMemo(() => {
    if (!normalizedQuery) return products;
    return products.filter((product) => normalize(product.searchText).includes(normalizedQuery));
  }, [products, normalizedQuery]);

  const suggestions = useMemo(() => {
    if (!normalizedQuery) return [] as Array<{ label: string; kind: "brand" | "category" | "attribute"; key?: string; value: string }>;
    const result: Array<{ label: string; kind: "brand" | "category" | "attribute"; key?: string; value: string }> = [];
    const seen = new Set<string>();
    const add = (entry: { label: string; kind: "brand" | "category" | "attribute"; key?: string; value: string }) => {
      const id = `${entry.kind}:${entry.key ?? ""}:${normalize(entry.value)}`;
      if (seen.has(id)) return;
      seen.add(id);
      result.push(entry);
    };
    for (const brand of facets.brands) if (normalize(brand).includes(normalizedQuery)) add({ label: `Brand: ${brand}`, kind: "brand", value: brand });
    for (const category of facets.categories) if (normalize(category).includes(normalizedQuery)) add({ label: `Category: ${category}`, kind: "category", value: category });
    for (const attribute of facets.attributes) {
      for (const value of attribute.values) {
        if (normalize(value).includes(normalizedQuery)) add({ label: `${attribute.key}: ${value}`, kind: "attribute", key: attribute.key, value });
      }
    }
    return result.slice(0, 8);
  }, [facets, normalizedQuery]);

  async function save() {
    if (!view) return;
    setStatus("Saving…");
    try {
      const next: CatalogViewConfig = {
        ...view,
        query: query.trim() || undefined,
        title: view.title?.trim() || (query.trim() ? query.trim() : undefined),
      };
      const result = await setCatalogView(slug, next);
      setView(result.view);
      setFacets(result.facets ?? facets);
      setStatus("Saved");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not save catalog view.");
    }
  }

  if (!view) return <section style={panelStyle}><strong>Catalog</strong><p style={mutedStyle}>{status || "Loading…"}</p></section>;

  return (
    <section style={panelStyle}>
      <div style={headingRow}>
        <div>
          <p style={eyebrowStyle}>CATALOG</p>
          <h2 style={{ margin: 0 }}>What do you want to show?</h2>
        </div>
        <span style={statusStyle}>{status}</span>
      </div>
      <p style={mutedStyle}>Search naturally. QRE searches names, brands, categories, flavors, and discovered attributes together.</p>

      <label style={{ ...labelStyle, marginTop: 20 }}>
        Search everything
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="strawberry, Fogger, pipes, keychains…"
          style={{ ...baseInputStyle, fontSize: 17 }}
        />
      </label>

      <div style={resultLineStyle}>
        <strong>{matches.length}</strong> {matches.length === 1 ? "match" : "matches"}
        {query.trim() ? <> for <strong>“{query.trim()}”</strong></> : " in the catalog"}
      </div>

      {suggestions.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <p style={smallHeadingStyle}>Narrow it</p>
          <div style={chipRowStyle}>
            {suggestions.map((suggestion) => (
              <button
                key={`${suggestion.kind}:${suggestion.key ?? ""}:${suggestion.value}`}
                type="button"
                onClick={() => {
                  if (suggestion.kind === "brand") narrow({ kind: "brand", value: suggestion.value });
                  else if (suggestion.kind === "category") narrow({ kind: "category", value: suggestion.value });
                  else narrow({ kind: "attribute", key: suggestion.key, value: suggestion.value });
                }}
                style={chipStyle}
              >
                {suggestion.label}
              </button>
            ))}
            {view.scope.kind !== "all" && (
              <button type="button" onClick={() => narrow({ kind: "all" })} style={clearChipStyle}>Clear narrowing</button>
            )}
          </div>
        </div>
      )}

      {query.trim() && matches.length > 0 && (
        <div style={previewStyle}>
          <p style={smallHeadingStyle}>Preview</p>
          <div style={previewListStyle}>
            {matches.slice(0, 8).map((product) => <div key={product.id} style={previewItemStyle}>{product.name}</div>)}
          </div>
          {matches.length > 8 && <p style={mutedStyle}>Showing the first 8 of {matches.length} matches.</p>}
        </div>
      )}

      {query.trim() && matches.length === 0 && (
        <div style={emptyStyle}>No matches. Try a product, brand, flavor, category, or another discovered detail.</div>
      )}

      <div style={advancedStyle}>
        <p style={smallHeadingStyle}>Presentation</p>
        <div style={gridStyle}>
          <label style={labelStyle}>Title<input value={view.title ?? ""} onChange={(event) => patch({ title: event.target.value || undefined })} placeholder="What’s here" style={baseInputStyle} /></label>
          <label style={labelStyle}>Name<select value={view.nameMode} onChange={(event) => patch({ nameMode: event.target.value as CatalogViewConfig["nameMode"] })} style={baseInputStyle}><option value="item">Item name</option><option value="brand_item">Brand + item</option><option value="attribute">One discovered attribute</option></select></label>
          <label style={labelStyle}>Order<select value={view.sortBy} onChange={(event) => patch({ sortBy: event.target.value as CatalogViewConfig["sortBy"] })} style={baseInputStyle}><option value="name">Name</option><option value="brand">Brand</option><option value="newest">Newest</option><option value="merchant">Merchant order</option></select></label>
        </div>
        <div style={checksStyle}>
          <label><input type="checkbox" checked={view.showBrand} onChange={(event) => patch({ showBrand: event.target.checked })} /> show brand</label>
          <label><input type="checkbox" checked={view.showCategory} onChange={(event) => patch({ showCategory: event.target.checked })} /> show category</label>
          <label><input type="checkbox" checked={view.showDescription} onChange={(event) => patch({ showDescription: event.target.checked })} /> show description</label>
        </div>
      </div>

      <button type="button" onClick={() => void save()} style={saveButton}>{query.trim() ? "Save this view" : "Save view"}</button>
      <p style={{ ...mutedStyle, marginBottom: 0 }}>Saving changes presentation only. Catalog reality, evidence, relationships, and availability stay intact.</p>
    </section>
  );
}

const panelStyle: React.CSSProperties = { marginTop: 48, maxWidth: 900, padding: 24, border: "1px solid rgba(255,255,255,.12)", borderRadius: 18, background: "rgba(255,255,255,.025)" };
const headingRow: React.CSSProperties = { display: "flex", justifyContent: "space-between", gap: 20, alignItems: "start" };
const eyebrowStyle: React.CSSProperties = { margin: "0 0 6px", opacity: .45, letterSpacing: 3, fontSize: 11 };
const mutedStyle: React.CSSProperties = { color: "rgba(255,255,255,.58)", lineHeight: 1.5 };
const statusStyle: React.CSSProperties = { color: "#8cff00", fontSize: 13 };
const labelStyle: React.CSSProperties = { display: "grid", gap: 7, marginTop: 14, color: "rgba(255,255,255,.8)", fontSize: 13 };
const smallHeadingStyle: React.CSSProperties = { margin: "0 0 8px", color: "rgba(255,255,255,.55)", fontSize: 12, textTransform: "uppercase", letterSpacing: 2 };
const resultLineStyle: React.CSSProperties = { marginTop: 14, color: "rgba(255,255,255,.72)", fontSize: 14 };
const chipRowStyle: React.CSSProperties = { display: "flex", flexWrap: "wrap", gap: 8 };
const chipStyle: React.CSSProperties = { border: "1px solid rgba(140,255,0,.24)", borderRadius: 999, padding: "8px 11px", background: "rgba(140,255,0,.07)", color: "#fff", cursor: "pointer" };
const clearChipStyle: React.CSSProperties = { ...chipStyle, borderColor: "rgba(255,255,255,.15)", background: "rgba(255,255,255,.04)" };
const previewStyle: React.CSSProperties = { marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,.08)" };
const previewListStyle: React.CSSProperties = { display: "grid", gap: 8 };
const previewItemStyle: React.CSSProperties = { color: "rgba(255,255,255,.9)", padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,.05)" };
const emptyStyle: React.CSSProperties = { marginTop: 20, padding: "14px 0", color: "rgba(255,255,255,.52)" };
const advancedStyle: React.CSSProperties = { marginTop: 24, paddingTop: 18, borderTop: "1px solid rgba(255,255,255,.08)" };
const gridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14 };
const checksStyle: React.CSSProperties = { display: "flex", gap: 18, flexWrap: "wrap", marginTop: 18, color: "rgba(255,255,255,.78)", fontSize: 13 };
const saveButton: React.CSSProperties = { marginTop: 20, border: 0, borderRadius: 12, padding: "12px 18px", background: "#8cff00", color: "#050505", fontWeight: 800, cursor: "pointer" };
