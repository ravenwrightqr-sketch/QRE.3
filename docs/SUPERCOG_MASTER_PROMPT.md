# QRE Super Cog / Author Master Prompt

## Mission

Build the QRE Author into a world-class creative compiler for real-world experiences.

Its job is not to write pretty prose. Its job is to discover the most compelling short movie that the supplied reality legitimately permits, then realize that movie as a sequence of short, screen-by-screen messages.

The downstream product can turn those play-outs into living memories, pet social stories, business experiences, service receipts, customer experiences, event memories, and future CTA moments. The quality of the play-out comes first.

## Reality Law

Reality is authoritative. The creative system may reinterpret supplied facts, change emphasis, reveal relationships between supplied facts, use grounded metaphorical or emotional language, use a creative lens, personify or mirror meaning metaphorically, compress supplied events, and select which supplied detail receives attention.

It may not invent people, identities, relationships, places, rooms or locations, objects, body details, dialogue, sensory facts, literal events, participants, ownership or tenancy, customer/client relationships, chronology, or outcomes that did not occur.

Plausibility is not provenance. A plausible detail is still invented if the supplied reality does not support it.

## Fact Typing

Every supplied item is data, but not every datum plays the same cognitive role. Super Cog classifies supplied material into a small internal vocabulary:

- identity
- event
- state
- trait
- preference
- relationship
- place
- object
- outcome
- recurrence

The type controls how cognition may use the datum.

EVENT → chronology and trajectory movement.
STATE → before/after condition.
TRAIT → persistent personality consistency, never invented biography.
PREFERENCE → motivation, leverage, callback, or comic texture grounded in the supplied preference.
RELATIONSHIP → social meaning only when explicitly supplied.
IDENTITY → explicit identity only; do not upgrade it into additional relationships.
PLACE → supplied world context only; never expand the location.
OBJECT → supplied object only; never add plausible props.
OUTCOME → supplied result; do not invent what caused it.
RECURRENCE → persistence, callback, echo, or changed meaning over time.

Fact typing is an internal compiler aid. It is not a user-facing form and does not create a second ontology system.

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

STATE BEFORE → SUPPLIED EVENT OR GROUNDED INTERPRETATION → STATE AFTER → NEW POSSIBILITY → NEXT QUESTION

The governing question is: “What is now possible because of what just happened?”

## Canonical Cognitive Pipeline

RAW PROMPT
↓
REALITY MODEL
↓
FACT TYPING
↓
DOMAIN / ENTITY MODEL
↓
DOMAIN COGNITION PROFILE
↓
EVENT / RELATIONSHIP GRAPH
↓
COGNITIVE STATE
↓
TRAJECTORY CANDIDATES
↓
CAUSAL / ATTENTION / NOVELTY SEARCH
↓
PERSONALITY / PERSISTENT-MEANING SEARCH WHEN APPLICABLE
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
GROUNDED RECOVERY IF NECESSARY
↓
SEQUENCEPLAY / TEXT-MOVIE

## Movie Cognition

A movie hypothesis is a proposed causal interpretation of supplied reality, not a writing style.

It must answer:

- What is actually happening?
- What is interesting about the relationship between supplied events or supplied character facts?
- What expectation exists?
- What changes that expectation?
- What consequence follows?
- What becomes possible next?
- What realization could this trajectory earn?

Different hypotheses should differ in evidence relationship and trajectory, not merely adjectives.

## Trajectory Search

Super Cog performs bounded search over grounded, chronological trajectories inside the existing movie-cognition layer.

For each candidate, evaluate:

- relationship strength
- state-transition fit
- novelty
- repetition risk
- unused-opportunity value
- payoff potential
- baseline lift
- personality coherence when reality is trait/preference-heavy
- domain fit

The search is deliberately bounded. QRE needs a small number of strong alternatives and disciplined pruning, not thousands of branches.

### Boring Baseline

Every experience has a simple factual baseline.

Example:

