import { Agent } from "undici";

/**
 * QRE CANONICAL AUTHOR BOUNDARY
 *
 * Local model runtime owns provider transport, fallback model behavior,
 * timeouts, context size, temperatures, and token budgets. Do not change model
 * behavior as a side effect of unrelated Author work.
 * See ./AUTHOR_ARCHITECTURE.md.
 */

export type LocalModelMessage = {
  role: "system" | "user" | "assistant";
  content: string;
  images?: string[];
};

export type LocalModelResult = {
  text: string;
  model: string;
  provider: "local" | "openrouter";
};
export type LocalModelJsonSchema = {
  type: "object";
  properties: Record<string, unknown>;
  required?: string[];
  additionalProperties?: boolean;
};

export type LocalModelOptions = {
  model?: string;
  numPredict?: number;
  numCtx?: number;
  temperature?: number;
  jsonSchema?: LocalModelJsonSchema;
};

function baseUrl(): string {
  return (
    process.env.QRE_LOCAL_MODEL_URL ||
    "http://127.0.0.1:11434"
  ).replace(/\/$/, "");
}

function openRouterEnabled(): boolean {
  return (
    String(
      process.env.QRE_MODEL_TRANSPORT ??
        "",
    ).toLowerCase() === "openrouter" ||
    process.env.QRE_OPENROUTER_ENABLED ===
      "true"
  );
}

function openRouterBaseUrl(): string {
  return (
    process.env.QRE_OPENROUTER_BASE_URL ||
    "https://openrouter.ai/api/v1"
  ).replace(/\/$/, "");
}

function openRouterModelName(
  modelOverride?: string,
): string {
  return (
    modelOverride ||
    process.env.QRE_OPENROUTER_MODEL ||
    process.env.QRE_AI_MODEL ||
    "google/gemma-3-12b-it:free"
  );
}

function openRouterApiKey(): string {
  return String(
    process.env.OPENROUTER_API_KEY ?? "",
  ).trim();
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
    process.env.QRE_AUTHOR_FALLBACK_MODEL ?? "",
  ).trim();

  if (
    !configured ||
    /^(?:none|off|disabled)$/i.test(configured)
  ) {
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

function defaultNumCtx(
  options: LocalModelOptions,
): number {
  const raw =
    options.numCtx ??
    Number(
      process.env.QRE_LOCAL_MODEL_NUM_CTX ||
        8192,
    );

  return Number.isFinite(raw) && raw >= 4096
    ? Math.floor(raw)
    : 8192;
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

        if (
          Array.isArray(content)
        ) {
          return content
            .map((part) => {
              if (
                typeof part ===
                  "object" &&
                part !== null &&
                "text" in part
              ) {
                const text = (
                  part as {
                    text?: unknown;
                  }
                ).text;

                return typeof text ===
                  "string"
                  ? text
                  : "";
              }

              return "";
            })
            .filter(Boolean)
            .join("\n")
            .trim();
        }
      }
    }
  }

  return "";
}

type OpenRouterResponseFormat =
  | {
      type: "json_object";
    }
  | {
      type: "json_schema";
      json_schema: {
        name: string;
        strict: true;
        schema: LocalModelJsonSchema;
      };
    };

type OpenRouterRequestBody = {
  model: string;
  stream: false;
  messages: Array<{
    role:
      | "system"
      | "user"
      | "assistant";
    content:
      | string
      | Array<
          | {
              type: "text";
              text: string;
            }
          | {
              type: "image_url";
              image_url: {
                url: string;
              };
            }
        >;
  }>;
  temperature: number;
  max_tokens: number;
  response_format?: OpenRouterResponseFormat;
  provider?: {
    require_parameters: true;
  };
};

class OpenRouterRequestError extends Error {
  readonly status: number;
  readonly detail: string;

  constructor(
    status: number,
    detail: string,
  ) {
    super(
      `OpenRouter model failed (${status}): ${detail.slice(
        0,
        300,
      )}`,
    );

    this.name =
      "OpenRouterRequestError";

    this.status =
      status;

    this.detail =
      detail;
  }
}

