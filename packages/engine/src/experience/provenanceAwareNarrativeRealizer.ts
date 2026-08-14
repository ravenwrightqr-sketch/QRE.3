import type {
  CognitiveEvidence,
  CognitiveExperiencePlan,
  CognitivePremiseRole,
  CognitivePremiseSlot,
  StoryBeat,
} from "@qre/contracts";

/**
 * UNIVERSAL CUSTOMER-LANGUAGE REALIZER
 *
 * Prompt/context evidence is the factual source of truth. Derived cognition
 * may guide structure but cannot become factual prose. Creative realization
 * adds rhetorical framing only. Explicit prompt roles remain authoritative:
 * a participant is not silently promoted to the narrative subject.
 */

const META = /\b(?:cognitive|compiler|premise|directive|hypothesis|semantic|realization|realizer|experience plan|story structure|meaning context|progression model|interaction model|content model|discovery model|trajectory|mechanic|mechanics|latent state|internal state|future evolution|dynamic behavior|situation is static|concrete reason to continue|new memories can change what later visitors discover)\b/i;
const DELIVERY = /\b(?:customer-facing|delivery pipeline|delivery layer|scan pipeline|qr pipeline|nfc pipeline|generated output)\b/i;
const ABSTRACT = /\b(?:situation|experience|interaction|process|journey|moment|meaning|progression|model|state|condition|possibility|potential|context|dynamic|behavior|behaviour|development)\b/i;
const SERIOUS = /\b(?:memorial|funeral|death|died|grief|grieving|emergency|medical|injury|trauma|crisis|solemn|reverent|mourning|urgent|lawsuit|legal|hospital|diagnosis|bereavement|accident|loss)\b/i;
const PLAYFUL = /\b(?:funny|fun|playful|humor|humour|comedy|hilarious|ridiculous|absurd|delight|laugh|wild|silly|whimsical|cute|cheeky|witty|crazy|celebratory)\b/i;
const ACTION = /\b(?:arriv|enter|walk|go|went|come|came|leave|left|return|groom|clean|wash|repair|fix|restore|build|make|create|design|write|cook|bake|serve|prepare|open|close|visit|travel|drive|ride|paint|dance|sing|play|choose|pick|select|decide|touch|hold|wear|taste|smell|look|see|watch|share|give|take|bring|receive|check|inspect|test|measure|install|remove|change|turn|transform|upgrade|finish|complete|celebrat|marry|vow|photograph|capture|record|teach|learn|discover|find|collect|organize|organise|decorate|style|trim|cut|brush|dry|massage|relax|pamper|spoil|treat|shake|shook|chew|chewed|tear|tore|eat|ate|run|ran|call|called|document|documents|documented|adding|add|remember|remembered|preserve|preserved|grow|growing|travelled|traveled)\w*\b/i;

const clean = (value: unknown): string =>
  typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
const lower = (value: unknown): string => clean(value).toLowerCase();
const sentence = (value: string): string => clean(value).replace(/[.!?]+$/, "");
const cap = (value: string): string => {
  const s = sentence(value);
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
};
const unique = (values: readonly unknown[]): string[] =>
  [...new Set(values.map(clean).filter(Boolean))];

function safe(value: string): boolean {
  return Boolean(clean(value)) && !META.test(value) && !DELIVERY.test(value);
}

function evidenceAuthority(evidence: CognitiveEvidence): number {
  if (evidence.source === "prompt") return 100;
  if (evidence.source === "context") return 95;
  if (evidence.source === "memory") return 92;
  if (evidence.source === "event") return 90;
  if (evidence.source === "location") return 88;
  if (evidence.source === "history") return 86;
  if (evidence.source === "creative_realization") return 25;
  return 5;
}

function slotAuthority(slot: CognitivePremiseSlot): number {
  const scores = slot.evidence.map(evidenceAuthority);
  return scores.length ? Math.max(...scores) : slot.status === "derived" ? 10 : 0;
}

