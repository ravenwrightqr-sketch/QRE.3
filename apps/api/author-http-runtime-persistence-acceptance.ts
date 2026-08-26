import { Agent, fetch as undiciFetch } from "undici";
import { randomUUID } from "node:crypto";
import bcrypt from "bcrypt";
import { db } from "@qre/db";
import { AnalyticsEventTypes } from "@qre/contracts";

import { createMemoryRepository } from "./src/repositories/memoryRepository.js";
import { extractAuthorExperienceStates } from "./src/services/authorExperienceMemory.js";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const API = process.env.QRE_TEST_API_URL ?? "http://127.0.0.1:3000";

const HTTP_TIMEOUT_MS = 15 * 60 * 1000;

const acceptanceAgent = new Agent({
  connectTimeout: 10_000,
  headersTimeout: HTTP_TIMEOUT_MS,
  bodyTimeout: HTTP_TIMEOUT_MS,
});

const email = `author-http-golden-${randomUUID()}@qre.test`;
const password = `Test-${randomUUID()}-Pass!`;
const slug = `author-http-golden-${randomUUID()}`;

const prompt =
  "Coco entered nervous, the lawyer was already contacted, then the bathwater came, pink bows came next, the mirror approved, fabulous arrived, but peace is temporary.";

type HttpRequestInit = {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
};

