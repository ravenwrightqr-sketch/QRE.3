import { Agent } from "undici";

export type LocalModelMessage = {
  role: "system" | "user" | "assistant";
  content: string;
  images?: string[];
};

export type LocalModelResult = {
  text: string;
  model: string;
  provider: "local";
};

export type LocalModelOptions = {
  numPredict?: number;
  temperature?: number;
};

function baseUrl(): string {
  return (
    process.env.QRE_LOCAL_MODEL_URL ||
    "http://127.0.0.1:11434"
  ).replace(/\/$/, "");
}

function modelName(
  modelOverride?: string,
): string {
  return (
    modelOverride ||
    process.env.QRE_AUTHOR_FAST_MODEL ||
    process.env.QRE_LOCAL_MODEL ||
    "qwen2.5vl:7b"
  );
}

function fallbackModelName(
  primaryModel: string,
): string {
  const configured = String(
    process.env.QRE_AUTHOR_FALLBACK_MODEL ||
      "qwen2.5vl:7b",
  ).trim();

  if (!configured) {
    return "";
  }

  if (configured === primaryModel) {
    return "";
  }

  return configured;
}

function timeoutMs(): number {
  const raw = Number(
    process.env.QRE_LOCAL_MODEL_TIMEOUT_MS ||
      600000,
  );

  return Number.isFinite(raw) && raw > 0
    ? raw
    : 600000;
}

function headersTimeoutMs(): number {
  const raw = Number(
    process.env.QRE_LOCAL_MODEL_HEADERS_TIMEOUT_MS ||
      timeoutMs(),
  );

  return Number.isFinite(raw) && raw > 0
    ? raw
    : timeoutMs();
}

function bodyTimeoutMs(): number {
  const raw = Number(
    process.env.QRE_LOCAL_MODEL_BODY_TIMEOUT_MS ||
      timeoutMs(),
  );

  return Number.isFinite(raw) && raw > 0
    ? raw
    : timeoutMs();
}

function connectTimeoutMs(): number {
  const raw = Number(
    process.env.QRE_LOCAL_MODEL_CONNECT_TIMEOUT_MS ||
      15000,
  );

  return Number.isFinite(raw) && raw > 0
    ? raw
    : 15000;
}

function keepAlive(): string {
  const fast =
    process.env.QRE_AUTHOR_FAST ===
    "true";

  return (
    process.env.QRE_LOCAL_MODEL_KEEP_ALIVE ||
    (fast ? "10m" : "5m")
  );
}

function defaultTemperature(
  options: LocalModelOptions,
): number {
  const fast =
    process.env.QRE_AUTHOR_FAST ===
    "true";

  return (
    options.temperature ??
    Number(
      process.env.QRE_LOCAL_MODEL_TEMPERATURE ||
        (fast ? 0.78 : 0.82),
    )
  );
}

function defaultNumPredict(
  options: LocalModelOptions,
): number {
  const fast =
    process.env.QRE_AUTHOR_FAST === "true";

  return (
    options.numPredict ??
    Number(
      process.env.QRE_LOCAL_MODEL_NUM_PREDICT ||
        768,
    )
  );
}

function stripDataUrl(
  value: string,
): string {
  const match =
    /^data:[^;]+;base64,(.+)$/s.exec(
      value,
    );

  return match
    ? match[1]
    : value;
}

let dispatcher:
  | Agent
  | undefined;

function getDispatcher(): Agent {
  if (!dispatcher) {
    dispatcher = new Agent({
      connect: {
        timeout:
          connectTimeoutMs(),
      },
      headersTimeout:
        headersTimeoutMs(),
      bodyTimeout:
        bodyTimeoutMs(),
      keepAliveTimeout:
        30_000,
      keepAliveMaxTimeout:
        120_000,
      connections: 4,
      pipelining: 1,
    });
  }

  return dispatcher;
}

