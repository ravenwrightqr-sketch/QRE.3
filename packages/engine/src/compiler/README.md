# Compiler Core

QRE has one public authoring path.

```ts
import { compileExperience } from "@qre/engine/compiler";
```

The active pipeline is:

```text
Human prompt
  -> Cognition V2
  -> ExperienceUnderstanding
  -> Meaning Context
  -> ExperienceGenome
  -> Cognitive synthesis
  -> ExperienceWorld
  -> ExperienceBlueprint
  -> ExperienceMoment[]
      |-> Flow projection
      |-> Cinematic projection
```

## Cognition V2 behavior

The cognitive front door is deliberately open-ended. It does not require an industry classification or a rigid configuration form. It asks what exists, who is involved, why someone would interact, what should happen, what should evolve, what should be remembered, what can be discovered, what would delight, and where commerce naturally belongs.

The behavioral contract lives in `@qre/cognition-v2` as `COGNITION_V2_MASTER_PROMPT`.

## Architectural rules

- `ExperienceMoment` remains the semantic boundary.
- Flow and Cinematic are projections; they do not redefine meaning.
- Geo Story and Memory Snapshot remain separate runtime artifacts.
- Evidence, temporal memory, connection graphs, and analytics are supporting cognition infrastructure, not additional compiler brains.
- Do not create another compiler orchestrator.
- Do not add industry-specific compiler branches merely to make a new use case work.
- New intelligence must enrich the canonical cognitive understanding/plan or become a projection after the semantic boundary.

The previous compiler brain exports are no longer part of the public compiler boundary. The old implementation can now be removed in controlled batches after build/test verification rather than becoming another active path.
