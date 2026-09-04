/**
 * QRE REALIZATION BOUNDARY
 *
 * RealityGraph / EventStructure owns concrete world truth.
 * Mouth may invent language freely inside the approved semantic meaning.
 * This boundary rejects only claims that actually introduce a new concrete
 * occurrence, spatial fact, or action by a known entity.
 *
 * Novel language is not evidence of invention.
 */

export type RealizationBoundaryInput = {
  text: string;
  subject?: string;
  place?: string;
  localReality?: readonly string[];
  globalReality?: readonly string[];
  semantic?: readonly string[];
  earnedInterpretations?: readonly string[];
  permittedRealizationModes?: readonly string[];
  inferenceBudget?:
    | "direct"
    | "compressed"
    | "interpretive"
    | "strongly-interpretive";
};

export type RealizationBoundaryResult = {
  inventionRisk: number;
  foreignTokens: string[];
  novelConcreteTokens: string[];
  approvedNovelLanguageTokens: string[];
};

const STOP = new Set([
  "the", "a", "an", "and", "or", "but", "to", "of", "in", "on", "at", "for", "with", "from", "by", "through",
  "after", "before", "then", "now", "still", "again", "this", "that", "it", "is", "are", "was", "were", "be",
  "been", "being", "as", "into", "my", "your", "our", "their", "his", "her", "its", "he", "she", "they", "them",
  "you", "we", "me", "very", "really", "just", "already", "apparently", "somehow", "perhaps", "maybe",
  "has", "have", "had", "got", "gets", "get",
]);

const CONCRETE_ACTIONS = new Set([
  "arrive", "arrived", "arrives", "arriving",
  "leave", "left", "leaves", "leaving",
  "go", "went", "gone", "goes", "going",
  "come", "came", "comes", "coming",
  "meet", "met", "meets", "meeting",
  "talk", "talked", "talks", "talking",
  "walk", "walked", "walks", "walking",
  "run", "ran", "runs", "running",
  "play", "played", "plays", "playing",
  "dance", "danced", "dances", "dancing",
  "call", "called", "calls", "calling",
  "text", "texted", "texts", "texting",
  "work", "worked", "works", "working",
  "buy", "bought", "buys", "buying",
  "sell", "sold", "sells", "selling",
  "use", "used", "uses", "using",
  "give", "gave", "gives", "giving",
  "find", "found", "finds", "finding",
  "lose", "lost", "loses", "losing",
  "steal", "stole", "stolen", "steals", "stealing",
  "take", "took", "taken", "takes", "taking",
  "pick", "picked", "picks", "picking",
  "return", "returned", "returns", "returning",
  "groom", "groomed", "grooms", "grooming",
  "bathe", "bathed", "bathes", "bathing",
  "clean", "cleaned", "cleans", "cleaning",
  "finish", "finished", "finishes", "finishing",
  "start", "started", "starts", "starting",
  "stop", "stopped", "stops", "stopping",
  "change", "changed", "changes", "changing",
  "wear", "wore", "worn", "wears", "wearing",
  "jump", "jumped", "jumps", "jumping",
  "sit", "sat", "sits", "sitting",
  "stand", "stood", "stands", "standing",
  "eat", "ate", "eats", "eating",
  "drink", "drank", "drunk", "drinks", "drinking",
  "sleep", "slept", "sleeps", "sleeping",
  "chase", "chased", "chases", "chasing",
  "carry", "carried", "carries", "carrying",
  "open", "opened", "opens", "opening",
  "close", "closed", "closes", "closing",
  "move", "moved", "moves", "moving",
  "enter", "entered", "enters", "entering",
  "exit", "exited", "exits", "exiting",
  "drive", "drove", "driven", "drives", "driving",
  "fly", "flew", "flown", "flies", "flying",
  "travel", "traveled", "travelled", "travels", "traveling", "travelling",
  "visit", "visited", "visits", "visiting",
  "stay", "stayed", "stays", "staying",
  "hold", "held", "holds", "holding",
  "keep", "kept", "keeps", "keeping",
  "grab", "grabbed", "grabs", "grabbing",
  "break", "broke", "broken", "breaks", "breaking",
  "fix", "fixed", "fixes", "fixing",
  "repair", "repaired", "repairs", "repairing",
  "wash", "washed", "washes", "washing",
  "polish", "polished", "polishes", "polishing",
  "prepare", "prepared", "prepares", "preparing",
  "earn", "earned", "earns", "earning",
  "receive", "received", "receives", "receiving",
  "send", "sent", "sends", "sending",
  "make", "made", "makes", "making",
  "build", "built", "builds", "building",
  "throw", "threw", "thrown", "throws", "throwing",
  "catch", "caught", "catches", "catching",
  "escape", "escaped", "escapes", "escaping",
  "refuse", "refused", "refuses", "refusing",
  "accept", "accepted", "accepts", "accepting",
  "smile", "smiled", "smiles", "smiling",
  "laugh", "laughed", "laughs", "laughing",
  "cry", "cried", "cries", "crying",
  "hug", "hugged", "hugs", "hugging",
  "kiss", "kissed", "kisses", "kissing",
  "become", "became", "becomes", "becoming",
  "look", "looked", "looks", "looking",
]);

