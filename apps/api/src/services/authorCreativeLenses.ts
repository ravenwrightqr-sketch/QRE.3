export type CreativeLensId =
  | "neutral"
  | "comedy"
  | "spy"
  | "heist"
  | "courtroom"
  | "horror"
  | "noir"
  | "military"
  | "game"
  | "romance"
  | "absurd"
  | "documentary"
  | "royal"
  | "cyberpunk"
  | "western"
  | "mockumentary";

export type CreativeLens = {
  id: CreativeLensId;
  label: string;
  principle: string;
  operations: string[];
  frameTerms: string[];
  forbiddenWorld: string[];
};

export const CREATIVE_LENSES: readonly CreativeLens[] = [
  {
    id: "neutral",
    label: "straight contemporary",
    principle: "Make the supplied meaning land with no overt genre costume.",
    operations: ["compression", "contrast", "status_shift", "implication"],
    frameTerms: [],
    forbiddenWorld: [],
  },
  {
    id: "comedy",
    label: "comedy",
    principle: "Treat the established reality as the setup for a clean comic turn without adding a new event.",
    operations: ["contrast", "deadpan", "status_shift", "understatement"],
    frameTerms: ["apparently", "somehow", "of course", "well", "naturally"],
    forbiddenWorld: ["audience", "comedian", "joke", "stage"],
  },
  {
    id: "spy",
    label: "spy",
    principle: "Render ordinary progress as covert procedure or controlled operation.",
    operations: ["reframe", "compression", "status_shift", "understatement"],
    frameTerms: ["secured", "classified", "operation", "target", "breach", "mission", "perimeter", "surveillance"],
    forbiddenWorld: ["handler", "agent", "gun", "camera", "weapon", "hotel room"],
  },
  {
    id: "heist",
    label: "heist",
    principle: "Render an established object, change, or resolution as a clean operation, acquisition, or disappearance.",
    operations: ["reframe", "status_shift", "compression", "inversion"],
    frameTerms: ["evidence", "operation", "clean", "extracted", "acquired", "disappeared", "target", "secured"],
    forbiddenWorld: ["crew", "guard", "vault", "alarm", "camera", "gun"],
  },
  {
    id: "courtroom",
    label: "courtroom",
    principle: "Turn supplied facts into a case, ruling, evidence, appeal, or verdict as metaphorical framing.",
    operations: ["reframe", "inversion", "status_shift", "compression"],
    frameTerms: ["case", "evidence", "verdict", "ruling", "appeal", "reopened", "dismissed", "sustained", "overruled"],
    forbiddenWorld: ["judge", "jury", "lawyer", "courtroom", "witness", "bailiff"],
  },
  {
    id: "horror",
    label: "horror",
    principle: "Turn resolution or absence into tension through implication and threat without inventing a supernatural event.",
    operations: ["understatement", "contrast", "reframe", "compression"],
    frameTerms: ["quiet", "still", "finally", "waiting", "gone", "not over", "too quiet"],
    forbiddenWorld: ["ghost", "monster", "demon", "blood", "corpse", "haunted"],
  },
  {
    id: "noir",
    label: "noir",
    principle: "Give the supplied meaning a dry, observational, consequence-first frame.",
    operations: ["understatement", "reframe", "contrast", "compression"],
    frameTerms: ["evidence", "case", "handled", "clean", "quiet", "trouble", "deal", "price"],
    forbiddenWorld: ["detective", "gun", "smoke", "bar", "informant", "alley"],
  },
  {
    id: "military",
    label: "military",
    principle: "Render completion, failure, or status change as a controlled operation or sector update.",
    operations: ["compression", "status_shift", "reframe", "contrast"],
    frameTerms: ["sector", "cleared", "secure", "mission", "operation", "status", "objective", "contained"],
    forbiddenWorld: ["soldier", "general", "weapon", "troop", "battlefield", "commander"],
  },
  {
    id: "game",
    label: "game",
    principle: "Render the sequence as level progression, acquisition, unlock, or challenge state.",
    operations: ["compression", "status_shift", "reframe", "deadpan"],
    frameTerms: ["level", "cleared", "acquired", "unlocked", "boss fight", "checkpoint", "score", "next round"],
    forbiddenWorld: ["player", "console", "controller", "server", "arcade"],
  },
  {
    id: "romance",
    label: "romance",
    principle: "Render a change or contradiction as chemistry, timing, tension, or a temporary truce without inventing a relationship.",
    operations: ["contrast", "implication", "status_shift", "understatement"],
    frameTerms: ["chemistry", "timing", "spark", "truce", "almost", "again", "peace", "changed the mood"],
    forbiddenWorld: ["date", "kiss", "lover", "boyfriend", "girlfriend", "proposal"],
  },
  {
    id: "absurd",
    label: "absurd",
    principle: "Use deadpan logic and disproportionate framing while preserving the literal world underneath it.",
    operations: ["inversion", "deadpan", "status_shift", "compression"],
    frameTerms: ["negotiations", "officially", "somehow", "apparently", "incident", "proceedings", "protocol"],
    forbiddenWorld: ["aliens", "time machine", "spaceship", "unicorn", "portal"],
  },
  {
    id: "documentary",
    label: "documentary",
    principle: "Treat a small supplied change as if it carries observed significance without inventing a narrator or new evidence.",
    operations: ["understatement", "compression", "status_shift", "reframe"],
    frameTerms: ["the pattern", "the result", "the change", "the record", "the outcome", "officially", "by then"],
    forbiddenWorld: ["narrator", "camera", "interview", "footage", "expert", "researcher"],
  },
  {
    id: "royal",
    label: "royal",
    principle: "Turn status, objects, and outcomes into ceremonial or dynastic framing without inventing a court.",
    operations: ["status_shift", "reframe", "compression", "ceremony"],
    frameTerms: ["kingdom", "changed hands", "restored", "decree", "royal", "throne", "declared", "crown"],
    forbiddenWorld: ["king", "queen", "prince", "princess", "castle", "guard"],
  },
  {
    id: "cyberpunk",
    label: "cyberpunk",
    principle: "Render state changes as terse system status, protocol, or network-like framing without inventing hardware.",
    operations: ["compression", "status_shift", "reframe", "deadpan"],
    frameTerms: ["system status", "clean", "protocol", "access", "signal", "online", "offline", "override"],
    forbiddenWorld: ["hacker", "server", "implant", "drone", "neon", "terminal"],
  },
  {
    id: "western",
    label: "western",
    principle: "Give the outcome a sparse showdown or frontier-like frame without inventing weapons or riders.",
    operations: ["understatement", "contrast", "status_shift", "compression"],
    frameTerms: ["dust", "met its match", "settled", "stand-off", "deal", "quiet", "the day"],
    forbiddenWorld: ["cowboy", "horse", "gun", "saloon", "sheriff", "outlaw"],
  },
  {
    id: "mockumentary",
    label: "mockumentary",
    principle: "Treat the supplied ordinary event with dry official seriousness without inventing production apparatus.",
    operations: ["deadpan", "understatement", "status_shift", "compression"],
    frameTerms: ["officially", "the incident", "the record", "the operation", "the situation", "by then"],
    forbiddenWorld: ["camera", "crew", "interview", "narrator", "documentary"],
  },
];

