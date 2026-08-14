import type { ExperienceMoment, MemorySnapshot, ServiceReceipt } from "@qre/contracts";

const clean = (value: unknown) => typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
const unique = (values: readonly string[]) => [...new Set(values.map(clean).filter(Boolean))];

function momentText(moment: ExperienceMoment): string {
  const value = moment.text ?? moment.description ?? moment.title ?? moment.meta?.text ?? moment.location?.label ?? moment.type;
  return clean(value);
}

function payloadString(moment: ExperienceMoment, key: string): string | undefined {
  const value = moment.payload?.[key];
  return typeof value === "string" ? clean(value) : undefined;
}

function inferTone(moments: ExperienceMoment[]): MemorySnapshot["emotionalTone"] {
  const text = moments.map(momentText).join(" ").toLowerCase();
  if (/\b(wedding|love|kiss|anniversary|romantic|tender|grandma|grandmother|father|memory)\b/.test(text)) return "positive";
  if (/\b(horror|scary|creepy|terrifying|dark|afraid|fear)\b/.test(text)) return "intense";
  if (/\b(luxury|spa|premium|fine dining|suite)\b/.test(text)) return "luxury";
  if (/\b(rave|festival|concert|party|dance|celebrat)\b/.test(text)) return "energetic";
  if (/\b(client|business|service|receipt|completed|delivered)\b/.test(text)) return "professional";
  return "mixed";
}

export function evolveRuntimeMemory(moments: ExperienceMoment[], prior?: MemorySnapshot | null): MemorySnapshot {
  const texts = moments.map(momentText).filter(Boolean);
  const entities = unique(moments.flatMap((moment) => [
    ...(Array.isArray(moment.payload?.participants) ? moment.payload.participants.filter((value): value is string => typeof value === "string") : []),
    payloadString(moment, "place") ?? "",
    ...((Array.isArray(moment.payload?.details) ? moment.payload.details.filter((value): value is string => typeof value === "string") : [])),
  ]));
  const locations = unique(moments.map((moment) => moment.location?.label ?? moment.meta?.label ?? payloadString(moment, "place") ?? ""));
  const highlights = unique([
    ...(prior?.highlights ?? []),
    ...moments.filter((moment) => moment.payload?.creativeDetails && Array.isArray(moment.payload.creativeDetails) && moment.payload.creativeDetails.length > 0).map(momentText),
    ...texts,
  ]).slice(-8);
  const timeline = moments.map((moment, index) => ({
    label: momentText(moment),
    timestamp: typeof moment.meta?.time === "string" ? moment.meta.time : new Date(Date.now() + index * 1000).toISOString(),
  }));
  const priorSummary = clean(prior?.summary);
  const summary = priorSummary
    ? `${priorSummary} ${texts[0] ?? ""}`.trim()
    : texts.slice(0, 3).join(" ");

  return {
    id: prior?.id ?? `memory-${Date.now().toString(36)}`,
    type: prior?.type ?? "experience",
    title: prior?.title ?? (entities[0] ? `${entities[0]} Experience` : "Memory Experience"),
    summary: summary || "A captured QRE experience.",
    emotionalTone: inferTone(moments),
    highlights,
    locationTags: unique([...(prior?.locationTags ?? []), ...locations]),
    timeline,
    confidence: Math.min(1, Math.max(prior?.confidence ?? 0.5, moments.length ? 0.8 : 0.5)),
    themes: unique([...(prior?.themes ?? []), ...moments.map((moment) => String(moment.payload?.lens ?? "").trim())]).filter(Boolean),
    entities: unique([...(prior?.entities ?? []), ...entities]),
    meta: {
      ...(prior?.meta ?? {}),
      evolutionCount: Number(prior?.meta?.evolutionCount ?? 0) + 1,
      lastMomentCount: moments.length,
      creativeMoments: moments.filter((moment) => Array.isArray(moment.payload?.creativeDetails) && moment.payload.creativeDetails.length > 0).length,
    },
  };
}

export function evolveServiceReceipt(receipt: ServiceReceipt, moments: ExperienceMoment[]): ServiceReceipt {
  const completion = moments.find((moment) => moment.meta?.event === "SERVICE_COMPLETE");
  const labels = unique(moments.flatMap((moment) => {
    const label = payloadString(moment, "label") ?? payloadString(moment, "action");
    return label ? [label] : [];
  }));
  const summary = completion ? momentText(completion) : receipt.summary;
  return {
    ...receipt,
    summary,
    lineItems: receipt.lineItems?.length ? receipt.lineItems : labels.map((label) => ({ label })),
    metadata: {
      ...(receipt.metadata ?? {}),
      cognitiveSteps: moments.length,
      completedEvent: completion?.meta?.event ?? null,
      narrativeHighlights: unique(moments.filter((moment) => Array.isArray(moment.payload?.creativeDetails) && moment.payload.creativeDetails.length > 0).map(momentText)).slice(0, 5),
    },
  };
}
