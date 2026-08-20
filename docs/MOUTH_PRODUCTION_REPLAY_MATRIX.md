# QRE MOUTH · REPLAY / ACCEPTANCE MATRIX

## Goal

Catch universal production failures without coupling the machine to one industry or one example.

## Required Invariants

Every fixture should assert, where applicable:

- reality preserved;
- no unsupported concrete invention;
- candidate pools non-empty;
- no exact duplicate non-terminal Mouth lines;
- callbacks may reuse evidence only with semantic advance;
- exact endpoint preserved when one is supplied;
- terminal payoff may restate the approved endpoint fact;
- middle cuts are not allowed to starve the frontier through pure repetition;
- cut policy returns per-cut diagnostics;
- sequence arc distinguishes middle transition from terminal landing;
- final scene count equals accepted sequence length;
- diagnostics identify the first failing layer.

## Fixture Families

| Family | Example intent |
|---|---|
| PET_GROOMING | service receipt / temperament / memorable detail |
| DOG_DAYCARE | daily experience / behavior / return visit |
| SHELTER | intake / personality / adoption story |
| RESCUE | before / rescue event / aftercare / outcome |
| LIVING_PET_MEMORY | recurring relationship / memory / callback |
| WEDDING | couple / detail / emotional turn / payoff |
| FAMILY_MEMORY | ordinary memory / relationship reveal / callback |
| RESTAURANT | meal / guest detail / signature moment |
| HOSPITALITY | stay / surprise / service detail |
| REAL_ESTATE | property / buyer reaction / distinctive detail |
| EVENT | arrival / standout moment / closing payoff |
| PERSONAL_STORY | person / contradiction / turn / consequence |
| ROMANCE | relationship / tension / reveal / landing |
| COMEDY | setup / contradiction / escalation / punchline |
| HORROR | ordinary detail / threat / escalation / terminal image |
| BUSINESS | customer / product / problem / outcome |
| ABSTRACT | concept supplied in language, no fabricated physical reality |

## Failure Classification

```text
GENERATION_FAILURE
  model returned unusable language

REALIZATION_FAILURE
  approved beat could not be realized distinctly

TRUTH_FAILURE
  unsupported concrete reality

BEAM_FAILURE
  no legal complete trajectory

CUT_FAILURE
  one or more realized lines violate final legality

ARC_FAILURE
  accumulation / payoff contract failed

ENDPOINT_FAILURE
  selected endpoint was not preserved
```

## Development Loop

1. Run one canonical fixture.
2. Inspect per-cut diagnostics.
3. Classify the first failing layer.
4. Change the owning layer only.
5. Replay captured candidates for deterministic layers.
6. Run the canonical fixture again.
7. Run at least one unrelated-domain fixture before declaring the change universal.

## Anti-Overfitting Rule

A fix is not considered production-ready merely because Coco passes.

A rule is accepted only when it improves or preserves the universal invariants across at least three materially different domains, including one non-pet domain and one memory/relationship domain.
