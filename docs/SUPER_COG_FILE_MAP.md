# QRE.3 Super Cog File Map

This file is the navigation map for the cognitive/compiler brain.

**Rule:** a file is not authoritative merely because its name sounds important. The labels below define responsibility. If two files claim the same authority, consolidate them.

## 1. Brain / cognition

| File | Label | Responsibility | Must NOT do |
|---|---|---|---|
| `packages/engine/src/cognition/cognitiveEngine.ts` | `COG-UNDERSTANDING` | Extract entities, claims, cues, hypotheses, direction, opportunities, and cognitive plan | Render story prose or create domain templates |
| `packages/engine/src/cognition/premiseBuilder.ts` | `COG-PREMISE` | Build the conserved role-based premise and relations | Invent unsupported facts |
| `packages/engine/src/cognition/cognitiveExperienceRealizer.ts` | `COG-SEMANTIC+CREATIVE-REALIZATION` | Turn the selected plan into beat directives; may introduce explicitly created, provenance-tagged experiential twists | Render final presentation prose or become a second compiler |
| `packages/engine/src/cognition/cognitiveMechanics.ts` | `COG-MECHANICS` | Infer reusable experiential mechanics such as escalation, contrast, discovery, excess, participation, memory, continuation | Branch by noun/industry |
| `packages/engine/src/experience/cognitiveTrajectory.ts` | `COG-TRAJECTORY` | Compose mechanics into a causal experiential trajectory | Reconstruct meaning from scratch |
| `packages/engine/src/experience/cognitiveVocabulary.ts` | `COG-VOCABULARY` | Reusable behavioral/affective vocabulary | Become a genre/template dictionary |
| `packages/engine/src/cognition/index.ts` | `COG-EXPORTS` | Cognition public export surface | Hide alternate authorities |

## 2. Conserved contracts

| File | Label | Responsibility |
|---|---|---|
| `packages/contracts/src/experience/cognition.ts` | `CONTRACT-COGNITION` | Cognitive claims, evidence, hypotheses, plans, realization directives |
| `packages/contracts/src/experience/premise.ts` | `CONTRACT-PREMISE` | Universal semantic roles and relations |
| `packages/contracts/src/experience/story.ts` | `CONTRACT-STORY` | Story/beat/scene-facing runtime shapes |
| `packages/contracts/src/experience/blueprint.ts` | `CONTRACT-BLUEPRINT` | Blueprint and cognitive-plan attachment |
| `packages/contracts/src/experience/semantic.ts` | `CONTRACT-SEMANTIC` | Semantic interpretation/context contracts |
| `packages/contracts/src/experience/entityExtractor.ts` | `CONTRACT-ENTITIES` | Universal entity shape |
| `packages/contracts/src/experience/index.ts` | `CONTRACT-EXPORTS` | Canonical experience contract exports |
| `packages/contracts/src/index.ts` | `CONTRACT-ROOT` | Package-level contract exports |

**Contract rule:** engine-local copies of these semantic shapes are non-authoritative and should be removed rather than extended.

## 3. Compiler spine

| File | Label | Responsibility | Authority |
|---|---|---|---|
| `packages/engine/src/experience/cognitiveExperienceCompiler.ts` | `COMPILER-ORCHESTRATOR` | Compose cognition → premise → realization → universal compiler; propagate canonical outputs | **YES: orchestration only** |
| `packages/engine/src/experience/universalStoryCompiler.ts` | `COMPILER-STRUCTURE` | Observe, choose structure, create beats, blueprint, flow, moments, scene plan, cinematic scenes | **YES: universal structure** |
| `packages/engine/src/experience/premiseRealizer.ts` | `COMPILER-LANGUAGE` | Canonical observable language realization from premise + directives + evidence | **YES: one language authority** |
| `packages/engine/src/experience/eloquentStoryRealizer.ts` | `COMPAT-FACADE` | Preserve old imports while delegating to `premiseRealizer.ts` | **NO** |
| `packages/engine/src/experience/genomeCompiler.ts` | `COMPILER-GENOME` | Compile/merge experience genome | Supporting authority |
| `packages/engine/src/experience/blueprintToFlow.ts` | `COMPILER-PROJECTION` | Project blueprint into executable flow | Projection only |
| `packages/engine/src/experience/blueprintComposer.ts` | `LEGACY/REVIEW` | Historical blueprint composition logic | Do not resurrect as a second compiler |

## 4. Runtime/world handoff

