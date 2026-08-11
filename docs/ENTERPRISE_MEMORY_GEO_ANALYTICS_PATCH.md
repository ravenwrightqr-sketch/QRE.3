# Enterprise memory + geo + analytics patch

This patch makes every compiled experience capable of carrying three first-class contextual artifacts:

- governed MemorySnapshot
- GeoStory, including semantic place context when physical coordinates are absent
- typed ExperienceAnalytics summary

The existing scan runtime remains the canonical execution path. No second compiler is introduced.
