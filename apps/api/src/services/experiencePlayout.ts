import type {
  AuthorScene,
  ExperiencePlayout,
  MediaAsset,
  PlayoutImageItem,
  PlayoutTextItem,
  PlayoutVideoItem,
} from "@qre/contracts";
export type PlayoutSourceScene = AuthorScene & {
  sourceEventIds: readonly string[];
};

function isRenderableText(text: string): boolean {
  return text.trim().length > 0;
}

const NON_SPLITTING_ABBREVIATIONS = new Set([
  "mr",
  "mrs",
  "ms",
  "dr",
  "prof",
  "sr",
  "jr",
  "st",
  "vs",
  "etc",
  "e.g",
  "i.e",
  "a.m",
  "p.m",
]);

function previousToken(text: string, periodIndex: number): string {
  let start = periodIndex - 1;
  while (start >= 0 && /[A-Za-z.]/.test(text[start] ?? "")) {
    start -= 1;
  }
  return text.slice(start + 1, periodIndex).toLowerCase();
}

function isNonSplittingPeriod(text: string, index: number): boolean {
  const before = text[index - 1] ?? "";
  const after = text[index + 1] ?? "";
  if (before === "." || after === ".") return true;
  if (/\d/.test(before) && /\d/.test(after)) return true;

  const token = previousToken(text, index);
  if (token === "a.m" || token === "p.m") {
    const next = text.slice(index + 1).match(/\S/)?.[0] ?? "";
    return !/^[A-Z]/.test(next);
  }
  if (NON_SPLITTING_ABBREVIATIONS.has(token)) return true;
  if (/^[a-z]$/i.test(token)) return true;

  return false;
}

function wordCount(text: string): number {
  return text.match(/[A-Za-z0-9]+(?:['-][A-Za-z0-9]+)*/g)?.length ?? 0;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

export function deriveTextRevealDurationMs(text: string): number {
  const measured = text.trim();
  const words = wordCount(measured);
  const ellipsisPause = /(?:\.{3}|�)(?:["')\]])?$/.test(measured) ? 240 : 0;
  const questionOrExclamationPause =
    ellipsisPause === 0 && /[?!](?:["')\]])?$/.test(measured) ? 180 : 0;
  const colonOrSemicolonPause = /[:;]/.test(measured) ? 120 : 0;

  return clamp(
    800 + words * 190 + ellipsisPause + questionOrExclamationPause + colonOrSemicolonPause,
    1100,
    4200,
  );
}

function nextBoundaryEnd(text: string, punctuationIndex: number): number {
  let end = punctuationIndex + 1;
  while (/["')\]]/.test(text[end] ?? "")) {
    end += 1;
  }
  while (/\s/.test(text[end] ?? "")) {
    end += 1;
  }
  return end;
}

export function splitAuthorSceneTextForPlayout(text: string): string[] {
  if (!isRenderableText(text)) return [];

  const reveals: string[] = [];
  let start = 0;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (char === "\n") {
      let end = index + 1;
      while (/\s/.test(text[end] ?? "")) {
        end += 1;
      }
      reveals.push(text.slice(start, end));
      start = end;
      index = end - 1;
      continue;
    }

    if (char !== "." && char !== "?" && char !== "!") {
      continue;
    }

    if (char === "." && isNonSplittingPeriod(text, index)) {
      continue;
    }

    const end = nextBoundaryEnd(text, index);
    if (end >= text.length) continue;

    const reveal = text.slice(start, end);
    if (wordCount(reveal) <= 1) continue;

    reveals.push(reveal);
    start = end;
    index = end - 1;
  }

  if (start < text.length) {
    reveals.push(text.slice(start));
  }

  return reveals;
}

export function reconstructPlayoutSceneText(reveals: readonly string[]): string {
  return reveals.join("");
}

export function mediaSourceEventIds(media: MediaAsset): string[] {
  const sourceEventIds = media.metadata?.sourceEventIds;

  if (!Array.isArray(sourceEventIds)) {
    return [];
  }

  return sourceEventIds.filter(
    (value): value is string =>
      typeof value === "string" && value.trim().length > 0,
  );
}

function composeTextItems(
  scenes: readonly PlayoutSourceScene[],
): PlayoutTextItem[] {
  return scenes.flatMap((scene, index) => {
    if (!isRenderableText(scene.text)) return [];

    if (!scene.sourceEventIds.length) {
      throw new Error(`Renderable Author scene ${index} is missing sourceEventIds`);
    }

    return splitAuthorSceneTextForPlayout(scene.text).map(
      (text, revealIndex): PlayoutTextItem => ({
        kind: "TEXT",
        text,
        sourceSceneIndex: index,
        revealIndex,
        sourceEventIds: [...scene.sourceEventIds],
        durationMs: deriveTextRevealDurationMs(text),
      }),
    );
  });
}

function composeImageItems(
  media: readonly MediaAsset[],
): PlayoutImageItem[] {
  return media
    .filter((asset) => asset.type === "image")
    .map(
      (asset): PlayoutImageItem => ({
        kind: "IMAGE",
        mediaId: asset.id,
        url: asset.url,
        sourceEventIds: mediaSourceEventIds(asset),
      }),
    );
}
function composeVideoItems(
  media: readonly MediaAsset[],
): PlayoutVideoItem[] {
  return media
    .filter((asset) => asset.type === "video")
    .map(
      (asset): PlayoutVideoItem => ({
        kind: "VIDEO",
        mediaId: asset.id,
        url: asset.url,
        sourceEventIds: mediaSourceEventIds(asset),
      }),
    );
}
export function composeExperiencePlayout(
  scenes: readonly PlayoutSourceScene[],
  media: readonly MediaAsset[] = [],
): ExperiencePlayout {
  return {
    items: [
      ...composeTextItems(scenes),
      ...composeImageItems(media),
      ...composeVideoItems(media),
    ],
  };
}
