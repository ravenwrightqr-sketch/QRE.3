
import type {
  ExperiencePresenceContext,
  ExperiencePresencePoint,
  ExperiencePresenceSession,
} from "@qre/contracts";

import type {
  PresenceRepository,
} from "../repositories/index.js";

function toIso(
  value: unknown,
): string | null {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (
    typeof value === "string" &&
    value
  ) {
    return value;
  }

  return null;
}

export async function buildPresenceContext(
  assetId: string,
  presenceRepo: PresenceRepository,
  currentSessionId?: string,
): Promise<ExperiencePresenceContext> {
  const [
    timeline,
    replay,
    persistedSessions,
  ] = await Promise.all([
    presenceRepo.getPresenceTimeline(
      assetId,
    ),

    presenceRepo.getPresenceReplay(
      assetId,
    ),

    presenceRepo.getPresenceSessions(
      assetId,
    ),
  ]);

  const points: ExperiencePresencePoint[] = (
    timeline as Array<
      Record<string, unknown>
    >
  ).map(
    (
      point,
    ) => ({
      sessionId:
        typeof point.sessionId ===
        "string"
          ? point.sessionId
          : null,

      timestamp:
        toIso(point.createdAt) ??
        new Date().toISOString(),

      lat:
        typeof point.lat === "number"
          ? point.lat
          : null,

      lng:
        typeof point.lng === "number"
          ? point.lng
          : null,

      accuracy:
        typeof point.accuracy ===
        "number"
          ? point.accuracy
          : null,

      label:
        typeof point.label ===
        "string"
          ? point.label
          : null,

      city:
        typeof point.city ===
        "string"
          ? point.city
          : null,

      region:
        typeof point.region ===
        "string"
          ? point.region
          : null,

      country:
        typeof point.country ===
        "string"
          ? point.country
          : null,
    }),
  );

  const persisted =
    (
      persistedSessions as Array<
        Record<string, unknown>
      >
    )
      .map(
        (
          session,
        ) => {
          const sessionId =
            typeof session.id ===
            "string"
              ? session.id
              : "";

          if (!sessionId) {
            return null;
          }

          return {
            sessionId,
            assetId,
            status:
              typeof session.status ===
              "string"
                ? session.status
                : "UNKNOWN",

            enteredAt:
              toIso(
                session.enteredAt,
              ),
          };
        },
      )
      .filter(
        (
          session,
        ): session is {
          sessionId: string;
          assetId: string;
          status: string;
          enteredAt: string | null;
        } =>
          session !== null,
      );

  /*
   * PresenceSession is the authoritative
   * evidence that a visit occurred.
   *
   * GeoProof is supplemental location
   * evidence and must not be required for
   * return-visit detection.
   */
  const orderedSessions =
    [...persisted].sort(
      (
        a,
        b,
      ) => {
        const aTime =
          a.enteredAt
            ? Date.parse(a.enteredAt)
            : Number.POSITIVE_INFINITY;

        const bTime =
          b.enteredAt
            ? Date.parse(b.enteredAt)
            : Number.POSITIVE_INFINITY;

        return (
          aTime - bTime
        );
      },
    );

  const persistedSessionIds =
    orderedSessions.map(
      (
        session,
      ) =>
        session.sessionId,
    );

  const geoSessionIds = [
    ...points
      .map(
        (
          point,
        ) =>
          point.sessionId,
      )
      .filter(
        (
          value,
        ): value is string =>
          Boolean(value),
      ),

    ...(
      replay as Array<
        Record<string, unknown>
      >
    )
      .map(
        (
          point,
        ) =>
          typeof point.sessionId ===
          "string"
            ? point.sessionId
            : null,
      )
      .filter(
        (
          value,
        ): value is string =>
          Boolean(value),
      ),
  ];

  const sessionIds = [
    ...new Set([
      ...persistedSessionIds,
      ...geoSessionIds,
    ]),
  ];

  const visitNumber = Math.max(
    1,
    sessionIds.length,
  );

  const currentPersistedSession =
    currentSessionId
      ? orderedSessions.find(
          (
            session,
          ) =>
            session.sessionId ===
            currentSessionId,
        ) ?? null
      : orderedSessions.at(-1) ??
        null;

  const currentPoint =
    currentSessionId
      ? points.find(
          (
            point,
          ) =>
            point.sessionId ===
            currentSessionId,
        ) ?? null
      : points.at(-1) ??
        null;

  const currentSession:
    ExperiencePresenceSession | null =
    currentSessionId
      ? {
          sessionId:
            currentSessionId,

          assetId,

          status:
            currentPersistedSession?.status ??
            "ENTERED",

          visitNumber,

          isReturning:
            visitNumber > 1,

          enteredAt:
            currentPersistedSession?.enteredAt ??
            currentPoint?.timestamp ??
            null,
        }
      : null;

  const places = [
    ...new Set(
      points.flatMap(
        (
          point,
        ) =>
          [
            point.label,
            point.city,
            point.region,
          ].filter(
            (
              value,
            ): value is string =>
              Boolean(value),
          ),
      ),
    ),
  ];

  const firstSeenAt =
    orderedSessions.at(0)
      ?.enteredAt ??
    points.at(0)
      ?.timestamp ??
    null;

  const lastSeenAt =
    orderedSessions.at(-1)
      ?.enteredAt ??
    points.at(-1)
      ?.timestamp ??
    null;

  const sessions: ExperiencePresenceSession[] =
    orderedSessions.map(
      (
        session,
        index,
      ) => ({
        sessionId:
          session.sessionId,

        assetId,

        status:
          session.status,

        visitNumber:
          index + 1,

        isReturning:
          index + 1 > 1,

        enteredAt:
          session.enteredAt,
      }),
    );

  const summary = [
    orderedSessions.length
      ? `presence sessions recorded: ${orderedSessions.length}`
      : "no presence sessions recorded",

    points.length
      ? `presence points recorded: ${points.length}`
      : "no geo presence points recorded",

    visitNumber > 1
      ? `returning presence: visit ${visitNumber}`
      : "first known presence",

    places.length
      ? `known places: ${places.join(", ")}`
      : "place label unavailable",

    firstSeenAt
      ? `first presence: ${firstSeenAt}`
      : "first presence unknown",

    lastSeenAt
      ? `latest presence: ${lastSeenAt}`
      : "latest presence unknown",

    currentSession
      ? `current session: ${currentSession.status}`
      : "no current session provided",
  ];

  return {
    currentSession,

    sessions,

    points,

    places,

    visitNumber,

    isReturning:
      visitNumber > 1,

    firstSeenAt,

    lastSeenAt,

    summary,
  };
}
