# Author Validation 2026-10-03
Relationship having “1 Author beat” is okay only because it contains multiple reveal-worthy sentences. We should document that distinction explicitly so six months from now nobody sees “1 beat” and decides the system can return one static screen.
## Test Record
Author beat count = semantic structure.
Playout reveal count = viewer pacing.
- Branch: `fuck-you-bitch-is-awake`
- HEAD/base checkpoint: `7bd302d3` (`checkpoint(author): preserve universal rhetorical author recovery`)
- Tested state: checkpoint source plus the uncommitted synthesizer/Playout changes in the working tree. The captured logs do not contain a source hash or the exact synthesizer system prompt, so they cannot independently prove which exact prompt revision was loaded.
- Provider/model: OpenRouter, `openai/gpt-5.4-mini`
- Experimental flags requested: `QRE_AUTHOR_DIRECT_CREATIVE_EXPERIMENT=true`, `QRE_AUTHOR_REALITY_EDITOR_EXPERIMENT=true`, `QRE_AUTHOR_SYNTHESIZER_OPENROUTER_MAX_TOKENS=4000`, `QRE_AUTHOR_DEBUG_RAW=true`
- All seven recorded cases exited `0`; the summary reports no HTTP 429s.
- Full runner summary: [.qre-debug/author-final-validation-20261002-200910511/SUMMARY.txt](../.qre-debug/author-final-validation-20261002-200910511/SUMMARY.txt)

## Moving-Text Doctrine

Sequence length is earned, with no fixed Author beat count. Beats should progressively develop meaning through setup, contrast, turn, payoff, and optional aftershock when those moves earn their place. The synthesizer should prioritize phone readability without mechanical word counting, avoid event coverage as a goal, and let supplied reality selectively support expressive perspective.

An **Author beat** is a semantic/creative unit, not necessarily a frontend text reveal. Current canonical playout maps each scene to one sequence cut and then to one beat/moment. A scene containing multiple short sentences remains one current cut; a future Playout layer may split it into ordered text reveals. Media belongs in that future presentation layer, not in Author text-count rules.

## Case Results

### COCO

- Mode / path: MEMORY; direct Author and Reality Editor ran.
- Raw Author A/B/C: A: “Coco was nervous. / Then came the bow. / That was the problem.” B: “A bath, fine. / The bow? No. / Coco made that clear.” C: “Coco tried to remove it. / So much for decoration. / Happy came later.”
- Claim Auditor / Reality Editor: applied; zero spans removed. Synthesis Claim Auditor protocol valid; zero spans removed.
- Authorized pool: present, 10 entries.
- Deterministic assembler: “That was the problem. So much for decoration.” Eligible.
- Raw synthesizer: “Nervous first. / Then came the bow. / The bow? No. / Coco made that clear. / So much for decoration. / Happy came later.” Eligible.
- Winner / final: `ASSEMBLED`; six Author beats, all above.
- Canonical grounding: seven captured clauses; zero with unsupported claims.
- Model calls: 14. Camera recovery: NOT CAPTURED.
- Assessment: PASS. The synthesizer expanded the assembler into a progressive sequence with opening state, resistance, attitude, and payoff. The supplied opening and ending states function as setup/payoff rather than full event coverage. The six-beat length is not a defect.
- Log: [COCO.log](../.qre-debug/author-final-validation-20261002-200910511/COCO.log)

### COCO_BLIND

