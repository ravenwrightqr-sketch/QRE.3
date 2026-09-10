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

export type LocalModelJsonSchema = {
  type: "object";
  properties: Record<string, unknown>;
  required?: readonly string[];
  additionalProperties?: boolean;
};

export type LocalModelOptions = {
  numPredict?: number;
  numCtx?: number;
  temperature?: number;
  jsonSchema?: LocalModelJsonSchema;
};

type LocalRequestMessage = {
  role: "system" | "user" | "assistant";
  content: string;
  images?: string[];
};

type LocalRequestBody = {
  model: string;
  stream: false;
  keep_alive: string;
  format?: "json" | LocalModelJsonSchema;
  messages: LocalRequestMessage[];
  options: {
    temperature: number;
    num_predict: number;
    num_ctx: number;
  };
};

type HttpError = Error & {
  status?: number;
  statusText?: string;
  responseBody?: string;
};

function baseUrl(): string {
  return (
    process.env.QRE_LOCAL_MODEL_URL ||
    "http://127.0.0.1:11434"
  ).replace(/\/+$/, "");
}

function modelName(modelOverride?: string): string {
  const configured =
    modelOverride ||
    process.env.QRE_AUTHOR_FAST_MODEL ||
    process.env.QRE_LOCAL_MODEL ||
    "qwen2.5vl:7b";

  const model = String(configured).trim();

  if (!model) {
    throw new Error("QRE local model name is empty.");
  }

  return model;
}

function fallbackModelName(primaryModel: string): string | undefined {
  const raw = process.env.QRE_AUTHOR_FALLBACK_MODEL;

  const configured = (
    raw === undefined ? "qwen2.5vl:7b" : String(raw)
  ).trim();

  if (!configured || configured === primaryModel) {
    return undefined;
  }

  return configured;
}

function positiveNumber(
  value: string | undefined,
  fallback: number,
): number {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function timeoutMs(): number {
  return positiveNumber(
    process.env.QRE_LOCAL_MODEL_TIMEOUT_MS,
    600000,
  );
}

function headersTimeoutMs(): number {
  return positiveNumber(
    process.env.QRE_LOCAL_MODEL_HEADERS_TIMEOUT_MS,
    timeoutMs(),
  );
}

function bodyTimeoutMs(): number {
  return positiveNumber(
    process.env.QRE_LOCAL_MODEL_BODY_TIMEOUT_MS,
    timeoutMs(),
  );
}

function connectTimeoutMs(): number {
  return positiveNumber(
    process.env.QRE_LOCAL_MODEL_CONNECT_TIMEOUT_MS,
    15000,
  );
}

function keepAlive(): string {
  const fast = process.env.QRE_AUTHOR_FAST === "true";

  return (
    process.env.QRE_LOCAL_MODEL_KEEP_ALIVE?.trim() ||
    (fast ? "10m" : "5m")
  );
}

function defaultTemperature(
  options: LocalModelOptions,
): number {
  const fast = process.env.QRE_AUTHOR_FAST === "true";

  const configured = Number(
    process.env.QRE_LOCAL_MODEL_TEMPERATURE,
  );

  const fallback = fast ? 0.78 : 0.82;

  const temperature =
    options.temperature ??
    (Number.isFinite(configured) ? configured : fallback);

  if (!Number.isFinite(temperature)) {
    throw new Error(
      `Invalid local model temperature: ${temperature}`,
    );
  }

  return Math.max(0, Math.min(2, temperature));
}

function defaultNumPredict(
  options: LocalModelOptions,
): number {
  const configured = Number(
    process.env.QRE_LOCAL_MODEL_NUM_PREDICT,
  );

  const value =
    options.numPredict ??
    (Number.isFinite(configured) ? configured : 768);

  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(
      `Invalid local model num_predict: ${value}`,
    );
  }

  return Math.floor(value);
}

/**
 * Ollama's context window is separate from num_predict.
 *
 * The effective request must accommodate both prompt tokens
 * and generated tokens. Callers may override this value while
 * the environment provides the process-wide default.
 */
