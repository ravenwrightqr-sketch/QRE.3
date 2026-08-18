/**
 * QRE LATENT MOVIE CONVERGENCE · DETERMINISTIC HELPER
 *
 * This is NOT a second latent-movie searcher.
 *
 * Canonical ownership remains:
 *
 *   RealityGraph
 *      ↓
 *   authorLatentMovieSearch.ts
 *      ↓
 *   authorLatentMovieConvergence.ts
 *      ↓
 *   LatentMovieCandidate
 *
 * Responsibility:
 *
 *   1. Find supplied endpoint candidates.
 *   2. Find supplied opening candidates.
 *   3. Walk forward from the opening.
 *   4. Walk backward from the endpoint.
 *   5. Compare the two paths.
 *   6. Report whether they converge on the same evidence.
 *
 * The endpoint is never invented.
 * Chronology is never inferred unless explicit clock evidence exists.
 * Weak graph relationships create uncertainty, not fabricated facts.
 *
 * This helper does not know about:
 *   - Qwen
 *   - mouth realization
 *   - Beat Graph prose
 *   - business domains
 *   - lenses as creative output
 *
 * It only reasons over RealityGraph evidence.
 */

import type {
  RealityGraph,
  RealityRelation,
} from "@qre/contracts";

export type LatentMovieConvergence = {
  endpointId: string;
  forwardPath: string[];
  backwardPath: string[];
  sharedIds: string[];
  convergence: number;
  endpointCandidates: string[];
  openingCandidates: string[];
};

export type LatentMovieConvergenceOptions = {
  preferredRelationKinds?: readonly RealityRelation["kind"][];
  maxDepth?: number;
  maxEndpoints?: number;
  maxOpenings?: number;
};

const clean = (value: unknown): string =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();

const clamp01 = (value: number): number =>
  Math.max(0, Math.min(1, value));

const metric = (value: number): number =>
  Number(clamp01(value).toFixed(3));

function unique<T>(
  values: readonly T[],
): T[] {
  return [...new Set(values)];
}

function eventById(
  graph: RealityGraph,
  id: string,
) {
  return graph.events.find(
    (event) => event.id === id,
  );
}

function incidentRelations(
  graph: RealityGraph,
  eventId: string,
): RealityRelation[] {
  return graph.relations.filter(
    (relation) =>
      relation.from === eventId ||
      relation.to === eventId,
  );
}

function relationBetween(
  graph: RealityGraph,
  a: string,
  b: string,
): RealityRelation | undefined {
  return graph.relations
    .filter(
      (relation) =>
        (relation.from === a &&
          relation.to === b) ||
        (relation.from === b &&
          relation.to === a),
    )
    .sort(
      (left, right) =>
        right.strength - left.strength,
    )[0];
}

/**
 * Only explicit clock evidence is allowed to affect temporal ordering.
 */
function explicitClock(
  text: string,
): number | undefined {
  const match = text.match(
    /\b(?:at\s*)?(\d{1,2}):(\d{2})\s*(am|pm)?\b/i,
  );

  if (!match) {
    return undefined;
  }

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const meridiem =
    match[3]?.toLowerCase();

  if (
    meridiem === "pm" &&
    hour < 12
  ) {
    hour += 12;
  }

  if (
    meridiem === "am" &&
    hour === 12
  ) {
    hour = 0;
  }

  return hour * 60 + minute;
}

/**
 * Endpoint scoring is deliberately conservative.
 *
 * These are clues that an observed event is terminal, completed, or visibly
 * final. They are not permission to invent an ending.
 */
function endpointStrength(
  label: string,
): number {
  const text =
    clean(label).toLowerCase();

  let score = 0;

  if (
    /\b(?:left|leave|finished|finish|completed|complete|ended|end|closed|returned|went home|came home|finally|result|outcome|became|now|after)\b/.test(
      text,
    )
  ) {
    score += 0.45;
  }

  if (
    /\b(?:fabulous|happy|proud|clean|beautiful|ready|done|safe|together|married|connected|smiling|laughing|resolved)\b/.test(
      text,
    )
  ) {
    score += 0.25;
  }

  return metric(score);
}

