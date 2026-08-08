# QRE Compiler Architecture

## Canonical path

```text
Prompt
  -> Understanding
  -> Meaning Context
  -> Experience Genome
  -> Cognitive Synthesis
  -> Experience World
  -> Experience Blueprint
  -> ExperienceMoment[]
       |-> FlowStep[]
       |-> CinematicScene[]
```

`ExperienceMoment` is the semantic boundary. The compiler creates it; runtime consumes it.

## Boundaries

- `coreCompiler.ts` — only compiler orchestration path.
- `compilerBrain.ts` — compatibility/public brain boundary; delegates to the core.
- `experience/genomeCompiler.ts` — compatibility import boundary only.
- `blueprintComposer.ts` — creates the canonical `ExperienceBlueprint` and its Moments.
- `blueprintToFlow.ts` — projects Moments/Blueprint into executable FlowSteps.
- `cinematic/cinematicCompiler.ts` — projects Moments into CinematicScenes.
- `runtimeProjection/` — runtime-only artifacts; GeoStory and MemorySnapshot are independent projections.
- `scanEngine.ts` — runtime orchestration; never becomes a compiler.

## Prohibited architecture

The following must not return:

- a second compiler entry point;
- a second Moment type;
- compiler-owned persistence;
- Prisma imports in compiler/runtime projection logic;
- GeoStory embedded as MemorySnapshot state;
- MemorySnapshot embedded as cinematic scene state;
- frontend-specific compiler contracts;
- business/scan execution inside the compiler.

Legacy modules may remain temporarily while imports are migrated, but they are not allowed to become new orchestration paths.
