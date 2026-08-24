import { describe, expect, it } from "vitest";
import { selectCreativeFrame } from "./authorCreativeFrameSelector.js";

void describe("authorCreativeFrameSelector", () => {
  it("returns a lens, not a sequence", async () => {
    const result = await selectCreativeFrame({
      prompt: "Dog grooming service receipt",
      subject: "Coco",
      facts: [
        "poodle",
        "nervous",
        "fierce",
        "came in nervous",
        "got a bath",
        "stole a blue bow",
        "left looking fabulous",
      ],
      sourceMoments: [
        "came in nervous",
        "got a bath",
        "stole a blue bow",
        "left looking fabulous",
      ],
      candidateFrames: [
        { frame: "negotiation", reason: "status contest", confidence: 0.92 },
        { frame: "celebrity prep", reason: "before/after performance", confidence: 0.88 },
        { frame: "transformation", reason: "visible state change", confidence: 0.74 },
      ],
      contradictions: ["vulnerability vs attitude"],
    });

    expect(result.frame.length).toBeGreaterThan(0);
    expect(result.frame).not.toMatch(/beat|sequence|scene/i);
  });
});
