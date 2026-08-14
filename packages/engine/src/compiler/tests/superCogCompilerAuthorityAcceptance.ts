import { strict as assert } from "node:assert";
import { compileCognitiveExperience } from "../../experience/cognitiveExperienceCompiler.js";

const prompts = [
  "A housekeeper documents a client's home after a huge cleaning day.",
  "Dog groomer. Max hated the bath, loved the attention, stole a bow, and left acting like he owned the place.",
  "Coco walked into the groomers scared, enjoyed the bath, stole a bow, and walked out happy.",
];

for (const prompt of prompts) {
  const result = compileCognitiveExperience(prompt);

  assert.ok(result.cognition, `cognition missing: ${prompt}`);
  assert.ok(result.cognition.plan.premise, `premise missing: ${prompt}`);
  assert.ok(result.cognition.plan.realization, `realization missing: ${prompt}`);
  assert.ok(result.story.beats.length >= 2, `too few beats: ${prompt}`);

  const directives = result.cognition.plan.realization?.directives ?? [];
  const creativeDirectives = directives.filter((directive) =>
    directive.evidence.some((evidence) => evidence.source === "creative_realization"),
  );

  assert.ok(creativeDirectives.length > 0, `Super Cog did not produce creative realization: ${prompt}`);

  const storyByKind = new Map(result.story.beats.map((beat) => [beat.kind, beat]));
  for (const directive of creativeDirectives) {
    const beat = storyByKind.get(directive.kind);
    assert.ok(beat, `directive did not reach story beat: ${directive.kind} / ${prompt}`);
    assert.equal(
      beat?.directive?.action,
      directive.action,
      `story directive drifted from cognitive authority: ${directive.kind} / ${prompt}`,
    );
    assert.ok(
      beat?.text.includes(directive.action),
      `authoritative directive action was lost from story text: ${directive.kind} / ${prompt}`,
    );
  }

  const synchronizedTexts = new Map(result.story.beats.map((beat) => [beat.id, beat.text]));
  for (const moment of result.moments) {
    const beatId = String(moment.meta?.beatId ?? "");
    assert.equal(moment.type === "message" ? moment.text : undefined, synchronizedTexts.get(beatId));
  }

  for (const scene of result.scenePlan) {
    assert.equal(scene.text, synchronizedTexts.get(scene.beatId), `scene text drifted: ${scene.beatId}`);
  }
}

console.log("SUPER COG COMPILER AUTHORITY ACCEPTANCE: PASS");