async function requestJson(
  path: string,
  init: HttpRequestInit = {},
): Promise<{ response: Awaited<ReturnType<typeof undiciFetch>>; json: any }> {
  const startedAt = Date.now();
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, HTTP_TIMEOUT_MS);

  console.log(
    `[HTTP GOLDEN] REQUEST START path=${path}`,
  );

  try {
    const response = await undiciFetch(`${API}${path}`, {
      method: init.method,
      body: init.body,
      signal: controller.signal,
      dispatcher: acceptanceAgent,
      headers: {
        "content-type": "application/json",
        ...(init.headers ?? {}),
      },
    });

    const text = await response.text();

    let json: any;

    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = { raw: text };
    }

    console.log(
      `[HTTP GOLDEN] REQUEST END path=${path} status=${response.status} durationMs=${Date.now() - startedAt}`,
    );

    return {
      response,
      json,
    };
  } catch (error) {
    console.error(
      `[HTTP GOLDEN] REQUEST FAILURE path=${path} durationMs=${Date.now() - startedAt}`,
      error,
    );
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function writeBehavior(assetId: string, types: string[]) {
  for (const type of types) {
    await db.analyticsEvent.create({
      data: {
        assetId,
        type: type as any,
        meta:
          type === AnalyticsEventTypes.AI_CREATIVE_ACCEPTED
            ? {
                feedback: "short punchy callback",
                trajectory: "reframe>recur>payoff",
                styleTags: ["short", "callback", "attitude"],
              }
            : type === AnalyticsEventTypes.AI_CREATIVE_REJECTED
              ? {
                  feedback: "too explanatory",
                  trajectory: "setup>setup>setup",
                  styleTags: ["longform"],
                }
              : {},
      },
    });
  }
}

function normalizeTruth(context: any) {
  return JSON.stringify({
    entities: context.entities
      .map((entity: any) => [
        entity.kind,
        entity.name,
        entity.canonicalKey,
      ])
      .sort(),
    facts: context.facts
      .map((fact: any) => [
        fact.kind,
        fact.predicate,
        fact.value,
        fact.source,
        fact.status,
      ])
      .sort(),
    relations: context.relations
      .map((relation: any) => [
        relation.fromEntityId,
        relation.toEntityId,
        relation.relation,
        relation.source,
      ])
      .sort(),
  });
}

function stateFromResponse(payload: any) {
  return payload?.experience?.authorExperienceState ?? null;
}

function stateSignature(state: any) {
  if (!state) return null;

  return JSON.stringify({
    movieId: state.movieId ?? null,
    lens: state.lens ?? null,
    tempo: state.tempo ?? null,
    pull: state.pull ?? null,
    compression: state.compression ?? null,
    revisitedEventIds: state.revisitedEventIds ?? [],
    continuationScore: state.continuationScore ?? null,
  });
}

async function main() {
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await db.user.create({
    data: {
      email,
      password: passwordHash,
      tier: "BASIC",
      tierActive: true,
    },
    select: {
      id: true,
      email: true,
    },
  });

  const asset = await db.asset.create({
    data: {
      slug,
      displayName: "Author HTTP Golden Test",
      status: "active",
      paid: false,
      ownerId: user.id,
    },
    select: {
      id: true,
      slug: true,
    },
  });

  console.log("HTTP GOLDEN START");
  console.log(`API=${API}`);
  console.log(`Asset=${asset.id}`);
  console.log(`User=${user.id}`);
  console.log(`Model=${process.env.QRE_AUTHOR_FAST_MODEL ?? "default"}`);

  try {
    const login = await requestJson("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
      }),
    });

    assert(
      login.response.ok,
      `login failed: HTTP ${login.response.status}`,
    );

    const token = String(login.json?.token ?? "").trim();

    assert(
      token,
      "login did not return JWT token",
    );

    console.log("LOGIN HTTP=200");

    const repository = createMemoryRepository();

    async function compileRound(round: number) {
      const roundStartedAt = Date.now();

      console.log(
        `[HTTP GOLDEN] ROUND ${round} START`,
      );

      const result = await requestJson("/experience/compile", {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt,
          assetId: asset.id,
          movieMode: true,
        }),
      });

      console.log(
        `[HTTP GOLDEN] ROUND ${round} END durationMs=${Date.now() - roundStartedAt}`,
      );

      console.log(
        `ROUND ${round} HTTP=${result.response.status}`,
      );

      assert(
        result.response.ok,
        `round ${round} HTTP request failed: ${JSON.stringify(result.json)}`,
      );

      assert(
        result.json?.success === true,
        `round ${round} response success=false`,
      );

      const state = stateFromResponse(result.json);

      assert(
        state,
        `round ${round} response did not contain Author experience state`,
      );

      const memory = await repository.loadContext({
        assetId: asset.id,
      });

      const states = extractAuthorExperienceStates(memory);

      console.log(
        `ROUND ${round} RESPONSE_STATE=${stateSignature(state)}`,
      );
      console.log(
        `ROUND ${round} PERSISTED_STATE_COUNT=${states.length}`,
      );
      console.log(
        `ROUND ${round} MEMORY_EVENTS=${memory.events.length}`,
      );

      return {
        payload: result.json,
        state,
        memory,
        states,
      };
    }

    const round1 = await compileRound(1);
    const truthRound1 = normalizeTruth(round1.memory);

    assert(
      round1.states.length >= 1,
      `round 1 persisted state missing: ${round1.states.length}`,
    );

    await writeBehavior(asset.id, [
      AnalyticsEventTypes.FLOW_COMPLETE,
      AnalyticsEventTypes.AI_CREATIVE_ACCEPTED,
      AnalyticsEventTypes.AI_CREATIVE_ACCEPTED,
      AnalyticsEventTypes.EXPERIENCE_REPLAY,
      AnalyticsEventTypes.MEDIA_REPLAY,
    ]);

    const round2 = await compileRound(2);

    assert(
      round2.states.length >= 2,
      `round 2 did not append Author state: ${round2.states.length}`,
    );

    const truthRound2 = normalizeTruth(round2.memory);

    assert(
      truthRound2 === truthRound1,
      "TRUTH_INVARIANT failed between round 1 and round 2",
    );

    await writeBehavior(asset.id, [
      AnalyticsEventTypes.AI_CREATIVE_ACCEPTED,
      AnalyticsEventTypes.AI_CREATIVE_REJECTED,
      AnalyticsEventTypes.AI_VARIATION_SELECTED,
      AnalyticsEventTypes.EXPERIENCE_REPLAY,
      AnalyticsEventTypes.FLOW_COMPLETE,
    ]);

    const round3 = await compileRound(3);

    assert(
      round3.states.length >= 3,
      `round 3 did not append Author state: ${round3.states.length}`,
    );

    const truthRound3 = normalizeTruth(round3.memory);

    assert(
      truthRound3 === truthRound1,
      "TRUTH_INVARIANT failed between round 1 and round 3",
    );

    const analyticsCount = await db.analyticsEvent.count({
      where: {
        assetId: asset.id,
      },
    });

    assert(
      analyticsCount >= 10,
      `expected at least 10 analytics events, got ${analyticsCount}`,
    );

    const signature1 = stateSignature(round1.state);
    const signature2 = stateSignature(round2.state);
    const signature3 = stateSignature(round3.state);

    assert(
      signature1 !== signature2 ||
        signature2 !== signature3,
      "Author experience state did not materially change across HTTP rounds",
    );

    console.log("");
    console.log(
      "AUTHOR HTTP RUNTIME PERSISTENCE ACCEPTANCE: PASS",
    );
    console.log(`Asset=${asset.id}`);
    console.log(`User=${user.id}`);
    console.log(`Model=${process.env.QRE_AUTHOR_FAST_MODEL ?? "default"}`);
    console.log(`Round1StateCount=${round1.states.length}`);
    console.log(`Round2StateCount=${round2.states.length}`);
    console.log(`Round3StateCount=${round3.states.length}`);
    console.log(`Analytics=${analyticsCount}`);
    console.log(`Round1State=${signature1}`);
    console.log(`Round2State=${signature2}`);
    console.log(`Round3State=${signature3}`);
    console.log("TRUTH_INVARIANT=UNCHANGED");
  } finally {
    console.log(`Test user=${user.id}`);
    console.log(`Test asset=${asset.id}`);

    await acceptanceAgent.close();
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error("");
  console.error(
    "AUTHOR HTTP RUNTIME PERSISTENCE ACCEPTANCE: FAIL",
  );
  console.error(error);
  process.exitCode = 1;
});