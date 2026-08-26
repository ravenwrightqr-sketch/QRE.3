import type {
  CognitiveLens,
  WorldEvent,
  WorldModel,
} from "./worldModel.js";

export type VoiceStrategy =
  | "scene-cut"
  | "character-glance"
  | "object-confession"
  | "image-turn"
  | "quiet-reveal"
  | "comic-logic"
  | "ominous-logic"
  | "romantic-afterimage"
  | "memory-jump"
  | "consequence"
  | "counterpoint";

export type VoiceDraft = {
  text: string;
  strategy: VoiceStrategy;
  details: string[];
};

const clean = (v: string) =>
  v
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.!?]+$/, "");

const lower = (v: string) =>
  clean(v).toLowerCase();

function strongest(
  event: WorldEvent,
): string | undefined {
  return (
    event.object ||
    event.details[0] ||
    event.place ||
    event.state
  );
}

function second(
  event: WorldEvent,
  primary?: string,
): string | undefined {
  return (
    event.details.find(
      (v) =>
        lower(v) !==
        lower(primary ?? ""),
    ) ||
    event.time ||
    event.place
  );
}

function add(
  out: VoiceDraft[],
  text: string,
  strategy: VoiceStrategy,
  ...details: string[]
) {
  const value = clean(text);

  if (!value) return;

  out.push({
    text: `${value}.`,
    strategy,
    details,
  });
}

export function generateVoiceDrafts(
  world: WorldModel,
  event: WorldEvent,
  previous?: WorldEvent,
  next?: WorldEvent,
): VoiceDraft[] {
  const out: VoiceDraft[] = [];

  const raw = clean(event.raw);
  const primary = strongest(event);
  const secondary = second(event, primary);

  const subject =
    event.participants.join(" and ") ||
    event.place ||
    primary ||
    "the moment";

  const lens =
    world.lens as CognitiveLens;

  if (event.place && primary) {
    add(
      out,
      `${event.place} held the moment steady while ${primary} changed what it meant`,
      "scene-cut",
      "place-object tension",
    );
  }

  if (event.time && primary) {
    add(
      out,
      `${event.time} was only a timestamp until ${primary} gave it a reason to be remembered`,
      "memory-jump",
      "time-to-memory",
    );
  }

  if (primary) {
    add(
      out,
      `${primary} looked like a detail. Then the rest of the event made it look like a clue`,
      "quiet-reveal",
      "detail-to-clue",
    );
  }

  if (primary && secondary) {
    add(
      out,
      `${primary} was the visible detail; ${secondary} was doing the quieter work`,
      "counterpoint",
      "foreground-background",
    );
  }

  if (
    event.participants.length &&
    primary
  ) {
    add(
      out,
      `${subject} gave ${primary} a role the original moment never announced`,
      "character-glance",
      "character-object relation",
    );
  }

  if (previous && primary) {
    add(
      out,
      `After ${strongest(previous) || clean(previous.raw)}, ${primary} carried a little more consequence`,
      "consequence",
      "state-change",
    );
  }

  if (next && primary) {
    add(
      out,
      `${primary} mattered partly because the next beat had not happened yet`,
      "image-turn",
      "forward-pressure",
    );
  }

  if (lens === "comedy") {
    add(
      out,
      `${raw}. The facts had one interpretation. The situation had already chosen another`,
      "comic-logic",
      "double-interpretation",
    );

    if (primary) {
      add(
        out,
        `${primary} had somehow become the most confident detail in the story`,
        "object-confession",
        "comic-personification",
      );
    }
  }

  if (lens === "horror") {
    add(
      out,
      `${raw}. Nothing here was impossible. That was what made the combination troublesome`,
      "ominous-logic",
      "ordinary-ominous",
    );

    if (event.place) {
      add(
        out,
        `${event.place} stayed familiar while the meaning of the moment stopped feeling familiar`,
        "scene-cut",
        "familiar-place-inversion",
      );
    }
  }

  if (lens === "romance") {
    if (primary) {
      add(
        out,
        `${primary} was small enough to overlook and exact enough to become an afterimage`,
        "romantic-afterimage",
        "memory-afterimage",
      );
    }

    add(
      out,
      `${raw}. The moment did not know it was becoming a memory yet`,
      "memory-jump",
      "future-memory",
    );
  }

  if (lens === "mysterious") {
    add(
      out,
      `${raw}. Every fact could stand alone; together they leaned toward a question`,
      "quiet-reveal",
      "assembled-implication",
    );

    if (primary) {
      add(
        out,
        `${primary} was not strange by itself. It became strange in company`,
        "counterpoint",
        "relational-strangeness",
      );
    }
  }

  if (lens === "wild") {
    add(
      out,
      `${raw}. The sensible explanation remained available, but it had stopped being interesting`,
      "comic-logic",
      "escalation",
    );

    if (next) {
      add(
        out,
        `${primary || "the detail"} was merely the first sign the sequence had started negotiating with itself`,
        "consequence",
        "trajectory",
      );
    }
  }

  return out.filter(
    (draft, i, arr) =>
      i ===
      arr.findIndex(
        (other) =>
          lower(other.text) ===
          lower(draft.text),
      ),
  );
}