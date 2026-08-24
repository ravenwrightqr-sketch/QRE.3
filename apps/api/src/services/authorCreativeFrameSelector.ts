import { localModelGenerate } from "./localModelRuntime.js";

export type CreativeFrameSelection = {
  frame: string;
  confidence: number;
  increase: string;
  sequenceRisk: string;
};

const GENERIC_FRAME = /^(?:game|story|cinematic|transformation|experience|journey|mission)$/i;

function clean(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function clamp01(value: unknown): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(1, numeric));
}

function parseSelection(raw: string): CreativeFrameSelection | null {
  const text = clean(raw)
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    const value = JSON.parse(text) as Partial<CreativeFrameSelection>;
    const frame = clean(value.frame).toUpperCase() === "NONE"
      ? "NONE"
      : clean(value.frame);

    if (!frame) return null;
    if (frame !== "NONE" && GENERIC_FRAME.test(frame)) return null;

    return {
      frame,
      confidence: clamp01(value.confidence),
      increase: clean(value.increase),
      sequenceRisk: clean(value.sequenceRisk),
    };
  } catch {
    return null;
  }
}

export async function selectCreativeFrame(input: {
  prompt: string;
  lens?: string;
  subject?: string;
  place?: string;
  facts: string[];
  sourceMoments: string[];
  memoryContext?: string[];
  priorScenes?: string[];
  candidateFrames: Array<{ frame: string; reason: string; confidence: number }>;
  contradictions?: string[];
  recurringSignals?: string[];
}): Promise<CreativeFrameSelection> {
  const source = {
    prompt: clean(input.prompt),
    requestedLens: clean(input.lens),
    subject: clean(input.subject),
    place: clean(input.place),
    facts: input.facts.slice(0, 32),
    sourceMoments: input.sourceMoments.slice(0, 24),
    memoryContext: (input.memoryContext ?? []).slice(0, 24),
    priorScenes: (input.priorScenes ?? []).slice(-12),
    contradictions: (input.contradictions ?? []).slice(0, 10),
    recurringSignals: (input.recurringSignals ?? []).slice(0, 10),
    candidateFrames: input.candidateFrames.slice(0, 8),
  };

  const system = [
    "You are QRE's creative frame selector.",
    "Choose a FRAME only when it materially increases the creative possibilities inside the supplied reality.",
    "A frame is a lens. It is NOT the story, NOT the sequence, NOT a list of beats, and NOT viewer-facing copy.",
    "NONE is a strong answer. Use NONE when the natural reality is already more interesting than any imposed frame.",
    "The frame must emerge from supplied evidence, relationships, contradiction, change, repetition, unresolved tension, status, ritual, or transformation.",
    "Do not force game, spy, mission, quest, heist, boss-fight, celebrity, or other genre framing merely because it sounds exciting.",
    "If you choose a frame, explain the specific creative possibilities it opens without inventing facts.",
    "The selected frame will be passed to a separate sequence planner. Do not invent the sequence yourself.",
    "A service receipt may use a frame when it makes routine work feel alive, but never turn every service into the same mission template.",
    "Recurring memory may make a natural lens stronger than an external frame. Prefer the accumulated world when that is more interesting.",
    "Return JSON exactly: {\"frame\":\"FRAME|NONE\",\"confidence\":0.0,\"increase\":\"...\",\"sequenceRisk\":\"...\"}.",
    "Confidence must be between 0.00 and 1.00.",
  ].join("\n");

  const result = await localModelGenerate(
    [
      { role: "system", content: system },
      { role: "user", content: JSON.stringify(source) },
    ],
    "json",
    { numPredict: 220, temperature: 0.2 },
  );

  return parseSelection(result.text) ?? {
    frame: "NONE",
    confidence: 0,
    increase: "selector output unavailable; preserve the natural lens",
    sequenceRisk: "unknown",
  };
}