/**
 * Opening scoring identifies observed arrival/initial states without assuming
 * chronology where the source did not provide it.
 */
function openingStrength(
  label: string,
): number {
  const text =
    clean(label).toLowerCase();

  let score = 0;

  if (
    /\b(?:arrived|arrive|came|first|started|start|began|begin|entered|met)\b/.test(
      text,
    )
  ) {
    score += 0.45;
  }

  if (
    /\b(?:nervous|scared|shy|new|quiet|waiting|before|at first)\b/.test(
      text,
    )
  ) {
    score += 0.2;
  }

  return metric(score);
}

function relationPreference(
  relation: RealityRelation,
  preferredKinds: readonly RealityRelation["kind"][],
): number {
  const index =
    preferredKinds.indexOf(
      relation.kind,
    );

  if (index >= 0) {
    return metric(
      1 - index * 0.14,
    );
  }

  if (
    relation.kind === "before" ||
    relation.kind === "after"
  ) {
    return 0.35;
  }

  return 0.18;
}

function endpointCandidatesForGraph(
  graph: RealityGraph,
  maxEndpoints: number,
): string[] {
  const explicitTimes = graph.events
    .map((event) => ({
      id: event.id,
      time: explicitClock(
        event.label,
      ),
    }))
    .filter(
      (
        item,
      ): item is {
        id: string;
        time: number;
      } =>
        item.time !== undefined,
    );

  const latestTime =
    explicitTimes.length > 0
      ? Math.max(
          ...explicitTimes.map(
            (item) => item.time,
          ),
        )
      : undefined;

  return graph.events
    .map(
      (event, index) => {
        const incident =
          incidentRelations(
            graph,
            event.id,
          );

        const outgoing =
          incident.filter(
            (relation) =>
              relation.from === event.id,
          );

        const latestTimeScore =
          latestTime !== undefined &&
          explicitClock(
            event.label,
          ) === latestTime
            ? 0.35
            : 0;

        const terminalScore =
          endpointStrength(
            event.label,
          );

        const terminalPosition =
          outgoing.length === 0
            ? 0.12
            : outgoing.every(
                (relation) =>
                  relation.kind !== "before",
              )
              ? 0.06
              : 0;

        return {
          id: event.id,
          score: metric(
            terminalScore +
              latestTimeScore +
              terminalPosition -
              index * 0.0001,
          ),
        };
      },
    )
    .sort(
      (a, b) =>
        b.score - a.score,
    )
    .slice(
      0,
      Math.min(
        maxEndpoints,
        graph.events.length,
      ),
    )
    .map(
      (item) => item.id,
    );
}
function openingCandidatesForGraph(
  graph: RealityGraph,
  endpointIds: Set<string>,
  maxOpenings: number,
): string[] {
  const explicitTimes = graph.events
    .map((event) => ({
      id: event.id,
      time: explicitClock(
        event.label,
      ),
    }))
    .filter(
      (
        item,
      ): item is {
        id: string;
        time: number;
      } =>
        item.time !== undefined,
    );

  const earliestTime =
    explicitTimes.length > 0
      ? Math.min(
          ...explicitTimes.map(
            (item) => item.time,
          ),
        )
      : undefined;

  const ranked =
    graph.events
      .filter(
        (event) =>
          !endpointIds.has(
            event.id,
          ),
      )
      .map(
        (event, index) => {
          const score =
            metric(
              openingStrength(
                event.label,
              ) +
                (earliestTime !== undefined &&
                explicitClock(
                  event.label,
                ) === earliestTime
                  ? 0.35
                  : 0) -
                index * 0.0001,
            );

          return {
            id: event.id,
            score,
          };
        },
      )
      .sort(
        (a, b) =>
          b.score - a.score,
      );

  /*
   * Prefer actual opening evidence whenever any exists.
   *
   * We do NOT fill the opening pool with arbitrary zero-score events because
   * doing so turns an ordinary middle event ("got a bath") into a fabricated
   * cinematic opening.
   */
  const positive =
    ranked.filter(
      (item) =>
        item.score > 0,
    );

  if (positive.length) {
    return positive
      .slice(
        0,
        Math.min(
          maxOpenings,
          positive.length,
        ),
      )
      .map(
        (item) =>
          item.id,
      );
  }

  /*
   * Only when the reality graph provides no opening signal at all do we use
   * the first supplied non-endpoint evidence as a conservative fallback.
   */
  return ranked
    .slice(
      0,
      Math.min(
        1,
        ranked.length,
      ),
    )
    .map(
      (item) =>
        item.id,
    );
}

