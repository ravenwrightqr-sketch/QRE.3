# Compiler verification

Run locally from the repository root:

```powershell
pnpm --filter @qre/contracts build
pnpm --filter @qre/cognition build
pnpm --filter @qre/cognition-v2 build
pnpm --filter @qre/engine build
```

Then exercise the canonical entry with a real prompt through the existing API/compiler test path.

Required invariants:

1. A prompt produces `ExperienceGenome`.
2. A genome produces one `ExperienceWorld` and one `ExperienceBlueprint`.
3. `blueprint.moments` is the canonical `ExperienceMoment[]`.
4. Flow is derived from the Blueprint; it does not create a second semantic Moment model.
5. Cinematic scenes are derived from the same Blueprint/Moments.
6. GeoStory can be produced without MemorySnapshot.
7. MemorySnapshot can be produced independently and receives GeoStory only as optional context.
8. Analytics repositories are runtime concerns; compiler analytics input is normalized data only.
9. No compiler module imports Prisma or repositories.