function resetDispatcher(): void {
  if (!dispatcher) {
    return;
  }

  const current =
    dispatcher;

  dispatcher = undefined;

  void current
    .close()
    .catch(() => {});
}

function elapsedMs(
  startedAt: number,
): number {
  return (
    Date.now() -
    startedAt
  );
}

function errorCode(
  error: unknown,
): string | undefined {
  if (
    typeof error ===
      "object" &&
    error !== null &&
    "code" in error
  ) {
    const code = (
      error as {
        code?: unknown;
      }
    ).code;

    if (
      typeof code ===
      "string"
    ) {
      return code;
    }
  }

  const cause =
    typeof error ===
        "object" &&
      error !== null &&
      "cause" in error
      ? (
          error as {
            cause?: unknown;
          }
        ).cause
      : undefined;

  if (
    typeof cause ===
      "object" &&
    cause !== null &&
    "code" in cause
  ) {
    const code = (
      cause as {
        code?: unknown;
      }
    ).code;

    if (
      typeof code ===
      "string"
    ) {
      return code;
    }
  }

  return undefined;
}

function isAbortError(
  error: unknown,
): boolean {
  return (
    typeof error ===
      "object" &&
    error !== null &&
    "name" in error &&
    (
      error as {
        name?: unknown;
      }
    ).name ===
      "AbortError"
  );
}

function isTransportError(
  error: unknown,
): boolean {
  if (
    isAbortError(error)
  ) {
    return true;
  }

  const code =
    errorCode(error);

  if (
    code &&
    [
      "UND_ERR_HEADERS_TIMEOUT",
      "UND_ERR_BODY_TIMEOUT",
      "UND_ERR_CONNECT_TIMEOUT",
      "UND_ERR_SOCKET",
      "UND_ERR_DESTROYED",
      "ECONNRESET",
      "ECONNREFUSED",
      "EPIPE",
      "ETIMEDOUT",
    ].includes(code)
  ) {
    return true;
  }

  return (
    error instanceof
      TypeError &&
    /fetch failed/i.test(
      error.message,
    )
  );
}

function outputText(
  data: unknown,
): string {
  if (
    typeof data !==
      "object" ||
    data === null
  ) {
    return "";
  }

  const record =
    data as Record<
      string,
      unknown
    >;

  const message =
    record.message;

  if (
    typeof message ===
      "object" &&
    message !== null
  ) {
    const content = (
      message as {
        content?: unknown;
      }
    ).content;

    if (
      typeof content ===
      "string"
    ) {
      return content.trim();
    }
  }

  const response =
    record.response;

  if (
    typeof response ===
    "string"
  ) {
    return response.trim();
  }

  const choices =
    record.choices;

  if (
    Array.isArray(
      choices,
    ) &&
    choices.length > 0
  ) {
    const first =
      choices[0];

    if (
      typeof first ===
        "object" &&
      first !== null
    ) {
      const firstRecord =
        first as Record<
          string,
          unknown
        >;

      const choiceMessage =
        firstRecord.message;

      if (
        typeof choiceMessage ===
          "object" &&
        choiceMessage !==
          null
      ) {
        const content = (
          choiceMessage as {
            content?: unknown;
          }
        ).content;

        if (
          typeof content ===
          "string"
        ) {
          return content.trim();
        }
      }
    }
  }

  return "";
}

type LocalRequestBody = {
  model: string;
  stream: false;
  keep_alive: string;
  format?: "json";
  messages: Array<{
    role:
      | "system"
      | "user"
      | "assistant";
    content: string;
    images?: string[];
  }>;
  options: {
    temperature: number;
    num_predict: number;
  };
};