function defaultNumCtx(
  options: LocalModelOptions,
): number {
  const configured = Number(
    process.env.QRE_LOCAL_MODEL_NUM_CTX,
  );

  const value =
    options.numCtx ??
    (Number.isFinite(configured) ? configured : 16384);

  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(
      `Invalid local model context size: ${value}`,
    );
  }

  return Math.floor(value);
}

function retryCount(): number {
  const configured = positiveNumber(
    process.env.QRE_LOCAL_MODEL_RETRIES,
    2,
  );

  return Math.min(5, Math.max(0, Math.floor(configured)));
}

function retryBaseDelayMs(): number {
  return positiveNumber(
    process.env.QRE_LOCAL_MODEL_RETRY_DELAY_MS,
    1000,
  );
}

function maxResponseBytes(): number {
  return positiveNumber(
    process.env.QRE_LOCAL_MODEL_MAX_RESPONSE_BYTES,
    10 * 1024 * 1024,
  );
}

/**
 * Convert a browser Data URL into the raw base64 payload Ollama expects.
 *
 * Accepts:
 *   data:image/jpeg;base64,AAAA...
 *   data:image/png;base64,AAAA...
 *   raw-base64-without-prefix
 *
 * The image itself is never decoded or copied unnecessarily.
 */
function normalizeImageDataUrl(
  value: string,
  index: number,
): string {
  if (typeof value !== "string") {
    throw new Error(
      `Local model image ${index + 1} is not a string.`,
    );
  }

  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error(
      `Local model image ${index + 1} is empty.`,
    );
  }

  let base64 = trimmed;

  if (trimmed.startsWith("data:")) {
    const headerEnd = trimmed.indexOf(",");

    if (headerEnd < 0) {
      throw new Error(
        `Local model image ${index + 1} is a malformed Data URL.`,
      );
    }

    const header = trimmed.slice(0, headerEnd);
    base64 = trimmed.slice(headerEnd + 1);

    if (!/^data:image\/[^;,]+(?:;[^,]*)*;base64$/i.test(header)) {
      throw new Error(
        `Local model image ${index + 1} is not a base64 image Data URL.`,
      );
    }
  } else if (/^[a-z]+:\/\//i.test(trimmed)) {
    throw new Error(
      `Local model image ${index + 1} is a URL. ` +
        "Ollama requires base64 image data for this endpoint.",
    );
  }

  base64 = base64
    .replace(/[\r\n\t ]+/g, "")
    .replace(/^\uFEFF/, "");

  if (!base64) {
    throw new Error(
      `Local model image ${index + 1} contains no base64 payload.`,
    );
  }

  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64)) {
    throw new Error(
      `Local model image ${index + 1} contains invalid base64 characters.`,
    );
  }

  if (base64.length % 4 !== 0) {
    throw new Error(
      `Local model image ${index + 1} has invalid base64 length.`,
    );
  }

  return base64;
}

function normalizeMessages(
  messages: LocalModelMessage[],
): LocalRequestMessage[] {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error(
      "Local model request requires at least one message.",
    );
  }

  return messages.map((message, messageIndex) => {
    if (!message || typeof message !== "object") {
      throw new Error(
        `Local model message ${messageIndex + 1} is invalid.`,
      );
    }

    if (
      message.role !== "system" &&
      message.role !== "user" &&
      message.role !== "assistant"
    ) {
      throw new Error(
        `Local model message ${messageIndex + 1} has invalid role.`,
      );
    }

    if (typeof message.content !== "string") {
      throw new Error(
        `Local model message ${messageIndex + 1} content is not a string.`,
      );
    }

    const content = message.content;

    const images =
      message.images && message.images.length > 0
        ? message.images.map((image, imageIndex) =>
            normalizeImageDataUrl(
              image,
              imageIndex,
            ),
          )
        : undefined;

    return {
      role: message.role,
      content,
      ...(images?.length ? { images } : {}),
    };
  });
}

let dispatcher: Agent | undefined;
let dispatcherConfigKey: string | undefined;

function dispatcherConfig(): string {
  return [
    connectTimeoutMs(),
    headersTimeoutMs(),
    bodyTimeoutMs(),
  ].join("|");
}

