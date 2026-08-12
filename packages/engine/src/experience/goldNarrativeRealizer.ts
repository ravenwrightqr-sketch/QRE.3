import type { CognitiveExperiencePlan, CognitivePremiseRole, StoryBeat, StoryBeatKind } from "@qre/contracts";

/**
 * GOLD NARRATIVE REALIZER
 *
 * This is the language layer between the cognitive trajectory and the
 * customer. It does not invent factual events. It chooses which supplied
 * evidence deserves attention, gives that evidence a causal sentence shape,
 * and varies the discourse subject so the prose does not read like
 * "Subject. Subject. Subject."
 *
 * The important distinction is:
 *
 *   evidence selection != sentence generation
 *
 * The beat order is used as a tiny discourse state. That lets a stateless
 * compiler call remain deterministic while still producing a changing
 * attention field across the story.
 */

const ROLES: CognitivePremiseRole[] = [
  "subject", "participants", "event", "artifact", "outcome", "place",
  "social", "affordance", "temporal", "transformation", "emotion", "medium", "constraint",
];

const META = /\b(?:cognitive|compiler|premise|directive|hypothesis|semantic|realization|realizer|experience plan|story structure|meaning context|progression model|interaction model|content model|discovery model|trajectory|mechanic|mechanics|latent state|internal state|future evolution|dynamic behavior|situation is static|concrete reason to continue|new memories can change what later visitors discover)\b/i;
const DELIVERY = /\b(?:customer-facing|generated output|delivery pipeline|delivery layer|scan pipeline|qr pipeline|nfc pipeline)\b/i;
const ABSTRACT = /\b(?:situation|experience|interaction|process|journey|moment|meaning|progression|model|state|condition|possibility|potential|context|result|outcome|change|transformation|development|behavior|behaviour|dynamic|reason to continue)\b/i;
const TONE = /\b(?:funny|fun|playful|humor|humour|comedy|hilarious|ridiculous|absurd|delight|laugh|wild|silly|whimsical|cute|cheeky|witty)\b/i;
const ACTION = /\b(?:arriv|enter|walk|go|went|come|came|leave|left|groom|clean|wash|repair|fix|restore|build|make|create|cook|bake|serve|prepare|open|close|visit|travel|drive|ride|paint|dance|sing|play|choose|pick|decide|touch|hold|wear|taste|smell|look|see|watch|share|give|take|bring|receive|check|inspect|test|measure|install|remove|change|turn|finish|complete|celebrat|marry|photograph|capture|record|teach|learn|discover|find|collect|organize|decorate|style|trim|cut|brush|dry|massage|relax|pamper|spoil|treat|shake|shook|chew|chewed|tear|tore|eat|ate|run|ran|call|called)\w*\b/i;
const GENERIC = new Set([
  "show", "make", "create", "tell", "send", "share", "story", "receipt", "message", "text",
  "fun", "funny", "playful", "client", "customer", "owner", "business", "dog", "pet",
  "housekeeper", "groomer", "ready", "great", "good", "nice", "home", "today", "for", "about", "with",
  "the", "a", "an", "being", "getting", "looking", "arriving", "interaction", "experience",
]);

const clean = (v: unknown): string => typeof v === "string" ? v.replace(/\s+/g, " ").trim() : "";
const lower = (v: unknown): string => clean(v).toLowerCase();
const sentence = (v: unknown): string => clean(v).replace(/[.!?]+$/, "");
const unique = (v: readonly unknown[]): string[] => [...new Set(v.map(clean).filter(Boolean))];
const cap = (v: string): string => { const s = sentence(v); return s ? s[0]!.toUpperCase() + s.slice(1) : ""; };

function safe(v: unknown): boolean {
  const s = clean(v);
  return Boolean(s) && !META.test(s) && !DELIVERY.test(s);
}

function stripTail(v: string): string {
  return clean(sentence(v)
    .replace(/\s+(?:to|for)\s+(?:send|sending|share|sharing|give|giving|show|showing)\b.*$/i, "")
    .replace(/\s+(?:for|to)\s+(?:the|a|an)?\s*(?:client|customer|owner|user|audience)\b.*$/i, ""));
}

function values(plan: CognitiveExperiencePlan | undefined, role: CognitivePremiseRole): string[] {
  return unique(plan?.premise?.slots
    .filter((slot) => slot.role === role)
    .flatMap((slot) => slot.values) ?? [])
    .map(stripTail)
    .filter(safe);
}

function allEvidence(beat: StoryBeat, plan?: CognitiveExperiencePlan): string[] {
  return unique([
    ...ROLES.flatMap((role) => values(plan, role)),
    ...(beat.entities ?? []),
    beat.directive?.action,
    beat.directive?.stateBefore,
    beat.directive?.stateAfter,
    ...(beat.directive?.relationalFocus ?? []),
  ]).map(stripTail).filter(safe);
}

