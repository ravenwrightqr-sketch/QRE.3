import fs from "node:fs";

const root = process.cwd();

function file(path) {
  return `${root}/${path}`;
}

function replaceOnce(path, label, from, to) {
  const target = file(path);
  const source = fs.readFileSync(target, "utf8");
  const count = source.split(from).length - 1;

  if (count === 0 && source.includes(to)) {
    console.log(`ALREADY PATCHED: ${path} · ${label}`);
    return;
  }

  if (count !== 1) {
    throw new Error(`${label}: expected exactly 1 match, found ${count}`);
  }

  fs.writeFileSync(target, source.replace(from, to), "utf8");
  console.log(`PATCHED: ${path} · ${label}`);
}

// 1. Canonical Mouth must recognize the current production prompt, not only the retired name.
replaceOnce(
  "apps/api/src/services/localModelRuntime.ts",
  "canonical Mouth detector",
  String.raw`  return /QRE's theatrical mouth/i.test(system);`,
  String.raw`  return /QRE CANONICAL MOUTH/i.test(system) || /QRE's theatrical mouth/i.test(system);`,
);

// 2. The universal Author must not require the discovered factual endpoint to be the literal final words.
replaceOnce(
  "apps/api/src/services/authorBrainUniversal.ts",
  "universal completion gate",
  `  const complete =
    sequenceResult.rejected === 0 &&
    mouth.texts.length ===
      sequence.cuts.length &&
    sequenceResult.scenes.length ===
      sequence.cuts.length &&
    sequenceArc.accepted &&
    endpointExact;`,
  `  const complete =
    sequenceResult.rejected === 0 &&
    mouth.texts.length ===
      sequence.cuts.length &&
    sequenceResult.scenes.length ===
      sequence.cuts.length &&
    sequenceArc.accepted;`,
);

// 3. Add a deterministic, source-grounded expansion only for service/receipt-like experiences.
const universalPath = file("apps/api/src/services/authorBrainUniversal.ts");
let universal = fs.readFileSync(universalPath, "utf8");
const anchor = `function buildFallbackBeatPlan(
  cognition: ReturnType<
    typeof buildAuthorCognitivePlan
  >,
  realityGraph: ReturnType<
    typeof buildAuthorRealityGraph
  >,
): BeatPlan | undefined {`;
if (!universal.includes(anchor)) throw new Error("service expansion anchor not found");

const helper = `function expandServiceBeatPlan(
  plan: BeatPlan,
  input: AuthorBrainTruth,
  realityGraph: ReturnType<typeof buildAuthorRealityGraph>,
  endpointEventId: string,
): BeatPlan {
  if (plan.beats.length >= 3) return plan;

  const serviceLike = /service|receipt|clean|cleaning|housekeeping|repair|maintenance|inspection|groom|grooming|property|work order|visit|round/i.test(
    [
      input.prompt,
      input.lens ?? "",
      ...input.facts,
      ...input.sourceMoments,
    ].join(" "),
  );

  if (!serviceLike) return plan;

  const existing = new Set(
    plan.beats.flatMap((beat) => beat.eventIds ?? []),
  );
  const usable = realityGraph.events.filter((event) => {
    if (existing.has(event.id)) return false;
    return Boolean(clean(event.label));
  });

  const target = Math.min(5, Math.max(3, plan.beats.length + usable.length));
  const added: AuthorBeat[] = [];

  for (const event of usable) {
    if (plan.beats.length + added.length >= target) break;

    const previous =
      [...plan.beats, ...added][
        [...plan.beats, ...added].length - 1
      ];
    const index = plan.beats.length + added.length + 1;
    const isEndpoint = event.id === endpointEventId;
    const nextEvent = usable.find((candidate) => candidate.id !== event.id);

    added.push({
      order: index,
      role: isEndpoint ? "payoff" : index === 2 ? "reframe" : "escalation",
      gainKind: isEndpoint ? "payoff" : index === 2 ? "reframe" : "discovery",
      change: clean(event.label),
      next: isEndpoint
        ? "Land the supplied ending cleanly."
        : clean(nextEvent?.label) || "What deserves the next cut?",
      frontier: isEndpoint
        ? clean(event.label)
        : clean(nextEvent?.label),
      necessity: isEndpoint
        ? "Pays off the supplied service experience."
        : "Carries the supplied work forward without inventing a new event.",
      eventIds: [event.id],
      attentionFunction: isEndpoint ? "payoff" : index === 2 ? "reframe" : "escalation",
      setsUp: previous?.change ? [clean(previous.change)] : [],
      paysOff: isEndpoint ? [clean(event.label)] : [],
      creativeMove: index === 2 ? "contrast" : isEndpoint ? "recontextualization" : "none",
      nextBeatPullTarget: isEndpoint ? 0.25 : 0.55,
    });
  }

  if (!added.length) return plan;

  return {
    ...plan,
    beats: [...plan.beats, ...added].slice(0, 6).map((beat, index) => ({
      ...beat,
      order: index + 1,
    })),
    attentionArc: [...plan.beats, ...added]
      .map((beat) => beat.attentionFunction ?? "reframe")
      .join(" → "),
  };
}

`;
universal = universal.replace(anchor, helper + anchor);
const beatPlanAnchor = `  if (!beatPlan) {
    return {`;
const insert = `  beatPlan = expandServiceBeatPlan(
    beatPlan,
    { ...input, realityGraph },
    realityGraph,
    realityEnvelope.endpointEventId,
  );

`;
if (universal.split(beatPlanAnchor).length - 1 !== 1) throw new Error("service expansion insertion anchor mismatch");
universal = universal.replace(beatPlanAnchor, insert + beatPlanAnchor);
fs.writeFileSync(universalPath, universal, "utf8");
console.log("PATCHED: apps/api/src/services/authorBrainUniversal.ts · service film expansion");

// 4. Strengthen the canonical Mouth instruction against physical invention.
const mouthPath = file("apps/api/src/services/authorMouthCandidateSearch.ts");
let mouth = fs.readFileSync(mouthPath, "utf8");
const mouthAnchor = '    "Do not invent physical actions, reactions, objects, people, locations, sounds, chronology, or outcomes.",';
const mouthReplacement = `    "Do not invent physical actions, reactions, objects, people, locations, sounds, chronology, or outcomes.",
    "For supplied states, preferences, attitudes, or relationships, prefer implication, status, contrast, rhetorical attitude, compression, callback, or wording changes. Do not invent a body reaction merely to make the line vivid.",
    "Every concrete verb or physical claim must be directly supported by the beat's source events; otherwise rewrite it as a grounded state/relationship line.",`;
if (mouth.split(mouthAnchor).length - 1 !== 1) throw new Error("Mouth truth instruction anchor mismatch");
mouth = mouth.replace(mouthAnchor, mouthReplacement);
fs.writeFileSync(mouthPath, mouth, "utf8");
console.log("PATCHED: apps/api/src/services/authorMouthCandidateSearch.ts · state-aware truth instruction");

console.log("AUTHOR PRODUCTION ALIGNMENT COMPLETE");