function getDispatcher(): Agent {
  const nextConfigKey = dispatcherConfig();

  if (
    dispatcher &&
    dispatcherConfigKey !== nextConfigKey
  ) {
    resetDispatcher();
  }

  if (!dispatcher) {
    dispatcher = new Agent({
      connect: {
        timeout: connectTimeoutMs(),
      },
      headersTimeout: headersTimeoutMs(),
      bodyTimeout: bodyTimeoutMs(),
      keepAliveTimeout: 30000,
      keepAliveMaxTimeout: 120000,
      connections: 4,
      pipelining: 1,
    });

    dispatcherConfigKey = nextConfigKey;
  }

  return dispatcher;
}

function resetDispatcher(): void {
  if (!dispatcher) {
    dispatcherConfigKey = undefined;
    return;
  }

  const current = dispatcher;

  dispatcher = undefined;
  dispatcherConfigKey = undefined;

  void current.close().catch(() => {});
}

function elapsedMs(startedAt: number): number {
  return Date.now() - startedAt;
}

function errorCode(
  error: unknown,
): string | undefined {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error
  ) {
    const code = (
      error as {
        code?: unknown;
      }
    ).code;

    if (typeof code === "string") {
      return code;
    }
  }

  const cause =
    typeof error === "object" &&
    error !== null &&
    "cause" in error
      ? (
          error as {
            cause?: unknown;
          }
        ).cause
      : undefined;

  if (
    typeof cause === "object" &&
    cause !== null &&
    "code" in cause
  ) {
    const code = (
      cause as {
        code?: unknown;
      }
    ).code;

    if (typeof code === "string") {
      return code;
    }
  }

  return undefined;
}

function errorStatus(
  error: unknown,
): number | undefined {
  if (
    typeof error === "object" &&
    error !== null &&
    "status" in error
  ) {
    const status = (
      error as {
        status?: unknown;
      }
    ).status;

    return typeof status === "number"
      ? status
      : undefined;
  }

  return undefined;
}

function isAbortError(
  error: unknown,
): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as { name?: unknown }).name ===
      "AbortError"
  );
}

function isTransportError(
  error: unknown,
): boolean {
  if (isAbortError(error)) {
    return true;
  }

  const code = errorCode(error);

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
    error instanceof TypeError &&
    /fetch failed/i.test(error.message)
  );
}

function isRetryableStatus(
  status: number | undefined,
): boolean {
  if (status === undefined) {
    return false;
  }

  return (
    status === 408 ||
    status === 409 ||
    status === 425 ||
    status === 429 ||
    status >= 500
  );
}

function isRetryableError(
  error: unknown,
): boolean {
  return (
    isTransportError(error) ||
    isRetryableStatus(errorStatus(error))
  );
}

function sleep(
  milliseconds: number,
): Promise<void> {
  return new Promise((resolve) =>
    setTimeout(resolve, milliseconds),
  );
}

function retryDelay(
  attempt: number,
): number {
  const base = retryBaseDelayMs();

  const exponential = Math.min(
    10000,
    base * Math.pow(2, attempt),
  );

  const jitter = Math.floor(
    Math.random() * Math.max(100, base / 2),
  );

  return exponential + jitter;
}

function outputText(
  data: unknown,
): string {
  if (
    typeof data !== "object" ||
    data === null
  ) {
    return "";
  }

  const record =
    data as Record<string, unknown>;

  const message = record.message;

  if (
    typeof message === "object" &&
    message !== null
  ) {
    const content = (
      message as {
        content?: unknown;
      }
    ).content;

    if (typeof content === "string") {
      return content.trim();
    }
  }

  const response = record.response;

  if (typeof response === "string") {
    return response.trim();
  }

  const choices = record.choices;

  if (
    Array.isArray(choices) &&
    choices.length > 0
  ) {
    const first = choices[0];

    if (
      typeof first === "object" &&
      first !== null
    ) {
      const choiceMessage = (
        first as Record<string, unknown>
      ).message;

      if (
        typeof choiceMessage === "object" &&
        choiceMessage !== null
      ) {
        const content = (
          choiceMessage as {
            content?: unknown;
          }
        ).content;

        if (typeof content === "string") {
          return content.trim();
        }
      }
    }
  }

  return "";
}