async function request(
  path: string,
  body: LocalRequestBody,
  modelOverride?: string,
): Promise<unknown> {
  const controller =
    new AbortController();

  const timeout =
    timeoutMs();

  const startedAt =
    Date.now();

  const timer =
    setTimeout(() => {
      console.log(
        "QRE LOCAL MODEL TIMEOUT FIRING",
        `after=${timeout}ms`,
      );

      controller.abort();
    }, timeout);

  const url =
    `${baseUrl()}${path}`;

  const serializedBody =
    JSON.stringify(body);

  const selectedModel =
    modelName(
      modelOverride,
    );

  try {
    console.log(
      "QRE REQUEST START",
    );

    console.log(
      "QRE REQUEST URL:",
      url,
    );

    console.log(
      "QRE REQUEST MODEL:",
      selectedModel,
    );

    console.log(
      "QRE REQUEST FORMAT:",
      body.format ??
        "default",
    );
     console.log(
  "QRE REQUEST NUM_PREDICT:",
  body.options.num_predict,
);
    console.log(
      "QRE REQUEST MESSAGE COUNT:",
      body.messages.length,
    );

    console.log(
      "QRE REQUEST BODY BYTES:",
      Buffer.byteLength(
        serializedBody,
        "utf8",
      ),
    );

    console.log(
      "QRE REQUEST CONTENT CHARS:",
      body.messages.reduce(
        (
          total,
          message,
        ) =>
          total +
          message.content.length,
        0,
      ),
    );

    console.log(
      "QRE REQUEST TIMEOUT:",
      timeout,
    );

    console.log(
      "QRE REQUEST HEADERS TIMEOUT:",
      headersTimeoutMs(),
    );

    console.log(
      "QRE REQUEST BODY TIMEOUT:",
      bodyTimeoutMs(),
    );

    console.log(
      "QRE FETCH ENTER",
    );

    const response =
      await fetch(
        url,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body:
            serializedBody,
          signal:
            controller.signal,
          dispatcher:
            getDispatcher(),
        } as RequestInit & {
          dispatcher?: unknown;
        },
      );

    console.log(
      "QRE FETCH RETURNED",
    );

    console.log(
      "QRE RESPONSE STATUS:",
      response.status,
    );

    console.log(
      "QRE TIME TO HEADERS MS:",
      elapsedMs(
        startedAt,
      ),
    );

    if (
      !response.ok
    ) {
      const detail =
        await response
          .text()
          .catch(
            () => "",
          );

      console.log(
        "QRE RESPONSE ERROR BODY:",
        detail,
      );

      throw new Error(
        `Local model failed (${response.status}): ${detail.slice(
          0,
          300,
        )}`,
      );
    }

    console.log(
      "QRE READING RESPONSE JSON",
    );

    const json =
      await response.json();

    console.log(
      "QRE RESPONSE JSON RECEIVED",
    );

    console.log(
      "QRE REQUEST TOTAL MS:",
      elapsedMs(
        startedAt,
      ),
    );

    return json;
  } catch (
    error
  ) {
    console.log(
      "QRE LOCAL REQUEST ERROR:",
      error,
    );

    if (
      isTransportError(
        error,
      )
    ) {
      const code =
        errorCode(error);

      console.log(
        "QRE LOCAL REQUEST TRANSPORT FAILURE",
        `code=${code ?? "unknown"}`,
        `elapsedMs=${elapsedMs(
          startedAt,
        )}`,
      );

      if (
        [
          "UND_ERR_SOCKET",
          "UND_ERR_DESTROYED",
          "ECONNRESET",
          "EPIPE",
        ].includes(
          code ?? "",
        )
      ) {
        resetDispatcher();
      }
    }

    throw error;
  } finally {
    clearTimeout(
      timer,
    );

    console.log(
      "QRE REQUEST FINISHED",
      `totalMs=${elapsedMs(
        startedAt,
      )}`,
    );
  }
}

