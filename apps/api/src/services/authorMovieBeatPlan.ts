import type { CognitiveAuthorMedia, MovieBeatPlan, MovieBeatPlanBeat } from "@qre/contracts";

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();

function mediaText(media: CognitiveAuthorMedia): string {
  return clean([
    media.title,
    media.caption,
    typeof media.metadata?.description === "string" ? media.metadata.description : "",
    typeof media.metadata?.stage === "string" ? media.metadata.stage : "",
    typeof media.metadata?.role === "string" ? media.metadata.role : "",
  ].join(" "));
}

function stageOf(media: CognitiveAuthorMedia): "before" | "after" | "moment" | "unknown" {
  const value = mediaText(media).toLowerCase();
  if (/\bbefore\b|start|arrival|initial/.test(value)) return "before";
  if (/\bafter\b|finished|final|departure|complete/.test(value)) return "after";
  if (/\bduring\b|moment|incident|action/.test(value)) return "moment";
  return "unknown";
}

function observedAt(media: CognitiveAuthorMedia): number {
  const value = media.observedAt ?? (typeof media.metadata?.observedAt === "string" ? media.metadata.observedAt : undefined);
  if (!value) return Number.MAX_SAFE_INTEGER;
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : Number.MAX_SAFE_INTEGER;
}

function mediaScore(media: CognitiveAuthorMedia, index: number): number {
  const value = mediaText(media).toLowerCase();
  let score = 0.25;
  if (media.role === "photo_beat" || media.role === "evidence") score += 0.3;
  if (stageOf(media) !== "unknown") score += 0.2;
  if (media.observedAt || media.metadata?.observedAt) score += 0.15;
  if (/after|final|complete/.test(value)) score += 0.05;
  score += Math.max(0, 0.05 - index * 0.002);
  return score;
}

function uniqueMedia(media: CognitiveAuthorMedia[]): CognitiveAuthorMedia[] {
  const seen = new Set<string>();
  return media.filter((item) => {
    const key = item.id || item.url;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function selectPhotos(media: CognitiveAuthorMedia[], limit: number): CognitiveAuthorMedia[] {
  if (!media.length || limit <= 0) return [];
  const ordered = [...uniqueMedia(media)].sort((a, b) => {
    const timeDelta = observedAt(a) - observedAt(b);
    if (timeDelta !== 0) return timeDelta;
    return mediaScore(b, 0) - mediaScore(a, 0);
  });

  const before = ordered.filter((item) => stageOf(item) === "before").slice(0, 1);
  const after = ordered.filter((item) => stageOf(item) === "after").slice(-2);
  const moments = ordered.filter((item) => stageOf(item) === "moment").slice(0, 2);
  const fallback = [...ordered].sort((a, b) => mediaScore(b, 0) - mediaScore(a, 0));

  return uniqueMedia([...before, ...moments, ...after, ...fallback]).slice(0, limit);
}

export function buildMovieBeatPlan(input: {
  textBeats: Array<{ id: string; text: string; sourceIds?: string[]; attentionRole?: string; durationHintMs?: number }>;
  media?: CognitiveAuthorMedia[];
  textBeatTarget?: number;
  mode?: "auto" | "manual";
  cta?: { text: string; sourceIds?: string[] };
}): MovieBeatPlan {
  const mode = input.mode ?? "auto";
  const textTarget = Math.max(1, Math.min(8, input.textBeatTarget ?? 5));
  const text = input.textBeats.slice(0, textTarget);
  const media = input.media ?? [];
  const selectedPhotos = selectPhotos(media, Math.min(5, Math.max(0, text.length)));

  const beats: MovieBeatPlanBeat[] = [];
  let order = 1;
  let photoIndex = 0;

  for (const beat of text) {
    beats.push({
      id: beat.id,
      order: order++,
      kind: "text",
      text: beat.text,
      sourceIds: beat.sourceIds ?? [],
      reason: "selected cinematic text beat",
      durationHintMs: beat.durationHintMs ?? 1400,
      attentionRole: beat.attentionRole,
      silent: false,
    });

    const photo = selectedPhotos[photoIndex++];
    if (photo) {
      const stage = stageOf(photo);
      beats.push({
        id: `movie-photo-${photo.id}`,
        order: order++,
        kind: "photo",
        media: photo,
        sourceIds: [photo.id],
        reason: stage === "before" ? "before evidence" : stage === "after" ? "after evidence" : "supporting visual evidence",
        durationHintMs: 1700,
        attentionRole: "photo",
        silent: true,
      });
    }
  }

  if (input.cta?.text) {
    beats.push({
      id: "movie-cta",
      order: order++,
      kind: "cta",
      text: input.cta.text,
      sourceIds: input.cta.sourceIds ?? [],
      reason: "explicit post-experience call to action",
      durationHintMs: 1400,
      attentionRole: "cta",
      silent: false,
    });
  }

  return {
    mode,
    textBeatTarget: textTarget,
    beats,
    selectedMediaIds: selectedPhotos.map((item) => item.id),
    organizationReasons: [
      "text remains the default attention unit",
      "photos are inserted as silent visual evidence",
      "chronology is preferred when observed timestamps exist",
      "before/after evidence is promoted when explicitly indicated",
      mode === "manual" ? "dashboard/manual ordering is authoritative" : "cognition owns default organization",
    ],
    manualOverride: mode === "manual",
    estimatedDurationMs: beats.reduce((sum, beat) => sum + (beat.durationHintMs ?? 1200), 0),
  };
}