function backwardPredecessors(
  graph: RealityGraph,
  currentId: string,
  used: Set<string>,
  preferredKinds: readonly RealityRelation["kind"][],
): Array<{
  id: string;
  relation: RealityRelation;
  score: number;
}> {
  const candidates: Array<{
    id: string;
    relation: RealityRelation;
    score: number;
  }> = [];

  for (const relation of graph.relations) {
    let predecessor: string | undefined;

    /*
     * Directed relation:
     *
     * predecessor → current
     */
    if (
      relation.to === currentId
    ) {
      predecessor =
        relation.from;
    }

    /*
     * Semantic relations can be traversed in either direction because they
     * describe relationships rather than chronology.
     */
    else if (
      relation.from === currentId &&
      [
        "contrasts",
        "converges",
        "recontextualizes",
        "changes",
        "repeats",
        "involves",
      ].includes(relation.kind)
    ) {
      predecessor =
        relation.to;
    }

    if (
      !predecessor ||
      used.has(predecessor)
    ) {
      continue;
    }

    const event =
      eventById(
        graph,
        predecessor,
      );

    if (!event) {
      continue;
    }

    candidates.push({
      id: predecessor,
      relation,
      score: metric(
        relation.strength * 0.54 +
          relationPreference(
            relation,
            preferredKinds,
          ) *
            0.24 +
          openingStrength(
            event.label,
          ) *
            0.12 +
          endpointStrength(
            event.label,
          ) *
            0.03,
      ),
    });
  }

  return candidates.sort(
    (a, b) =>
      b.score - a.score,
  );
}

function forwardSuccessors(
  graph: RealityGraph,
  currentId: string,
  used: Set<string>,
  endpointId: string,
  preferredKinds: readonly RealityRelation["kind"][],
): Array<{
  id: string;
  relation: RealityRelation;
  score: number;
}> {
  const candidates: Array<{
    id: string;
    relation: RealityRelation;
    score: number;
  }> = [];

  for (const relation of graph.relations) {
    let next: string | undefined;

    /*
     * Directed relation:
     *
     * current → next
     */
    if (
      relation.from === currentId
    ) {
      next = relation.to;
    }

    /*
     * Semantic relations can be traversed in either direction.
     */
    else if (
      relation.to === currentId &&
      [
        "contrasts",
        "converges",
        "recontextualizes",
        "changes",
        "repeats",
        "involves",
      ].includes(relation.kind)
    ) {
      next = relation.from;
    }

    if (
      !next ||
      used.has(next)
    ) {
      continue;
    }

    const event =
      eventById(
        graph,
        next,
      );

    if (!event) {
      continue;
    }

    const endpointBonus =
      next === endpointId
        ? 0.4
        : 0;

    candidates.push({
      id: next,
      relation,
      score: metric(
        relation.strength * 0.54 +
          relationPreference(
            relation,
            preferredKinds,
          ) *
            0.24 +
          endpointBonus,
      ),
    });
  }

  return candidates.sort(
    (a, b) =>
      b.score - a.score,
  );
}