- Mode / path: fixture has no `experienceMode`; direct Author was false, so this is a normal-path run, not a full experimental-stack validation.
- Raw A/B/C: A: “Nervous, first. / Then came the bath, and the bow. / Coco tried to remove the bow. / But Coco left happy.” B: “Coco was nervous. / Coco got a bath; a bow was added. / The bow did not go unchallenged. / Happy in the end, even after the bow fight.” C: “Just nervousness, at first. / Bath first. Bow after. / She went for the bow. / The bow was trouble, not the verdict: Coco left happy.”
- Claim Auditor, pool, assembler, synthesizer, synthesis eligibility, and production winner: NOT CAPTURED; those experimental stages did not run.
- Final: “Coco was nervous. / Then came the bath, and the bow. / The bow did not go unchallenged. / But Coco left happy.” Four Author beats.
- Canonical grounding: four captured clauses; zero with unsupported claims. Model calls: 11. Camera recovery: NOT CAPTURED.
- Assessment: PASS for the existing blind fixture. The four beats move from nervousness through grooming and resistance to the happy exit. Do not count this as evidence for the experimental pool/synthesizer stack.
- Log: [COCO_BLIND.log](../.qre-debug/author-final-validation-20261002-200910511/COCO_BLIND.log)

### HOUSEKEEPING

- Mode / path: MEMORY; direct Author and Reality Editor ran.
- Raw Author A/B/C: A: “Arrived at 9:04. / Kitchen. Two bathrooms. / Gone at 11:47.” B: “Not much on the list. / Three hours on the clock. / Cleaning knows how to linger.” C: “One kitchen. / Two bathrooms. / A whole morning, apparently.”
- Claim Auditor / Reality Editor: applied; zero spans removed. Synthesis Claim Auditor protocol valid; zero spans removed.
- Authorized pool: present, 10 entries.
- Deterministic assembler: “Not much on the list. Still, three hours on the clock. Still, cleaning knows how to linger.” Eligible.
- Raw synthesizer: “Not much on the list. / One kitchen. Two bathrooms. / Arrived at 9:04. / Three hours on the clock. / Gone at 11:47.” Eligible.
- Winner / final: `ASSEMBLED`; five Author beats, all above.
- Canonical grounding: six captured clauses; zero with unsupported claims. Model calls: 14. Camera recovery: NOT CAPTURED.
- Assessment: AUTHOR FAILURE (later-stage flattening/recap). The assembler’s “cleaning knows how to linger” supplies the strongest attitude; synthesis drops it and adds inventory/timing coverage. This is a meaning/selection issue, not a five-beat-length issue.
- Log: [HOUSEKEEPING.log](../.qre-debug/author-final-validation-20261002-200910511/HOUSEKEEPING.log)

### RELATIONSHIP

- Mode / path: MEMORY; direct Author and Reality Editor ran.
- Raw Author A/B/C: A: “I was nervous first. / Not a bad sign. / Just a hard door. / Two hours later, lighter.” B: “Alex had the entrance problem. / The conversation didn’t. / That’s the whole trick.” C: “Before Alex: nerves. / After Alex: air. / Next week, again. / So it was never the wall.”
- Claim Auditor / Reality Editor: applied; zero spans removed. Synthesis Claim Auditor protocol valid; zero spans removed.
- Authorized pool: present, 11 entries.
- Deterministic assembler: “Not a bad sign. Still, just a hard door. Still, alex had the entrance problem.”
- Raw synthesizer: “Before Alex: nerves. / The conversation didn’t. / That’s the whole trick. / After Alex: air. / Next week, again. / So it was never the wall.” Synthesis eligibility was false: `invented-concrete-reality`.
- Winner / final: production A; one Author beat containing “Nervous before meeting Alex. Not a warning. A threshold. The meeting was hard to enter, not hard to sustain.”
- Canonical grounding: four captured clauses; zero with unsupported claims. Model calls: 15. Camera recovery: NOT CAPTURED.
- Assessment: PASS with a stage limitation. The invalid synthesizer candidate was rejected and production A survived. Its four short sentences are one current Author beat, not four current frontend reveals; future Playout may separate those reveals. The failed synthesis candidate is not evidence that a six-line output is required.
- Log: [RELATIONSHIP.log](../.qre-debug/author-final-validation-20261002-200910511/RELATIONSHIP.log)

### MILO_MEMORY

