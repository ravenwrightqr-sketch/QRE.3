import type { AuthorScene, ExperiencePlayout } from "@qre/contracts";

export type PlayoutSourceScene = AuthorScene & {
  sourceEventIds: readonly string[];
};

function isRenderableText(text: string): boolean {
  return text.trim().length > 0;
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

      return [
        {
          kind: "TEXT" as const,
          text: scene.text,
          sourceSceneIndex: index,
          sourceEventIds: [...scene.sourceEventIds],
        },
      ];
    }),
  };
}