| File | Label | Responsibility |
|---|---|---|
| `packages/engine/src/world/worldDomain.ts` | `WORLD` | World/context representation used by the experience runtime |
| `packages/engine/src/runtime/cinematic/cinematicRuntime.ts` | `RUNTIME-CINEMATIC` | Execute/render compiled cinematic experience |
| `packages/engine/src/index.ts` | `ENGINE-EXPORTS` | Public engine surface |
| `apps/api/src/services/experienceService.ts` | `APP-EXPERIENCE-SERVICE` | API-side experience orchestration/persistence boundary |
| `apps/api/src/services/experienceCreationServices.ts` | `APP-CREATION-SERVICE` | API-side creation workflow |
| `apps/api/src/routes/experience.ts` | `APP-EXPERIENCE-ROUTE` | HTTP boundary |
| `apps/web/src/lib/experienceApi.ts` | `WEB-EXPERIENCE-API` | Frontend API boundary |
| `apps/web/src/components/compiler/ExperienceComposer.tsx` | `WEB-COMPOSER` | Prompt → draft interaction; should not become save authority |
| `apps/web/src/pages/ExperiencePreview.tsx` | `WEB-PREVIEW` | Preview compiled experience |
| `apps/web/src/pages/AssetDashboard.tsx` | `WEB-DASHBOARD` | Dashboard/asset-facing experience management |

## 5. Tests that protect the brain

| File | Label | What it protects |
|---|---|---|
| `packages/engine/src/compiler/tests/experienceCompiler.test.ts` | `TEST-COMPILER` | General compiler behavior |
| `packages/engine/src/compiler/tests/cognitivePromptMatrix.ts` | `TEST-PROMPT-MATRIX` | Cross-domain universality |
| `packages/engine/src/compiler/tests/cognitiveConcreteExperienceAcceptance.ts` | `TEST-CONCRETE` | Mechanics reaching actual experience language |
| `packages/engine/src/compiler/tests/cognitiveDirectiveAuthorityAcceptance.ts` | `TEST-DIRECTIVE` | Directive preservation |
| `packages/engine/src/compiler/tests/cognitiveRealizationAcceptance.ts` | `TEST-REALIZATION` | Semantic realization integrity |
| `packages/engine/src/compiler/tests/cognitiveRuntimeAcceptance.ts` | `TEST-RUNTIME` | Downstream runtime handoff |
| `packages/engine/src/compiler/tests/cognitiveTrajectoryAcceptance.ts` | `TEST-TRAJECTORY` | Mechanics/trajectory coherence |
| `packages/engine/src/compiler/tests/cognitiveMechanicsAcceptance.ts` | `TEST-MECHANICS` | Universal mechanics |
| `packages/engine/src/compiler/tests/premiseRealizerAcceptance.ts` | `TEST-PREMISE` | Premise conservation |
| `packages/engine/src/compiler/tests/superCogPremiseAcceptance.ts` | `TEST-SUPER-COG` | End-to-end semantic conservation |
| `packages/engine/src/experience/universalStoryCompiler.acceptance.ts` | `TEST-UNIVERSAL` | Universal compiler invariants |

## 6. Audit / documentation

| File | Label | Responsibility |
|---|---|---|
| `AGENTS.md` | `MASTER-RULES` | Non-negotiable engineering/cognitive rules |
| `docs/SUPER_COG_NEXT_LEVEL_PLAN.md` | `ROADMAP` | Evolution plan for the compiler brain |
| `ENGINE_AUDIT/COMPILER_REBUILD.md` | `AUDIT-COMPILER` | Compiler reconstruction/audit record |
| `ENGINE_AUDIT/cognition.txt` | `AUDIT-COGNITION` | Cognitive audit record |
| `ENGINE_AUDIT/experience.txt` | `AUDIT-EXPERIENCE` | Experience/compiler audit record |
| `ENGINE_AUDIT/00_tree.txt` | `AUDIT-TREE` | Historical tree snapshot; useful for archaeology, not authority |

## 7. Legacy / danger zone

These categories are not places to add more intelligence:

- deleted analyzer stacks under `packages/engine/src/compiler/analyzers/`
- old semantic compiler stacks under `packages/engine/src/compiler/semantic/`
- old understanding compiler stacks under `packages/engine/src/compiler/understanding/`
- `premiseRealizerV2.ts` / `premiseRealizerV3.ts` — removed from the active architecture
- scripts whose only purpose is repeatedly rewiring realization authorities
- generated JS sitting beside TS source

If a new feature appears to require one of these, first ask which canonical layer is missing the capability.

## 8. The actual direction of travel

```text
USER PROMPT
    ↓
UNDERSTAND WHAT IS ACTUALLY THERE
    ↓
CONSERVE SUBJECT + RELATIONSHIPS + EVIDENCE
    ↓
EXPLORE EXPERIENCE POSSIBILITIES
    ↓
SELECT A DIRECTION
    ↓
SELECT UNIVERSAL MECHANICS / TRAJECTORY
    ↓
CREATE NOVEL MATERIAL WHEN IT HELPS
    │   └── mark it creative_realization
    ↓
REALIZE CONCRETELY
    ↓
CHECK THAT THE PREMISE SURVIVED
    ↓
COMPILE VARIABLE STORY STRUCTURE
    ↓
PROPAGATE THE SAME CANONICAL BEATS
    ↓
BLUEPRINT → FLOW → MOMENTS → SCENES → RUNTIME
```

The compiler should make the user think:

> **"Holy shit. I didn't even think of that."**

without ever making the user wonder whether the compiler forgot what they actually asked for.
