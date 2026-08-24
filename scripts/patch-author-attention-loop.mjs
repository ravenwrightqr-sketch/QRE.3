import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function file(relative) {
  return path.join(root, relative);
}

function patch(relative, label, transform) {
  const target = file(relative);
  const before = fs.readFileSync(target, "utf8");
  const after = transform(before);
  if (after === before) {
    console.log(`UNCHANGED: ${relative} · ${label}`);
    return;
  }
  fs.writeFileSync(target, after, "utf8");
  console.log(`PATCHED: ${relative} · ${label}`);
}

patch("apps/api/src/services/localModelRuntime.ts", "canonical Mouth + attention-efficient length", (source) => {
  let out = source;

  out = out.replace(
    /return\s+\/QRE's theatrical mouth\/i\.test\(system\);/,
    'return /QRE CANONICAL MOUTH|QRE\\'s theatrical mouth/i.test(system);',
  );

  out = out.replace(
    /if \(!text \|\| words < 2 \|\| words > 7\) return false;/,
    'if (!text || words < 2 || words > 28) return false;',
  );

  out = out.replace(
    /2-7 words\. Prefer 3-6\./g,
    'Prefer a compact viewer-facing sentence. There is no fixed word count. Expand only when the wording itself is the hit; never pad or become a paragraph.',
  );

  out = out.replace(
    /2-7 words\. Use only the source-truth details below\./g,
    'Prefer a compact sentence. Use only the source-truth details below.',
  );

  out = out.replace(
    /Use 2-7 words\. Prefer 3-6\./g,
    'Prefer a compact viewer-facing sentence. There is no fixed word count. Use exactly the words needed to land the hit, and expand only when the sentence earns the extra space.',
  );

  out = out.replace(
    /const retryInstruction = attempt === 0[\s\S]*?;\n\s*const singleSystem:/,
    (block) => block.replace(
      /2-7 words/g,
      'Prefer a compact sentence; no fixed word count. Use only enough language to land the hit.',
    ),
  );

  const stateRule = 'STATE / RELATIONSHIP DISCIPLINE: when the approved beat is a supplied state, preference, attitude, or relationship, realize that state directly. Do not convert it into a new physical action or body reaction. If "hates bows" is supplied, legal realizations include "Bows? Absolutely not." or "Still no bows." Do not invent smiling, sniffing, glaring, hiding, walking, or similar behavior unless supplied.\n';
  if (!out.includes(stateRule)) {
    out = out.replace(
      /QRE MOUTH · SOURCE-LOCKED MOVING MESSAGE MODE:\n/,
      `QRE MOUTH · SOURCE-LOCKED MOVING MESSAGE MODE:\n${stateRule}`,
    );
  }

  return out;
});

patch("apps/api/src/services/authorMouthCandidateSearch.ts", "remove tiny-line clamp and sharpen film-cut bar", (source) => {
  let out = source;

  out = out.replace(
    /const bounded = .*?;/,
    'const bounded = (value: string): string => clean(value);',
  );

  out = out.replace(
    /if \(!value \|\| value\.split\(\/\\s\+\/\)\.length > 7\) return false;/,
    'if (!value || value.split(/\\s+/).length > 28) return false;',
  );

  out = out.replace(
    /2-7 words preferred\. One thought\. Make the next moment desirable\./,
    'Prefer the smallest amount of language that creates the strongest next-moment pull. There is no fixed line length. A longer sentence is valid when the wording itself is the hit; never pad.',
  );

  out = out.replace(
    /Each beat becomes one short film moment\. Keep the beats in order\./,
    'Each beat becomes one film moment. Keep the beats in order. Optimize for attention, curiosity, interruption, prediction shift, escalation, contrast, callback, anticipation, and payoff as the source supports them.',
  );

  out = out.replace(
    /const compressionScore = text\.split\(\/\\s\+\/\)\.length <= 7 \? 1 : 0;/,
    'const wordLength = text.split(/\\s+/).filter(Boolean).length;\n  const compressionScore = wordLength <= 16 ? 1 : wordLength <= 24 ? 0.85 : 0.65;',
  );

  return out;
});

patch("apps/api/src/services/authorBrainUniversal.ts", "rich-reality beat expansion and non-mandatory endpoint", (source) => {
  let out = source;

  out = out.replace(
    /  return normalizeBeatPlan\(\n    recovered,\n  \);/,
    `  const normalized = normalizeBeatPlan(recovered);\n\n  // A rich reality graph should not be collapsed into a tiny movie solely\n  // because the latent trajectory happened to contain only two steps.\n  // Hand rich material to the canonical beat planner so it can choose the\n  // shortest sufficient attention loop from the accumulated evidence.\n  if (\n    normalized &&\n    normalized.beats.length < 3 &&\n    realityGraph.events.length >= 4\n  ) {\n    return undefined;\n  }\n\n  return normalized;`,
  );

  out = out.replace(
    /    `Fallback target: approximately \$\{targetBeats\} beats\.`,\n    "Return JSON only:",/,
    `    \`Planning target: approximately \${targetBeats} moments only as a soft guide; there is no fixed beat count. Choose the smallest sufficient sequence that preserves useful supplied information and creates a compelling attention loop. Rich service/receipt material may use several cuts when each earns its place; thin material should stop sooner.\`,\n    "For service or receipt material, preserve useful work-order facts while turning meaningful changes into watchable film moments. Optional time, location, presence, and photos are separate intentional film elements and should not be repeated as prose metadata.\",\n    "The sequence should create a loop of attention: attention → curiosity → interruption or prediction shift → escalation/contrast/callback → anticipation → payoff, using any subset supported by the source.\",\n    "Do not confuse brevity with quality. Prefer compact language, but allow a longer sentence when the sentence itself is the hit.\",\n    "Do not manufacture physical behavior to make a beat vivid. State, relationship, attitude, and status material may be realized through wording, implication, humor, rhetorical force, or contrast without creating a new event.\",\n    "Every substantial supplied event should be considered for inclusion; omit it only when it adds no distinct viewer change or useful service information.\",\n    "Return JSON only:",`,
  );

  out = out.replace(
    /    sequenceArc\.accepted &&\n    endpointExact;/,
    '    sequenceArc.accepted;',
  );

  return out;
});

console.log("AUTHOR ATTENTION LOOP PATCH COMPLETE");