Coco came in nervous.
Coco got a bath.
Coco stole a blue bow.
Coco left looking fabulous.
Peace was temporary.

The creative winner should beat that baseline on meaningful movement, causal relationship, attention, and payoff while preserving reality.

VALIDITY = can this exist?
QUALITY = is this worth watching?

A technically valid but boring trajectory is not the winner merely because it passes the truth gate.

## Unused Opportunity

At every state, Cog tracks which supplied details have not yet been meaningfully used.

The governing question is: “What supplied detail could now change the meaning of what we already established?”

This prevents fact-parade writing and creates retrospective payoff.

## Personality Cognition

Trait and preference data is not forced into event chronology.

For pet/social or personality-heavy experiences, Cog builds a compact personality map:

IDENTITY → who/what the subject is, only as supplied
TRAITS → persistent characteristics
PREFERENCES → what the subject is drawn toward or away from
SOCIAL SIGNALS → relationships or social tendencies only when supplied
ACTIVITIES → recurring behaviors or supplied behavior patterns
TENSIONS → contrasts between supplied character signals
OPPORTUNITIES → tensions, combinations, or comic contrasts already latent in those facts

Example:

Coco
poodle
fierce
loves bacon
long walks at night
friendly
loves other dogs

Possible cognitive relationship:

fierce + friendly → useful personality contrast
night walks + loves other dogs → social/behavioral opportunity
loves bacon → concrete preference / comic leverage

The system may make the personality feel vivid. It may not invent a dog park, owner, house, dialogue, physical habit, or unreported adventure.

## Domain Cognition Profile

Domain cognition is a mode of the same Super Cog, not a second brain.

Supported modes include:

- memory
- pet_social
- service
- business_media
- generic

The profile contains:

- typed domain facts
- anchors
- personality or meaning tensions
- opportunities
- identity signals
- trait signals
- preference signals
- social signals
- activity signals
- continuity signals
- forbidden expansions

Domain cognition determines how supplied knowledge should be searched. It must not create new reality.

### Memory mode

Memory mode searches for persistent meaning:

FIRST EVENT → CONNECTION → CONTINUITY → CHANGED MEANING

A supplied later event may make an earlier event feel more important, intimate, funny, strange, or inevitable, but may not create unsupported relationship status or private history.

### Pet social mode

Pet social mode searches for character rather than biography:

IDENTITY → TRAITS → PREFERENCES → ACTIVITIES → SOCIAL SIGNALS → PERSONALITY TENSION → PAYOFF

It should create a recognizable social personality from sparse facts. It must not create an owner, home, dog park, breed history, dialogue, physical habits, or unreported adventures.

### Service mode

Service mode distinguishes the service provider, paying/business entity, customer/client when explicitly supplied, service subject, location, work performed, completion state, and operational CTA.

Housekeeping service is not automatically hotel, homeowner, Airbnb, tenant, or host context. The system must never silently add those entities.

### Business media mode

Business media mode can turn supplied product/service facts into punchy, attention-oriented play-outs and CTA moments while preserving exact commercial claims.

“New on market” may create urgency. It may not invent square footage, price, features, buyer demographics, property condition, or seller identity.

## Character Tension

When multiple persistent character signals are supplied, Cog should search for useful tension instead of flattening them into adjectives.

Examples:

fierce ↔ friendly
social ↔ private
routine ↔ spontaneous
serious ↔ playful
strong preference A ↔ strong preference B

A character tension is valid only when both sides are directly supported by supplied facts.

Tension is not permission to invent an event. It is a reason to choose a different framing or payoff.

## Persistent Meaning

Persistent meaning is a first-class search target.

A detail can appear early, matter differently later, and then pay off without the literal detail changing.

The search asks:

“What was established early that the ending can make mean something different?”

This is especially important for living memories, recurring pet behavior, customer relationships, and serialized experiences.

## Domain / Entity Rule

Domain is not prose style. Each domain supplies its own ontology, affordances, constraints, actors, objects, transformations, and business context.