/**
 * PURE LOCAL MODEL TRANSPORT.
 *
 * This module deliberately does NOT:
 *
 * - build a RealityGraph
 * - choose a movie
 * - choose a lens
 * - plan beats
 * - interpret a thesis
 * - realize one beat at a time
 * - run Mouth policy
 * - score Mouth candidates
 * - select a sequence
 *
 * Those responsibilities belong upstream.
 *
 * Canonical path:
 *
 * Cognition
 *   ↓ selectedMovie
 * Brain
 *   ↓ approved beats
 * Mouth
 *   ↓ one batch request
 * localModelGenerate()
 *   ↓
 * local model transport
 */
export async function localModelGenerate(
  messages: LocalModelMessage[],
  format?: "json",
  options: LocalModelOptions = {},
): Promise<LocalModelResult> {

  
  const primaryModel =
    modelName();

  const fallbackModel =
    fallbackModelName(
      primaryModel,
    );

  const temperature =
    defaultTemperature(
      options,
    );

  const numPredict =
    defaultNumPredict(
      options,
    );

  const requestBody:
    LocalRequestBody = {
    model:
      primaryModel,

    stream:
      false,

    keep_alive:
      keepAlive(),

    format,

    messages:
      messages.map(
        (message) => ({
          role:
            message.role,

          content:
            message.content,

          ...(message
            .images?.length
            ? {
                images:
                  message.images.map(
                    stripDataUrl,
                  ),
              }
            : {}),
        }),
      ),

    options: {
      temperature,
      num_predict:
        numPredict,
    },
  };

  try {
    const data =
      await request(
        "/api/chat",
        requestBody,
        primaryModel,
      );

    const text =
      outputText(data);

    if (
      process.env
        .QRE_AUTHOR_DEBUG_RAW ===
      "true"
    ) {
      console.log(
        "\n--- QRE RAW MODEL OUTPUT ---\n" +
          text +
          "\n--- END QRE RAW MODEL OUTPUT ---\n",
      );
    }

    return {
      text,
      model:
        primaryModel,
      provider:
        "local",
    };
  } catch (
    error
  ) {
    if (
      !isTransportError(
        error,
      ) ||
      !fallbackModel
    ) {
      throw error;
    }

    console.log(
      "QRE LOCAL MODEL FALLBACK",
      `primary=${primaryModel}`,
      `fallback=${fallbackModel}`,
      `code=${errorCode(error) ?? "unknown"}`,
    );

    const fallbackBody:
      LocalRequestBody = {
      ...requestBody,
      model:
        fallbackModel,
    };

    const data =
      await request(
        "/api/chat",
        fallbackBody,
        fallbackModel,
      );

    const text =
      outputText(data);

    if (
      process.env
        .QRE_AUTHOR_DEBUG_RAW ===
      "true"
    ) {
      console.log(
        "\n--- QRE RAW FALLBACK MODEL OUTPUT ---\n" +
          text +
          "\n--- END QRE RAW FALLBACK MODEL OUTPUT ---\n",
      );
    }

    return {
      text,
      model:
        fallbackModel,
      provider:
        "local",
    };
  }
}

export async function localModelHealthy(): Promise<boolean> {
  const controller =
    new AbortController();

  const timer =
    setTimeout(
      () => {
        controller.abort();
      },
      3000,
    );

  try {
    const response =
      await fetch(
        `${baseUrl()}/api/tags`,
        {
          signal:
            controller.signal,
          dispatcher:
            getDispatcher(),
        } as RequestInit & {
          dispatcher?: unknown;
        },
      );

    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(
      timer,
    );
  }
}

export function localModelConfig() {
  const model =
    modelName();

  return {
    provider:
      "local" as const,

    url:
      baseUrl(),

    model,

    fallbackModel:
      fallbackModelName(
        model,
      ) ||
      undefined,

    timeoutMs:
      timeoutMs(),

    headersTimeoutMs:
      headersTimeoutMs(),

    bodyTimeoutMs:
      bodyTimeoutMs(),

    connectTimeoutMs:
      connectTimeoutMs(),

    keepAlive:
      keepAlive(),
  };
}