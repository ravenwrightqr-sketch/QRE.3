# Super Cog Engineering Rules

## Mission
Build a domain-neutral cognitive experience compiler that can turn arbitrary prompts into concrete, fun, coherent experiences without subject-specific story templates or generic significance prose.

## Locked architecture

`PROMPT -> UNDERSTANDING -> MEANING -> EXPERIENCE GENOME -> COMPILER MIND -> WORLD/BLUEPRINT -> DIRECTION -> FLOW -> MOMENTS -> SCENES`

The brain gets smarter; the architecture does not get replaced.

## Semantic rules

- Preserve distinctive prompt evidence in actual beats, not only metadata.
- Treat coupled premises as bundles: event + artifact/medium + audience + human outcome must survive realization.
- Treat QR/NFC/scan/tag as media/interfaces unless the prompt explicitly makes them the subject.
- The physical art object is an artifact/portal concept and may be non-square, DIY-shaped, physical, wearable, installed, or not visibly QR-like.
- Do not create branches for individual nouns or industries.
- Generalize event context rather than building a concert-only branch.
- Keep semantic/runtime contracts in `@qre/contracts`.
- Engine remains Prisma-agnostic.

## Validation

```powershell
pnpm --filter @qre/contracts build
pnpm --filter @qre/engine build
pnpm --filter @qre/engine run test:universal
pnpm --filter @qre/engine run test:realization
```

## Current hard acceptance

The coupled premise `Turn this concert QR into something people will remember.` must preserve `concert`, `qr`, and `remember` in the actual story beats, not merely in metadata.