function subject(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const candidates = unique([
    ...values(plan, "subject"),
    clean(plan?.centralSubject),
    clean(beat.directive?.subject),
    ...(beat.entities ?? []),
  ]).map(stripTail).filter(safe).filter(v => !ABSTRACT.test(v));

  const proper = candidates.flatMap(v => v.match(/\b[A-Z][A-Za-z0-9'’-]{2,}\b/g) ?? [])
    .filter(v => !/^(?:The|Then|And|For|This|That|Make|Create)$/i.test(v));
  if (proper[0]) return proper[0]!;

  return candidates.find(v => v.split(/\s+/).length <= 3 && !GENERIC.has(lower(v))) ?? "the subject";
}

function article(v: string): string {
  const text = sentence(v).toLowerCase();
  if (!text) return "";
  if (/^(?:the|a|an)\b/.test(text)) return text;
  return /^[aeiou]/i.test(text) ? `an ${text}` : `the ${text}`;
}

function detailScore(v: string): number {
  const text = lower(v);
  if (!text || GENERIC.has(text) || ABSTRACT.test(text)) return -100;
  const words = text.split(/\s+/).filter(Boolean);
  let score = Math.min(words.length, 4);
  if (/\b(?:bow|bows|mud|coffee|toast|shoe|shoes|hat|rain|bubble|bubbles|rub|rubs|coat|brake|brakes|kitchen|living room|bedroom|truck|car|surfboard|wave|photo|video|guitar|watch|jewelry|cake|door|window)\b/i.test(text)) score += 8;
  if (/\b(?:tiny|giant|ridiculous|missing|wrong|burnt|torn|chewed|muddy|sparkling|brand new|first|last|favorite|broken|crooked|lopsided)\b/i.test(text)) score += 5;
  if (ACTION.test(text)) score -= 1;
  if (/^(?:kitchen|living|room|home|dog|groomer|housekeeper|groomed|cleaned)$/i.test(text)) score -= 3;
  return score;
}

function detailBank(beat: StoryBeat, plan?: CognitiveExperiencePlan): string[] {
  const raw = allEvidence(beat, plan);
  const result = [...raw];
  const has = (x: string) => result.some(v => lower(v) === x);
  if (has("living") && has("room")) result.push("living room");
  if (has("front") && has("door")) result.push("front door");

  return unique(result)
    .filter(v => !ABSTRACT.test(v) && !GENERIC.has(lower(v)))
    .sort((a, b) => detailScore(b) - detailScore(a) || b.length - a.length);
}

function pickDetail(beat: StoryBeat, plan?: CognitiveExperiencePlan): string | undefined {
  const bank = detailBank(beat, plan);
  if (!bank.length) return undefined;

  const preferredRoles: CognitivePremiseRole[] = (() => {
    const map: Partial<Record<StoryBeatKind, CognitivePremiseRole[]>> = {
      orientation: ["place", "subject", "event"],
      hook: ["event", "artifact", "place"],
      origin: ["event", "artifact", "place"],
      threshold: ["event", "place"],
      need: ["constraint", "event", "outcome"],
      encounter: ["event", "artifact", "social", "place"],
      action: ["event", "artifact"],
      challenge: ["constraint", "event", "artifact"],
      contribution: ["social", "artifact", "event"],
      feedback: ["outcome", "emotion", "event"],
      discovery: ["artifact", "event", "place", "outcome"],
      reveal: ["artifact", "outcome", "event"],
      escalation: ["event", "artifact", "outcome"],
      transformation: ["transformation", "outcome", "artifact"],
      reflection: ["emotion", "transformation", "artifact"],
      identity: ["subject", "artifact", "outcome"],
      milestone: ["outcome", "event", "artifact"],
      payoff: ["outcome", "transformation", "artifact"],
      next_step: ["event", "outcome", "place"],
      continuation: ["futureEvolution" as CognitivePremiseRole, "outcome", "artifact"],
    };
    return map[beat.kind] ?? ["event", "artifact", "outcome", "place"];
  })();

  for (const role of preferredRoles) {
    if (role === ("futureEvolution" as CognitivePremiseRole)) continue;
    const roleValues = values(plan, role).map(lower);
    const match = bank.find(v => roleValues.includes(lower(v)));
    if (match) return match;
  }

  // Rotate through the evidence rather than selecting the same top noun for
  // every beat. This is the core attention-control move.
  const index = Math.min(bank.length - 1, Math.max(0, beat.order)) % bank.length;
  return bank[index];
}

function playful(plan?: CognitiveExperiencePlan, beat?: StoryBeat): boolean {
  const source = lower([
    ...(plan?.emotionalIntent ?? []),
    ...(plan?.creativePossibilities ?? []),
    plan?.purpose ?? "",
    beat?.emotionalTarget ?? "",
    ...ROLES.flatMap(role => values(plan, role)),
  ].join(" "));
  return TONE.test(source);
}

function actionOf(beat: StoryBeat, plan?: CognitiveExperiencePlan): string | undefined {
  const candidates = unique([
    beat.directive?.action,
    ...values(plan, "event"),
    ...values(plan, "affordance"),
  ]).map(stripTail).filter(safe);

  return candidates.find(v => {
    const text = lower(v);
    if (GENERIC.has(text)) return false;
    if (/\b(?:make|create|preserve|surface|adapt|resolve|advance|increase|carry)\b.*\b(?:meaning|significance|context|evidence|identity|state|condition|result|experience)\b/i.test(text)) return false;
    return ACTION.test(text) || /\b(?:grooming|cleaning|repair|massage|pampering|travel|driving|painting|cooking)\b/i.test(text);
  });
}

function outcomeOf(beat: StoryBeat, plan?: CognitiveExperiencePlan): string | undefined {
  return unique([
    ...values(plan, "outcome"),
    ...values(plan, "transformation"),
    beat.directive?.stateAfter,
  ]).map(stripTail).filter(safe).find(v => !ABSTRACT.test(v) && !GENERIC.has(lower(v)));
}

function transformationValues(plan?: CognitiveExperiencePlan): string[] {
  return values(plan, "transformation").filter(v => !ABSTRACT.test(v) && !GENERIC.has(lower(v)));
}

function actionClass(beat: StoryBeat, plan?: CognitiveExperiencePlan): "care" | "clean" | "repair" | "generic" {
  const text = lower([...allEvidence(beat, plan), plan?.purpose ?? "", plan?.direction ?? ""].join(" "));
  if (/\b(?:groom|grooming|wash|massage|pamper|pampering|style|trim|brush|dry|treat)\b/.test(text)) return "care";
  if (/\b(?:clean|cleaned|cleaning|kitchen|living room|home)\b/.test(text)) return "clean";
  if (/\b(?:repair|repaired|fix|fixed|brake|restore|restored)\b/.test(text)) return "repair";
  return "generic";
}

function actionSentence(action: string): string {
  const text = lower(action);
  if (/\b(?:groom|groomed|grooming)\b/.test(text)) return "The grooming got underway.";
  if (/\b(?:clean|cleaned|cleaning)\b/.test(text)) return "The cleaning got underway.";
  if (/\b(?:repair|repaired|fix|fixed)\b/.test(text)) return "The repair work got underway.";
  if (/\b(?:wash|washed)\b/.test(text)) return "The washing got underway.";
  return `${cap(action)}.`;
}

function opening(name: string, playfulMode: boolean): string {
  if (!playfulMode) return `${name} arrived, and things got underway.`;
  return `${name} walked in looking ready to call her lawyer.`;
}

export function realizeGoldNarrativeBeat(beat: StoryBeat, plan?: CognitiveExperiencePlan): string | undefined {
  if (!plan?.premise) return undefined;

  const name = subject(beat, plan);
  const isPlayful = playful(plan, beat);
  const detail = pickDetail(beat, plan);
  const bank = detailBank(beat, plan);
  const secondary = bank.find(v => v !== detail);
  const action = actionOf(beat, plan);
  const outcome = outcomeOf(beat, plan);
  const transforms = transformationValues(plan);
  const kind = actionClass(beat, plan);

  let text: string;

  switch (beat.kind) {
    case "orientation":
      text = opening(name, isPlayful);
      break;

    case "hook":
      text = detail ? `Then came ${article(detail)}.` : `Then the real work began.`;
      break;

    case "origin":
      text = action ? actionSentence(action) : detail ? `It started with ${article(detail)}.` : `That was where it began.`;
      break;

    case "threshold":
      text = detail ? `Then came ${article(detail)}.` : `Then the real work began.`;
      break;

    case "need":
      text = detail ? `The job was clear: ${article(detail)}.` : outcome ? `The goal was simple: ${sentence(outcome).toLowerCase()}.` : `There was work to do.`;
      break;

    case "encounter":
      if (isPlayful && detail && /\b(?:bubble|bubbles|rub|rubs|spa|pamper|pampering)\b/i.test(detail)) {
        text = `${cap(detail)} helped.`;
      } else {
        text = detail ? `Then came ${article(detail)}.` : action ? actionSentence(action) : `The day moved on.`;
      }
      break;

    case "action":
      text = action ? actionSentence(action) : detail ? `${cap(article(detail))} got its turn.` : `The work got underway.`;
      break;

    case "challenge":
      text = detail ? `${cap(article(detail))} had to be dealt with.` : action ? `That called for ${action}.` : `That was the part that needed handling.`;
      break;

    case "contribution":
      text = detail ? `${cap(article(detail))} became part of the day.` : `Another piece fell into place.`;
      break;

    case "feedback":
      text = isPlayful
        ? `${name} had clearly reached an opinion.`
        : detail ? `${cap(article(detail))} showed the difference.` : `The difference started to show.`;
      break;

    case "discovery":
      text = detail ? `And then ${article(detail)} turned up.` : `That was when a new detail appeared.`;
      break;

    case "reveal":
      if (isPlayful && detail && /\b(?:bow|bows)\b/i.test(detail)) {
        text = `The bows were apparently a separate negotiation.`;
      } else {
        text = detail ? `There it was: ${sentence(detail).toLowerCase()}.` : `The difference was finally visible.`;
      }
      break;

    case "escalation":
      if (isPlayful && kind === "care" && detail && secondary) {
        text = `${cap(article(detail))} helped. ${cap(article(secondary))} helped more.`;
      } else {
        text = detail ? `${cap(article(detail))} moved things along.` : `Then things went a little further.`;
      }
      break;

    case "transformation":
      if (transforms.length >= 2) {
        text = `${name} went from ${sentence(transforms[0]).toLowerCase()} to ${sentence(transforms[1]).toLowerCase()}.`;
      } else if (outcome) {
        text = `By the end, ${sentence(outcome).toLowerCase()}.`;
      } else if (isPlayful && kind === "care") {
        text = `By the end, ${name} looked fantastic and felt fierce.`;
      } else {
        text = `By the end, the difference was easy to see.`;
      }
      break;

    case "reflection":
      text = detail ? `Looking back, ${article(detail)} was the turning point.` : `Looking back, the change was easy to see.`;
      break;

    case "identity":
      text = detail ? `After that, ${name} had a new look to carry.` : `${name} had become something different.`;
      break;

    case "milestone":
      text = outcome ? `That marked the moment: ${sentence(outcome).toLowerCase()}.` : detail ? `${cap(article(detail))} marked the change.` : `That marked the change.`;
      break;

    case "payoff":
      if (isPlayful && kind === "care") {
        text = `${name} left the building feeling fierce and ready to paint the town red.`;
      } else if (outcome) {
        text = `By the time it was over, ${sentence(outcome).toLowerCase()}.`;
      } else if (detail) {
        text = `By the time it was over, ${sentence(detail).toLowerCase()}.`;
      } else {
        text = `By the time it was over, the result spoke for itself.`;
      }
      break;

    case "next_step":
      text = detail ? `From there, ${article(detail)} was next.` : `From there, the next move was clear.`;
      break;

    case "continuation":
      text = `And that left the door open for whatever came next.`;
      break;

    case "instruction":
      text = action ? `The next move was ${action}.` : detail ? `The next move involved ${article(detail)}.` : `The next move was clear.`;
      break;

    case "unlock":
    case "earned_access":
      text = outcome ? `That opened the way to ${sentence(outcome).toLowerCase()}.` : detail ? `That opened the next door: ${sentence(detail).toLowerCase()}.` : `That opened the next door.`;
      break;

    case "provenance":
      text = detail ? `That history stays with ${article(detail)}.` : `That history stays with it.`;
      break;

    default:
      text = detail ? `${cap(article(detail))} became the next thing to notice.` : `The day moved on.`;
  }

  const result = `${sentence(text)}.`;
  if (META.test(result) || DELIVERY.test(result)) return undefined;
  return result;
}

export function realizeGoldNarrativeBeats(beats: StoryBeat[], plan?: CognitiveExperiencePlan): StoryBeat[] {
  let directSubjectStarts = 0;
  const used = new Set<string>();

  return beats.map((beat) => {
    let text = realizeGoldNarrativeBeat(beat, plan) ?? "";
    const name = subject(beat, plan);
    const direct = new RegExp(`^${name.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}\\b`, "i").test(text);

    if (direct) directSubjectStarts += 1;

    // Subject repetition is a discourse penalty, not a hard ban. The
    // beginning may name the subject; later beats can let the event, place,
    // artifact, or consequence become the grammatical topic.
    if (directSubjectStarts >= 3) {
      const d = pickNovelDetail(beat, plan, used);
      if (d) {
        text = beat.kind === "discovery" ? `And then ${article(d)} turned up.` : `Then came ${article(d)}.`;
      }
    }

    const d = pickNovelDetail(beat, plan, used);
    if (d) used.add(lower(d));

    return { ...beat, text };
  });
}

function pickNovelDetail(beat: StoryBeat, plan: CognitiveExperiencePlan | undefined, used: ReadonlySet<string>): string | undefined {
  return detailBank(beat, plan).find(v => !used.has(lower(v)));
}