async function readResponseBody(
  response: Response,
): Promise<string> {
  const contentLength =
    response.headers.get("content-length");

  if (contentLength) {
    const declaredBytes = Number(contentLength);

    if (
      Number.isFinite(declaredBytes) &&
      declaredBytes > maxResponseBytes()
    ) {
      throw new Error(
        `Local model response is too large (${declaredBytes} bytes).`,
      );
    }
  }

  const text = await response.text();

  if (
    Buffer.byteLength(text, "utf8") >
    maxResponseBytes()
  ) {
    throw new Error(
      `Local model response exceeded the configured limit of ${maxResponseBytes()} bytes.`,
    );
  }

  return text;
}

function parseJsonResponse(
  text: string,
): unknown {
  if (!text.trim()) {
    throw new Error(
      "Local model returned an empty response.",
    );
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      "Local model returned invalid JSON.",
    );
  }
}

async function request(
  path: string,
  body: LocalRequestBody,
  modelOverride?: string,
): Promise<unknown> {
  const url = `${baseUrl()}${path}`;
  const serializedBody = JSON.stringify(body);
  const selectedModel =
    modelName(modelOverride);

  let lastError: unknown;

  const attempts = retryCount() + 1;

  for (
    let attempt = 0;
    attempt < attempts;
    attempt += 1
  ) {
    const controller =
      new AbortController();

    const timeout = timeoutMs();
    const startedAt = Date.now();

    const timer = setTimeout(() => {
      console.log(
        "QRE LOCAL MODEL TIMEOUT FIRING",
        `after=${timeout}ms`,
        `model=${selectedModel}`,
        `attempt=${attempt + 1}/${attempts}`,
      );

      controller.abort();
    }, timeout);

    try {
      console.log("QRE REQUEST START");
      console.log(
        "QRE REQUEST URL:",
        url,
      );
      console.log(
        "QRE REQUEST MODEL:",
        selectedModel,
      );
      console.log(
        "QRE REQUEST ATTEMPT:",
        `${attempt + 1}/${attempts}`,
      );
      console.log(
        "QRE REQUEST FORMAT:",
        body.format ?? "default",
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
        "QRE REQUEST IMAGE COUNT:",
        body.messages.reduce(
          (total, message) =>
            total + (message.images?.length ?? 0),
          0,
        ),
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
          (total, message) =>
            total + message.content.length,
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
        "QRE REQUEST CONNECT TIMEOUT:",
        connectTimeoutMs(),
      );
      console.log("QRE FETCH ENTER");

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: serializedBody,
        signal: controller.signal,
        dispatcher: getDispatcher(),
      } as RequestInit & {
        dispatcher?: unknown;
      });

      console.log("QRE FETCH RETURNED");
      console.log(
        "QRE RESPONSE STATUS:",
        response.status,
      );
      console.log(
        "QRE TIME TO HEADERS MS:",
        elapsedMs(startedAt),
      );

      if (!response.ok) {
        const detail =
          await readResponseBody(response).catch(
            () => "",
          );

        console.log(
          "QRE RESPONSE ERROR BODY:",
          detail.slice(0, 1000),
        );

        const error =
          new Error(
            `Local model failed (${response.status}): ${detail.slice(
              0,
              500,
            )}`,
          ) as HttpError;

        error.status = response.status;
        error.statusText =
          response.statusText;
        error.responseBody = detail;

        throw error;
      }

      console.log(
        "QRE READING RESPONSE JSON",
      );

      const responseText =
        await readResponseBody(response);

      const json =
        parseJsonResponse(responseText);

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
        elapsedMs(startedAt),
      );

      return json;
    } catch (error) {
      lastError = error;

      const retryable =
        isRetryableError(error);

      const hasAnotherAttempt =
        attempt + 1 < attempts;

      console.log(
        "QRE LOCAL REQUEST ERROR:",
        error,
      );

      if (isTransportError(error)) {
        const code = errorCode(error);

        console.log(
          "QRE LOCAL REQUEST TRANSPORT FAILURE",
          `code=${code ?? "unknown"}`,
          `elapsedMs=${elapsedMs(startedAt)}`,
        );

        if (
          [
            "UND_ERR_SOCKET",
            "UND_ERR_DESTROYED",
            "ECONNRESET",
            "EPIPE",
          ].includes(code ?? "")
        ) {
          resetDispatcher();
        }
      }

      if (
        !retryable ||
        !hasAnotherAttempt
      ) {
        throw error;
      }

      const delay =
        retryDelay(attempt);

      console.log(
        "QRE LOCAL MODEL RETRY",
        `delayMs=${delay}`,
        `attempt=${attempt + 1}/${attempts}`,
      );

      await sleep(delay);
    } finally {
      clearTimeout(timer);

      console.log(
        "QRE REQUEST FINISHED",
        `totalMs=${elapsedMs(startedAt)}`,
        `attempt=${attempt + 1}/${attempts}`,
      );
    }
  }

  throw (
    lastError instanceof Error
      ? lastError
      : new Error(
          "Local model request failed.",
        )
  );
}

