# QRE Enterprise Geo Intelligence

QRE treats location as evidence, not as an inferred story fact.

## Runtime flow

```text
Browser GPS / user pin / scan / imported coordinate
        ↓
GeoObservationV17
        ↓
coordinate + timestamp + accuracy + provenance validation
        ↓
Presence / GeoProof
        ↓
reverse geocoder (cached + throttled + switchable)
        ↓
GeoSpatialIntelligenceV17
        ↓
movement / repeated place / return / rapid-jump detection
        ↓
Geo memory + GeoStory + authoring evidence
```

## Evidence rules

- Latitude and longitude are preserved exactly when exact visibility is authorized.
- Device accuracy is preserved and participates in confidence and repeat-place radius.
- Capture timestamp comes from the positioning source when available.
- Speed, heading, altitude, and altitude accuracy remain optional evidence fields.
- Manual map pins have unknown accuracy; they are not treated as GPS-precise observations.
- Derived relations such as `moved`, `returned`, and `teleport_suspect` are explicitly marked derived.
- Derived geography never authorizes a concrete event that was not supplied.

## Privacy

Raw coordinates default to private visibility. Public/shared outputs should use a deliberate output granularity (`precise`, `neighborhood`, `city`, `region`, or `country`) rather than exposing raw coordinates by accident.

Location access in browsers requires secure HTTPS context and user permission. High-accuracy requests can increase power use and may take longer, so QRE uses them deliberately for capture paths. citeturn655308search0turn655308search3

Location data is privacy-sensitive and should remain bound to access rules and user-controlled visibility. citeturn655308search2turn655308search6

## Reverse geocoding

The default resolver is Nominatim for development/small-volume use. The resolver is provider-switchable with:

- `QRE_GEO_REVERSE_URL`
- `QRE_GEO_USER_AGENT`
- `QRE_GEO_CONTACT`
- `QRE_GEO_LANGUAGE`

The resolver caches responses, deduplicates concurrent requests, applies a one-request-per-second guard, and has a timeout.

The public Nominatim service has a strict one-request-per-second maximum and requests an identifying User-Agent; it is not an enterprise-scale bulk geocoder. Production deployments should use a managed provider or a self-hosted geocoder and switch `QRE_GEO_REVERSE_URL` accordingly. citeturn734012search0

## Spatial intelligence

`geoIntelligenceV17.ts` provides deterministic:

- WGS84-style great-circle distance via haversine calculation
- initial bearing
- accuracy-aware repeat-place clustering
- stationary / moved / rapid-jump / teleport-suspect classification
- return detection
- cumulative travel distance
- coordinate redaction by output visibility

The story compiler uses the same distance-aware grouping instead of coordinate decimal rounding, so authoring, memory, and geo story layers share one geometric interpretation.

## Map layer

The dashboard location picker uses Leaflet with OpenStreetMap attribution and the canonical HTTPS tile endpoint. OSM tiles require attribution and appropriate caching/usage behavior; QRE does not prefetch tile grids. citeturn734012search3
