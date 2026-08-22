# QRE Super Cog / Author Master Prompt

## Mission

Build the QRE Author into a world-class creative compiler for real-world experiences.

Its job is not to write pretty prose. Its job is to discover the most compelling short movie that the supplied reality legitimately permits, then realize that movie as a sequence of short, screen-by-screen messages.

The downstream product can turn those play-outs into living memories, pet social stories, business experiences, service receipts, customer experiences, event memories, and future CTA moments. The quality of the play-out comes first.

## Non-Negotiable Reality Law

Reality is authoritative.

The creative system may reinterpret supplied facts, change emphasis, reveal relationships between supplied facts, use grounded metaphorical or emotional language, use a creative lens, personify or mirror meaning metaphorically, compress supplied events, and select which supplied detail receives attention.

The creative system may NOT invent people, identities, relationships, places, rooms or locations, objects, body details, dialogue, sensory facts, literal events, participants, ownership or tenancy, customer/client relationships, chronology, or outcomes that did not occur.

Plausibility is not provenance. A plausible detail is still invented if the supplied reality does not support it.

## Interpretation vs Invention

Interpretive creativity is allowed when it is causally grounded.

Allowed: a cleaned home can be described as looking able to breathe again.

Disallowed: a front door opening by itself when no such event was supplied.

A lens changes framing, not reality.

## Chronology Law

Source chronology is immutable. Creative realization may change the meaning of an earlier event, but may never move a supplied event backward or forward in time.

## Cognitive State

Cognitive State is temporary compiler state, not durable memory and not a new database architecture.

Minimum state concepts:

- establishedFacts
- establishedStates
- stateBefore
- trigger
- stateAfter
- nextPossibility
- unresolvedQuestion
- sourceIndex

Every beat operates as:

STATE BEFORE
→ SUPPLIED EVENT OR GROUNDED INTERPRETATION
→ STATE AFTER
→ NEW POSSIBILITY
→ NEXT QUESTION

The governing question is:

“What is now possible because of what just happened?”

## Canonical Cognitive Pipeline

RAW PROMPT
↓
REALITY MODEL
↓
DOMAIN / ENTITY MODEL
↓
EVENT / RELATIONSHIP GRAPH
↓
COGNITIVE STATE
↓
TRAJECTORY CANDIDATES
↓
CAUSAL / ATTENTION / NOVELTY SEARCH
↓
BEST MOVIE
↓
OPTIONAL LENS
↓
ONE MOUTH REALIZATION
↓
TRUTH / PROVENANCE GATE
↓
ATTENTION / BORINGNESS GATE
↓
SEQUENCEPLAY / TEXT-MOVIE

## Domain Model

Domain is not prose style.

Each domain supplies an ontology, affordances, constraints, actors, objects, transformations, and business context.

Housekeeping service is not automatically hotel, homeowner, Airbnb, tenant, or client context. Hotel has its own ontology. Grooming has its own ontology. Legal services have their own exact-data context. Wedding has ritual, family, time, promise, memory, and photographs. The same cognition runs across all of them while the world model changes.

## Entity / Paying-Party Rule

All data is organized.

Never confuse service provider, paying entity, customer/client, subject, location, and participant.

The paying/business entity is the commercial party QRE should address downstream. The subject of a story can be a different entity.

Never infer homeowner, Airbnb host, tenant, employer, owner, client, customer, or relationship unless the source establishes it.

## Movie Cognition

A movie hypothesis is a proposed causal interpretation of supplied reality, not a writing style.

It must answer:

- What is actually happening?
- What is interesting about the relationship between supplied events?
- What expectation exists?
- What changes that expectation?
- What consequence follows?
- What becomes possible next?
- What realization could this trajectory earn?

Different hypotheses should differ in evidence relationship and trajectory, not merely adjectives.

## Trajectory Search

Super Cog now performs bounded search over grounded, chronological trajectories inside the existing movie-cognition layer.

The search may compare several candidate fact paths, but every candidate must preserve source order.

For each candidate, evaluate:

- relationship strength
- state-transition fit
- novelty
- repetition risk
- unused-opportunity value
- payoff potential
- baseline lift

The search is deliberately bounded. QRE does not need thousands of branches. It needs a small number of strong alternatives and disciplined pruning.

### Boring Baseline

Every experience has a simple factual baseline.

Example:

Coco came in nervous.
Coco got a bath.
Coco stole a blue bow.
Coco left looking fabulous.
Peace was temporary.

The creative winner should beat that baseline on meaningful movement, causal relationship, attention, and payoff while preserving reality.

Validity and quality are separate:

VALIDITY = can this exist?
QUALITY = is this worth watching?

A technically valid but boring trajectory is not the winner merely because it passes the truth gate.

## Unused Opportunity

At every state, Cog tracks which supplied details have not yet been meaningfully used.

The governing question is:

“What supplied detail could now change the meaning of what we already established?”

This is the mechanism for retrospective payoff and for preventing fact-parade writing.

A later supplied event should be able to make an earlier event feel different without changing what physically happened.

## Creative Operations

Operations are mechanisms, not motifs.

Examples:

- REVEAL
- PERSONIFICATION
- AMPLIFICATION
- MIRROR
- REVERSAL
- ENCLOSURE
- DISAPPEARANCE
- LOOP
- INVITATION
- TRANSFORMATION
- COLLISION
- ACCUMULATION
- CEREMONY
- CONSPIRACY
- TIME_DISTORTION
- THRESHOLD
- ECHO
- REFRAME
- CONTRAST
- IMPLICATION

“MIRROR” never means insert a mirror. “HEIST” never means invent a crew. “HORROR” never means invent ghosts. The operation is cognitive; the literal world stays closed.

## Semantic Creativity Law

Do not add weirdness.

Discover what the experience secretly wants to become.

CREATIVITY:

OBSERVATION
→ MEANING
→ LATENT POSSIBILITY
→ GROUNDED TRANSFORMATION OF INTERPRETATION
→ CONSEQUENCE
→ ESCALATION
→ REALIZATION
→ PAYOFF

The invention expresses the meaning. The invention is never the point by itself.

## Attention / Trajectory Loop

A strong short movie is not a pile of good sentences.

Every screen must either:

- establish a state
- raise a question
- answer/change the state
- create a new question
- escalate an existing consequence
- reframe an earlier detail
- pay something off

JOLT
→ QUESTION
→ CHANGE
→ NEW QUESTION
→ CONSEQUENCE
→ REFRAME
→ PAYOFF

## Retrospective Payoff

The ending is earned when the final state changes the meaning of the beginning.

Do not select a clever ending first and force facts toward it.

Search forward from reality. Allow the ending to emerge from the strongest trajectory.

## Lens Architecture

Lens comes after movie cognition.

COG decides what the movie is.
LENS decides how to frame it.
MOUTH realizes the framed movie.

Lens may affect tone, emphasis, implication, pacing, seriousness, absurdity, intimacy, and tension.

Lens may not alter facts, chronology, identity, relationships, literal events, or provenance.

## Mouth Contract

The Mouth is a renderer, not the planner.

Prefer one selected movie over asking a small local model to write three complete movies.

The Mouth payload should contain only:

- selected trajectory
- cognitive purpose
- lens pressure
- concrete supplied details
- truth constraints
- line/screen constraints
- ending requirements

The Mouth must not be responsible for choosing the movie.

## Grounded Recovery

Local models can hallucinate even when instructed not to.

Therefore:

MODEL OUTPUT
→ STRICT TRUTH GATE
→ ACCEPT
or
→ REJECT
→ GROUNDED RECOVERY

Recovery must reconstruct from supplied facts only. It may not relax the truth law just to make a test green.

## Validator as Teacher

The validator is both gate and feedback source.

Track recurring failures:

- invented places
- invented objects
- invented people
- unsupported relationships
- unsupported body details
- invented temporal/location modifiers
- chronology violations
- abstract cognition language
- weak next-beat pull
- repetition
- generic decoration
- stock sentiment
- excessive line length
- duplicate candidate outputs
- fake escalation
- unearned payoff

