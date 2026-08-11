# Super Cog Engineering Rules

## Mission
Build a domain-neutral cognitive experience compiler that can turn arbitrary prompts into concrete, specific, surprising, coherent experiences without subject-specific story templates or generic significance prose.

The target is not "positive" output. Feel-good means experiential quality: comedy, horror, luxury, mystery, absurdity, competition, self-care, celebration, utility, drama, and other tones are valid when the prompt supports them.

## Locked architecture

`PROMPT -> UNDERSTANDING -> PREMISE/EVIDENCE -> MEANING -> EXPERIENCE GENOME -> COGNITIVE DIRECTION -> SEMANTIC/CREATIVE REALIZATION -> UNIVERSAL STORY COMPILATION -> BLUEPRINT -> FLOW -> MOMENTS -> SCENES`

The brain gets smarter; the architecture does not get replaced.

## One-authority rule

There is one downstream structure authority and one canonical language authority:

- `packages/engine/src/experience/universalStoryCompiler.ts` — **UNIVERSAL STRUCTURE AUTHORITY**
- `packages/engine/src/experience/premiseRealizer.ts` — **CANONICAL LANGUAGE REALIZATION AUTHORITY**
- `packages/engine/src/experience/eloquentStoryRealizer.ts` — **COMPATIBILITY FACADE ONLY**; it must never become another realization brain.

Do not resurrect `premiseRealizerV2.ts`, `premiseRealizerV3.ts`, or create another parallel realizer.

## Cognitive rules

- Preserve distinctive prompt evidence in actual beats, not only metadata.
- Preserve semantic relationships, not merely nouns.
- Treat coupled premises as bundles: event + artifact/medium + audience + human outcome must survive realization.
- Claims and evidence distinguish observed/derived material from created material.
- `creative_realization` provenance explicitly marks invented experiential details.
- **Never invent the premise; invent inside the premise.**
- Creative invention is allowed and expected when it increases attention, specificity, surprise, humor, tension, escalation, sensory impact, or payoff.
- A mundane prompt may receive a fresh concrete twist. It must not receive the same twist every time.
- Creative variation must be deterministic for a given prompt so tests/builds remain reproducible.
- Serious contexts must not be forced into comedy.
- "Feel good" is not synonymous with wholesome.

## Universal rules

- Do not create branches for individual nouns or industries.
- Generalize event context rather than building a concert-only branch.
- QR/NFC/scan/tag are media/interfaces unless the prompt explicitly makes them the subject.
- The physical art object is an artifact/portal concept and may be non-square, DIY-shaped, physical, wearable, installed, or not visibly QR-like.
- New nouns inherit intelligence through semantic roles and mechanics.
- Do not solve a new prompt by adding a noun-specific rescue branch.
- Generic compiler language is a failure mode. Concrete action, reaction, consequence, and payoff are preferred.

## Contracts

- All shared semantic/runtime types come from `@qre/contracts`.
- Engine remains Prisma-agnostic.
- Do not create engine-local competing semantic contracts.

## File labels

See `docs/SUPER_COG_FILE_MAP.md`. Every cognition/compiler file must have an obvious responsibility. When changing a file, strengthen its labeled responsibility; do not silently move authority between layers.

## Forbidden drift

Kill rather than extend:

- duplicate realization authorities
- V2/V3 realization copies
- subject-specific rescue vocabulary
- noun-to-genre template dictionaries
- compiler/meta-language leaking into final prose
- wrappers that secretly run another compiler after the universal compiler
- generic significance prose patched by endless regex substitutions
- architecture changes disguised as "smarter cognition"

## Validation

```powershell
pnpm --filter @qre/contracts build
pnpm --filter @qre/engine build
pnpm --filter @qre/engine run test:universal
pnpm --filter @qre/engine run test:realization
```

For cognitive/creative work, also run the acceptance probes under `packages/engine/src/compiler/tests/` and verify that created details carry `creative_realization` provenance.

## Current hard acceptance

The coupled premise `Turn this concert QR into something people will remember.` must preserve `concert`, `qr`, and `remember` in actual story beats, not merely metadata.

The mundane premise `A housekeeper documents a client's home after a huge cleaning day.` must not collapse into a keyword dump or a generic "meaningful discovery" story. It must retain the housekeeper/home/cleaning/documentation relationship and may introduce a fresh, premise-compatible attention twist with explicit creative provenance.