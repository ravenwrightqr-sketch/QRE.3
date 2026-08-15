export type CreativeStrategy = {
  name: string;
  when: string;
  engine: string;
  moves: string[];
  avoid: string[];
};

export const CREATIVE_STRATEGIES: CreativeStrategy[] = [
  {
    name: "character_status",
    when: "A living subject has a strong preference, fear, habit, attitude, or contradiction.",
    engine: "Treat the subject's personality as the hidden drama.",
    moves: ["establish attitude", "introduce friction", "give the subject leverage", "reverse status", "pay off personality"],
    avoid: ["generic sweetness", "literal attribute-to-action", "invented biographical events"],
  },
  {
    name: "recurring_client_chapter",
    when: "A service business creates another experience for a known client.",
    engine: "Permanent identity + visit history + today's difference = a new chapter.",
    moves: ["recall one known trait", "spot what changed", "turn the change into a scene", "callback selectively", "end on a new beat"],
    avoid: ["re-asking identity", "repeating the previous visit", "generic service praise"],
  },
  {
    name: "ordinary_to_important",
    when: "An ordinary object, place, service, or routine needs meaning.",
    engine: "Find the hidden reason the ordinary thing matters.",
    moves: ["show ordinary state", "zoom into one detail", "connect it to a person/place/history", "reframe", "leave an after-image"],
    avoid: ["luxury filler", "importance without evidence", "ad copy"],
  },
  {
    name: "artifact_portal",
    when: "A physical object should feel like a doorway into a digital world.",
    engine: "Object → signal → curiosity → discovery → world.",
    moves: ["surface detail", "tiny anomaly", "touch/scan implication", "meaning reveal", "portal payoff"],
    avoid: ["claims about physical mechanics unless supplied", "generic QR marketing language"],
  },
  {
    name: "high_value_provenance",
    when: "A house, yacht, car, watch, artwork, heirloom, or other valuable object has history or ownership.",
    engine: "Value comes from provenance, use, people, place, craft, and meaning—not price alone.",
    moves: ["physical signature", "history trace", "human connection", "place or use", "earned significance"],
    avoid: ["luxury clichés", "price-as-personality", "invented ownership history"],
  },
  {
    name: "vintage_vs_new",
    when: "The subject is old, restored, inherited, brand-new, or contrasted across time.",
    engine: "Use time as the dramatic contrast.",
    moves: ["before/after", "wear or freshness", "what stayed", "what changed", "future implication"],
    avoid: ["fake provenance", "specific repairs not supplied", "nostalgia clichés"],
  },
  {
    name: "night_affordance",
    when: "A grounded event occurs at night.",
    engine: "Exploit what night makes available without contradicting the actual time.",
    moves: ["moonlight", "reflected light", "lights in distance", "quieter atmosphere", "intimacy or tension"],
    avoid: ["sunrise", "sunset", "daylight unless supplied"],
  },
  {
    name: "quiet_battle",
    when: "A prompt describes competing control, resistance, territory, or a struggle beneath an ordinary task.",
    engine: "Make the hidden opponent legible and escalate the power shift.",
    moves: ["arrival", "first resistance", "territory shift", "escalation", "surrender/payoff"],
    avoid: ["explaining the joke", "inventing unrelated obstacles"],
  },
  {
    name: "calm_reality_break",
    when: "A horror sequence calls for escalating impossible events while people remain strangely normal.",
    engine: "Human normality stays calm while reality loses its rules.",
    moves: ["ordinary conversation", "small violation", "casual continuation", "bigger violation", "impossible pattern", "realization"],
    avoid: ["generic ghost-first openings", "monster clichés", "random escalation without a repeating motif"],
  },
  {
    name: "stop_scroll",
    when: "A sparse social/creator prompt asks for attention without giving biography.",
    engine: "Pattern break → curiosity gap → escalation → reveal → payoff.",
    moves: ["unexpected first image", "question", "contradiction", "tight escalation", "payoff"],
    avoid: ["random city scenes", "crowd gasps", "generic influencer success arcs"],
  },
  {
    name: "artist_threshold",
    when: "A sparse artist prompt asks viewers to enter the artist's world.",
    engine: "Move from seeing the work to understanding its signature point of view.",
    moves: ["material detail", "visual rule", "unexpected pattern", "signature reveal", "after-image"],
    avoid: ["generic gallery doors", "hidden magical worlds by default", "fake exhibition details"],
  },
  {
    name: "relationship_texture",
    when: "A person, relationship, or family memory needs emotional specificity.",
    engine: "Meaning lives in small repeated details, contradictions, rituals, and shared references.",
    moves: ["shared detail", "habit", "contrast", "callback", "meaning shift"],
    avoid: ["generic soulmate language", "invented history", "biography summary"],
  },
];

export function strategyContext(names?: string[]): string[] {
  const selected = names?.length
    ? CREATIVE_STRATEGIES.filter((strategy) => names.includes(strategy.name))
    : CREATIVE_STRATEGIES;

  return selected.map((strategy) =>
    `${strategy.name}: ENGINE=${strategy.engine} MOVES=${strategy.moves.join(" → ")} AVOID=${strategy.avoid.join(" | ")}`,
  );
}
