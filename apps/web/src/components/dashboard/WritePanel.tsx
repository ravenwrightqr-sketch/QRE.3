import { useState } from "react";

export default function WritePanel({ slug }: { slug: string }) {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!slug) return;

    setSaving(true);

    try {
      await fetch("/admin/asset/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          teaserText: text,
        }),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ marginTop: 20 }}>
      <h3>✍️ Write Experience</h3>

      <textarea
        placeholder="What should this QR say?"
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{
          width: "100%",
          height: 120,
          padding: 10,
        }}
      />

      <button onClick={save} disabled={saving} style={{ marginTop: 10 }}>
        {saving ? "Saving..." : "Publish Instantly"}
      </button>
    </div>
  );
}