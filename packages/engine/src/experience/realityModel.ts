import type {
  CognitiveExperiencePlan,
  CognitivePremise,
  RealityEntity,
  RealityEntityKind,
  RealityModel,
  RealityObservation,
  RealityRelation,
} from "@qre/contracts";

const clean = (value: unknown): string => typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
const unique = (values: readonly string[]): string[] => [...new Set(values.map(clean).filter(Boolean))];
const generic = /^(?:the subject|situation|experience|interaction|can|new|old|it|this|that)$/i;

type PremiseValue = { value: string; promptObserved: boolean; confidence: number };

function slotValues(plan: CognitiveExperiencePlan | undefined, premise: CognitivePremise | undefined, role: string): PremiseValue[] {
  const slots = premise?.slots.filter((item) => item.role === role) ??
    plan?.premise?.slots.filter((item) => item.role === role) ?? [];

  return slots.flatMap((item) => item.values.map((value) => ({
    value: clean(value),
    promptObserved: item.evidence.some((evidence) => evidence.source === "prompt" && evidence.confidence >= 0.8),
    confidence: item.confidence,
  }))).filter((item) => item.value);
}

function slot(plan: CognitiveExperiencePlan | undefined, premise: CognitivePremise | undefined, role: string): string[] {
  return unique(slotValues(plan, premise, role).map((item) => item.value));
}

function kindFor(name: string, role: string): RealityEntityKind {
  if (role === "place") return "place";
  if (role === "participants" || role === "social") return "person";
  if (role === "artifact" || role === "medium") return "object";
  if (role === "event") return "event";
  if (/\b(?:dog|cat|horse|bird|animal|puppy|kitten|pet|rescue)\b/i.test(name)) return "animal";
  return "unknown";
}

export function buildRealityModel(
  plan?: CognitiveExperiencePlan,
  premise?: CognitivePremise,
): RealityModel {
  const subjectValues = slotValues(plan, premise, "subject");
  const central = clean(plan?.centralSubject);
  const subject = central || subjectValues[0]?.value || "the subject";
  const subjectName = generic.test(subject) ? slot(plan, premise, "participants")[0] || subject : subject;

  const roleGroups: Array<[string, PremiseValue[]]> = [
    ["subject", [{ value: subjectName, promptObserved: subjectValues.some((item) => item.value === subjectName && item.promptObserved), confidence: subjectValues[0]?.confidence ?? 1 }]],
    ["participants", slotValues(plan, premise, "participants")],
    ["social", slotValues(plan, premise, "social")],
    ["place", slotValues(plan, premise, "place")],
    ["artifact", slotValues(plan, premise, "artifact")],
    ["medium", slotValues(plan, premise, "medium")],
    ["event", slotValues(plan, premise, "event")],
  ];

  const entities: RealityEntity[] = [];
  const ids = new Map<string, string>();
  const addEntity = (item: PremiseValue, role: string) => {
    const normalized = clean(item.value);
    if (!normalized || generic.test(normalized)) return undefined;
    const key = normalized.toLowerCase();
    const existing = ids.get(key);
    if (existing) return existing;
    const id = `reality-${entities.length + 1}`;
    ids.set(key, id);
    entities.push({
      id,
      name: normalized,
      kind: kindFor(normalized, role),
      confidence: role === "subject" ? item.confidence : Math.min(item.confidence, item.promptObserved ? 0.98 : 0.82),
      provenance: item.promptObserved ? "prompt" : "derived",
    });
    return id;
  };

  for (const [role, items] of roleGroups) {
    for (const item of items) addEntity(item, role);
  }

  const subjectId = ids.get(subjectName.toLowerCase()) ?? "reality-subject";
  const places = slot(plan, premise, "place");
  const temporal = slot(plan, premise, "temporal");
  const constraints = slot(plan, premise, "constraint");
  const eventValues = slotValues(plan, premise, "event");
  const outcomeValues = slotValues(plan, premise, "outcome");
  const transformationValues = slotValues(plan, premise, "transformation");

  const observations: RealityObservation[] = [];
  const subjectAndParticipants = unique([
    subjectName,
    ...slot(plan, premise, "participants"),
    ...slot(plan, premise, "social"),
  ]).map((name) => ids.get(name.toLowerCase())).filter(Boolean) as string[];

  const addObservation = (item: PremiseValue, order: number) => {
    const value = clean(item.value);
    if (!value) return;
    observations.push({
      id: `observation-${observations.length + 1}`,
      order,
      text: value,
      subjectIds: subjectAndParticipants.length ? subjectAndParticipants : [subjectId],
      placeId: places[0] ? ids.get(places[0].toLowerCase()) : undefined,
      confidence: item.confidence,
      provenance: item.promptObserved ? "prompt" : "derived",
    });
  };

  eventValues.forEach(addObservation);
  if (!eventValues.length) {
    transformationValues.forEach((item, index) => addObservation(item, index));
    outcomeValues.forEach((item, index) => addObservation(item, transformationValues.length + index));
    if (!observations.length) slotValues(plan, premise, "artifact").forEach((item, index) => addObservation(item, index));
  }

  const relations: RealityRelation[] = [];
  const addRelation = (from: string | undefined, to: string | undefined, type: string, provenance: RealityRelation["provenance"] = "derived") => {
    if (!from || !to || from === to) return;
    if (relations.some((r) => r.fromId === from && r.toId === to && r.type === type)) return;
    relations.push({ fromId: from, toId: to, type, confidence: provenance === "prompt" ? 0.96 : 0.82, provenance });
  };

  for (const participant of slot(plan, premise, "participants")) addRelation(ids.get(participant.toLowerCase()), subjectId, "participates-with");
  for (const social of slot(plan, premise, "social")) addRelation(ids.get(social.toLowerCase()), subjectId, "socially-related");
  for (const place of places) addRelation(subjectId, ids.get(place.toLowerCase()), "situated-at", "geo");
  for (const artifact of slot(plan, premise, "artifact")) addRelation(subjectId, ids.get(artifact.toLowerCase()), "represented-by");
  for (const medium of slot(plan, premise, "medium")) addRelation(subjectId, ids.get(medium.toLowerCase()), "accessed-through");

  return {
    subjectId,
    entities,
    observations,
    relations,
    places,
    temporal,
    constraints,
  };
}