Housekeeping service is not automatically hotel, homeowner, Airbnb, tenant, or client context. Hotel has a different ontology. Grooming has a different ontology. Legal services may require exact-data mode. Wedding has ritual, family, time, promise, memory, and photographs.

Never confuse:

- service provider
- paying entity
- customer/client
- subject
- location
- participant

The paying/business entity is the commercial party QRE should address downstream. The story subject can be different.

Never infer homeowner, Airbnb host, tenant, employer, owner, client, customer, or relationship unless the source establishes it.

## Creative Operations

Operations are mechanisms, not motifs.

Examples:

REVEAL, PERSONIFICATION, AMPLIFICATION, MIRROR, REVERSAL, ENCLOSURE, DISAPPEARANCE, LOOP, INVITATION, TRANSFORMATION, COLLISION, ACCUMULATION, CEREMONY, CONSPIRACY, TIME_DISTORTION, THRESHOLD, ECHO, REFRAME, CONTRAST, IMPLICATION.

“MIRROR” never means insert a mirror. “HEIST” never means invent a crew. “HORROR” never means invent ghosts. The operation is cognitive; the literal world stays closed.

## Semantic Creativity Law

Do not add weirdness. Discover what the experience secretly wants to become.

CREATIVITY:
OBSERVATION → MEANING → LATENT POSSIBILITY → GROUNDED TRANSFORMATION OF INTERPRETATION → CONSEQUENCE → ESCALATION → REALIZATION → PAYOFF

The invention expresses the meaning. The invention is never the point by itself.

## Attention / Movie Law

A strong short movie is not a pile of good sentences.

Every screen must establish a state, raise a question, answer/change the state, create a new question, escalate an existing consequence, reframe an earlier detail, or pay something off.

JOLT → QUESTION → CHANGE → NEW QUESTION → CONSEQUENCE → REFRAME → PAYOFF

The actual product is the screen-by-screen play-out. Acceptance means the movie is grounded, compelling, chronological, and earned—not merely that individual sentences are grammatical.

## Retrospective Payoff

The ending is earned when the final state changes the meaning of the beginning.

Do not select a clever ending first and force facts toward it. Search forward from reality and let the ending emerge from the strongest trajectory.

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

The Mouth payload should contain only the selected trajectory, cognitive purpose, lens pressure, concrete supplied details, truth constraints, line/screen constraints, and ending requirements.

The Mouth must not be responsible for choosing the movie.

## Grounded Recovery

Local models can hallucinate even when instructed not to.

MODEL OUTPUT → STRICT TRUTH GATE → ACCEPT
or
MODEL OUTPUT → REJECT → GROUNDED RECOVERY

Recovery reconstructs from supplied facts only. It may not relax the truth law to make a test green.

## Validator as Teacher

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

The objective is not better rejection. It is generation that naturally avoids rejection patterns.

## Quality Objective

Target output is:

SPECIFIC + GROUNDED + CAUSAL + NOVEL + EMOTIONALLY MEANINGFUL + DOMAIN-NATIVE + ATTENTION-GENERATING + EARNED

The experience should make someone think: “Holy shit, that actually went somewhere.”

Ideally it creates: “I want one of these for my own thing.”

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

Never hard-code domain jokes as architecture. Let the same cognitive operations find different realizations in different worlds.

## Engineering Doctrine

Build as if this were our own company.

Prefer the smallest clean architectural addition that materially increases cognitive capability.

Do not create V2/V3 brains, duplicate legacy creative systems, or speculative branches of architecture.

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
6. Type reality facts before reasoning when the input mixes events, traits, preferences, identity, or social data.
7. Use trait/preference cognition for personality-heavy experiences instead of forcing them into event-only trajectories.
8. Build domain cognition profiles for memory, pet social, service, and business media without creating separate brains.
9. Search explicit character tensions when trait/preference data is present.
10. Search persistent meaning when repeated or long-horizon facts are present.
11. Select one movie before Mouth realization.
12. Keep lens after cognition and before language.
13. Use strict truth validation plus grounded recovery.
14. Feed recurring validator failures back into generation constraints.
15. Expand acceptance around living memory, pet social, services, business marketing, and exact-data modes.

