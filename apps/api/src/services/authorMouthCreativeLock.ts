/**
 * QRE MOUTH CREATIVE LOCK
 *
 * A Creative Lock is a framing universe for language realization.
 *
 * It NEVER grants permission to invent reality.
 * It NEVER changes the approved Meaning Spine.
 * It NEVER changes the endpoint.
 *
 * It only tells the Mouth which family of expressive moves to explore
 * when converting approved meaning into viewer-facing language.
 */

export type MouthCreativeLockName =
  | "organic"
  | "spy"
  | "heist"
  | "courtroom"
  | "rom-com"
  | "horror"
  | "game"
  | "noir"
  | "royal"
  | "mockumentary"
  | "absurd"
  | "military"
  | "western"
  | "cyberpunk";

export type MouthCreativeLock = {
  name: MouthCreativeLockName;
  purpose: string;
  preferredMoves: readonly string[];
  forbiddenLiteralizations: readonly string[];
};

const LOCKS: Record<
  MouthCreativeLockName,
  MouthCreativeLock
> = {
  organic: {
    name: "organic",
    purpose:
      "Find the sharpest natural reading already hidden in the evidence.",
    preferredMoves: [
      "implication",
      "understatement",
      "recontextualization",
      "compression",
      "callback",
    ],
    forbiddenLiteralizations: [
      "new genre props",
      "new characters",
      "new settings",
      "new actions",
    ],
  },

  spy: {
    name: "spy",
    purpose:
      "Frame supplied details as covert operations, intelligence, negotiation, clearance, or classified stakes.",
    preferredMoves: [
      "classified framing",
      "negotiation language",
      "mission language",
      "status reversal",
      "deadpan implication",
    ],
    forbiddenLiteralizations: [
      "guns",
      "surveillance equipment",
      "handlers",
      "agents",
      "new missions",
      "new locations",
    ],
  },

  heist: {
    name: "heist",
    purpose:
      "Frame supplied details as a coordinated score, acquisition, escape, or suspiciously successful operation.",
    preferredMoves: [
      "score language",
      "evidence framing",
      "acquisition framing",
      "misdirection",
      "status reversal",
    ],
    forbiddenLiteralizations: [
      "vaults",
      "alarms",
      "crew members",
      "weapons",
      "getaway vehicles",
      "new theft events",
    ],
  },

  courtroom: {
    name: "courtroom",
    purpose:
      "Frame relationships as evidence, rulings, negotiations, verdicts, or cases already contained in the facts.",
    preferredMoves: [
      "evidence framing",
      "verdict language",
      "cross-examination tone",
      "negotiation",
      "deadpan judgment",
    ],
    forbiddenLiteralizations: [
      "judges",
      "lawyers",
      "courtrooms",
      "new testimony",
      "new legal events",
    ],
  },

  "rom-com": {
    name: "rom-com",
    purpose:
      "Frame supplied details through chemistry, tension, affectionate contradiction, timing, or romantic implication.",
    preferredMoves: [
      "chemistry",
      "affectionate understatement",
      "status play",
      "callback",
      "timing",
    ],
    forbiddenLiteralizations: [
      "new romance events",
      "dates",
      "kisses",
      "new partners",
      "new dialogue",
    ],
  },

  horror: {
    name: "horror",
    purpose:
      "Make ordinary supplied reality feel ominous through restraint, recurrence, wrongness, or delayed implication.",
    preferredMoves: [
      "ominous implication",
      "understatement",
      "recurrence",
      "recontextualization",
      "quiet escalation",
    ],
    forbiddenLiteralizations: [
      "ghosts",
      "monsters",
      "blood",
      "new deaths",
      "new sounds",
      "new supernatural events",
    ],
  },

  game: {
    name: "game",
    purpose:
      "Frame supplied progress, reversals, and wins as levels, status changes, objectives, or boss-like moments.",
    preferredMoves: [
      "level framing",
      "status framing",
      "objective language",
      "boss framing",
      "achievement compression",
    ],
    forbiddenLiteralizations: [
      "health bars",
      "weapons",
      "new game objects",
      "new opponents",
      "new actions",
    ],
  },

  noir: {
    name: "noir",
    purpose:
      "Frame supplied facts with dry suspicion, consequence, restraint, and memorable understatement.",
    preferredMoves: [
      "deadpan narration",
      "implication",
      "consequence",
      "status reversal",
      "understatement",
    ],
    forbiddenLiteralizations: [
      "detectives",
      "crime scenes",
      "guns",
      "rain",
      "new crimes",
    ],
  },

  royal: {
    name: "royal",
    purpose:
      "Frame supplied behavior and objects as matters of rank, ceremony, territory, approval, or succession.",
    preferredMoves: [
      "ceremonial framing",
      "status language",
      "approval framing",
      "territorial implication",
      "understatement",
    ],
    forbiddenLiteralizations: [
      "crowns",
      "castles",
      "courts",
      "new titles",
      "new ceremonies",
    ],
  },

  mockumentary: {
    name: "mockumentary",
    purpose:
      "Frame supplied reality with dry observational humor and documentary-like understatement without inventing a crew or interview.",
    preferredMoves: [
      "deadpan observation",
      "status framing",
      "understatement",
      "ironic compression",
      "callback",
    ],
    forbiddenLiteralizations: [
      "cameras",
      "interviews",
      "documentary crew",
      "new witnesses",
      "narrator claims",
    ],
  },

  absurd: {
    name: "absurd",
    purpose:
      "Push the strangest supported implication until the framing becomes delightfully disproportionate without inventing a concrete event.",
    preferredMoves: [
      "semantic escalation",
      "understatement",
      "status inversion",
      "juxtaposition",
      "deadpan absurdity",
    ],
    forbiddenLiteralizations: [
      "new physical events",
      "new characters",
      "new objects",
      "new locations",
      "new outcomes",
    ],
  },

  military: {
    name: "military",
    purpose:
      "Frame supplied progress and obstacles as missions, sectors, clearance, command, or tactical status.",
    preferredMoves: [
      "mission framing",
      "sector framing",
      "clearance language",
      "status shift",
      "deadpan command tone",
    ],
    forbiddenLiteralizations: [
      "weapons",
      "soldiers",
      "bases",
      "new missions",
      "new combat",
    ],
  },

  western: {
    name: "western",
    purpose:
      "Frame supplied conflict, pride, and resolution with sparse frontier-style status and consequence.",
    preferredMoves: [
      "standoff framing",
      "status language",
      "dry understatement",
      "reversal",
      "finality",
    ],
    forbiddenLiteralizations: [
      "horses",
      "guns",
      "saloon",
      "dust",
      "new duels",
    ],
  },

  cyberpunk: {
    name: "cyberpunk",
    purpose:
      "Frame supplied changes as system state, exploits, patches, breaches, upgrades, or status shifts without inventing technology.",
    preferredMoves: [
      "system-status framing",
      "upgrade framing",
      "breach implication",
      "patch language",
      "compression",
    ],
    forbiddenLiteralizations: [
      "servers",
      "implants",
      "hackers",
      "new technology",
      "new interfaces",
    ],
  },
};

export function getMouthCreativeLock(
  name?: string,
): MouthCreativeLock {
  const normalized = String(
    name ?? "organic",
  )
    .trim()
    .toLowerCase() as MouthCreativeLockName;

  return (
    LOCKS[normalized] ??
    LOCKS.organic
  );
}

export function buildMouthCreativeLockDirective(
  lock: MouthCreativeLock,
): string[] {
  return [
    `CREATIVE LOCK: ${lock.name}`,
    `PURPOSE: ${lock.purpose}`,
    `PREFERRED CREATIVE MOVES: ${lock.preferredMoves.join(", ")}`,
    `FORBIDDEN LITERALIZATIONS: ${lock.forbiddenLiteralizations.join(", ")}`,
    "The lock changes framing only; it never changes approved reality, approved meaning, or the endpoint.",
    "Use the lock as a creative lens, not as permission to add domain facts, props, characters, settings, actions, reactions, sounds, chronology, or outcomes.",
  ];
}

export function listMouthCreativeLocks(): MouthCreativeLock[] {
  return Object.values(LOCKS);
}
