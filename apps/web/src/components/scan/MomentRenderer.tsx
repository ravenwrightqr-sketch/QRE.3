import type { ExperienceMoment } from "@qre/contracts";

type MomentProps = { moment: ExperienceMoment };

type TextLayout = {
  text: string;
  className: "micro" | "short" | "medium" | "long";
  lines: string[];
};

function cleanText(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function splitCinematicText(value: string): string[] {
  const text = cleanText(value);
  if (!text) return [];

  const sentenceParts = text
    .split(/(?<=[.!?])\s+|\s*\n+\s*/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (sentenceParts.length > 1) {
    return sentenceParts.flatMap((sentence) => {
      if (sentence.length <= 82) return [sentence];
      return splitLongClause(sentence);
    });
  }

  return text.length > 82 ? splitLongClause(text) : [text];
}

function splitLongClause(value: string): string[] {
  const words = value.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > 64 && current) {
      chunks.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }

  if (current) chunks.push(current);
  return chunks;
}

function getLayout(text: string): TextLayout {
  const normalized = cleanText(text);
  const lines = splitCinematicText(normalized);
  const longest = Math.max(...lines.map((line) => line.length), 0);
  const total = normalized.length;

  if (total <= 34 && lines.length === 1) return { text: normalized, className: "short", lines };
  if (total <= 82 && lines.length <= 2) return { text: normalized, className: "medium", lines };
  if (longest <= 70 && lines.length <= 3) return { text: normalized, className: "long", lines };
  return { text: normalized, className: "micro", lines };
}

function CinematicText({ text }: { text: string }) {
  const layout = getLayout(text);
  if (!layout.lines.length) return null;

  return (
    <div
      style={{
        width: "min(88vw, 900px)",
        maxHeight: "68dvh",
        overflow: "hidden",
        display: "grid",
        gap: "clamp(8px, 1.8vh, 18px)",
        placeItems: "center",
        textAlign: "center",
        textWrap: "balance" as any,
        padding: "0 6vw",
      }}
    >
      {layout.lines.map((line, index) => (
        <div
          key={`${index}-${line}`}
          style={{
            maxWidth: "18ch",
            fontSize:
              layout.className === "short"
                ? "clamp(34px, 6.5vw, 72px)"
                : layout.className === "medium"
                  ? "clamp(28px, 5.2vw, 58px)"
                  : layout.className === "long"
                    ? "clamp(24px, 4.2vw, 46px)"
                    : "clamp(19px, 3.4vw, 38px)",
            lineHeight: layout.className === "short" ? 1.0 : 1.08,
            fontWeight: index === layout.lines.length - 1 && layout.lines.length > 1 ? 520 : 460,
            letterSpacing: layout.className === "short" ? "-0.035em" : "-0.02em",
            textShadow: "0 8px 42px rgba(0,0,0,.52)",
            animation: `qreTextIn ${index === 0 ? 0.55 : 0.45}s cubic-bezier(.22,.8,.24,1) both`,
            animationDelay: `${index * 70}ms`,
          }}
        >
          {line}
        </div>
      ))}
    </div>
  );
}

export default function MomentRenderer({ moment }: MomentProps) {
  const text = cleanText(moment.text ?? moment.description ?? moment.title ?? "");
  const url = moment.url ?? (typeof moment.meta?.url === "string" ? moment.meta.url : null);

  switch (moment.type) {
    case "system":
      return <CinematicText text={text || "Experience Event"} />;
    case "action":
      return (
        <button
          onClick={() => { if (url) window.location.href = url; }}
          style={{
            maxWidth: "min(82vw, 620px)",
            padding: "14px 22px",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,.18)",
            background: "rgba(255,255,255,.055)",
            color: "white",
            fontSize: 13,
            letterSpacing: 1.2,
            cursor: "pointer",
            backdropFilter: "blur(10px)",
          }}
        >
          {cleanText(moment.label ?? text) || "Continue"}
        </button>
      );
    case "location":
      return (
        <div style={{ width: "min(88vw, 760px)", textAlign: "center", display: "grid", gap: 10 }}>
          <div style={{ opacity: .52, fontSize: 10, letterSpacing: 3 }}>PLACE</div>
          <CinematicText text={cleanText(moment.location?.label ?? "Location")} />
          {moment.location?.city && (
            <div style={{ opacity: .45, fontSize: 12 }}>
              {moment.location.city}{moment.location.region ? `, ${moment.location.region}` : ""}
            </div>
          )}
        </div>
      );
      case "media": {
  const media = moment.media ?? [];

  return (
    <div
      style={{
        width: "min(92vw, 1000px)",
        display: "grid",
        gap: 18,
        justifyItems: "center",
      }}
    >
      {media.map((item) => {
        if (item.type === "image") {
          return (
            <img
              key={item.id}
              src={item.url}
              alt={item.caption ?? item.title ?? ""}
              style={{
                display: "block",
                width: "100%",
                maxHeight: "72dvh",
                objectFit: "contain",
                borderRadius: 18,
              }}
            />
          );
        }

        if (item.type === "video") {
          return (
            <video
              key={item.id}
              src={item.url}
              poster={item.thumbnail}
              controls
              playsInline
              preload="metadata"
              style={{
                display: "block",
                width: "100%",
                maxHeight: "72dvh",
                borderRadius: 18,
              }}
            />
          );
        }

        if (item.type === "audio") {
          return (
            <div
              key={item.id}
              style={{
                width: "min(88vw, 720px)",
                display: "grid",
                gap: 12,
              }}
            >
              <div style={{ fontSize: 13, opacity: 0.65 }}>
                {item.title ?? "Audio"}
              </div>
              <audio
                src={item.url}
                controls
                preload="metadata"
                style={{ width: "100%" }}
              />
            </div>
          );
        }

        return null;
      })}

      {text ? <CinematicText text={text} /> : null}
    </div>
  );
}
    default:
      return <CinematicText text={text} />;
  }
}
