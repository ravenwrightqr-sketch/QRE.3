import type { ExperienceMoment } from "@qre/contracts";

type MomentProps = { moment: ExperienceMoment };

export default function MomentRenderer({ moment }: MomentProps) {
  const text = moment.text ?? moment.description ?? moment.title ?? "";
  const url = moment.url ?? (typeof moment.meta?.url === "string" ? moment.meta.url : null);

  switch (moment.type) {
    case "system":
      return <div style={{ width: "100%", textAlign: "center", opacity: 0.82 }}>{text || "Experience Event"}</div>;
    case "action":
      return (
        <button
          onClick={() => { if (url) window.location.href = url; }}
          style={{ width: "100%", padding: "16px 22px", borderRadius: 18, border: "1px solid rgba(0,255,180,.4)", background: "rgba(0,255,180,.12)", color: "white", fontSize: 16, cursor: "pointer", backdropFilter: "blur(10px)" }}
        >
          {moment.label ?? text ?? "Continue →"}
        </button>
      );
    case "location":
      return (
        <div style={{ width: "100%", maxWidth: 940, textAlign: "center" }}>
          <h3 style={{ marginBottom: 8 }}>📍 {moment.location?.label ?? "Location"}</h3>
          {moment.location?.city && <div>{moment.location.city}{moment.location.region ? `, ${moment.location.region}` : ""}</div>}
        </div>
      );
    case "media":
      return moment.media?.length ? <div>{text || "Media"}</div> : <div>Media unavailable</div>;
    default:
      return (
        <div style={{ width: "100%", maxWidth: 940, minHeight: "62vh", padding: "28px 20px", background: "transparent", fontSize: "clamp(32px, 7vw, 78px)", lineHeight: 1.12, display: "grid", placeItems: "center", textAlign: "center", textShadow: "0 6px 36px rgba(0,0,0,.45)" }}>
          {text}
        </div>
      );
  }
}
