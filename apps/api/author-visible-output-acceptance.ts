import "dotenv/config";

import { db } from "@qre/db";
import { compileExperience } from "./src/services/experienceService.js";
import { createMemoryRepository } from "./src/repositories/memoryRepository.js";

function clean(value: unknown): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function textOfMoment(value: unknown): string {
  if (!value || typeof value !== "object") return "";

  const record = value as Record<string, unknown>;
  const payload =
    record.payload && typeof record.payload === "object"
      ? (record.payload as Record<string, unknown>)
      : undefined;

  return clean(
    record.text ??
      payload?.text ??
      record.content ??
      payload?.content,
  );
}

function diagnosticsOf(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

const assetId =
  clean(process.env.QRE_VISIBLE_ASSET_ID) || "GRIMES";

const lens =
  clean(process.env.QRE_VISIBLE_LENS) || "noir";

const prompt =
  clean(process.env.QRE_VISIBLE_PROMPT) ||
  [
    "A service was completed.",
    "The kitchen was cleaned.",
    "Two bathrooms were cleaned.",
    "I felt eyes on me.",
    "The cat watched from around the corner.",
    "Create the finished customer-facing experience as a short cinematic service receipt film.",
  ].join(" ");

const sessionId =
  `acceptance:visible:${assetId}:${lens}:${Date.now()}`;

const operationId =
  sessionId;

const asset =
  await db.asset.findUnique({
    where: {
      id: assetId,
    },
    select: {
      id: true,
      displayName: true,
      slug: true,
    },
  });

if (!asset) {
  throw new Error(
    `Visible output asset not found: ${assetId}`,
  );
}

const memoryRepository =
  createMemoryRepository();

console.log(
  "--- QRE VISIBLE USER OUTPUT ---",
);
console.log(`asset=${asset.id}`);
console.log(`slug=${asset.slug}`);
console.log(`lens=${lens}`);
console.log(`prompt=${prompt}`);

const result =
  await compileExperience({
    assetId: asset.id,
    prompt,
    lens,
    movieMode: true,
    sessionId,
    operationId,
    memoryRepository,
  });

const diagnostics =
  diagnosticsOf(result.authorDiagnostics);

const lines = result.moments
  .slice()
  .sort(
    (a, b) =>
      Number(a.order ?? 0) -
      Number(b.order ?? 0),
  )
  .map(textOfMoment)
  .filter(Boolean);

console.log(
  "\n============================================================",
);
console.log(
  `USER SEES · ${clean(asset.displayName) || asset.slug}`,
);
console.log(
  `LENS · ${lens}`,
);
console.log(
  "============================================================\n",
);

if (!lines.length) {
  console.log(
    "[NO USER-VISIBLE MOMENTS]",
  );
} else {
  for (let index = 0; index < lines.length; index += 1) {
    console.log(
      `${index + 1}. ${lines[index]}`,
    );
  }
}

console.log(
  "\n============================================================",
);
console.log(
  `title=${clean(result.title)}`,
);
console.log(
  `moments=${result.momentCount}`,
);
console.log(
  `scenes=${result.cinematicScenes.length}`,
);
console.log(
  `quality=${clean(diagnostics.qualityStatus)}`,
);
console.log(
  `score=${clean(diagnostics.selectedScore)}`,
);
console.log(
  `renderable=${diagnostics.renderable === true}`,
);
console.log(
  `complete=${diagnostics.complete === true}`,
);
console.log(
  "============================================================\n",
);

await db.scanSession.delete({
  where: {
    id: sessionId,
  },
});

await db.$disconnect();

console.log(
  "PASS · visible output generated; test session cleaned up",
);