export async function localModelGenerate(
  messages: LocalModelMessage[],
  format?: "json",
  options: LocalModelOptions = {},
): Promise<LocalModelResult> {
  const primaryModel =
    modelName();

  console.trace(
    "QRE MODEL CALLER",
  );

  const fallbackModel =
    fallbackModelName(
      primaryModel,
    );

  const numPredict =
    defaultNumPredict(options);

  const numCtx =
    defaultNumCtx(options);

  const temperature =
    defaultTemperature(options);

  const normalizedMessages =
    normalizeMessages(messages);

  const requestBody: LocalRequestBody = {
    model: primaryModel,
    stream: false,
    keep_alive: keepAlive(),
    format:
      options.jsonSchema ??
      format,
    messages: normalizedMessages,
    options: {
      temperature,
      num_predict: numPredict,
      num_ctx: numCtx,
    },
  };

  try {
    const data = await request(
      "/api/chat",
      requestBody,
      primaryModel,
    );

    const text =
      outputText(data);

    if (
      process.env.QRE_AUTHOR_DEBUG_RAW ===
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
      model: primaryModel,
      provider: "local",
    };
  } catch (error) {
    if (
      !isTransportError(error) ||
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

    const fallbackBody: LocalRequestBody = {
      ...requestBody,
      model: fallbackModel,
    };

    const data = await request(
      "/api/chat",
      fallbackBody,
      fallbackModel,
    );

    const text =
      outputText(data);

    if (
      process.env.QRE_AUTHOR_DEBUG_RAW ===
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
      model: fallbackModel,
      provider: "local",
    };
  }
}

export async function localModelHealthy(): Promise<boolean> {
  const controller =
    new AbortController();

  const timer =
    setTimeout(() => {
      controller.abort();
    }, 3000);

  try {
    const response =
      await fetch(
        `${baseUrl()}/api/tags`,
        {
          method: "GET",
          signal: controller.signal,
          dispatcher: getDispatcher(),
        } as RequestInit & {
          dispatcher?: unknown;
        },
      );

    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export function localModelConfig() {
  const model =
    modelName();

  return {
    provider: "local" as const,
    url: baseUrl(),
    model,
    fallbackModel:
      fallbackModelName(model),
    timeoutMs:
      timeoutMs(),
    headersTimeoutMs:
      headersTimeoutMs(),
    bodyTimeoutMs:
      bodyTimeoutMs(),
    connectTimeoutMs:
      connectTimeoutMs(),
    retryCount:
      retryCount(),
    retryBaseDelayMs:
      retryBaseDelayMs(),
    keepAlive:
      keepAlive(),
    numCtx:
      defaultNumCtx({}),
    numPredict:
      defaultNumPredict({}),
    temperature:
      defaultTemperature({}),
    maxResponseBytes:
      maxResponseBytes(),
  };
}
