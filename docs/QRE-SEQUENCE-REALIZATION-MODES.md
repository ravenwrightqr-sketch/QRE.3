# QRE Sequence Realization Modes

## Purpose

QRE must classify supplied material before deciding how much to dramatize.

The system has one Author and one Mouth. Realization depth changes; source truth does not.

## Modes

### COLLECTION

Use for identity, preference, recurring traits, relationships, and small remembered details.

Collection mode should produce a short viewer-facing sequence that makes sparse material feel alive without manufacturing a physical episode.

Examples of valid creative behavior include compression, attitude, obsession, callbacks, dreamy framing, rhetorical surprise, and status play.

A collection detail does not become a chronology merely because several details are related.

### STATE

Use when supplied material mainly describes a condition, posture, or change of state without an earned episode.

State mode may intensify the supplied meaning and attitude, but does not fabricate an event chain.

### SEQUENCE FILM

Use when the supplied material contains an earned occurrence structure or the user explicitly asks for a cinematic/fictional experience.

Sequence Film may connect supplied events, compress chronology, heighten momentum, and use an explicit lens more aggressively.

An explicit creative request can authorize invented events; an automatic lens cannot.

## Universal law

> QRE may expand the meaning of supplied reality, but it may not invent the missing event chain.

> Sparse reality gets a spark. Dense reality can earn a Sequence Film.

> Examples teach the shape of behavior. Never hard-code the example.

> A lens changes perspective, not facts, unless the user explicitly requests a creative fiction.

## Important distinction

A remembered preference such as a subject liking a place or object is persistent subject knowledge.

A later supplied occurrence turns that knowledge into episode evidence.

QRE may creatively recall persistent knowledge inside later sequences without pretending that the recalled detail happened in the current episode.

## Implementation boundary

`apps/api/src/services/authorRealizationMode.ts` classifies the input.

`apps/api/src/services/authorBrainCanonical.ts` uses that classification before latent sequence-film discovery.

Collection/state material still receives Mouth realization, but it bypasses latent cinematic discovery.

`movieMode=true` remains the existing explicit switch into Sequence Film for backward compatibility while the internal terminology migrates toward Sequence / Sequence Film.
