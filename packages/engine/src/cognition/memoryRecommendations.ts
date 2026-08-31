export type MemoryRecommendation = {
  kind: "place" | "person" | "event" | "callback";
  title: string;
  reason: string;
  evidence: string[];
  confidence: number;
};

type MemoryContextLike = {
  entities?: Array<{ name?: string; kind?: string; confidence?: number }>;
  facts?: Array<{ predicate?: string; value?: string; entityId?: string; confidence?: number }>;
  relations?: Array<{ relation?: string; confidence?: number }>;
  events?: Array<{ summary?: string; type?: string; occurredAt?: string; confidence?: number }>;
};

const clean = (value: unknown) => typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";

export function recommendMemories(context: MemoryContextLike, prompt = ""): MemoryRecommendation[] {
  const query = clean(prompt).toLowerCase();
  const recommendations: MemoryRecommendation[] = [];
  for (const entity of context.entities ?? []) {
    const name = clean(entity.name);
    if (!name) continue;
    const score = query.includes(name.toLowerCase()) ? 0.96 : Math.min(0.9, 0.55 + Number(entity.confidence ?? 0.5) * 0.35);
    recommendations.push({
      kind: /place|location|venue/i.test(clean(entity.kind)) ? "place" : "person",
      title: name,
      reason: query.includes(name.toLowerCase()) ? "This memory matches what you just mentioned." : "This is a recurring entity in your experience history.",
      evidence: [name],
      confidence: score,
    });
  }
  for (const event of context.events ?? []) {
    const summary = clean(event.summary);
    if (!summary) continue;
    const score = query && summary.toLowerCase().includes(query) ? 0.94 : Math.min(0.88, 0.5 + Number(event.confidence ?? 0.5) * 0.4);
    recommendations.push({
      kind: "event",
      title: summary,
      reason: query && summary.toLowerCase().includes(query) ? "This past event is directly related." : "This is a recent memory that may connect to the new experience.",
      evidence: [summary],
      confidence: score,
    });
  }
  for (const fact of context.facts ?? []) {
    const value = clean(fact.value);
    const predicate = clean(fact.predicate);
    if (!value || !predicate) continue;
    if (/location|place|venue|visited|traveled|returned/i.test(predicate) || query.includes(value.toLowerCase())) {
      recommendations.push({
        kind: /location|place|venue|visited|traveled|returned/i.test(predicate) ? "place" : "callback",
        title: value,
        reason: `Remembered fact: ${predicate}.`,
        evidence: [value],
        confidence: Math.min(0.95, Number(fact.confidence ?? 0.7)),
      });
    }
  }
  return recommendations
    .sort((a, b) => b.confidence - a.confidence)
    .filter((item, index, values) => index === values.findIndex((other) => other.title.toLowerCase() === item.title.toLowerCase()))
    .slice(0, 8);
}
