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
  required?: string[];
  additionalProperties?: boolean;
};

export type LocalModelOptions = {
  numPredict?: number;
  openRouterMaxTokens?: number;
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

function aiProvider(): "ollama" | "openrouter" {
  const provider = String(
    process.env.QRE_AI_PROVIDER ||
      "ollama",
  ).trim().toLowerCase();

  if (provider === "openrouter") {
    return "openrouter";
  }

  return "ollama";
}

function openRouterBaseUrl(): string {
  return "https://openrouter.ai/api/v1";
}

function openRouterApiKey(): string {
  const key = String(
    process.env.OPENROUTER_API_KEY ||
      "",
  ).trim();

  if (!key) {
    throw new Error(
      "QRE_AI_PROVIDER=openrouter requires OPENROUTER_API_KEY",
    );
  }

  return key;
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
      }
    }
  }

  return "";
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

type OpenRouterRequestBody = {
  model: string;
  messages: Array<{
    role:
      | "system"
      | "user"
      | "assistant";
    content: string;
  }>;
  temperature: number;
  max_tokens: number;
  response_format?:
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
};

function schemaRecord(
  value: unknown,
): Record<string, unknown> | undefined {
  return typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function stringValuesEqual(
  value: unknown,
  expected: readonly string[],
): boolean {
  return Array.isArray(value) &&
    value.length === expected.length &&
    expected.every((item, index) => value[index] === item);
}

function isDirectAuthorProvenanceAssignmentsSchema(
  value: unknown,
): boolean {
  const assignments = schemaRecord(value);
  if (
    assignments?.type !== "array" ||
    assignments.minItems !== 3 ||
    assignments.maxItems !== 3
  ) {
    return false;
  }

  const assignmentItem = schemaRecord(assignments.items);
  const assignmentProperties = schemaRecord(assignmentItem?.properties);
  const production = schemaRecord(assignmentProperties?.production);
  const lines = schemaRecord(assignmentProperties?.lines);
  const lineItem = schemaRecord(lines?.items);
  const lineProperties = schemaRecord(lineItem?.properties);
  const order = schemaRecord(lineProperties?.order);
  const sourceEventIds = schemaRecord(lineProperties?.sourceEventIds);
  const sourceEventIdItem = schemaRecord(sourceEventIds?.items);

  return assignmentItem?.additionalProperties === false &&
    stringValuesEqual(assignmentItem?.required, ["production", "lines"]) &&
    production?.type === "string" &&
    stringValuesEqual(production?.enum, ["A", "B", "C"]) &&
    lines?.type === "array" &&
    lines.minItems === 0 &&
    lines.maxItems === 12 &&
    lineItem?.additionalProperties === false &&
    stringValuesEqual(lineItem?.required, ["order", "sourceEventIds"]) &&
    order?.type === "integer" &&
    order.minimum === 1 &&
    sourceEventIds?.type === "array" &&
    sourceEventIds.minItems === 1 &&
    sourceEventIds.maxItems === 32 &&
    sourceEventIdItem?.type === "string" &&
    sourceEventIdItem.maxLength === 64;
}

function isDirectCreativeAuthorAttemptsSchema(
  value: unknown,
): boolean {
  const attempts = schemaRecord(value);
  if (
    attempts?.type !== "array" ||
    attempts.minItems !== 3 ||
    attempts.maxItems !== 3
  ) {
    return false;
  }

  const attemptItem = schemaRecord(attempts.items);
  const attemptProperties = schemaRecord(attemptItem?.properties);
  const text = schemaRecord(attemptProperties?.text);

  return attemptItem?.additionalProperties === false &&
    stringValuesEqual(attemptItem?.required, ["text"]) &&
    text?.type === "string";
}

function isAuthorRealityClaimAuditsSchema(
  value: unknown,
): boolean {
  const audits = schemaRecord(value);
  if (
    audits?.type !== "array" ||
    audits.minItems !== 3 ||
    audits.maxItems !== 3
  ) {
    return false;
  }

  const auditItem = schemaRecord(audits.items);
  const auditProperties = schemaRecord(auditItem?.properties);
  const production = schemaRecord(auditProperties?.production);
  const atomicClaimSpans = schemaRecord(auditProperties?.atomicClaimSpans);
  const spanItem = schemaRecord(atomicClaimSpans?.items);
  const spanProperties = schemaRecord(spanItem?.properties);
  const exactText = schemaRecord(spanProperties?.exactText);
  const classification = schemaRecord(spanProperties?.classification);
  const sourceEventIds = schemaRecord(spanProperties?.sourceEventIds);
  const sourceEventIdItem = schemaRecord(sourceEventIds?.items);
  const atomicity = schemaRecord(spanProperties?.atomicity);

  return auditItem?.additionalProperties === false &&
    stringValuesEqual(auditItem?.required, ["production", "atomicClaimSpans"]) &&
    production?.type === "string" &&
    stringValuesEqual(production?.enum, ["A", "B", "C"]) &&
    atomicClaimSpans?.type === "array" &&
    atomicClaimSpans.minItems === 0 &&
    atomicClaimSpans.maxItems === 64 &&
    spanItem?.additionalProperties === false &&
    stringValuesEqual(spanItem?.required, [
      "exactText",
      "classification",
      "sourceEventIds",
      "atomicity",
    ]) &&
    exactText?.type === "string" &&
    classification?.type === "string" &&
    stringValuesEqual(classification?.enum, [
      "SUPPORTED_REALITY",
      "KEEP_EXPRESSION",
      "UNSUPPORTED_REALITY",
    ]) &&
    sourceEventIds?.type === "array" &&
    sourceEventIds.minItems === 0 &&
    sourceEventIds.maxItems === 32 &&
    sourceEventIdItem?.type === "string" &&
    sourceEventIdItem.maxLength === 64 &&
    atomicity?.type === "string" &&
    stringValuesEqual(atomicity?.enum, [
      "SMALLEST_INDEPENDENT_CLASSIFIABLE_UNIT",
    ]);
}

function isAuthorRealityAtomicClaimSpansSchema(
  value: unknown,
): boolean {
  const atomicClaimSpans = schemaRecord(value);
  const spanItem = schemaRecord(atomicClaimSpans?.items);
  const spanProperties = schemaRecord(spanItem?.properties);
  const exactText = schemaRecord(spanProperties?.exactText);
  const classification = schemaRecord(spanProperties?.classification);
  const sourceEventIds = schemaRecord(spanProperties?.sourceEventIds);
  const sourceEventIdItem = schemaRecord(sourceEventIds?.items);
  const atomicity = schemaRecord(spanProperties?.atomicity);

  return atomicClaimSpans?.type === "array" &&
    atomicClaimSpans.minItems === 0 &&
    atomicClaimSpans.maxItems === 64 &&
    spanItem?.additionalProperties === false &&
    stringValuesEqual(spanItem?.required, [
      "exactText",
      "classification",
      "sourceEventIds",
      "atomicity",
    ]) &&
    exactText?.type === "string" &&
    classification?.type === "string" &&
    stringValuesEqual(classification?.enum, [
      "SUPPORTED_REALITY",
      "KEEP_EXPRESSION",
      "UNSUPPORTED_REALITY",
    ]) &&
    sourceEventIds?.type === "array" &&
    sourceEventIds.minItems === 0 &&
    sourceEventIds.maxItems === 32 &&
    sourceEventIdItem?.type === "string" &&
    sourceEventIdItem.maxLength === 64 &&
    atomicity?.type === "string" &&
    stringValuesEqual(atomicity?.enum, [
      "SMALLEST_INDEPENDENT_CLASSIFIABLE_UNIT",
    ]);
}

function isFinalGroundingVerificationsSchema(
  value: unknown,
): boolean {
  const verifications = schemaRecord(value);
  if (
    verifications?.type !== "array" ||
    typeof verifications.minItems !== "number" ||
    verifications.minItems < 0 ||
    verifications.maxItems !== verifications.minItems
  ) {
    return false;
  }

  const verificationItem = schemaRecord(verifications.items);
  const verificationProperties = schemaRecord(verificationItem?.properties);
  const sceneIndex = schemaRecord(verificationProperties?.sceneIndex);
  const clauseIndex = schemaRecord(verificationProperties?.clauseIndex);
  const supported = schemaRecord(verificationProperties?.supported);
  const supportKind = schemaRecord(verificationProperties?.supportKind);
  const sourceEventIds = schemaRecord(verificationProperties?.sourceEventIds);
  const concreteClaims = schemaRecord(verificationProperties?.concreteClaims);
  const unsupportedClaims = schemaRecord(
    verificationProperties?.unsupportedClaims,
  );

  return verificationItem?.additionalProperties === false &&
    stringValuesEqual(verificationItem?.required, [
      "sceneIndex",
      "clauseIndex",
      "supported",
      "supportKind",
      "sourceEventIds",
      "concreteClaims",
      "unsupportedClaims",
    ]) &&
    sceneIndex?.type === "integer" &&
    sceneIndex.minimum === 0 &&
    clauseIndex?.type === "integer" &&
    clauseIndex.minimum === 0 &&
    clauseIndex.maximum === 11 &&
    supported?.type === "boolean" &&
    supportKind?.type === "string" &&
    stringValuesEqual(supportKind?.enum, [
      "DIRECT",
      "PARAPHRASE",
      "FIGURATIVE",
      "CONTEXTUAL_TEXTURE",
      "UNSUPPORTED",
    ]) &&
    sourceEventIds?.type === "array" &&
    sourceEventIds.maxItems === 32 &&
    concreteClaims?.type === "array" &&
    concreteClaims.maxItems === 12 &&
    unsupportedClaims?.type === "array" &&
    unsupportedClaims.maxItems === 12;
}

function openRouterDevelopmentTokenCeiling(
  schema: LocalModelJsonSchema | undefined,
): number | undefined {
  const root = schemaRecord(schema);
  const properties = schemaRecord(root?.properties);

  if (isDirectCreativeAuthorAttemptsSchema(properties?.attempts)) {
    return 3000;
  }

  if (isDirectAuthorProvenanceAssignmentsSchema(properties?.assignments)) {
    return 3000;
  }

  if (isAuthorRealityClaimAuditsSchema(properties?.audits)) {
    return 12000;
  }

  if (isFinalGroundingVerificationsSchema(properties?.verifications)) {
    return 4000;
  }

  return undefined;
}

function normalizeOpenRouterJsonSchema(
  value: unknown,
  options: {
    preserveMinItemsZero?: boolean;
    omitClaimAuditorAtomicSpanMaxItems?: boolean;
  } = {},
): unknown {
  if (
    Array.isArray(value)
  ) {
    return value.map((item) =>
      normalizeOpenRouterJsonSchema(
        item,
        options,
      ),
    );
  }

  if (
    typeof value !==
      "object" ||
    value === null
  ) {
    return value;
  }

  const normalized:
    Record<string, unknown> =
      {};
  const omitDirectProvenanceAssignmentsCardinality =
    isDirectAuthorProvenanceAssignmentsSchema(
      value,
    );
  const omitClaimAuditsCardinality =
    isAuthorRealityClaimAuditsSchema(
      value,
    );
  const omitClaimAuditorAtomicSpanMaxItems =
    Boolean(
      options.omitClaimAuditorAtomicSpanMaxItems,
    ) &&
    isAuthorRealityAtomicClaimSpansSchema(
      value,
    );
  const nestedOptions = {
    preserveMinItemsZero:
      options.preserveMinItemsZero ||
      omitClaimAuditsCardinality,
    omitClaimAuditorAtomicSpanMaxItems:
      options.omitClaimAuditorAtomicSpanMaxItems ||
      omitClaimAuditsCardinality,
  };

  for (const [
    key,
    nestedValue,
  ] of Object.entries(
    value as Record<
      string,
      unknown
    >,
  )) {
    if (
      key === "minItems" &&
      nestedValue === 0 &&
      !options.preserveMinItemsZero
    ) {
      continue;
    }

    if (
      omitDirectProvenanceAssignmentsCardinality &&
      (
        key === "minItems" ||
        key === "maxItems"
      ) &&
      nestedValue === 3
    ) {
      continue;
    }

    if (
      omitClaimAuditsCardinality &&
      (
        key === "minItems" ||
        key === "maxItems"
      ) &&
      nestedValue === 3
    ) {
      continue;
    }

    if (
      omitClaimAuditorAtomicSpanMaxItems &&
      key === "maxItems" &&
      nestedValue === 64
    ) {
      continue;
    }

    normalized[key] =
      normalizeOpenRouterJsonSchema(
        nestedValue,
        nestedOptions,
      );
  }

  return normalized;
}

function openRouterResponseFormat(
  format: "json" | undefined,
  schema: LocalModelJsonSchema | undefined,
): OpenRouterRequestBody["response_format"] {
  if (schema) {
    return {
      type: "json_schema",
      json_schema: {
        name: "qre_structured_output",
        strict: true,
        schema:
          normalizeOpenRouterJsonSchema(
            schema,
          ) as LocalModelJsonSchema,
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

function isStructuredOpenRouterFormat(
  responseFormat:
    | OpenRouterRequestBody["response_format"]
    | undefined,
): boolean {
  return (
    responseFormat?.type ===
      "json_schema" ||
    responseFormat?.type ===
      "json_object"
  );
}

function isTruncatedFinishReason(
  value: unknown,
): boolean {
  if (
    typeof value !==
      "string"
  ) {
    return false;
  }

  return /(?:^|[^a-z])(?:length|max[_ -]?tokens?|token[_ -]?limit)(?:$|[^a-z])/i.test(
    value,
  );
}

function parseStructuredJson(
  text: string,
): unknown {
  const source =
    text
      .trim()
      .replace(
        /^\`\`\`(?:json)?/i,
        "",
      )
      .replace(
        /\`\`\`$/i,
        "",
      )
      .trim();

  if (!source) {
    throw new Error(
      "empty structured output",
    );
  }

  try {
    return JSON.parse(source);
  } catch {
    const start =
      source.indexOf("{");
    const end =
      source.lastIndexOf("}");

    if (
      start < 0 ||
      end <= start
    ) {
      throw new Error(
        "structured output is not complete JSON",
      );
    }

    return JSON.parse(
      source.slice(
        start,
        end + 1,
      ),
    );
  }
}

function openRouterTextContent(
  data: unknown,
): {
  text: string;
  choicesLength: number;
  finishReason?: unknown;
  nativeFinishReason?: unknown;
  usage?: Record<string, unknown>;
} {
  if (
    typeof data !==
      "object" ||
    data === null
  ) {
    return {
      text: "",
      choicesLength: 0,
    };
  }

  const record =
    data as Record<
      string,
      unknown
    >;

  const usage =
    typeof record.usage ===
        "object" &&
      record.usage !== null
      ? record.usage as Record<
          string,
          unknown
        >
      : undefined;

  const choices =
    record.choices;

  if (
    !Array.isArray(
      choices,
    ) ||
    choices.length === 0
  ) {
    return {
      text: "",
      choicesLength:
        Array.isArray(choices)
          ? choices.length
          : 0,
      usage,
    };
  }

  const first =
    choices[0];

  if (
    typeof first !==
      "object" ||
    first === null
  ) {
    return {
      text: "",
      choicesLength:
        choices.length,
      usage,
    };
  }

  const firstRecord =
    first as Record<
      string,
      unknown
    >;

  const choiceMessage =
    firstRecord.message;

  const text =
    typeof choiceMessage ===
        "object" &&
      choiceMessage !== null &&
      typeof (
        choiceMessage as {
          content?: unknown;
        }
      ).content ===
        "string"
      ? (
          choiceMessage as {
            content: string;
          }
        ).content.trim()
      : "";

  return {
    text,
    choicesLength:
      choices.length,
    finishReason:
      firstRecord.finish_reason,
    nativeFinishReason:
      firstRecord.native_finish_reason,
    usage,
  };
}

function openRouterOutputText(
  data: unknown,
  responseFormat:
    | OpenRouterRequestBody["response_format"]
    | undefined,
  maxTokens: number,
): string {
  const completion =
    openRouterTextContent(
      data,
    );

  console.log(
    "QRE OPENROUTER RESPONSE CHOICES:",
    completion.choicesLength,
  );

  console.log(
    "QRE OPENROUTER RESPONSE FINISH:",
    `finish_reason=${String(
      completion.finishReason ??
        "",
    )}`,
    `native_finish_reason=${String(
      completion.nativeFinishReason ??
        "",
    )}`,
  );

  console.log(
    "QRE OPENROUTER RESPONSE USAGE:",
    `prompt=${String(
      completion.usage?.prompt_tokens ??
        "",
    )}`,
    `completion=${String(
      completion.usage?.completion_tokens ??
        "",
    )}`,
    `total=${String(
      completion.usage?.total_tokens ??
        "",
    )}`,
    `max_tokens=${maxTokens}`,
  );

  console.log(
    "QRE OPENROUTER RESPONSE CONTENT CHARS:",
    completion.text.length,
  );

  if (
    isStructuredOpenRouterFormat(
      responseFormat,
    ) &&
    (
      isTruncatedFinishReason(
        completion.finishReason,
      ) ||
      isTruncatedFinishReason(
        completion.nativeFinishReason,
      )
    )
  ) {
    throw new Error(
      `OpenRouter structured output truncated: finish_reason=${String(
        completion.finishReason ??
          "",
      )} native_finish_reason=${String(
        completion.nativeFinishReason ??
          "",
      )} completion_tokens=${String(
        completion.usage?.completion_tokens ??
          "",
      )} max_tokens=${maxTokens}`,
    );
  }

  if (
    isStructuredOpenRouterFormat(
      responseFormat,
    )
  ) {
    try {
      parseStructuredJson(
        completion.text,
      );
    } catch (
      error
    ) {
      throw new Error(
        `OpenRouter structured output was not complete JSON: ${
          error instanceof Error
            ? error.message
            : "unknown parse failure"
        }`,
      );
    }
  }

  return completion.text;
}

async function requestOpenRouter(
  body: OpenRouterRequestBody,
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

    const response =
      await fetch(
        url,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization:
              `Bearer ${openRouterApiKey()}`,
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

    if (
      !response.ok
    ) {
      const detail =
        await response
          .text()
          .catch(
            () => "",
          );

      throw new Error(
        `OpenRouter model failed (${response.status}): ${detail.slice(
          0,
          300,
        )}`,
      );
    }

    const json =
      await response.json();

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
      error instanceof Error
        ? error.message
        : "unknown",
    );

    throw error;
  } finally {
    clearTimeout(
      timer,
    );
  }
}

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

  const numCtx =
    defaultNumCtx(
      options,
    );

  if (
    aiProvider() ===
    "openrouter"
  ) {
    const openRouterMaxTokens =
      openRouterDevelopmentTokenCeiling(
        options.jsonSchema,
      ) ??
      options.openRouterMaxTokens ??
      numPredict;

    const responseFormat =
      openRouterResponseFormat(
        format,
        options.jsonSchema,
      );

    const requestBody:
      OpenRouterRequestBody = {
      model:
        primaryModel,

      messages:
        messages.map(
          (message) => ({
            role:
              message.role,

            content:
              message.content,
          }),
        ),

      temperature,

      max_tokens:
        openRouterMaxTokens,

      ...(responseFormat
        ? {
            response_format:
              responseFormat,
          }
        : {}),
    };

    const data =
      await requestOpenRouter(
        requestBody,
      );

    const text =
      openRouterOutputText(
        data,
        responseFormat,
        openRouterMaxTokens,
      );

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
        primaryModel,
      provider:
        "local",
    };
  }

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
    aiProvider() ===
    "openrouter"
  ) {
    return Boolean(
      String(
        process.env.OPENROUTER_API_KEY ||
          "",
      ).trim(),
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
  const model =
    modelName();

  if (
    aiProvider() ===
    "openrouter"
  ) {
    return {
      provider:
        "openrouter" as const,

      url:
        openRouterBaseUrl(),

      model,

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
