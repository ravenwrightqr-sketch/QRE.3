# Super Cog Engineering Rules

## Mission
Build a domain-neutral cognitive experience compiler that can turn arbitrary prompts into concrete, fun, coherent experiences without subject-specific story templates or generic significance prose.

## Locked architecture

`PROMPT -> UNDERSTANDING -> MEANING -> EXPERIENCE GENOME -> COMPILER MIND -> WORLD/BLUEPRINT -> DIRECTION -> FLOW -> MOMENTS -> SCENES`

The brain gets smarter; the architecture does not get replaced.

## Canonical file responsibilities

- `packages/engine/src/experience/universalStoryCompiler.ts` — **UNIVERSAL COMPILER / STRUCTURE AUTHORITY**. Owns observation-to-story structure and downstream projections. It is not a second brain.
- `packages/engine/src/experience/premiseRealizer.ts` — **CANONICAL LANGUAGE REALIZATION AUTHORITY**. Converts the already-selected premise, relations, evidence, and directives into observable language. It does not plan, score directions, or invent domain facts.
- `packages/engine/src/experience/cognitiveMechanics.ts` — **EXPERIENTIAL MECHANICS**. Derives reusable behavioral operations such as escalation, transformation, discovery, participation, excess, memory, continuation, and adaptation. It must remain domain-neutral.
- `packages/engine/src/cognition/*` — **COGNITION**. Owns understanding, evidence, hypotheses, direction, premise, and cognitive plan decisions.

### One-authority rule

There is exactly one canonical premise realization implementation: `premiseRealizer.ts`.

Do not create `premiseRealizerV2.ts`, `premiseRealizerV3.ts`, `SuperStoryRealizer`, `UniversalStoryCompilerSuper`, or another parallel realization/compiler brain. If realization needs to become smarter, strengthen the canonical boundary instead.

## Semantic rules

- Preserve distinctive prompt evidence in actual beats, not only metadata.
- Treat coupled premises as bundles: event + artifact/medium + audience + human outcome must survive realization.
- Treat QR/NFC/scan/tag as media/interfaces unless the prompt explicitly makes them the subject.
- The physical art object is an artifact/portal concept and may be non-square, DIY-shaped, physical, wearable, installed, or not visibly QR-like.
- Do not create branches for individual nouns or industries.
- Generalize event context rather than building a concert-only branch.
- Keep semantic/runtime contracts in `@qre/contracts`.
- Engine remains Prisma-agnostic.
- Semantic relations are stronger than keyword rescue. Render relationships already selected by cognition rather than inventing facts from noun dictionaries.
- Directive actions are authoritative semantic material and must survive into observable realization.
- Evidence coverage is a compilation invariant: a good-sounding story that drops a high-salience premise dimension is a failed compilation.
- Feel-good means **lean into the actual experience**, not forced wholesome sentiment. Horror, comedy, luxury, absurdity, competition, mystery, celebration, utility, and self-care can all be fully realized when supported by the prompt.

## Forbidden drift

Kill rather than extend:

- duplicate realization authorities
- `V2`/`V3` realization copies
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

## Current hard acceptance

The coupled premise `Turn this concert QR into something people will remember.` must preserve `concert`, `qr`, and `remember` in the actual story beats, not merely in metadata.
