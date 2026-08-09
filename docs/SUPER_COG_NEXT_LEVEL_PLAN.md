# QRE Super Cog — Next-Level Cognitive Compiler Plan

## Status

Current branch: `cognitive-experience-engine`

Current verified state:

- `@qre/contracts` builds.
- `@qre/engine` builds.
- `test:realization` passes the current semantic-premise acceptance set.
- `test:universal` still fails the coupled premise `Turn this concert QR into something people will remember.` because `StoryBeat.text` realizes `qr` and `remember` but drops `concert`.
- The current patch-script approach is brittle and must not be the normal evolution mechanism.

## Core finding

QRE currently has multiple realization authorities:

`cognitiveEngine -> universalStoryCompiler -> eloquentStoryRealizer -> premiseRealizer`

but the universal substrate test bypasses the final cognitive realization boundary. More importantly, the semantic information passed between layers is too lossy: the plan has a central subject and many semantic arrays, but no explicit conserved premise bundle describing the relationships among the subject, event, medium/artifact, audience, desired outcome, constraints, and temporal/social context.

This is why the compiler can understand a coupled prompt and still lose one dimension while rendering prose.

## Target architecture

Keep the locked skeleton and strengthen the semantic representation:

`PROMPT`
`→ UNDERSTANDING`
`→ EVIDENCE GRAPH`
`→ MEANING`
`→ HYPOTHESES`
`→ OPPORTUNITY SPACE`
`→ SELECTED DIRECTION`
`→ COGNITIVE PLAN`
`→ UNIVERSAL STORY STRUCTURE`
`→ PREMISE REALIZATION`
`→ BLUEPRINT`
`→ FLOW`
`→ MOMENTS`
`→ CINEMATIC SCENES`

The brain becomes richer; the runtime/compiler architecture remains intact.

## 1. Build a conserved premise model

Extend the shared cognitive contract with an optional, evidence-backed premise representation. It should capture semantic roles rather than industries or nouns:

- subject/artifact
- event/context
- medium/interface
- physical artifact
- participants/audience
- desired human outcome
- emotional intent
- action/affordance
- temporal intent
- place/geographic context
- social relation
- transformation/comparison
- constraints/rejections
- source evidence and confidence

Each field must retain provenance and confidence. Do not infer a fact merely because a noun appears.

The critical invariant becomes:

> Every distinctive prompt dimension that materially affects the intended experience must remain available to realization until the story is compiled.

## 2. Stop treating QR/NFC as subjects by default

QR, NFC, scan, tag, code, barcode, etc. are media/interfaces unless the prompt explicitly makes them the experience subject.

The system's internal semantic vocabulary should allow:

`artifact | portal | interface | marker | object | installation | wearable | image | physical_artifact`

The public product can therefore be a portal/artifact even when the physical art is custom-shaped and no longer visually resembles a square QR.

## 3. Replace noun-centric event detection with event-role evidence

Do not create branches for concert, rave, convention, Pokémon event, anime event, Anaheim Convention Center, Insomniac, etc.

Recognize the broader role:

`event/context`

and retain the concrete observed phrase as evidence. Event examples are evidence values, not compiler modes.

The same realization machinery must work for:

- concert
- rave
- festival
- convention
- anime convention
- gaming event
- trade show
- wedding
- birthday
- museum event
- tournament
- premiere
- launch
- meetup
- party
- venue event
- any newly encountered event noun

## 4. Make hypothesis selection genuinely competitive

Current hypothesis scoring is heavily cue-driven and gives broad default scores to every direction. This can cause semantic collapse.

Next level:

- score positive evidence
- score contradictory evidence
- score missing prerequisites
- score novelty
- score interaction naturalness
- score emotional fit
- score evidence coverage
- score feasibility
- penalize generic fallback directions
- retain top alternatives rather than discarding them

Selected direction should be the result of evidence competition, not a keyword winner.

## 5. Add evidence coverage as a compiler invariant

Before prose is emitted, compute which premise dimensions the candidate story actually realizes.

For every beat/story:

- required evidence
- realized evidence
- dropped evidence
- inferred additions
- confidence

A story that sounds good but drops a high-salience prompt dimension is a failed compilation.

This replaces brittle tests such as the concert/QR case with a generic invariant while retaining that case as an acceptance example.

## 6. Make story structure variable from cognition

The current direction-to-beat mappings are useful but still too template-like.

Keep narrative operations (`orientation`, `hook`, `encounter`, `challenge`, `discovery`, `contribution`, `transformation`, `payoff`, `continuation`, etc.) as primitives.

Do not make every direction use the same sequence.

Select operations from:

- premise relationships
- desired interaction
- tension
- emotional trajectory
- evidence density
- temporal behavior
- social behavior
- discovery depth
- requested outcome

The result should be a generated experiential trajectory, not a fixed genre template.

## 7. Separate semantic realization from prose polish

There should be one canonical realization authority.

Recommended boundary:

`CognitiveExperienceCompiler`
→ asks universal substrate for semantic beats
→ invokes premise realization
→ validates evidence coverage
→ propagates the exact realized beat text to blueprint/flow/moments/scenes

`eloquentStoryRealizer` should remain only as a compatibility facade during migration and eventually disappear once no callers remain.

`premiseRealizer` should be the semantic realization implementation, not a second hidden planner.

## 8. Eliminate generic significance prose at the source

Forbidden language should be treated as a compiler smell, not fixed with endless substitutions.

Prefer:

- observable action
- concrete consequence
- participant choice
- change of state
- evidence
- discovery
- contribution
- sensory/contextual detail supplied by the prompt
- earned continuation

Avoid prose that merely explains that something is meaningful.

## 9. Integrate the existing cognition subsystems deliberately

The repository contains a second cognition family (`cognitionKernel`, memory, reflection, adaptation, decision). It is currently conceptually separate from prompt understanding.

Do not blindly merge it into prompt parsing.

Instead establish a clean distinction:

`Prompt Cognition`
- understands the current request
- builds premise/evidence
- selects experience direction

`Experience Cognition`
- remembers prior experience state
- reflects on accumulated outcomes
- adapts future behavior
- recommends decisions

Their shared boundary should be context/evidence, not duplicate planning.

## 10. Memory must alter future experience, not merely prepend text

Current memory context can be injected into the first beat as prose. That proves transport but is not cognition.

Next level memory behavior:

- prior evidence influences hypothesis scoring
- repeated entities gain continuity
- previous contributions change available opportunities
- future encounters can differ from the first encounter
- memory remains subordinate to the current prompt
- memory never overwrites present intent

## 11. Creativity should be compositional, not hardcoded by subject

Existing creative possibilities for dogs, surfboards, tattoo shops, trucks, guitars, and nightlife demonstrate useful ideas but should not become a growing noun dictionary.

Promote the underlying semantic forces instead:

- artifact → portal
- object → passport
- event → living context
- participation → accumulation
- physical item → identity carrier
- memory → evolving layer
- place → chapter
- contribution → state change
- discovery → progressive reveal
- return → evolving experience

New nouns inherit these capabilities automatically.

## 12. Testing strategy

Create a semantic acceptance matrix with independent dimensions rather than a list of domains.

Required classes:

1. simple concrete prompt
2. coupled premise
3. physical artifact + digital interface
4. event + medium + outcome
5. social + accumulation
6. memory + future evolution
7. geographic journey
8. discovery + mystery
9. utility/urgent request
10. commerce + rejection of boring loyalty
11. absurd/fictional prompt
12. sparse/garbage prompt
13. unknown/new noun combinations
14. prompts with multiple competing directions
15. repeat prompt with prior memory/context

Every case should validate:

- subject fidelity
- evidence coverage
- direction coherence
- beat progression
- no generic prose
- no dropped high-salience dimensions
- downstream synchronization
- scene/beat count integrity

## 13. Immediate implementation order

### Phase A — semantic conservation

- Add premise/evidence roles to the shared cognition contract.
- Populate them in `cognitiveEngine` from existing entity/cue/evidence data.
- Pass the same premise through universal compilation.
- Add a generic evidence-coverage validator.
- Fix the concert/QR case through the generic invariant, not a concert-specific branch.

### Phase B — canonical realization

- Make `premiseRealizer` the only semantic realization implementation.
- Keep `eloquentStoryRealizer` as a compatibility facade only.
- Remove direct prose generation that competes with the canonical realization layer.
- Propagate realized text once to all downstream projections.

### Phase C — stronger cognition

- Improve hypothesis competition with evidence coverage and contradiction penalties.
- Separate subject, artifact, interface, event, audience, outcome, and context roles.
- Preserve alternative hypotheses for diagnostics.
- Make creative possibilities derive from semantic forces rather than subject dictionaries.

### Phase D — adaptive cognition

- Connect prior experience memory to hypothesis/plan context.
- Use reflection/adaptation/decision only where accumulated experience actually exists.
- Ensure repeat interactions can produce different experiences from prior evidence.

### Phase E — adversarial universal testing

- Generate a broad prompt matrix from semantic dimensions.
- Add regression cases for novel nouns and combinations.
- Require evidence coverage rather than exact canned phrases wherever possible.
- Keep a few exact examples (including concert/QR) as human-readable regression anchors.

## Definition of Super Cog

Super Cog is not a larger list of keywords or more subject-specific templates.

It is a compiler that:

1. understands what the user actually supplied,
2. distinguishes facts from inference,
3. preserves the relationships among those facts,
4. considers multiple possible experience directions,
5. chooses one based on evidence and intent,
6. generates a variable experiential trajectory,
7. realizes concrete language without losing premise evidence,
8. carries the result consistently into runtime projections,
9. learns from accumulated experience context,
10. remains capable when the nouns, industries, event types, artifacts, and combinations are completely new.

That is the path from the current baby cognition to the intended Super Cog system.
