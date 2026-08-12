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

function slot(plan: CognitiveExperiencePlan | undefined, premise: CognitivePremise | undefined, role: string): string[] {
  return unique(premise?.slots.filter((item) => item.role === role).flatMap((item) => item.values) ??
    plan?.premise?.slots.filter((item) => item.role === role).flatMap((item) => item.values) ?? []);
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
  const subject = clean(plan?.centralSubject) || slot(plan, premise, "subject")[0] || "the subject";
  const subjectName = generic.test(subject) ? slot(plan, premise, "participants")[0] || subject : subject;

  const roleGroups: Array<[string, string]> = [
    ["subject", subjectName],
    ["participants", ""],
    ["social", ""],
    ["place", ""],
    ["artifact", ""],
    ["medium", ""],
    ["event", ""],
  ];

  const entities: RealityEntity[] = [];
  const ids = new Map<string, string>();
  const addEntity = (name: string, role: string) => {
    const normalized = clean(name);
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
      confidence: role === "subject" ? 1 : 0.9,
      provenance: "prompt",
    });
    return id;
  };

  for (const [role, explicit] of roleGroups) {
    const names = explicit ? [explicit] : slot(plan, premise, role);
    for (const name of names) addEntity(name, role);
  }

  const subjectId = addEntity(subjectName, "subject") ?? "reality-subject";
  const places = slot(plan, premise, "place");
  const temporal = slot(plan, premise, "temporal");
  const constraints = slot(plan, premise, "constraint");
  const eventTexts = slot(plan, premise, "event");
  const outcomes = slot(plan, premise, "outcome");
  const transformations = slot(plan, premise, "transformation");

  const observations: RealityObservation[] = [];
  const subjectAndParticipants = unique([
    subjectName,
    ...slot(plan, premise, "participants"),
    ...slot(plan, premise, "social"),
  ]).map((name) => ids.get(name.toLowerCase())).filter(Boolean) as string[];

  const addObservation = (text: string, order: number, provenance: RealityObservation["provenance"] = "prompt") => {
    const value = clean(text);
    if (!value) return;
    observations.push({
      id: `observation-${observations.length + 1}`,
      order,
      text: value,
      subjectIds: subjectAndParticipants.length ? subjectAndParticipants : [subjectId],
      placeId: places[0] ? ids.get(places[0].toLowerCase()) : undefined,
      confidence: provenance === "prompt" ? 0.98 : 0.84,
      provenance,
    });
  };

  eventTexts.forEach((event, index) => addObservation(event, index));
  if (!eventTexts.length) {
    const contextual = [
      ...transformations,
      ...outcomes,
      ...slot(plan, premise, "artifact"),
    ];
    contextual.forEach((value, index) => addObservation(value, index));
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
