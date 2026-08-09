# Super Cog Engineering Rules

## Mission
Build a domain-neutral cognitive experience compiler that can turn arbitrary user prompts into concrete, fun, coherent experiences without subject-specific story templates or generic significance prose.

## Locked architecture

`PROMPT -> UNDERSTANDING -> MEANING -> EXPERIENCE GENOME -> COMPILER MIND -> WORLD/BLUEPRINT -> DIRECTION -> FLOW -> MOMENTS -> SCENES`

The brain gets smarter; the architecture does not get replaced.

## Hard rules

- Preserve distinctive prompt evidence in actual story beats, not only metadata.
- Treat coupled premises as bundles. If a prompt contains event + medium + human outcome, all dimensions must survive realization.
- Do not create branches for individual nouns or domains.
- Do not add canned subject-specific stories.
- Do not use significance filler such as `is the thing the experience puts into focus`, `deserves a closer look`, `the experience leaves a meaning behind`, or similar dead prose.
- Prefer observable events, actions, consequences, participation, evidence, change, and continuation.
- Keep semantic/runtime contracts in `@qre/contracts`.
- Engine code remains Prisma-agnostic.
- Run contracts build before engine build.
- Universal acceptance is `pnpm --filter @qre/engine test:universal`.

## Local validation

```powershell
pnpm --filter @qre/contracts build
pnpm --filter @qre/engine build
pnpm --filter @qre/engine test:universal
pnpm --filter @qre/engine exec tsx src/compiler/tests/manualRealizationProbe.ts
```

## Current priority

Strengthen premise evidence conservation and semantic composition. The QR/concert case is a representative coupled premise, not a special case. A correct solution must generalize to any event, medium, social interaction, memory, geographic context, or future-evolution combination.