const normalize = (value: string): string => value.toLowerCase().trim();

export function getCreativeLens(id?: string): CreativeLens {
  const normalized = normalize(id ?? "");
  return CREATIVE_LENSES.find((lens) => lens.id === normalized) ?? CREATIVE_LENSES[0]!;
}

export function rankCreativeLenses(facts: string[], ending: string, preferred?: string): CreativeLens[] {
  if (preferred) return [getCreativeLens(preferred)];

  const text = normalize([...facts, ending].join(" "));
  const scored = CREATIVE_LENSES.map((lens, index) => {
    let score = lens.id === "neutral" ? 0.1 : 0;
    for (const term of lens.frameTerms) if (text.includes(normalize(term))) score += 1.5;
    if (/(mess|clean|tidy|towel|bathroom|housekeeping|cleaned)/i.test(text)) {
      if (["spy", "heist", "horror", "game", "noir", "mockumentary"].includes(lens.id)) score += 1.1;
    }
    if (/(contract|clause|agreement|fine print|legal|redline|approved)/i.test(text)) {
      if (["courtroom", "spy", "noir", "heist", "mockumentary"].includes(lens.id)) score += 1.1;
    }
    if (/(dinner|restaurant|dessert|kitchen|order)/i.test(text)) {
      if (["comedy", "game", "absurd", "documentary", "noir"].includes(lens.id)) score += 1.0;
    }
    if (/(wedding|reception|speeches|dance|couple|night)/i.test(text)) {
      if (["romance", "comedy", "documentary", "absurd", "royal"].includes(lens.id)) score += 1.0;
    }
    if (/(offer|buyer|house|showing|listed|sale)/i.test(text)) {
      if (["courtroom", "heist", "noir", "royal", "documentary"].includes(lens.id)) score += 0.9;
    }
    return { lens, score, index };
  });

  scored.sort((a, b) => b.score - a.score || a.index - b.index);
  return scored.slice(0, 3).map((entry) => entry.lens);
}
