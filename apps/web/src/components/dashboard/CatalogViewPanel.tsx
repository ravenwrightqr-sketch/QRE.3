import { useEffect, useMemo, useState } from "react";
import { getCatalogView, setCatalogView, type CatalogViewConfig } from "../../lib/api";

type Facets = {
  brands: string[];
  categories: string[];
  attributes: Array<{ key: string; values: string[] }>;
};

type Props = { slug: string };

const baseInputStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 42,
  boxSizing: "border-box",
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,.14)",
  background: "rgba(255,255,255,.04)",
  color: "#fff",
};

export default function CatalogViewPanel({ slug }: Props) {
  const [view, setView] = useState<CatalogViewConfig | null>(null);
  const [facets, setFacets] = useState<Facets>({ brands: [], categories: [], attributes: [] });
  const [status, setStatus] = useState("");

  useEffect(() => {
    void getCatalogView(slug)
      .then((result) => {
        setView(result.view);
        setFacets(result.facets ?? { brands: [], categories: [], attributes: [] });
      })
      .catch((error) => setStatus(error instanceof Error ? error.message : "Could not load catalog view."));
  }, [slug]);

  const selectedAttribute = useMemo(
    () => facets.attributes.find((attribute) => attribute.key === (view?.nameAttributeKey || view?.groupAttributeKey || view?.scope.key)),
    [facets.attributes, view?.groupAttributeKey, view?.nameAttributeKey, view?.scope.key],
  );

  function patch(next: Partial<CatalogViewConfig>) {
    setView((current) => current ? { ...current, ...next } : current);
  }

  function setScope(kind: CatalogViewConfig["scope"]["kind"]) {
    setView((current) => current ? { ...current, scope: { kind } } : current);
  }

  function setAttributeKey(nextKey: string) {
    setView((current) => current ? { ...current, nameAttributeKey: nextKey || undefined, groupAttributeKey: nextKey || undefined, scope: { kind: current.scope.kind === "attribute" ? "attribute" : current.scope.kind, key: nextKey || undefined, value: current.scope.value } } : current);
  }

  async function save() {
    if (!view) return;
    setStatus("Saving…");
    try {
      const result = await setCatalogView(slug, view);
      setView(result.view);
      setFacets(result.facets ?? facets);
      setStatus("Saved");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not save catalog view.");
    }
  }

  if (!view) return <section style={panelStyle}><strong>Catalog view</strong><p style={mutedStyle}>{status || "Loading…"}</p></section>;

  const attributeOptions = facets.attributes;
  const activeAttributeKey = view.nameAttributeKey || view.groupAttributeKey || view.scope.key || attributeOptions[0]?.key || "";
  const activeAttribute = facets.attributes.find((attribute) => attribute.key === activeAttributeKey);

  return (
    <section style={panelStyle}>
      <div style={headingRow}><div><p style={eyebrowStyle}>CATALOG CONTROL</p><h2 style={{ margin: 0 }}>View / detonator</h2></div><span style={statusStyle}>{status}</span></div>
      <p style={mutedStyle}>This changes presentation only. Catalog reality, evidence, relationships, and availability stay intact.</p>

      <div style={gridStyle}>
        <label style={labelStyle}>Title<input value={view.title ?? ""} onChange={(event) => patch({ title: event.target.value || undefined })} placeholder="What’s here" style={baseInputStyle} /></label>
        <label style={labelStyle}>Name<select value={view.nameMode} onChange={(event) => patch({ nameMode: event.target.value as CatalogViewConfig["nameMode"] })} style={baseInputStyle}>
          <option value="item">Item name</option>
          <option value="brand_item">Brand + item</option>
          <option value="attribute">One discovered attribute</option>
        </select></label>
        <label style={labelStyle}>Attribute used for name<select value={view.nameAttributeKey ?? ""} onChange={(event) => setAttributeKey(event.target.value)} style={baseInputStyle} disabled={view.nameMode !== "attribute" && view.groupBy !== "attribute" && view.scope.kind !== "attribute"}>
          <option value="">Choose an attribute</option>{attributeOptions.map((attribute) => <option key={attribute.key} value={attribute.key}>{attribute.key}</option>)}
        </select></label>
        <label style={labelStyle}>Group by<select value={view.groupBy} onChange={(event) => patch({ groupBy: event.target.value as CatalogViewConfig["groupBy"] })} style={baseInputStyle}>
          <option value="none">No grouping</option><option value="brand">Brand</option><option value="category">Category</option><option value="attribute">Discovered attribute</option>
        </select></label>
        <label style={labelStyle}>Order<select value={view.sortBy} onChange={(event) => patch({ sortBy: event.target.value as CatalogViewConfig["sortBy"] })} style={baseInputStyle}>
          <option value="name">Name</option><option value="brand">Brand</option><option value="newest">Newest</option><option value="merchant">Merchant order</option>
        </select></label>
        <label style={labelStyle}>Filter<select value={view.scope.kind} onChange={(event) => setScope(event.target.value as CatalogViewConfig["scope"]["kind"])} style={baseInputStyle}>
          <option value="all">Everything</option><option value="brand">One brand</option><option value="category">One category</option><option value="attribute">One discovered value</option>
        </select></label>
      </div>

      {view.scope.kind === "brand" && <label style={labelStyle}>Brand<select value={view.scope.value ?? ""} onChange={(event) => patch({ scope: { kind: "brand", value: event.target.value } })} style={baseInputStyle}><option value="">Choose a brand</option>{facets.brands.map((brand) => <option key={brand} value={brand}>{brand}</option>)}</select></label>}
      {view.scope.kind === "category" && <label style={labelStyle}>Category<select value={view.scope.value ?? ""} onChange={(event) => patch({ scope: { kind: "category", value: event.target.value } })} style={baseInputStyle}><option value="">Choose a category</option>{facets.categories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>}
      {(view.scope.kind === "attribute" || view.groupBy === "attribute" || view.nameMode === "attribute") && <div style={gridStyle}>
        <label style={labelStyle}>Discovered dimension<select value={activeAttributeKey} onChange={(event) => setAttributeKey(event.target.value)} style={baseInputStyle}><option value="">Choose an attribute</option>{attributeOptions.map((attribute) => <option key={attribute.key} value={attribute.key}>{attribute.key}</option>)}</select></label>
        <label style={labelStyle}>Value<select value={view.scope.value ?? ""} onChange={(event) => patch({ scope: { kind: view.scope.kind === "all" ? "attribute" : view.scope.kind, key: activeAttributeKey || undefined, value: event.target.value } })} style={baseInputStyle} disabled={!activeAttribute}><option value="">Choose a value</option>{activeAttribute?.values.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
      </div>}

      <div style={checksStyle}>
        <label><input type="checkbox" checked={view.showBrand} onChange={(event) => patch({ showBrand: event.target.checked })} /> show brand</label>
        <label><input type="checkbox" checked={view.showCategory} onChange={(event) => patch({ showCategory: event.target.checked })} /> show category</label>
        <label><input type="checkbox" checked={view.showDescription} onChange={(event) => patch({ showDescription: event.target.checked })} /> show description</label>
      </div>

      <button type="button" onClick={() => void save()} style={saveButton}>Save view</button>
    </section>
  );
}

const panelStyle: React.CSSProperties = { marginTop: 48, maxWidth: 900, padding: 24, border: "1px solid rgba(255,255,255,.12)", borderRadius: 18, background: "rgba(255,255,255,.025)" };
const headingRow: React.CSSProperties = { display: "flex", justifyContent: "space-between", gap: 20, alignItems: "start" };
const eyebrowStyle: React.CSSProperties = { margin: "0 0 6px", opacity: .45, letterSpacing: 3, fontSize: 11 };
const mutedStyle: React.CSSProperties = { color: "rgba(255,255,255,.58)", lineHeight: 1.5 };
const statusStyle: React.CSSProperties = { color: "#8cff00", fontSize: 13 };
const gridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14, marginTop: 18 };
const labelStyle: React.CSSProperties = { display: "grid", gap: 7, marginTop: 14, color: "rgba(255,255,255,.8)", fontSize: 13 };
const checksStyle: React.CSSProperties = { display: "flex", gap: 18, flexWrap: "wrap", marginTop: 18, color: "rgba(255,255,255,.78)", fontSize: 13 };
const saveButton: React.CSSProperties = { marginTop: 20, border: 0, borderRadius: 10, padding: "11px 16px", background: "#8cff00", color: "#050505", fontWeight: 800, cursor: "pointer" };
