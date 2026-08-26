import { compileCognitiveExperience } from "@qre/engine";

function assert(
  condition: unknown,
  message: string,
): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function sourceTerms(prompt: string): Set<string> {
  return new Set(
    normalize(prompt)
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length >= 4),
  );
}

const FORBIDDEN_INVENTION_PATTERNS = [
  /\bwindow\b/i,
  /\bdoor\b/i,
  /\broom\b/i,
  /\bsalon\b/i,
  /\bshop\b/i,
  /\bchair\b/i,
  /\btable\b/i,
  /\bcouch\b/i,
  /\bbed\b/i,
  /\bsofa\b/i,
  /\bcar\b/i,
  /\btruck\b/i,
  /\bgarden\b/i,
  /\byard\b/i,
  /\bstreet\b/i,
  /\bpark\b/i,
  /\bbeach\b/i,
  /\bocean\b/i,
  /\bsun\b/i,
  /\bsunset\b/i,
  /\bsunrise\b/i,
  /\bmoon\b/i,
  /\bstars?\b/i,
  /\brain\b/i,
  /\bsnow\b/i,
  /\bwind\b/i,
  /\blight(?:ing)?\b/i,
  /\bshadow\b/i,
  /\bglow\b/i,
  /\bblue\b/i,
  /\bred\b/i,
  /\bgreen\b/i,
  /\bwhite\b/i,
  /\bblack\b/i,
  /\bgolden\b/i,
  /\blavender\b/i,
  /\bsmell(?:ed|s|ing)?\b/i,
  /\bfragrance\b/i,
  /\bperfume\b/i,
  /\bmusic\b/i,
  /\bsound\b/i,
  /\blaughed\b/i,
  /\bsmiled\b/i,
  /\bcried\b/i,
  /\bwhispered\b/i,
  /\bshouted\b/i,
  /\bsat\b/i,
  /\bstood\b/i,
  /\bheld\b/i,
  /\btouched\b/i,
  /\bwore\b/i,
  /\bdressed\b/i,
  /\bwearing\b/i,
  /\bcollar\b/i,
  /\bbow\b/i,
  /\bcoat\b/i,
  /\bhat\b/i,
  /\bshoes\b/i,
  /\bphone\b/i,
  /\bcamera\b/i,
];

function suppliedEnough(
  text: string,
  prompt: string,
): boolean {
  const terms = sourceTerms(prompt);
  const words = normalize(text)
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  const meaningful = words.filter(
    (word) => word.length >= 4,
  );

  if (!meaningful.length) return true;

  const suppliedHits = meaningful.filter(
    (word) => terms.has(word),
  ).length;

  return (
    suppliedHits / meaningful.length >= 0.25 ||
    text.trim().length < 80
  );
}

function assertNoUnsupportedConcreteDetail(
  text: string,
  prompt: string,
  label: string,
): void {
  const normalizedPrompt = normalize(prompt);

  for (const pattern of FORBIDDEN_INVENTION_PATTERNS) {
    const match = normalizedPrompt.match(pattern);

    if (match) continue;

    assert(
      !pattern.test(text),
      `${label}: unsupported concrete detail detected: ${pattern}`,
    );
  }
}

function collectOutput(result: {
  moments: Array<{
    text?: string;
    description?: string;
  }>;
}): string {
  return result.moments
    .flatMap((moment) => [
      moment.text ?? "",
      moment.description ?? "",
    ])
    .join(" ");
}

const cases = [
  {
    name: "sparse_pet",
    prompt:
      "Coco was groomed at Elm Street Grooming on Friday.",
  },
  {
    name: "sparse_object",
    prompt:
      "The camera survived the road trip through the desert.",
  },
  {
    name: "sparse_memory",
    prompt:
      "Friday, September 21st. A family sat happily behind the red door.",
  },
  {
    name: "sparse_service",
    prompt:
      "The customer picked up the repaired watch.",
  },
];

for (const testCase of cases) {
  const result = compileCognitiveExperience(
    testCase.prompt,
  );

  assert(
    result.world.events.length > 0,
    `${testCase.name}: no world events`,
  );

  assert(
    result.moments.length > 0,
    `${testCase.name}: no realized moments`,
  );

  const output = collectOutput(result);

  assert(
    output.trim().length > 0,
    `${testCase.name}: empty realization`,
  );

  assertNoUnsupportedConcreteDetail(
    output,
    testCase.prompt,
    testCase.name,
  );

  for (const moment of result.moments) {
    const text = moment.text ?? "";

    assert(
      suppliedEnough(
        text,
        testCase.prompt,
      ),
      `${testCase.name}: realization is insufficiently anchored to supplied material: "${text}"`,
    );

    const payload =
      moment.payload &&
      typeof moment.payload === "object"
        ? moment.payload as Record<string, unknown>
        : {};

    const details =
      Array.isArray(payload.details)
        ? payload.details
        : [];

    for (const detail of details) {
      if (typeof detail !== "string") continue;

      assert(
        !FORBIDDEN_INVENTION_PATTERNS.some(
          (pattern) => {
            const sourceHas =
              pattern.test(
                normalize(testCase.prompt),
              );

            return (
              !sourceHas &&
              pattern.test(detail)
            );
          },
        ),
        `${testCase.name}: unsupported detail entered moment payload: "${detail}"`,
      );
    }
  }

  console.log(
    `PASS ${testCase.name}: ${result.moments.length} moments`,
  );
}

console.log(
  "COGNITION REALIZATION TRUTH ACCEPTANCE: PASS",
);