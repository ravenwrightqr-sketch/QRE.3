export type CreativeLensId = "neutral" | "comedy" | "spy" | "heist" | "courtroom" | "horror" | "noir" | "military" | "game" | "romance" | "absurd" | "documentary" | "royal" | "cyberpunk" | "western" | "mockumentary";

export type CreativeLens = {
  id: CreativeLensId;
  label: string;
  principle: string;
  operations: string[];
  frameTerms: string[];
};

export const CREATIVE_LENSES: readonly CreativeLens[] = [
  { id: "neutral", label: "straight contemporary", principle: "Make the approved meaning land with no overt genre costume.", operations: ["compression", "contrast", "status_shift", "implication"], frameTerms: [] },
  { id: "comedy", label: "comedy", principle: "Use dry contrast and status reversal.", operations: ["contrast", "deadpan", "status_shift", "understatement"], frameTerms: ["apparently", "somehow", "of course", "naturally"] },
  { id: "spy", label: "spy", principle: "Frame ordinary progress as controlled procedure.", operations: ["reframe", "compression", "status_shift", "understatement"], frameTerms: ["secured", "classified", "operation", "target", "mission"] },
  { id: "heist", label: "heist", principle: "Frame an established object or outcome as a clean acquisition or disappearance.", operations: ["reframe", "status_shift", "compression", "inversion"], frameTerms: ["evidence", "operation", "clean", "extracted", "acquired", "disappeared"] },
  { id: "courtroom", label: "courtroom", principle: "Frame supplied facts as case, evidence, ruling, appeal, or verdict.", operations: ["reframe", "inversion", "status_shift", "compression"], frameTerms: ["case", "evidence", "verdict", "ruling", "appeal", "reopened", "dismissed"] },
  { id: "horror", label: "horror", principle: "Create tension through implication, absence, stillness, and unresolved pressure.", operations: ["understatement", "contrast", "reframe", "compression"], frameTerms: ["quiet", "still", "finally", "waiting", "gone", "not over"] },
  { id: "noir", label: "noir", principle: "Use dry observation, consequence, deals, evidence, and understated pressure.", operations: ["understatement", "reframe", "contrast", "compression"], frameTerms: ["evidence", "case", "handled", "clean", "quiet", "trouble", "deal", "price"] },
  { id: "military", label: "military", principle: "Frame completion or failure as controlled status.", operations: ["compression", "status_shift", "reframe", "contrast"], frameTerms: ["sector", "cleared", "secure", "mission", "operation", "status", "objective", "contained"] },
  { id: "game", label: "game", principle: "Frame progress as level, acquisition, unlock, or challenge state.", operations: ["compression", "status_shift", "reframe", "deadpan"], frameTerms: ["level", "cleared", "acquired", "unlocked", "checkpoint", "score", "next round"] },
  { id: "romance", label: "romance", principle: "Frame change as chemistry, timing, tension, or temporary truce without inventing a relationship.", operations: ["contrast", "implication", "status_shift", "understatement"], frameTerms: ["chemistry", "timing", "spark", "truce", "almost", "again", "peace"] },
  { id: "absurd", label: "absurd", principle: "Use deadpan logic and disproportionate framing while preserving the literal world.", operations: ["inversion", "deadpan", "status_shift", "compression"], frameTerms: ["negotiations", "officially", "somehow", "apparently", "incident", "proceedings", "protocol"] },
  { id: "documentary", label: "documentary", principle: "Treat a small supplied change as observed significance.", operations: ["understatement", "compression", "status_shift", "reframe"], frameTerms: ["the pattern", "the result", "the change", "the record", "the outcome", "officially", "by then"] },
  { id: "royal", label: "royal", principle: "Turn status, objects, and outcomes into ceremonial framing.", operations: ["status_shift", "reframe", "compression", "ceremony"], frameTerms: ["kingdom", "changed hands", "restored", "decree", "royal", "declared", "crown"] },
  { id: "cyberpunk", label: "cyberpunk", principle: "Render state changes as terse system status or protocol framing.", operations: ["compression", "status_shift", "reframe", "deadpan"], frameTerms: ["system status", "clean", "protocol", "access", "signal", "online", "offline", "override"] },
  { id: "western", label: "western", principle: "Give outcomes a sparse showdown or frontier-like frame.", operations: ["understatement", "contrast", "status_shift", "compression"], frameTerms: ["dust", "met its match", "settled", "stand-off", "deal", "quiet", "the day"] },
  { id: "mockumentary", label: "mockumentary", principle: "Treat ordinary events with dry official seriousness.", operations: ["deadpan", "understatement", "status_shift", "compression"], frameTerms: ["officially", "the incident", "the record", "the operation", "the situation", "by then"] },
];

const norm = (value: string): string => value.toLowerCase().trim();
export function getCreativeLens(id?: string): CreativeLens {
  return CREATIVE_LENSES.find((lens) => lens.id === norm(id ?? "")) ?? CREATIVE_LENSES[0]!;
}

export function rankCreativeLenses(facts: string[], ending: string, preferred?: string): CreativeLens[] {
  if (preferred) return [getCreativeLens(preferred)];
  const text = norm([...facts, ending].join(" "));
  const buckets: Record<string, string[]> = {
    housekeeping: ["spy", "heist", "horror", "game", "noir", "mockumentary"],
    legal: ["courtroom", "spy", "noir", "heist", "mockumentary"],
    food: ["comedy", "game", "absurd", "documentary", "noir"],
    wedding: ["romance", "comedy", "documentary", "absurd", "royal"],
    property: ["courtroom", "heist", "noir", "royal", "documentary"],
  };
  let bonus: string[] = [];
  if (/(mess|clean|tidy|towel|bathroom|housekeeping|cleaned)/i.test(text)) bonus = buckets.housekeeping!;
  else if (/(contract|clause|agreement|fine print|legal|redline|approved)/i.test(text)) bonus = buckets.legal!;
  else if (/(dinner|restaurant|dessert|kitchen|order)/i.test(text)) bonus = buckets.food!;
  else if (/(wedding|reception|speeches|dance|couple|night)/i.test(text)) bonus = buckets.wedding!;
  else if (/(offer|buyer|house|showing|listed|sale)/i.test(text)) bonus = buckets.property!;
  const ordered = [ ...bonus, "neutral", ...CREATIVE_LENSES.map((lens) => lens.id) ];
  return [...new Set(ordered)].slice(0, 3).map(getCreativeLens);
}
