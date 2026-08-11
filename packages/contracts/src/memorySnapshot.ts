/**
 * UNIVERSAL MEMORY SNAPSHOT
 *
 * A durable-facing summary of the experience's remembered state.
 * It is not generated prose pretending to be database truth. It carries
 * provenance, temporal anchors, entities, themes, and geo linkage so any
 * prompt can produce a coherent memory artifact.
 */

export type MemoryTimelineItem = {
  label: string;
  timestamp: string;
  kind?: string;
  source?: "prompt" | "event" | "scan" | "memory" | "location" | "system";
  confidence?: number;
};

export type EmotionalTone =
  | "positive"
  | "neutral"
  | "mixed"
  | "intense"
  | "luxury"
  | "friendly"
  | "energetic"
  | "professional";

export type MemoryType =
  | "generic"
  | "service"
  | "event"
  | "memorial"
  | "business"
  | "personal"
  | "relationship"
  | "location"
  | "experience";

export type MemorySnapshot = {
  id: string;
  assetId?: string;
  sessionId?: string;
  type: MemoryType;
  title: string;
  summary: string;
  emotionalTone: EmotionalTone;
  highlights: string[];
  locationTags: string[];
  timeline: MemoryTimelineItem[];
  confidence?: number;
  themes?: string[];
  entities?: string[];
  /** Ordered geo scene ids represented by this memory. */
  geoSceneIds?: string[];
  /** Whether the snapshot contains physical, semantic, or mixed geo evidence. */
  geoMode?: "physical" | "semantic" | "mixed" | "none";
  /** Provenance for the snapshot itself. */
  provenance?: {
    source: "prompt" | "event" | "scan" | "memory" | "system";
    observedAt: string;
    evidenceCount: number;
  };
  meta?: Record<string, unknown>;
};