- Mode / path: MEMORY; direct Author and Reality Editor ran.
- Raw Author A/B/C: A: “Five o’clock. / Then fifty-six minutes. / That’s not a stroll. / That’s an outing in a dog suit.” B: “Milo went out at 5 PM. / Came back after 56 minutes. / Long enough to collect squirrels, / five dogs, / and two compliments.” C: “Fifty-six minutes has opinions. / It says: this was not quick. / It was a proper walk, / with witnesses.”
- Claim Auditor / Reality Editor: applied; zero spans removed. Discovery rejected some unsupported alternatives; none appears in the final output. Synthesis Claim Auditor protocol valid; zero spans removed.
- Authorized pool: present, 9 entries.
- Deterministic assembler: “That’s not a stroll. Still, that’s an outing in a dog suit. Still, it was a proper walk,.” Eligible.
- Raw synthesizer: “Five o’clock. / Fifty-six minutes has opinions. / It says: this was not quick. / That’s not a stroll. / That’s an outing in a dog suit.” Eligible.
- Winner / final: `ASSEMBLED`; five Author beats, all above.
- Canonical grounding: five captured clauses; zero with unsupported claims. Model calls: 13. Camera recovery: NOT CAPTURED.
- Assessment: PASS with a redundancy note. The duration/“not quick”/“not a stroll” beats overlap, but move from measured duration toward the outing’s character. Review the explanatory “It says” beat in Playout; beat count alone is not a failure.
- Log: [MILO_MEMORY.log](../.qre-debug/author-final-validation-20261002-200910511/MILO_MEMORY.log)

### MILO / IDENTITY

- Mode / path: IDENTITY; direct Author was false because the experiment gate is Memory-only. The older Identity `variantsByBeat` topology remains in use.
- Raw A/B/C: A: “Walks and bacon sit on the same shelf for Milo. No hierarchy, no apology.” B: “Milo’s version of company is simple: move first, keep it small, keep it friendly.” C: “The heart of the thing is bluntly practical—something to eat, something to like, nothing ornamental.”
- Claim Auditor, pool, assembler, synthesizer, synthesis eligibility, and production winner: NOT CAPTURED; they did not run.
- Final: “Walks and bacon sit on the same shelf for Milo. No hierarchy, no apology.” One Author beat with two short sentences.
- Canonical grounding: two captured clauses; zero with unsupported claims. Model calls: 10. Camera recovery: NOT CAPTURED.
- Assessment: PASS for this Identity fixture, not a validation of the experimental stack. The rhetorical character read survived local selection. The single scene contains two sentences; a future Playout layer may reveal them separately.
- Log: [MILO.log](../.qre-debug/author-final-validation-20261002-200910511/MILO.log)

### HOUSE / REAL ESTATE

- Mode / path: MEMORY; custom fixed House fixture through `authorBrainCanonical`; direct Author and Reality Editor ran.
- Reality: porch photographed Thursday; afternoon showing; open house Saturday; offer Monday.
- Raw Author A/B/C: A: “Saturday was not a long visit. / It was a runway. / Monday said so.” B: “The weekend got promoted. / Not to waiting. / To takeoff.” C: “Open house on Saturday. / Offer on Monday. / That’s barely a pause.”
- Claim Auditor / Reality Editor: applied; zero spans removed. Synthesis Claim Auditor protocol valid; zero spans removed.
- Authorized pool: present, 9 entries.
- Deterministic assembler: “Saturday was not a long visit. Still, it was a runway. Still, the weekend got promoted.” Eligible.
- Raw synthesizer: “Saturday was not a long visit. / It was a runway. / Monday said so. / That’s barely a pause.” Eligible.
- Winner / final: `ASSEMBLED`; four Author beats, all above.
- Canonical grounding: four captured clauses; zero with unsupported claims. Model calls: 13. Camera recovery: NOT CAPTURED.
- Assessment: PASS. The setup develops into runway/takeoff language and lands on the short interval. The sequence length is earned by the progression.
- Log: [HOUSE.log](../.qre-debug/author-final-validation-20261002-200910511/HOUSE.log)

## Cross-Case Findings

