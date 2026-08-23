import type { RequestHandler } from "express";

const INTERNAL_LABEL = /\b(?:INTENT|DOMAIN|SUBJECT|TYPE|GOAL|OUTPUT|TONE|CURRENT FACTS|KNOWN ASSET FACTS|REAL FACTS|FIELDS|AUTHORING|COGNITIVE|LEARNING SIGNALS|PROVENANCE|DIAGNOSTICS)\s*:/i;
const INTERNAL_META = /\b(?:second meaning|gave the moment its shape|made the larger moment stay|landed differently|reads like setup|next beat was|this was the hinge|background detail|the audience|the viewer|the strategy|the beat|according to qre|the transformation|the symbol|the tension|the contrast|the premise|the operation|the lens|the trajectory|the movie)\b/i;

function cleanText(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function isRenderableText(value: unknown): boolean {
  const text = cleanText(value);
  if (!text) return false;
  if (text.length > 800) return false;
  if (text.includes("|") && (text.match(/\|/g)?.length ?? 0) >= 2) return false;
  if (text.includes("{") || text.includes("}")) return false;
  if (INTERNAL_LABEL.test(text) || INTERNAL_META.test(text)) return false;
  return true;
}

function presentMoment(moment: any, index: number): any | null {
  const text = cleanText(moment?.text ?? moment?.description ?? moment?.title ?? "");
  const media = Array.isArray(moment?.media) ? moment.media : undefined;
  if (!isRenderableText(text) && !(media?.length)) return null;

  const presented: Record<string, unknown> = {
    type: moment?.type,
    component: moment?.component,
    order: index,
    editable: Boolean(moment?.editable),
    text: isRenderableText(text) ? text : "",
  };

  if (typeof moment?.label === "string" && isRenderableText(moment.label)) presented.label = moment.label;
  if (typeof moment?.url === "string" && moment.url.trim()) presented.url = moment.url;
  if (moment?.location && typeof moment.location === "object") presented.location = moment.location;
  if (media?.length) presented.media = media;

  return presented;
}

function presentScene(scene: any, index: number): any | null {
  const moment = presentMoment(scene?.moment, index);
  if (!moment) return null;

  return {
    id: cleanText(scene?.id) || `scene-${index + 1}`,
    type: scene?.type,
    duration: Number(scene?.duration ?? 1400),
    order: index,
    transition: scene?.transition ?? (index === 0 ? "none" : "fade"),
    visual: scene?.visual ?? { theme: "cinematic", animation: "parallax" },
    preload: Boolean(scene?.preload),
    moment,
  };
}

export function presentExperienceForClient(experience: any): any {
  const rawScenes = Array.isArray(experience?.cinematicScenes) ? experience.cinematicScenes : [];
  const rawMoments = Array.isArray(experience?.moments) ? experience.moments : [];

  const cinematicScenes = rawScenes
    .map((scene: any, index: number) => presentScene(scene, index))
    .filter(Boolean);

  const moments = rawMoments
    .map((moment: any, index: number) => presentMoment(moment, index))
    .filter(Boolean);

  return {
    sessionId: cleanText(experience?.sessionId) || undefined,
    access: experience?.access,
    preview: Boolean(experience?.preview),
    title: isRenderableText(experience?.title) ? cleanText(experience.title) : "Living Experience",
    moments,
    cinematicScenes,
    asset: experience?.asset
      ? {
          id: experience.asset.id,
          slug: experience.asset.slug,
          title: experience.asset.title,
          category: experience.asset.category,
        }
      : undefined,
  };
}

export const presentationBoundary: RequestHandler = (_req, res, next) => {
  const json = res.json.bind(res);
  res.json = ((body: any) => {
    if (body && typeof body === "object" && body.experience && typeof body.experience === "object") {
      return json({ ...body, experience: presentExperienceForClient(body.experience) });
    }
    return json(body);
  }) as typeof res.json;

  next();
};