The long-term objective is not better rejection. It is generation that naturally avoids the rejection patterns.

## Quality Objective

Target output is:

SPECIFIC
+ GROUNDED
+ CAUSAL
+ NOVEL
+ EMOTIONALLY MEANINGFUL
+ DOMAIN-NATIVE
+ ATTENTION-GENERATING
+ EARNED

The experience should make someone think:

“Holy shit, that actually went somewhere.”

Ideally it creates:

“I want one of these for my own thing.”

## Living Memory

Living memory preserves source truth while allowing creative framing.

Example supplied facts:

met at the local bar
connected
talked until close
seen each other every day

Cog may discover intimacy, repetition, anticipation, or changing significance from those facts.

It may not upgrade “seen each other every day” into living together, marriage, a private confession, or another unsupported relationship state.

MEMORY TRUTH = immutable source
CREATIVE LENS = interpretation
PLAY-OUT = realized experience

## Pet Social / Living Dog Tag

Pet social experiences use user-entered bullet facts as the reality source.

Example:

Coco
poodle
fierce
loves bacon
long walks at night
friendly
loves other dogs

Cog may derive a recognizable personality and social trajectory from those traits.

It may not invent a home, owner, dog park, breed history, dialogue, physical behavior, or event unless supplied.

The goal is fun plus learnable personality, not fabricated biography.

## Business / Data Mode

When the user is documenting operational or exact business data, preserve exactness.

Legal, accounting, compliance, receipts, logs, service records, and similar data should not be forced through entertainment cognition merely because QRE can make stories.

Creative mode is optional and must never silently mutate business truth.

## Domain Independence

Never hard-code domain jokes as architecture.

Bad:

housekeeping → crumbs joke
wedding → candles
grooming → bow joke
restaurant → empty room

Those can be tests, not brain rules.

Good:

same cognitive operation
→ different domain reality
→ different realization

Let patterns emerge.

## Product Direction

The play-out is the product experience.

A scan should feel like a small text-message movie.

One screen.
One moving line.
One reason to continue.
Then a payoff.

Pet memories can become social media.
Business services can become memorable artifacts.
Wedding moments can become living memories.
Property can become cinematic marketing.
Receipts can become useful narrative records when creative mode is appropriate.

CTA is downstream. Make the play-out excellent first.

## Engineering Doctrine

Build as if this were our own company.

Prefer the smallest clean architectural addition that materially increases cognitive capability.

Do not add a new file when an existing canonical cognition file is the correct home.

Do not create V2/V3 brains.

Do not weaken validators to hide failures.

Do not optimize for green tests alone.

Every meaningful upgrade must have:

1. one clear responsibility
2. one measurable effect
3. one acceptance path
4. one documented reason

Update this document as architecture evolves.

## Current Engineering Priorities

1. Keep Cognitive State authoritative inside movie cognition.
2. Use bounded trajectory search rather than isolated fact selection.
3. Require the selected trajectory to beat the boring factual baseline.
4. Track unused opportunities during compilation.
5. Preserve chronology and provenance as hard constraints.
6. Select one movie before Mouth realization.
7. Keep lens after cognition and before language.
8. Use strict truth validation plus grounded recovery.
9. Feed recurring validator failures back into generation constraints.
10. Expand cross-domain acceptance around living memory, pet social, services, business marketing, and exact-data modes.

## Definition of Done

Super Cog is successful when ordinary supplied reality can become a compelling short movie without changing reality; multiple hypotheses genuinely differ in causal trajectory; the selected movie is domain-native; the lens improves framing without changing facts; the Mouth realizes instead of explaining; chronology remains intact; unsupported details never survive; every beat changes or deepens the viewer's state; the payoff is earned; outputs remain fast and scannable; and the same cognitive mechanism works across memories, pets, services, businesses, events, commerce, and experiences.

That is the beast we are building.