function slotValues(
  plan: CognitiveExperiencePlan | undefined,
  role: CognitivePremiseRole,
): string[] {
  return unique(
    plan?.premise?.slots
      .filter((slot) => slot.role === role)
      .flatMap((slot) => slot.values) ?? [],
  ).filter(safe);
}

/**
 * ONLY an observed subject claim may become the grammatical subject.
 *
 * We intentionally do not fall back to:
 * - centralSubject when it is merely inferred
 * - participants
 * - social actors
 * - places
 * - products
 * - arbitrary beat entities
 * - cognitive directives
 *
 * This is the enterprise boundary that prevents hidden domain assumptions.
 */
function explicitSubject(
  beat: StoryBeat,
  plan: CognitiveExperiencePlan,
): string {
  void beat;

  const subjectSlot = plan.premise?.slots.find(
    (slot) => slot.role === "subject",
  );

  if (subjectSlot && slotAuthority(subjectSlot) >= 80) {
    const observed = subjectSlot.values.find(safe);
    if (observed) return observed;
  }

  return "the experience";
}

function allObservedEvidence(
  beat: StoryBeat,
  plan: CognitiveExperiencePlan,
): Array<{ value: string; role: CognitivePremiseRole; authority: number }> {
  const output: Array<{ value: string; role: CognitivePremiseRole; authority: number }> = [];

  for (const slot of plan.premise?.slots ?? []) {
    const authority = slotAuthority(slot);
    if (authority < 80) continue;
    for (const value of slot.values) {
      if (safe(value)) output.push({ value: clean(value), role: slot.role, authority });
    }
  }

  for (const value of beat.entities ?? []) {
    if (safe(value)) output.push({ value: clean(value), role: "artifact", authority: 80 });
  }

  const seen = new Set<string>();
  return output
    .filter((entry) => {
      const key = lower(entry.value);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => b.authority - a.authority || b.value.length - a.value.length);
}

function concreteEvidence(
  beat: StoryBeat,
  plan: CognitiveExperiencePlan,
): Array<{ value: string; role: CognitivePremiseRole; authority: number }> {
  return allObservedEvidence(beat, plan).filter((entry) => {
    const text = entry.value;
    if (entry.role !== "outcome" && entry.role !== "transformation" && ABSTRACT.test(text)) return false;
    if (/^(?:a|an|the)\s+(?:result|outcome|change|meaning|experience|situation|journey)$/i.test(text)) return false;
    return text.split(/\s+/).some((word) => word.replace(/[^a-z0-9'’-]/gi, "").length > 2);
  });
}

function creativeDetail(beat: StoryBeat): string | undefined {
  return unique(
    (beat.directive?.evidence ?? [])
      .filter((item) => item.source === "creative_realization")
      .map((item) => sentence(item.detail))
      .filter((value) => safe(value) && !ABSTRACT.test(value)),
  )[0];
}

function isPlayful(plan: CognitiveExperiencePlan, beat: StoryBeat): boolean {
  if (SERIOUS.test(plan.purpose ?? "")) return false;
  return PLAYFUL.test([
    ...(plan.emotionalIntent ?? []),
    ...(plan.creativePossibilities ?? []),
    plan.purpose ?? "",
    beat.emotionalTarget ?? "",
  ].join(" "));
}

function article(value: string): string {
  const s = sentence(value).toLowerCase();
  if (!s) return "";
  if (/^(?:the|a|an)\b/.test(s)) return s;
  return /^[aeiou]/i.test(s) ? `an ${s}` : `a ${s}`;
}

function chooseDetail(
  beat: StoryBeat,
  plan: CognitiveExperiencePlan,
): string | undefined {
  const bank = concreteEvidence(beat, plan);
  if (!bank.length) return undefined;

  const preferred: Partial<Record<string, CognitivePremiseRole[]>> = {
    orientation: ["subject", "place", "event"],
    hook: ["event", "artifact", "participants", "place"],
    origin: ["event", "artifact", "place"],
    threshold: ["event", "constraint", "place"],
    need: ["constraint", "event", "participants", "outcome"],
    encounter: ["event", "artifact", "participants", "social", "place"],
    challenge: ["constraint", "event", "artifact", "participants"],
    action: ["event", "artifact"],
    contribution: ["social", "participants", "artifact", "event"],
    feedback: ["outcome", "participants", "event", "emotion"],
    discovery: ["artifact", "event", "place", "participants"],
    reveal: ["artifact", "outcome", "event", "participants"],
    escalation: ["event", "artifact", "participants", "outcome"],
    transformation: ["transformation", "outcome", "event", "artifact"],
    reflection: ["emotion", "transformation", "artifact", "participants"],
    identity: ["subject", "artifact", "outcome"],
    milestone: ["outcome", "event", "artifact", "participants"],
    payoff: ["outcome", "transformation", "artifact", "participants"],
    next_step: ["event", "place", "participants", "outcome"],
    continuation: ["outcome", "artifact", "temporal"],
    instruction: ["event", "artifact", "participants"],
  };

  for (const role of preferred[beat.kind] ?? ["event", "artifact", "participants", "place", "outcome"]) {
    const match = bank.find((entry) => entry.role === role);
    if (match) return match.value;
  }

  return bank[Math.min(beat.order, bank.length - 1)]?.value;
}

function explicitParticipant(plan: CognitiveExperiencePlan): string | undefined {
  return slotValues(plan, "participants")[0] ?? slotValues(plan, "social")[0];
}

function explicitOutcome(plan: CognitiveExperiencePlan): string | undefined {
  return slotValues(plan, "outcome")[0] ?? slotValues(plan, "transformation")[1];
}

function actionEvidence(plan: CognitiveExperiencePlan): string | undefined {
  return slotValues(plan, "event")
    .concat(slotValues(plan, "affordance"))
    .find((value) => ACTION.test(value));
}

function baseSentence(beat: StoryBeat, plan: CognitiveExperiencePlan): string {
  const subject = explicitSubject(beat, plan);
  const detail = chooseDetail(beat, plan);
  const participant = explicitParticipant(plan);
  const outcome = explicitOutcome(plan);
  const action = actionEvidence(plan);
  const playful = isPlayful(plan, beat);

  switch (beat.kind) {
    case "orientation":
      return playful
        ? `${subject} showed up looking like this deserved a formal review.`
        : `${subject} arrived, and things got underway.`;
    case "hook":
      return detail ? `Then came ${article(detail)}.` : `Then the work began.`;
    case "origin":
      return action ? cap(action) : detail ? `It started with ${article(detail)}.` : `That was where it began.`;
    case "threshold":
      return detail ? `Then came ${article(detail)}.` : `That was the point where things changed.`;
    case "need":
      if (participant && lower(participant) !== lower(subject)) return `This one was for ${article(participant)}.`;
      return detail ? `The job was clear: ${article(detail)}.` : outcome ? `The goal was simple: ${sentence(outcome).toLowerCase()}.` : `There was work to do.`;
    case "encounter":
      if (playful && detail && /\b(?:spa|pamper|massage|bubble|rub|birthday|cake|party)\b/i.test(detail)) return `${cap(detail)} helped.`;
      return detail ? `Then came ${article(detail)}.` : `The day moved on.`;
    case "challenge":
      return detail ? `${cap(article(detail))} had to be dealt with.` : `That was the part that needed handling.`;
    case "action":
      return action ? cap(action) : detail ? `${cap(article(detail))} got its turn.` : `The work got underway.`;
    case "contribution":
      return detail ? `${cap(article(detail))} became part of the day.` : `Another piece fell into place.`;
    case "feedback":
      return playful ? `${subject} had clearly reached an opinion.` : detail ? `${cap(article(detail))} showed the difference.` : `The difference started to show.`;
    case "discovery":
      return detail ? `And then ${article(detail)} turned up.` : `That was when a new detail appeared.`;
    case "reveal":
      return detail ? `There it was: ${sentence(detail).toLowerCase()}.` : `The difference was finally visible.`;
    case "escalation":
      return playful && detail ? `${cap(article(detail))} was no longer a side detail. It had become the main event.` : detail ? `${cap(article(detail))} moved things along.` : `Then things went a little further.`;
    case "transformation":
      return outcome ? `By the end, ${sentence(outcome).toLowerCase()}.` : detail ? `By the end, ${sentence(detail).toLowerCase()}.` : `By the end, the difference was easy to see.`;
    case "reflection":
      return detail ? `Looking back, ${article(detail)} was the turning point.` : `Looking back, the change was easy to see.`;
    case "identity":
      return detail ? `After that, ${subject} had ${article(detail)} to carry forward.` : `${subject} had become something different.`;
    case "milestone":
      return outcome ? `That marked the moment: ${sentence(outcome).toLowerCase()}.` : detail ? `${cap(article(detail))} marked the change.` : `That marked the change.`;
    case "payoff":
      if (playful && detail) return `${subject} left with ${article(detail)} and considerably more personality.`;
      if (outcome) return `By the time it was over, ${sentence(outcome).toLowerCase()}.`;
      return detail ? `By the time it was over, ${sentence(detail).toLowerCase()}.` : `By the time it was over, the result spoke for itself.`;
    case "next_step":
      return detail ? `From there, ${article(detail)} was next.` : `From there, the next move was clear.`;
    case "continuation":
      return `And that left the door open for whatever came next.`;
    case "instruction":
      return action ? `The next move was ${sentence(action).toLowerCase()}.` : detail ? `The next move involved ${article(detail)}.` : `The next move was clear.`;
    case "unlock":
    case "earned_access":
      return outcome ? `That opened the way to ${sentence(outcome).toLowerCase()}.` : detail ? `That opened the next door: ${sentence(detail).toLowerCase()}.` : `That opened the next door.`;
    case "provenance":
      return detail ? `That history stays with ${article(detail)}.` : `That history stays connected to what came before.`;
    default:
      return detail ? `${cap(article(detail))} became the next thing to notice.` : `The day moved on.`;
  }
}

function missingObservedAnchor(
  beat: StoryBeat,
  plan: CognitiveExperiencePlan,
  text: string,
): { value: string; role: CognitivePremiseRole } | undefined {
  const covered = lower(text);
  const candidates = concreteEvidence(beat, plan)
    .filter((entry) => entry.authority >= 90)
    .filter((entry) => !covered.includes(lower(entry.value)));
  if (!candidates.length) return undefined;
  return candidates[beat.order % Math.min(candidates.length, 3)];
}

function attachObservedAnchor(
  text: string,
  anchor: { value: string; role: CognitivePremiseRole } | undefined,
): string {
  if (!anchor) return text;
  const value = sentence(anchor.value);
  if (!value) return text;

  switch (anchor.role) {
    case "participants":
    case "social":
      return `${sentence(text)} It was for ${article(value)}.`;
    case "place":
      return `${sentence(text)} It happened at ${article(value)}.`;
    case "artifact":
    case "medium":
      return `${sentence(text)} ${cap(article(value))} was part of it.`;
    case "event":
      return `${sentence(text)} The day included ${article(value)}.`;
    case "constraint":
      return `${sentence(text)} The constraint was clear: ${value.toLowerCase()}.`;
    case "outcome":
    case "transformation":
      return `${sentence(text)} The goal was ${value.toLowerCase()}.`;
    case "temporal":
      return `${sentence(text)} It happened ${value.toLowerCase()}.`;
    case "emotion":
      return `${sentence(text)} The feeling was ${value.toLowerCase()}.`;
    default:
      return `${sentence(text)} ${cap(article(value))} was part of it.`;
  }
}

export function realizeProvenanceAwareBeat(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string | undefined {
  if (!plan?.premise) return undefined;

  let text = baseSentence(beat, plan);
  text = attachObservedAnchor(text, missingObservedAnchor(beat, plan, text));

  const creative = creativeDetail(beat);
  if (creative && !lower(text).includes(lower(creative))) {
    text = `${sentence(text)} ${creative}.`;
  }

  const result = `${sentence(text)}.`;
  if (META.test(result) || DELIVERY.test(result)) return undefined;
  return result;
}
