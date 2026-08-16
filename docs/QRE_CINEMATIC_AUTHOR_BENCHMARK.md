# QRE Cinematic Author Benchmark

## Canonical rule

QRE writes for the screen, not the page.

**One scene = one short thought.**

The scene is an individual cinematic beat. The sequence creates the story. A complete experience may contain many scenes and may grow indefinitely by appending new clips to the same physical QRE asset.

## Author contract

1. Never echo an authoring instruction into viewer-facing text.
2. Never emit parser fragments, `+` token chains, entity dumps, metadata, compiler language, or internal reasoning.
3. Prefer one striking line or 1–2 short sentences per scene.
4. Default target is roughly 5–18 words per scene; longer scenes must earn their length.
5. Never pack several independent facts into one cinematic scene when they can become separate beats.
6. Every scene must change the viewer's state: hook, movement, anticipation, discovery, contrast, escalation, transformation, realization, payoff, or afterglow.
7. Avoid consecutive subject-led openings such as `Coco... Coco... Coco...`.
8. Use supplied details aggressively; use generic nouns instead of inventing unsupported identities or locations.
9. Grounded memories may use metaphor, personification, rhythm, contrast, callbacks, and interpretation, but must not invent concrete facts.
10. Promotional concept mode may invent clearly fictionalized mini-story action, but may not invent real business claims, prices, reviews, awards, certifications, guarantees, addresses, or named customers.
11. Short scenes may be numerous. “Short” describes the individual screen beat, not the total experience length.
12. Do not impose a fixed scene count. Cognition decides density from intent, evidence, memory depth, audience, and attention goal.
13. The experience can grow forever. Each new creation is an appendable clip/chapter attached to the same QRE asset.
14. Existing memories remain intact. New memories add context; they do not require regeneration of old clips.
15. The runtime can later traverse a whole world, a chapter, a selected memory cluster, or a short highlight from the same persistent material.
16. Endings need gravity. The last scene should earn a payoff, reveal, callback, transformation, realization, or afterimage.
17. Silence and very short beats are valid creative choices.
18. Never use generic filler such as `beautiful`, `magical`, `unforgettable`, `cinematic`, `amazing`, or `incredible` as a substitute for a concrete idea.
19. A good sequence should feel like: **image → movement → change → consequence → payoff**, or another trajectory appropriate to the material.
20. The author should optimize each line for visualizability, emotional movement, clarity, and memorability.

## Runtime handoff contract

Each authored clip should eventually provide:

- short scene text
- scene kind / beat function
- duration intent
- transition intent
- soundtrack mood intent
- optional visual intent
- clip identity
- source provenance

The frontend may decide exact typography and animation later, but the author must already create screen-ready lines.

## Persistent-world rule

A QR asset is a persistent world, not a single movie.

Example:

```text
COCO QR

Clip 01 — first grooming visit
  → 5 short scenes

Clip 02 — three weeks later
  → 4 short scenes

Clip 03 — birthday memory
  → 7 short scenes

Clip 04 — new photo + new memory
  → new short sequence
```

The physical QR remains the doorway. The world grows.

## Benchmark prompts

### Service / promotion

- `CREATE A VIDEO FOR MY DOG GROOMING BUSINESS`
- `Make a funny video for my house cleaning service.`
- `Make my boring lawn service look like a tiny action movie.`
- `Turn a normal restaurant shift into something people want to watch.`
- `Make a realtor video that feels like a future is waiting behind the door.`

### Grounded memory

- `Make a wedding memory cinematic.`
- `Remember our trip to Huntington.`
- `Use this dog memory and make it funny.`
- `Turn this housekeeping job into a quiet battle.`
- `Make this ordinary family memory feel important without inventing anything.`

### Vibe stress

- romantic
- funny
- horror
- thrilling
- demented
- dark
- fierce
- nostalgic
- playful
- dreamlike
- chaotic
- mysterious
- warm
- cinematic

### Sequence supplied by a creator

- `Coco walked in nervous.`
- `The bubbles helped.`
- `Then she saw the blue bow.`
- `She stole it.`
- `She left looking like a billion bucks.`

Expected behavior: preserve these as distinct beats, improve the language when appropriate, and never flatten them into one paragraph.

## Gold standard

A successful author result should make the reviewer think:

> “I can see this playing.”

not:

> “I can read this.”

The test is not whether the prose is long or sophisticated. The test is whether the **sequence creates an experience**.