function buildBackwardPath(
  graph: RealityGraph,
  endpointId: string,
  preferredKinds: readonly RealityRelation["kind"][],
  maxDepth: number,
): string[] {
  const path = [
    endpointId,
  ];

  const used =
    new Set(path);

  let current =
    endpointId;

  for (
    let depth = 0;
    depth < maxDepth;
    depth += 1
  ) {
    const candidates =
      backwardPredecessors(
        graph,
        current,
        used,
        preferredKinds,
      );

    const winner =
      candidates[0];

    if (!winner) {
      break;
    }

    used.add(
      winner.id,
    );

    path.push(
      winner.id,
    );

    current =
      winner.id;
  }

  return path;
}
function buildForwardPath(
  graph: RealityGraph,
  startId: string,
  endpointId: string,
  preferredKinds: readonly RealityRelation["kind"][],
  maxDepth: number,
): string[] {
  const path = [startId];
  const used = new Set(path);

  const STOP = new Set(
    "the a an and or but for to of in on at with from this that is are was were be been as into by through after before then now very just still again his her their its it's he she they them you we me my our your what when where why how one two three four five six seven eight nine ten more came got looking left".split(
      /\s+/,
    ),
  );

  const tokens = (
    value: string,
  ): Set<string> =>
    new Set(
      clean(value)
        .toLowerCase()
        .split(/[^a-z0-9'-]+/i)
        .filter(
          (word) =>
            word.length >= 3 &&
            !STOP.has(word),
        ),
    );

  const overlap = (
    a: Set<string>,
    b: Set<string>,
  ): number => {
    if (!a.size || !b.size) {
      return 0;
    }

    let hits = 0;

    for (const token of a) {
      if (b.has(token)) {
        hits += 1;
      }
    }

    return hits /
      Math.max(a.size, b.size);
  };

  const duplicateState = (
    candidateId: string,
    currentPath: string[],
  ): boolean => {
    const candidate =
      tokens(
        eventById(
          graph,
          candidateId,
        )?.label ?? "",
      );

    if (!candidate.size) {
      return false;
    }

    return currentPath.some(
      (existingId) =>
        overlap(
          candidate,
          tokens(
            eventById(
              graph,
              existingId,
            )?.label ?? "",
          ),
        ) >= 0.8,
    );
  };

  const relationScore = (
    relation: RealityRelation,
  ): number =>
    metric(
      relation.strength * 0.62 +
        relationPreference(
          relation,
          preferredKinds,
        ) *
          0.28,
    );

  const relationBetween = (
    a: string,
    b: string,
  ): RealityRelation | undefined =>
    graph.relations
      .filter(
        (relation) =>
          (relation.from === a &&
            relation.to === b) ||
          (relation.from === b &&
            relation.to === a),
      )
      .sort(
        (left, right) =>
          right.strength -
          left.strength,
      )[0];

  const endpointSupport = (
    currentPath: string[],
  ): number => {
    const supports =
      currentPath
        .map(
          (id) =>
            relationBetween(
              id,
              endpointId,
            ),
        )
        .filter(
          (
            relation,
          ): relation is RealityRelation =>
            Boolean(relation),
        );

    return supports.length
      ? Math.max(
          ...supports.map(
            (relation) =>
              relation.strength,
          ),
        )
      : 0;
  };

  /*
   * Carrier = an already-established supplied detail that:
   *
   *   1. materially connects to the supplied endpoint, AND
   *   2. connects to another detail inside the candidate path.
   *
   * This is the structural role we actually care about.
   */
  const carrierScore = (
    candidatePath: string[],
  ): number => {
    if (
      candidatePath.length < 2
    ) {
      return 0;
    }

    let best = 0;

    for (
      let index = 1;
      index <
        candidatePath.length;
      index += 1
    ) {
      const candidateId =
        candidatePath[index];

      if (
        candidateId ===
        endpointId
      ) {
        continue;
      }

      const toEndpoint =
        relationBetween(
          candidateId,
          endpointId,
        );

      if (!toEndpoint) {
        continue;
      }

      let connectedCount = 0;

      for (
        let otherIndex = 0;
        otherIndex <
          candidatePath.length;
        otherIndex += 1
      ) {
        if (
          otherIndex ===
          index
        ) {
          continue;
        }

        if (
          relationBetween(
            candidateId,
            candidatePath[
              otherIndex
            ],
          )
        ) {
          connectedCount += 1;
        }
      }

      const centrality =
        metric(
          Math.min(
            connectedCount,
            3,
          ) / 3,
        );

      const score =
        toEndpoint.strength *
          0.7 +
        centrality * 0.3;

      best = Math.max(
        best,
        score,
      );
    }

    return metric(best);
  };

  /*
   * Score the entire candidate movie.
   *
   * Do not score the next edge in isolation. The question is:
   *
   *   "Does this collection of supplied evidence accumulate into a movie?"
   */
  const scorePath = (
    candidatePath: string[],
  ): number => {
    if (
      candidatePath.length <
      2
    ) {
      return 0;
    }

    const relations =
      [];

    for (
      let index = 1;
      index <
        candidatePath.length;
      index += 1
    ) {
      const relation =
        relationBetween(
          candidatePath[
            index - 1
          ],
          candidatePath[
            index
          ],
        );

      if (relation) {
        relations.push(
          relation,
        );
      }
    }

    const relationQuality =
      relations.length
        ? metric(
            relations.reduce(
              (sum, relation) =>
                sum +
                relationScore(
                  relation,
                ),
              0,
            ) /
              relations.length,
          )
        : 0;

    const openingQuality =
      openingStrength(
        eventById(
          graph,
          candidatePath[0],
        )?.label ?? "",
      );

    const endpointQuality =
      endpointSupport(
        candidatePath,
      );

    const carrierQuality =
      carrierScore(
        candidatePath,
      );

    const accumulation =
      metric(
        Math.min(
          candidatePath.length -
            1,
          3,
        ) / 3,
      );

    /*
     * A carrier-supported multi-detail path beats a shallow direct shortcut.
     */
    return metric(
      openingQuality * 0.22 +
        relationQuality * 0.18 +
        endpointQuality * 0.25 +
        carrierQuality * 0.25 +
        accumulation * 0.1,
    );
  };
   const assembleMoviePath = (
  rawPath: string[],
): string[] => {
  const uniquePath = unique(
    rawPath,
  );

  const endpointIndex =
    uniquePath.indexOf(
      endpointId,
    );

  const body =
    endpointIndex >= 0
      ? uniquePath.slice(
          0,
          endpointIndex,
        )
      : uniquePath;

  if (
    body.length <= 1
  ) {
    return [
      ...body,
      endpointId,
    ];
  }

  const opening =
    body[0];

  const candidates =
    body.slice(1);

  /*
   * Find the semantic carrier:
   *
   *   - strongly connected to the supplied endpoint
   *   - strongly connected to other supplied details
   *   - preferably uses a relation favored by the current creative lens
   *
   * This is not a domain rule. It is structural centrality inside the supplied
   * evidence.
   */
  const carrierScores =
    candidates.map(
      (candidateId) => {
        const endpointRelation =
          graph.relations
            .filter(
              (relation) =>
                (relation.from ===
                  candidateId &&
                  relation.to ===
                    endpointId) ||
                (relation.from ===
                  endpointId &&
                  relation.to ===
                    candidateId),
            )
            .sort(
              (a, b) =>
                b.strength -
                a.strength,
            )[0];

        const otherRelations =
          candidates
            .filter(
              (id) =>
                id !==
                candidateId,
            )
            .map(
              (id) =>
                relationBetween(
                  
                  candidateId,
                  id,
                ),
            )
            .filter(
              (
                relation,
              ): relation is RealityRelation =>
                Boolean(relation),
            );

        const centrality =
          otherRelations.length
            ? metric(
                otherRelations.reduce(
                  (sum, relation) =>
                    sum +
                    relation.strength *
                      0.6 +
                    relationPreference(
                      relation,
                      preferredKinds,
                    ) *
                      0.4,
                  0,
                ) /
                  otherRelations.length,
              )
            : 0;

        const endpointSupport =
          endpointRelation
            ? metric(
                endpointRelation.strength,
              )
            : 0;

        return {
          id: candidateId,
          score:
            endpointSupport * 0.65 +
            centrality * 0.35,
        };
      },
    )
    .sort(
      (a, b) =>
        b.score -
        a.score,
    );

  const carrier =
    carrierScores[0]?.id;

  if (!carrier) {
    return [
      ...body,
      endpointId,
    ];
  }

  /*
   * Everything after the carrier is a consequence/supporting detail.
   *
   * Prefer details with stronger relation preference from the carrier. This
   * lets a favored contrast/reframe/convergence become the concrete "seal"
   * without hard-coding any particular industry or object.
   */
  const consequences =
    candidates
      .filter(
        (id) =>
          id !== carrier,
      )
      .map(
        (id) => {
          const relation =
            relationBetween(
              
              carrier,
              id,
            );

          const endpointRelation =
            relationBetween(
        
              id,
              endpointId,
            );

          return {
            id,
            score:
              relation
                ? relation.strength *
                    0.62 +
                  relationPreference(
                    relation,
                    preferredKinds,
                  ) *
                    0.28 +
                  (endpointRelation
                    ? endpointRelation.strength *
                      0.1
                    : 0)
                : 0,
          };
        },
      )
      .sort(
        (a, b) =>
          b.score -
          a.score,
      )
      .map(
        (item) =>
          item.id,
      );

  /*
   * Keep the opening and carrier, then take only the strongest accumulated
   * consequences that fit the configured search depth.
   */
    const consequence =
  consequences[0];

return [
  opening,
  carrier,
  ...(consequence
    ? [consequence]
    : []),
  endpointId,
].filter(
  (id, index, values) =>
    values.indexOf(id) ===
    index,
);
};
  let bestPath =
    [startId];

  let bestScore =
    -Infinity;

  const search = (
    currentId: string,
    currentPath: string[],
  ): void => {
    /*
     * Evaluate the movie so far.
     *
     * The supplied endpoint is NOT inserted during traversal. It is a final
     * landing supported by an already accumulated path.
     */
    if (
      currentPath.length >= 2 &&
      endpointSupport(
        currentPath,
      ) > 0
    ) {
      const score =
        scorePath(
          currentPath,
        );

      if (
        score > bestScore
      ) {
        bestScore =
          score;

        bestPath = [
          ...currentPath,
          endpointId,
        ];
      }
    }

    if (
      currentPath.length >=
      maxDepth
    ) {
      return;
    }

    const candidates =
      graph.relations
        .map(
          (relation) => {
            let next:
              | string
              | undefined;

            /*
             * Directed relations preserve their direction.
             */
            if (
              relation.from ===
              currentId
            ) {
              next =
                relation.to;
            }

            /*
             * Semantic relations may be traversed in either direction.
             * Duplicate-state protection prevents meaningless reversals.
             */
            else if (
              relation.to ===
                currentId &&
              [
                "contrasts",
                "converges",
                "recontextualizes",
                "changes",
                "repeats",
                "involves",
              ].includes(
                relation.kind,
              )
            ) {
              next =
                relation.from;
            }

            if (
              !next ||
              next ===
                endpointId ||
              used.has(next) ||
              duplicateState(
                next,
                currentPath,
              )
            ) {
              return undefined;
            }

            return {
              next,
              relation,
            };
          },
        )
        .filter(
          (
            candidate,
          ): candidate is {
            next: string;
            relation: RealityRelation;
          } =>
            Boolean(candidate),
        )
        .sort(
          (a, b) =>
            relationScore(
              b.relation,
            ) -
            relationScore(
              a.relation,
            ),
        );

    for (
      const candidate of
        candidates
    ) {
      used.add(
        candidate.next,
      );

      search(
        candidate.next,
        [
          ...currentPath,
          candidate.next,
        ],
      );

      used.delete(
        candidate.next,
      );
    }
  };

  search(
    startId,
    path,
  );
  return assembleMoviePath(
    bestPath,
  );
  
}

function sharedPathIds(
  forwardPath: string[],
  backwardPath: string[],
): string[] {
  const backwardSet =
    new Set(
      backwardPath,
    );

  return unique(
    forwardPath.filter(
      (id) =>
        backwardSet.has(id),
    ),
  );
}

function pathRelations(
  graph: RealityGraph,
  path: string[],
): RealityRelation[] {
  const relations: RealityRelation[] = [];

  for (
    let index = 1;
    index < path.length;
    index += 1
  ) {
    const relation =
      relationBetween(
        graph,
        path[index - 1],
        path[index],
      );

    if (relation) {
      relations.push(
        relation,
      );
    }
  }

  return relations;
}
function scoreConvergence(
  graph: RealityGraph,
  forwardPath: string[],
  backwardPath: string[],
  endpointId: string,
): number {
  const backwardForward =
    [...backwardPath].reverse();

  const sharedIds =
    sharedPathIds(
      forwardPath,
      backwardForward,
    );

  const sharedRatio =
    sharedIds.length /
    Math.max(
      1,
      Math.min(
        forwardPath.length,
        backwardForward.length,
      ),
    );

  const ordered =
    unique([
      ...forwardPath,
      ...backwardForward,
    ]);

  const relations =
    pathRelations(
      graph,
      ordered,
    );

  const relationRatio =
    relations.length /
    Math.max(
      1,
      ordered.length - 1,
    );

  const endpointReached =
    forwardPath.includes(
      endpointId,
    );

  const endpointIsBackwardAnchor =
    backwardPath.length > 0 &&
    backwardPath[0] ===
      endpointId;

  const endpointConvergence =
    endpointReached &&
    endpointIsBackwardAnchor
      ? 0.2
      : endpointReached
        ? 0.1
        : 0;

  const openingId =
    forwardPath[0];

  const opening =
    openingId
      ? eventById(
          graph,
          openingId,
        )
      : undefined;

  /*
   * Real opening evidence is more valuable than an atomic semantic fragment.
   *
   * "came in nervous" should beat "nervous" because the former contains an
   * observed arrival/state transition while the latter is merely an attribute.
   */
  const openingStrengthScore =
    opening
      ? openingStrength(
          opening.label,
        )
      : 0;

  /*
   * A movie should accumulate evidence before it lands the supplied endpoint.
   * Reward meaningful intermediate depth, but cap it so long paths cannot win
   * merely by being long.
   */
  const accumulation =
    metric(
      Math.min(
        Math.max(
          0,
          forwardPath.length - 1,
        ),
        4,
      ) / 4,
    );

  /*
   * Distinct evidence count prevents the search from getting credit for
   * repeated/near-duplicate states.
   */
  const distinctEvidence =
    unique(
      forwardPath,
    ).length /
    Math.max(
      1,
      forwardPath.length,
    );

  /*
   * Endpoint support should reflect an actual relation from the accumulated
   * path, not merely the fact that the endpoint exists.
   */
  const endpointSupportCandidates =
    forwardPath
      .filter(
        (id) =>
          id !== endpointId,
      )
      .map(
        (id) =>
          graph.relations
            .filter(
              (relation) =>
                (relation.from === id &&
                  relation.to === endpointId) ||
                (relation.from === endpointId &&
                  relation.to === id),
            )
            .sort(
              (a, b) =>
                b.strength -
                a.strength,
            )[0],
      )
      .filter(
        (
          relation,
        ): relation is RealityRelation =>
          Boolean(relation),
      );

  const endpointSupport =
    endpointSupportCandidates.length
      ? metric(
          Math.max(
            ...endpointSupportCandidates.map(
              (relation) =>
                relation.strength,
            ),
          ),
        )
      : 0;

  return metric(
    sharedRatio * 0.22 +
      relationRatio * 0.18 +
      endpointConvergence * 0.14 +
      openingStrengthScore * 0.18 +
      accumulation * 0.16 +
      distinctEvidence * 0.06 +
      endpointSupport * 0.06,
  );
}

/**
 * Run the two-direction search.
 *
 * The helper evaluates multiple candidate endpoints/openings, then chooses the
 * strongest convergent pair.
 */
export function findLatentMovieConvergence(
  graph: RealityGraph,
  options: LatentMovieConvergenceOptions = {},
): LatentMovieConvergence {
  if (
    !graph.events.length
  ) {
    return {
      endpointId: "",
      forwardPath: [],
      backwardPath: [],
      sharedIds: [],
      convergence: 0,
      endpointCandidates: [],
      openingCandidates: [],
    };
  }

  const preferredKinds =
    options.preferredRelationKinds ??
    [];

  const maxDepth =
    Math.max(
      1,
      Math.min(
        options.maxDepth ?? 4,
        8,
      ),
    );

  const maxEndpoints =
    Math.max(
      1,
      Math.min(
        options.maxEndpoints ?? 3,
        8,
      ),
    );

  const maxOpenings =
    Math.max(
      1,
      Math.min(
        options.maxOpenings ?? 4,
        8,
      ),
    );

  const endpoints =
    endpointCandidatesForGraph(
      graph,
      maxEndpoints,
    );

  const openingIds =
    openingCandidatesForGraph(
      graph,
      new Set(endpoints),
      maxOpenings,
    );

  if (
    !endpoints.length ||
    !openingIds.length
  ) {
    return {
      endpointId:
        endpoints[0] ?? "",
      forwardPath: [],
      backwardPath:
        endpoints[0]
          ? [endpoints[0]]
          : [],
      sharedIds: [],
      convergence: 0,
      endpointCandidates:
        endpoints,
      openingCandidates:
        openingIds,
    };
  }

  let best:
    | {
        endpointId: string;
        forwardPath: string[];
        backwardPath: string[];
        sharedIds: string[];
        convergence: number;
      }
    | undefined;

  for (
    const endpointId of endpoints
  ) {
    const backwardPath =
      buildBackwardPath(
        graph,
        endpointId,
        preferredKinds,
        maxDepth,
      );

    for (
      const openingId of openingIds
    ) {
      if (
        openingId === endpointId
      ) {
        continue;
      }

      const forwardPath =
        buildForwardPath(
          graph,
          openingId,
          endpointId,
          preferredKinds,
          maxDepth,
        );

      const convergence =
        scoreConvergence(
          graph,
          forwardPath,
          backwardPath,
          endpointId,
        );

      const backwardForward =
        [...backwardPath].reverse();

      const sharedIds =
        sharedPathIds(
          forwardPath,
          backwardForward,
        );

      const candidate = {
        endpointId,
        forwardPath,
        backwardPath,
        sharedIds,
        convergence,
      };

     const candidateOpeningStrength =
  candidate.forwardPath[0]
    ? openingStrength(
        eventById(
          graph,
          candidate.forwardPath[0],
        )?.label ?? "",
      )
    : 0;

const bestOpeningStrength =
  best?.forwardPath[0]
    ? openingStrength(
        eventById(
          graph,
          best.forwardPath[0],
        )?.label ?? "",
      )
    : 0;

const candidatePathLength =
  candidate.forwardPath.length;

const bestPathLength =
  best?.forwardPath.length ?? 0;

if (
  !best ||
  candidate.convergence >
    best.convergence ||
  (
    candidate.convergence ===
      best.convergence &&
    (
      candidateOpeningStrength >
        bestOpeningStrength ||
      (
        candidateOpeningStrength ===
          bestOpeningStrength &&
        candidatePathLength >
          bestPathLength
      )
    )
  )
) {
  best =
    candidate;
}
    }
  }

  if (!best) {
    const endpointId =
      endpoints[0] ?? "";

    const backwardPath =
      endpointId
        ? buildBackwardPath(
            graph,
            endpointId,
            preferredKinds,
            maxDepth,
          )
        : [];

    return {
      endpointId,
      forwardPath: [],
      backwardPath,
      sharedIds: [],
      convergence: 0,
      endpointCandidates:
        endpoints,
      openingCandidates:
        openingIds,
    };
  }

  return {
    ...best,
    endpointCandidates:
      endpoints,
    openingCandidates:
      openingIds,
  };
}