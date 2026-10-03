import type { AuthorScene, ExperiencePlayout } from "@qre/contracts";

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

export function composeExperiencePlayout(
  scenes: readonly PlayoutSourceScene[],
): ExperiencePlayout {
  return {
    items: scenes.flatMap((scene, index) => {
      if (!isRenderableText(scene.text)) return [];
      if (!scene.sourceEventIds.length) {
        throw new Error(`Renderable Author scene ${index} is missing sourceEventIds`);
      }

      return splitAuthorSceneTextForPlayout(scene.text).map((text, revealIndex) => ({
          kind: "TEXT" as const,
          text,
          sourceSceneIndex: index,
          revealIndex,
          sourceEventIds: [...scene.sourceEventIds],
        }));
    }),
  };
}