const tokens = (value: string): string[] =>
  String(value ?? "")
    .toLowerCase()
    .split(/[^a-z0-9'’-]+/g)
    .map((token) => token.replace(/[’']s$/i, ""))
    .filter((token) => token.length >= 3 && !STOP.has(token));

const tokenSet = (values: readonly string[]): Set<string> =>
  new Set(values.flatMap(tokens));

function unsupportedSpatialTokens(
  text: string,
  localReality: Set<string>,
  semantic: Set<string>,
): string[] {
  const out: string[] = [];
  const pattern = /\b(?:in|inside|outside|on|under|over|above|below|behind|beside|near|around|across|through|beneath|within|between)\s+(?:the|a|an)?\s*([a-z][a-z0-9'’-]{2,})\b/gi;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(String(text ?? "")))) {
    const token = String(match[1] ?? "").toLowerCase();
    if (!token || STOP.has(token) || localReality.has(token) || semantic.has(token)) continue;
    out.push(token);
  }

  return [...new Set(out)];
}

function unsupportedSubjectActionTokens(
  text: string,
  subject: string | undefined,
  localReality: Set<string>,
  semantic: Set<string>,
): string[] {
  const subjectText = String(subject ?? "").trim();
  if (!subjectText) return [];

  const escaped = subjectText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const subjectPattern = new RegExp(
    `\\b${escaped}\\b(?:['’]s)?`,
    "i",
  );
  const match = subjectPattern.exec(String(text ?? ""));
  if (!match) return [];

  const tail = String(text ?? "").slice(match.index + match[0].length);
  const candidateTokens = tokens(tail);

  for (const token of candidateTokens) {
    if (STOP.has(token) || localReality.has(token) || semantic.has(token)) continue;
    if (CONCRETE_ACTIONS.has(token)) return [token];
  }

  return [];
}

export function evaluateRealizationBoundary(
  input: RealizationBoundaryInput,
): RealizationBoundaryResult {
  const localReality = tokenSet([
    ...(input.localReality ?? []),
    input.subject ?? "",
    input.place ?? "",
  ]);

  const globalReality = tokenSet(
    input.globalReality ?? input.localReality ?? [],
  );

  const semantic = tokenSet([
    ...(input.semantic ?? []),
    ...(input.earnedInterpretations ?? []),
  ]);

  const candidate = tokenSet([input.text]);

  const foreignTokens = [...candidate].filter(
    (token) => globalReality.has(token) && !localReality.has(token),
  );

  const approvedNovelLanguageTokens = [...candidate].filter(
    (token) => !localReality.has(token) && semantic.has(token),
  );

  const unknownTokens = [...candidate].filter(
    (token) =>
      !localReality.has(token) &&
      !semantic.has(token) &&
      !foreignTokens.includes(token),
  );

  const spatialTokens = unsupportedSpatialTokens(
    input.text,
    localReality,
    semantic,
  );

  const subjectActionTokens = unsupportedSubjectActionTokens(
    input.text,
    input.subject,
    localReality,
    semantic,
  );

  const novelConcreteTokens = [
    ...new Set(
      [...spatialTokens, ...subjectActionTokens].filter((token) =>
        unknownTokens.includes(token),
      ),
    ),
  ];

  const concreteClaim =
    foreignTokens.length > 0 ||
    novelConcreteTokens.length > 0;

  return {
    inventionRisk: concreteClaim ? 0.95 : 0,
    foreignTokens,
    novelConcreteTokens,
    approvedNovelLanguageTokens,
  };
}