## Current Advancement Doctrine

The next level of Super Cog comes from adding cognitive structure, not adding prompt adjectives.

A supplied fact should create one or more useful relationships:

FACT → TYPE → ROLE → RELATIONSHIP → TENSION → OPPORTUNITY → TRAJECTORY → MEANING → PAYOFF

The system should continuously search for:

- the strongest fact relationship
- the strongest state transition
- the strongest character tension
- the strongest social opportunity
- the strongest unused fact
- the strongest persistent meaning
- the strongest payoff connection

The winning movie is the hypothesis that creates the most meaningful viewer-state movement under the hard reality constraints.

## Product Expansion Targets

The same Super Cog can support many experiences without becoming many brains.

### Living memories

Meeting → connection → continuity → significance.

### Pet social media

Identity → personality → preference → social behavior → character tension → funny/learnable payoff.

### Service media

Arrival → work → change → result → client-facing completion moment → optional CTA.

### Real estate

Supplied property fact → market event → distinctive detail → attention shift → commercial action.

Never invent listing facts, price, buyer type, seller identity, square footage, property condition, or location claims.

### Restaurant / hospitality

Supplied food/service facts → sensory emphasis only when supported → social or commercial opportunity → CTA.

Never manufacture ingredients, reviews, customer quotes, or service claims.

### Legal / exact-data businesses

Prefer exactness-first cognition. Creative framing is opt-in and cannot mutate the underlying record.

### Events / weddings

Supplied sequence → ritual / emotion / turning point → earned memory payoff.

Never fabricate relatives, dialogue, vows, locations, or private meaning not supported by the source.

## Speed / UX Doctrine

The user should not need to understand any of this machinery.

The product should feel:

FAST → TYPE OR PASTE FACTS → QRE UNDERSTANDS → QRE MAKES THE MOVIE → USER APPROVES / SHARES / SAVES

No learning dashboard is required for the creative core.

Avoid unnecessary configuration. Automatic domain detection should be preferred when confidence is high. User-provided lens or mode overrides are explicit and should never silently change reality rules.

## Definition of Done

Super Cog is successful when ordinary supplied reality can become a compelling short movie without changing reality; multiple hypotheses genuinely differ in causal trajectory; fact types are respected; the selected movie is domain-native; the lens improves framing without changing facts; the Mouth realizes instead of explaining; chronology remains intact; unsupported details never survive; every beat changes or deepens the viewer’s state; the payoff is earned; outputs remain fast and scannable; and the same cognitive mechanism works across memories, pets, services, businesses, events, commerce, and experiences.

That is the beast we are building.

## Advancement Log — 2026-08-21

### Upgrade: Unified Domain Cognition Profile

Added `authorDomainCognition.ts` as a shared mode layer rather than a separate domain brain.

Current modes:

- `memory`
- `pet_social`
- `service`
- `business_media`
- `generic`

The profile organizes typed facts into anchors, traits, preferences, social signals, activities, continuity signals, tensions, opportunities, and forbidden expansions.

Why:

The same fact set should not be reasoned about identically across a living memory, pet social story, housekeeping service, and business-media promotion. The domain mode changes what relationships are worth searching while the truth law remains global.

Acceptance:

`author:domain-cognition` exercises pet personality, living-memory meaning shift, and service cognition through the same shared profile system.

### Next Upgrade Target: Character + Persistent Meaning Search

The next cognitive jump is to make `authorMovieCognition.ts` consume domain profiles directly for:

- trait contradiction search
- preference leverage
- social opportunity search
- activity/recurrence search
- persistent-meaning callbacks
- domain-specific trajectory scoring

This should make pet social experiences behave like character movies, living memories behave like evolving meaning, services behave like transformation/completion movies, and business media behave like attention/action movies without creating separate brains.
