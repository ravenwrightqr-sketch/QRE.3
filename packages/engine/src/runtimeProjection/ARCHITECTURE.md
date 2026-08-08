# Runtime Projection Boundary

The runtime consumes canonical semantic artifacts and may project them independently.

```text
Runtime state
   |
   +--> GeoStory
   |
   +--> MemorySnapshot
   |
   +--> CinematicScene[]
```

Geo and memory are separate artifacts. A caller may build Geo without memory, memory without Geo context, or both. Neither projection owns persistence, API response formatting, or scan routing.

`projectGeoStory()` and `projectMemorySnapshot()` are the public composition functions. `projectRuntime()` exists only as a compatibility convenience and must not become a new dependency boundary.
