import { useEffect, useState } from "react";

import CinematicScanPlayer from "../components/scan/CinematicScanPlayer";
import type { Experience } from "@qre/contracts";
import type { CompiledExperience } from "../types/experience";

function compileToRuntimeExperience(input: CompiledExperience): Experience {
  return {
    sessionId: crypto.randomUUID(),
    access: "PREVIEW",
    preview: true,
    asset: {
      id: "preview",
      slug: "preview",
      title: input.title ?? "Living Experience",
      category: input.model?.metadata?.category,
      ownerId: null,
      paid: false,
    },
    moments: input.moments ?? [],
    geoStory: input.world ?? null,
    cinematicScenes: input.cinematicScenes ?? [],
    memorySnapshot: {
      id: "preview",
      title: input.title,
      moments: input.moments,
      createdAt: new Date().toISOString(),
    },
    receipt: null,
    insights: [],
    meta: { source: "experience-compiler-preview" },
  };
}

export default function ExperiencePreview() {
  const [experience, setExperience] = useState<Experience | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("experiencePreview");
    if (!stored) return;

    try {
      const compiled: CompiledExperience = JSON.parse(stored);
      setExperience(compileToRuntimeExperience(compiled));
    } catch (error) {
      console.error("Invalid QRE experience", error);
    }
  }, []);

  if (!experience) {
    return (
      <div style={{ minHeight: "100dvh", display: "grid", placeItems: "center", background: "#030305", color: "#fff", padding: 24 }}>
        <div style={{ opacity: 0.7 }}>No experience loaded.</div>
      </div>
    );
  }

  return <CinematicScanPlayer data={experience} />;
}