function isOpenRouterParameterRoutingFailure(
  error: unknown,
): boolean {
  if (
    !(error instanceof OpenRouterRequestError)
  ) {
    return false;
  }

  if (
    error.status !== 404
  ) {
    return false;
  }

  return /No endpoints found that can handle the requested parameters|Filter by Parameters|requested parameters/i.test(
    error.detail,
  );
}

function openRouterResponseFormat(
  format?: "json",
  jsonSchema?: LocalModelJsonSchema,
): OpenRouterResponseFormat | undefined {
  if (jsonSchema) {
    return {
      type: "json_schema",
      json_schema: {
        name: "qre_author_response",
        strict: true,
        schema: jsonSchema,
      },
    };
  }

  if (format === "json") {
    return {
      type: "json_object",
    };
  }

  return undefined;
}

function openRouterMessages(
  messages: LocalModelMessage[],
): OpenRouterRequestBody["messages"] {
  return messages.map((message) => ({
    role:
      message.role,

    content:
      message.images?.length
        ? [
            {
              type: "text" as const,
              text: message.content,
            },
            ...message.images.map((image) => ({
              type: "image_url" as const,
              image_url: {
                url: image,
              },
            })),
          ]
        : message.content,
  }));
}

async function requestOpenRouter(
  body: OpenRouterRequestBody,
): Promise<unknown> {
  const apiKey =
    openRouterApiKey();

  if (!apiKey) {
    throw new Error(
      "OpenRouter transport requires OPENROUTER_API_KEY.",
    );
  }

  const controller =
    new AbortController();

  const timeout =
    timeoutMs();

  const startedAt =
    Date.now();

  const timer =
    setTimeout(() => {
      console.log(
        "QRE OPENROUTER TIMEOUT FIRING",
        `after=${timeout}ms`,
      );

      controller.abort();
    }, timeout);

  const url =
    `${openRouterBaseUrl()}/chat/completions`;

  const serializedBody =
    JSON.stringify(body);

  try {
    console.log(
      "QRE OPENROUTER REQUEST START",
    );

    console.log(
      "QRE OPENROUTER REQUEST URL:",
      url,
    );

    console.log(
      "QRE OPENROUTER REQUEST MODEL:",
      body.model,
    );

    console.log(
      "QRE OPENROUTER REQUEST FORMAT:",
      body.response_format?.type ??
        "default",
    );

    console.log(
      "QRE OPENROUTER REQUEST MAX_TOKENS:",
      body.max_tokens,
    );

    console.log(
      "QRE OPENROUTER REQUEST MESSAGE COUNT:",
      body.messages.length,
    );

    console.log(
      "QRE OPENROUTER REQUEST BODY BYTES:",
      Buffer.byteLength(
        serializedBody,
        "utf8",
      ),
    );

    console.log(
      "QRE OPENROUTER REQUEST CONTENT CHARS:",
      body.messages.reduce(
        (
          total,
          message,
        ) => {
          if (
            typeof message.content ===
            "string"
          ) {
            return (
              total +
              message.content.length
            );
          }

          return (
            total +
            message.content.reduce(
              (
                partTotal,
                part,
              ) =>
                part.type ===
                "text"
                  ? partTotal +
                    part.text.length
                  : partTotal,
              0,
            )
          );
        },
        0,
      ),
    );

    const response =
      await fetch(
        url,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization:
              `Bearer ${apiKey}`,
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
      "QRE OPENROUTER RESPONSE STATUS:",
      response.status,
    );

    console.log(
      "QRE OPENROUTER TIME TO HEADERS MS:",
      elapsedMs(
        startedAt,
      ),
    );

    if (!response.ok) {
      const detail =
        await response
          .text()
          .catch(
            () => "",
          );

      console.log(
        "QRE OPENROUTER RESPONSE ERROR BODY:",
        detail,
      );

      throw new OpenRouterRequestError(
        response.status,
        detail,
      );
    }

    const json =
      await response.json();

    if (
      process.env
        .QRE_AUTHOR_DEBUG_RAW ===
      "true"
    ) {
      console.log(
        "\n--- QRE RAW OPENROUTER RESPONSE JSON ---\n" +
          JSON.stringify(
            json,
            null,
            2,
          ) +
          "\n--- END QRE RAW OPENROUTER RESPONSE JSON ---\n",
      );
    }

    console.log(
      "QRE OPENROUTER RESPONSE JSON RECEIVED",
    );

    console.log(
      "QRE OPENROUTER REQUEST TOTAL MS:",
      elapsedMs(
        startedAt,
      ),
    );

    return json;
  } catch (
    error
  ) {
    console.log(
      "QRE OPENROUTER REQUEST ERROR:",
      error,
    );

    if (
      isTransportError(
        error,
      )
    ) {
      console.log(
        "QRE OPENROUTER REQUEST TRANSPORT FAILURE",
        `code=${errorCode(error) ?? "unknown"}`,
        `elapsedMs=${elapsedMs(
          startedAt,
        )}`,
      );
    }

    throw error;
  } finally {
    clearTimeout(
      timer,
    );

    console.log(
      "QRE OPENROUTER REQUEST FINISHED",
      `totalMs=${elapsedMs(
        startedAt,
      )}`,
    );
  }
}
type LocalRequestBody = {
  model: string;
  stream: false;
  keep_alive: string;
  format?: "json" | LocalModelJsonSchema;
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
    num_ctx: number;
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
      "QRE REQUEST NUM_CTX:",
      body.options.num_ctx,
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

if (
  typeof json === "object" &&
  json !== null
) {
  const record =
    json as Record<string, unknown>;

  console.log(
    "QRE RESPONSE DONE:",
    record.done,
  );

  console.log(
    "QRE RESPONSE DONE_REASON:",
    record.done_reason,
  );

  console.log(
    "QRE RESPONSE PROMPT_EVAL_COUNT:",
    record.prompt_eval_count,
  );

  console.log(
    "QRE RESPONSE EVAL_COUNT:",
    record.eval_count,
  );

  console.log(
    "QRE RESPONSE EVAL_DURATION_NS:",
    record.eval_duration,
  );
}

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
    modelName(options.model);

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

  const numCtx =
    defaultNumCtx(
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

    format:
  options.jsonSchema ??
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
      num_ctx:
        numCtx,
    },
  };

  if (
    openRouterEnabled()
  ) {
    const responseFormat =
      openRouterResponseFormat(
        format,
        options.jsonSchema,
      );

    const openRouterModel =
      openRouterModelName(
        options.model,
      );

    const openRouterBody:
      OpenRouterRequestBody = {
      model:
        openRouterModel,

      stream:
        false,

      messages:
        openRouterMessages(
          messages,
        ),

      temperature,

      max_tokens:
        numPredict,

      ...(responseFormat
        ? {
            response_format:
              responseFormat,
            provider: {
              require_parameters:
                true,
            },
          }
        : {}),
    };

    let data: unknown;

    try {
      data =
        await requestOpenRouter(
          openRouterBody,
        );
    } catch (
      error
    ) {
      if (
        responseFormat?.type !==
          "json_schema" ||
        !isOpenRouterParameterRoutingFailure(
          error,
        )
      ) {
        throw error;
      }

      console.log(
        "QRE OPENROUTER STRICT JSON_SCHEMA UNSUPPORTED",
      );

      console.log(
        "QRE OPENROUTER RETRY FORMAT: json",
      );

      data =
        await requestOpenRouter({
          ...openRouterBody,
          response_format: {
            type: "json_object",
          },
        });
    }

    const text =
      outputText(data);

    if (
      process.env
        .QRE_AUTHOR_DEBUG_RAW ===
      "true"
    ) {
      console.log(
        "\n--- QRE RAW OPENROUTER MODEL OUTPUT ---\n" +
          text +
          "\n--- END QRE RAW OPENROUTER MODEL OUTPUT ---\n",
      );
    }

    return {
      text,
      model:
        openRouterModel,
      provider:
        "openrouter",
    };
  }

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
  if (
    openRouterEnabled()
  ) {
    return Boolean(
      openRouterApiKey(),
    );
  }

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
  if (
    openRouterEnabled()
  ) {
    return {
      provider:
        "openrouter" as const,

      url:
        openRouterBaseUrl(),

      model:
        openRouterModelName(),

      timeoutMs:
        timeoutMs(),

      headersTimeoutMs:
        headersTimeoutMs(),

      bodyTimeoutMs:
        bodyTimeoutMs(),

      connectTimeoutMs:
        connectTimeoutMs(),
    };
  }

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
