import type { ExperiencePresenceContext, ExperiencePresencePoint, ExperiencePresenceSession } from "@qre/contracts";
import type { PresenceRepository } from "../repositories/index.js";

function toIso(value: unknown): string | null {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string" && value) return value;
  return null;
}

export async function buildPresenceContext(
  assetId: string,
  presenceRepo: PresenceRepository,
  currentSessionId?: string,
): Promise<ExperiencePresenceContext> {
  const [timeline, replay] = await Promise.all([
    presenceRepo.getPresenceTimeline(assetId),
    presenceRepo.getPresenceReplay(assetId),
  ]);

  const points: ExperiencePresencePoint[] = (timeline as Array<Record<string, unknown>>).map((point) => ({
    sessionId: typeof point.sessionId === "string" ? point.sessionId : null,
    timestamp: toIso(point.createdAt) ?? new Date().toISOString(),
    lat: typeof point.lat === "number" ? point.lat : null,
    lng: typeof point.lng === "number" ? point.lng : null,
    accuracy: typeof point.accuracy === "number" ? point.accuracy : null,
    label: typeof point.label === "string" ? point.label : null,
    city: typeof point.city === "string" ? point.city : null,
    region: typeof point.region === "string" ? point.region : null,
    country: typeof point.country === "string" ? point.country : null,
  }));

  const sessionIds = [...new Set([
    ...points.map((point) => point.sessionId).filter((value): value is string => Boolean(value)),
    ...(replay as Array<Record<string, unknown>>).map((point) => typeof point.sessionId === "string" ? point.sessionId : null).filter((value): value is string => Boolean(value)),
  ])];

  const currentPoint = currentSessionId
    ? points.find((point) => point.sessionId === currentSessionId) ?? null
    : points.at(-1) ?? null;

  const places = [...new Set(
    points
      .flatMap((point) => [point.label, point.city, point.region].filter((value): value is string => Boolean(value)))
  )];

  const visitNumber = Math.max(1, sessionIds.length || (points.length ? 1 : 0));
  const firstSeenAt = points.at(0)?.timestamp ?? null;
  const lastSeenAt = points.at(-1)?.timestamp ?? null;
  const currentSession: ExperiencePresenceSession | null = currentSessionId
    ? {
        sessionId: currentSessionId,
        assetId,
        status: "ENTERED",
        visitNumber,
        isReturning: visitNumber > 1,
        enteredAt: currentPoint?.timestamp ?? null,
      }
    : null;

  const summary = [
    points.length ? `presence points recorded: ${points.length}` : "no geo presence points recorded",
    visitNumber > 1 ? `returning presence: visit ${visitNumber}` : "first known presence",
    places.length ? `known places: ${places.join(", ")}` : "place label unavailable",
    firstSeenAt ? `first presence: ${firstSeenAt}` : "first presence unknown",
    lastSeenAt ? `latest presence: ${lastSeenAt}` : "latest presence unknown",
    currentSession ? "current session: ENTERED" : "no current session provided",
  ];

  return {
    currentSession,
    sessions: currentSession ? [currentSession] : [],
    points,
    places,
    visitNumber: visitNumber || undefined,
    isReturning: visitNumber > 1,
    firstSeenAt,
    lastSeenAt,
    summary,
  };
}