- Valid rhetorical material survived the Reality Editor in all experimental Memory cases: each reports zero removed spans. Final canonical grounding reports zero unsupported claims for every case.
- Variable sequence lengths appear across final outputs; no beat count is treated as inherently better.
- The clearest flattening is Housekeeping: its winning synthesis replaces the assembler’s stronger attitude with more factual inventory/timing coverage.
- Relationship synthesis was safely rejected for `invented-concrete-reality`; the accepted direct-Author production became the final output.
- Camera recovery: NOT CAPTURED in all seven logs. Do not infer that it ran or that it was unnecessary.
- `COCO_BLIND` and `MILO/IDENTITY` are existing fixtures but did not use the experimental writer/authority stack; their mode gates left them on the normal path. Identity still uses its older local `variantsByBeat` selector.
- The logs capture outcomes and executed stages but do not record a source hash or exact synthesizer system prompt, so exact prompt-version attribution is unproven.

## Known Remaining Issues

- Identity remains on the legacy four-variant-per-beat writer/selector; this run does not validate production-major Identity.
- Housekeeping shows synthesis can flatten the assembler’s stronger attitude into event coverage.
- Relationship synthesis was rejected by truth evaluation; the fallback worked in this run.
- Camera recovery activation is not captured.
- Current renderer preserves one scene/cut per Author beat. Splitting multi-sentence beats into timed text reveals belongs to future `ExperiencePlayout` / `SequenceComposer`, alongside ordered TEXT / IMAGE / VIDEO items.
- The build still has unrelated TypeScript errors in `authorCreativeDiscovery.ts`; previously observed stale Reality Editor/Claim Auditor regression assertions are not fixed here.

## Housekeeping Preservation Correction

- Correction: synthesis input now exposes `protectedExpressiveRealizations`, derived from the deterministic authorized-realization selection. These are the strongest earlier expressive discoveries that synthesis must preserve or intensify.
- Correction: the Authorized Realization Synthesizer prompt now says protected expressive material must remain central, factual setup is only useful when it strengthens that expressive realization, and complete factual inventory is not a goal.
- Correction: assembly eligibility now rejects grounded synthesized candidates that drop protected expressive realization IDs after synthesis/reality audit with `assembly-dropped-protected-expressive-realization`.
- Regression: `apps/api/author-authorized-realization-assembly-regression.mjs` now includes a grounded-but-flattened synthesis case that uses factual coverage while omitting protected expressive material; it must be ineligible.
- Targeted rerun status: attempted HOUSEKEEPING live rerun with OpenRouter selected, but the current shell and `apps/api/.env` do not provide `OPENROUTER_API_KEY`, so no successful authenticated OpenRouter validation was captured.
- Failed rerun logs:
  - `.qre-debug/author-housekeeping-preservation-20261002-204047332/HOUSEKEEPING.log` used the default local provider and failed with `ECONNREFUSED 127.0.0.1:11434`.
  - `.qre-debug/author-housekeeping-preservation-openrouter-20261002-204118955/HOUSEKEEPING.log` selected OpenRouter but failed before authentication because `OPENROUTER_API_KEY` was missing.
  - `.qre-debug/author-housekeeping-preservation-openrouter-dotenv-20261002-204147022/HOUSEKEEPING.log` used `apps/api` dotenv loading and still failed because `OPENROUTER_API_KEY` was missing.

## Evidence Files

- `.qre-debug/author-final-validation-20261002-200910511/COCO.log`
- `.qre-debug/author-final-validation-20261002-200910511/COCO_BLIND.log`
- `.qre-debug/author-final-validation-20261002-200910511/HOUSEKEEPING.log`
- `.qre-debug/author-final-validation-20261002-200910511/RELATIONSHIP.log`
- `.qre-debug/author-final-validation-20261002-200910511/MILO_MEMORY.log`
- `.qre-debug/author-final-validation-20261002-200910511/MILO.log`
- `.qre-debug/author-final-validation-20261002-200910511/HOUSE.log`
- `.qre-debug/author-final-validation-20261002-200910511/SUMMARY.txt`
