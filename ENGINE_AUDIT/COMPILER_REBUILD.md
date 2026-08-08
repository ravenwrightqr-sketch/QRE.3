# QRE Compiler Rebuild — Any Prompt → Story

Branch: `compiler-rebuild-any-prompt`

## Goal

One universal compiler accepts almost any human prompt and invents a coherent, fun, subject-native experience. It does **not** select an industry template or force every prompt through arrival/discovery/reveal/return.

Universal machinery is allowed. Universal story shape is not.

## Current verdict

The current compiler is not a real generative compiler. It is a chain of keyword classifiers, threshold rules, fabricated defaults, and fixed scene sequences.

Observed failures:

- `compiler/semantic/semanticAnalyzer.ts` uses a small keyword table and hard-coded defaults.
- `compiler/analyzers/*` split cognition into many shallow rule files.
- `ExperienceUnderstandingKernel.ts` sets every component score to `1`.
- `worldAnalyzer.ts` always begins with `journey_world` and uses fixed domain rules.
- `SemanticCortex.ts` defaults to discovery/exploration and returns a fixed emotional arc.
- `compiler/semantic/genome/genomeBuilder.ts` fabricates memory, feeling, journey, energy, and dimensions.
- `experience/blueprintComposer.ts` chooses industry/goal/type with thresholds and emits a fixed welcome/followup pattern.
- `experience/sceneCompiler.ts` always emits `arrival → discovery → reflection`.
- `runtime/cinematic/cinematicRuntime.ts` maps generic types and appends a hard-coded CTA.
- output metadata leaks internal cognition labels, UUID-like identifiers, implementation concepts, and semantic garbage.

The Max/poodle result is therefore a symptom of architecture, not a missing keyword.

## File decisions

### Replace completely

- `packages/engine/src/compiler/semantic/*`
- `packages/engine/src/compiler/cortex/*`
- `packages/engine/src/compiler/understanding/*`
- `packages/engine/src/compiler/analyzers/*`
- `packages/engine/src/compiler/meaningEngines/*`
- `packages/engine/src/compiler/scene/*`
- `packages/engine/src/experience/blueprintComposer.ts`
- `packages/engine/src/experience/genomeCompiler.ts`

These layers currently turn classification into creative decisions. They should not remain authoritative.

### Salvage and redesign

- `packages/engine/src/semantic/entityExtractor.ts` — keep as evidence extraction only; never choose a story.
- `packages/engine/src/semantic/semanticAnalyzer.ts` — replace with a general observation model or remove if redundant.
- `packages/engine/src/experience/blueprintToFlow.ts` — keep only as a projection boundary from generated plan to runtime flow.
- `packages/engine/src/moments/*` — keep projection responsibilities; remove semantic invention.
- `packages/engine/src/runtime/cinematic/cinematicRuntime.ts` — keep runtime projection; remove narrative invention and hard-coded CTA.
- `packages/engine/src/geo/*` — keep as optional context augmentation.
- `packages/contracts/src/experience/*` — keep the boundary but redesign contracts around evidence, situation, story beats, scenes, and provenance rather than template-specific moment unions.

### Keep outside cognition

Scan/access engine, payments, repositories, analytics, presence, delivery, and database adapters stay isolated. They consume compiled/runtime contracts and must not decide story meaning.

## New architecture

```text
PROMPT
  ↓
OBSERVATION
  ↓
SITUATION MODEL
  ↓
MEANING + STORY AFFORDANCES
  ↓
NARRATIVE CANDIDATES
  ↓
BEAT PLANNER
  ↓
STORY REALIZER
  ↓
SCENE COMPILER
  ↓
RUNTIME PROJECTION
```

### Observation

Capture only supported evidence: entities, actions, relations, time, place/event signals, explicit emotion, audience, media, constraints, and uncertainty.

### Situation model

Represent actors, subject, setting, activity, change, tension/opportunity, temporal position, social configuration, salient objects, purpose, and confidence.

### Story affordances

Infer possible story material without making it mandatory. Example: grooming a dog can afford care, anticipation, transformation, reveal, and playfulness. A concert can afford anticipation, crowd energy, performance, and aftermath. These are candidates, not templates.

### Narrative search

Generate multiple plausible story directions and score them for prompt fidelity, causal coherence, emotional progression, novelty, playfulness, subject fit, evidence support, replay potential, and interaction potential.

### Beat planning

Choose a variable-length sequence of beats such as orientation, hook, encounter, escalation, discovery, transformation, payoff, reflection, and continuation. Three beats or twelve beats are both valid.

### Story realization

Separate observed fact, reasonable inference, and playful invention. Playful invention is allowed when appropriate, but invented details must not masquerade as factual memory.

### Scene compilation

Each scene carries semantic purpose, actual content, entity references, emotional target, visual/audio/interaction affordances, duration hint, transition hint, and provenance/confidence.

### Runtime projection

Runtime renders the compiled plan. It does not decide what the story means.

## Memory invariant

Memory is optional augmentation, not the universal purpose. No memory means a strong present-tense experience. Existing memory enriches it. Repeated scans/events can evolve the experience because they add new evidence.

## Event invariant

Events are context, not a compiler mode. Participants, venue, time window, shared atmosphere, activity sequence, and social interaction are simply additional evidence.

## Required acceptance tests

1. `Create a dog groomer story for Max the poodle about the experience.` → playful grooming/care/transformation story; never generic `dog's Journey`.
2. `Make something fun for everyone at my wedding tonight.` → event/social/time-aware without a wedding template.
3. `Turn this concert QR into something people will remember.` → concert-aware without a concert branch.
4. `My grandmother gave me this watch.` → object + relationship + origin/memory affordances without invented facts.
5. `Make this boring product launch fun.` → detects transformation of the experience and creates a playful progression.
6. `Surprise me.` → coherent minimal experience from sparse input.
7. `asdf 123` → graceful minimal result or product-layer request for more context; no fake semantic universe.

## Definition of success

The output should feel like QRE **understood the prompt and invented an experience from it**, not like QRE successfully classified the prompt into an existing category.
