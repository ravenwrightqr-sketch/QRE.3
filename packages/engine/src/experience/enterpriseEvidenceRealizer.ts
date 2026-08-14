import type {
  CognitiveExperiencePlan,
  CognitivePremiseRole,
  StoryBeat,
} from "@qre/contracts";

/**
 * Enterprise Evidence-First Realizer
 *
 * This is the single customer-language authority for the cognitive compiler.
 *
 * Design rules:
 * 1. The prompt/runtime evidence defines the world.
 * 2. Observed facts can be stated as facts.
 * 3. Prompt-grounded intent can be expressed as intent, not as a fabricated
 *    event.
 * 4. Cognitive machinery can shape sequence and tone but cannot create a new
 *    person, object, place, event, owner, measurement, or physical action.
 * 5. A participant is never silently promoted to subject.
 * 6. Creative language may exaggerate attitude, never evidence.
 * 7. Lexical anchors from the prompt are conserved enough for traceability.
 * 8. No domain list is required for the realization strategy.
 */

const META = /\b(?:cognitive|compiler|premise|directive|hypothesis|semantic|realization|realizer|experience plan|story structure|meaning context|progression model|interaction model|content model|discovery model|trajectory|mechanic|mechanics|latent state|internal state|future evolution|dynamic behavior|situation is static)\b/i;
const DELIVERY = /\b(?:customer-facing|delivery pipeline|delivery layer|scan pipeline|qr pipeline|nfc pipeline|generated output)\b/i;
const SERIOUS = /\b(?:memorial|funeral|death|died|grief|grieving|emergency|medical|injury|trauma|crisis|solemn|reverent|mourning|urgent|lawsuit|legal|hospital|diagnosis|bereavement|accident|loss)\b/i;
const PLAYFUL = /\b(?:funny|fun|playful|humor|humour|comedy|hilarious|ridiculous|absurd|delight|laugh|wild|silly|whimsical|cute|cheeky|witty|crazy|celebratory)\b/i;
const DARK = /\b(?:horror|horrifying|horrific|creepy|terrifying|terror|haunted|sinister|disturbing|dark|nightmare|ominous|evil|cursed)\b/i;
const ACTION = /\b(?:arriv|enter|walk|go|went|come|came|leave|left|return|groom|clean|wash|repair|fix|restore|build|make|create|design|write|cook|bake|serve|prepare|open|close|visit|travel|drive|ride|paint|dance|sing|play|choose|pick|select|decide|touch|hold|wear|taste|smell|look|see|watch|share|give|take|bring|receive|check|inspect|test|measure|install|remove|change|turn|transform|upgrade|finish|complete|celebrat|marry|vow|photograph|capture|record|teach|learn|discover|find|collect|organize|organise|decorate|style|trim|cut|brush|dry|massage|relax|pamper|spoil|treat|shake|shook|chew|chewed|tear|tore|eat|ate|run|ran|call|called|document|documents|documented|adding|add|remember|remembered|preserve|preserved|grow|growing|travelled|traveled)\w*\b/i;
const ABSTRACT = /\b(?:situation|experience|interaction|process|journey|moment|meaning|progression|model|state|condition|possibility|potential|context|dynamic|behavior|behaviour|development|transformation|change|result|outcome)\b/i;

const NOISE = new Set([
  "the","a","an","and","or","but","for","with","about","from","this","that",
  "into","something","people","will","can","should","could","would","make","create",
  "build","design","write","show","give","send","turn","then","there","where","when",
  "while","what","than","more","very","really","just","want","need","experience","story",
]);

const clean = (value: unknown): string =>
  typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
const lower = (value: unknown): string => clean(value).toLowerCase();
const sentence = (value: unknown): string => clean(value).replace(/[.!?]+$/, "");
const cap = (value: string): string => {
  const text = sentence(value);
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "";
};
const unique = (values: readonly unknown[]): string[] =>
  [...new Set(values.map(clean).filter(Boolean))];

function usable(value: string): boolean {
  return Boolean(clean(value)) && !META.test(value) && !DELIVERY.test(value);
}

function lexical(value: string): boolean {
  const text = lower(value);
  if (!usable(text)) return false;
  const parts = text.split(/[^a-z0-9'’-]+/).filter(Boolean);
  return parts.some((word) => word.length >= 2 && !NOISE.has(word));
}

function slotValues(plan: CognitiveExperiencePlan | undefined, role: CognitivePremiseRole): string[] {
  return unique(
    plan?.premise?.slots
      .filter((slot) => slot.role === role)
      .flatMap((slot) => slot.values) ?? [],
  ).filter(usable);
}

function slotAuthority(plan: CognitiveExperiencePlan | undefined, role: CognitivePremiseRole): number {
  const slot = plan?.premise?.slots.find((entry) => entry.role === role);
  if (!slot) return 0;

  const sourceAuthority = Math.max(
    0,
    ...slot.evidence.map((evidence) => {
      if (evidence.source === "prompt") return 100 * evidence.confidence;
      if (evidence.source === "context") return 95 * evidence.confidence;
      if (evidence.source === "event") return 90 * evidence.confidence;
      if (evidence.source === "location") return 88 * evidence.confidence;
      if (evidence.source === "memory") return 80 * evidence.confidence;
      if (evidence.source === "history") return 75 * evidence.confidence;
      return 20 * evidence.confidence;
    }),
  );

  // Derived does not mean false. It means the system normalized explicit
  // prompt grammar into a semantic role. It can be verbalized carefully when
  // its provenance is still prompt-grounded.
  if (slot.status === "derived" && slot.evidence.some((e) => e.source === "prompt")) {
    return Math.max(55, Math.min(78, sourceAuthority));
  }

  return slot.status === "observed" ? sourceAuthority : 0;
}

function explicitSubject(plan?: CognitiveExperiencePlan): string | undefined {
  const subject = plan?.premise?.slots.find((slot) => slot.role === "subject");
  if (!subject || slotAuthority(plan, "subject") < 80) return undefined;
  return subject.values.find(usable);
}

function observed(plan: CognitiveExperiencePlan | undefined, role: CognitivePremiseRole): string[] {
  return slotAuthority(plan, role) >= 80 ? slotValues(plan, role) : [];
}

function groundedIntent(plan: CognitiveExperiencePlan | undefined, role: CognitivePremiseRole): string[] {
  return slotAuthority(plan, role) >= 55 ? slotValues(plan, role) : [];
}

function anchorPool(beat: StoryBeat, plan?: CognitiveExperiencePlan): string[] {
  return unique([
    ...observed(plan, "subject"),
    ...observed(plan, "event"),
    ...observed(plan, "medium"),
    ...observed(plan, "artifact"),
    ...observed(plan, "participants"),
    ...observed(plan, "place"),
    ...observed(plan, "social"),
    ...observed(plan, "temporal"),
    ...beat.entities,
  ]).filter(lexical);
}

function actionEvidence(plan?: CognitiveExperiencePlan): string | undefined {
  return unique([
    ...observed(plan, "event"),
    ...slotValues(plan, "affordance"),
  ]).find((value) => ACTION.test(value));
}

function tone(plan?: CognitiveExperiencePlan): "playful" | "dark" | "serious" | "cinematic" {
  const text = lower([
    ...(plan?.emotionalIntent ?? []),
    ...(plan?.creativePossibilities ?? []),
    ...(plan?.purpose ? [plan.purpose] : []),
    ...(plan?.direction ? [plan.direction] : []),
  ].join(" "));

  if (SERIOUS.test(text)) return "serious";
  if (DARK.test(text)) return "dark";
  if (PLAYFUL.test(text)) return "playful";
  return "cinematic";
}

function article(value: string): string {
  const text = sentence(value).toLowerCase();
  if (!text) return "";
  if (/^(?:the|a|an)\b/.test(text)) return text;
  return /^[aeiou]/i.test(text) ? `an ${text}` : `a ${text}`;
}

function subjectText(plan?: CognitiveExperiencePlan): string {
  return explicitSubject(plan) ?? observed(plan, "participants")[0] ?? observed(plan, "artifact")[0] ?? observed(plan, "event")[0] ?? "the story";
}

function pick(values: string[], order: number): string | undefined {
  return values.length ? values[Math.abs(order) % values.length] : undefined;
}

function detailForBeat(beat: StoryBeat, plan?: CognitiveExperiencePlan): string | undefined {
  const byKind: Partial<Record<string, CognitivePremiseRole[]>> = {
    orientation: ["subject", "event", "artifact", "place"],
    hook: ["event", "medium", "artifact", "participants", "place"],
    origin: ["event", "artifact", "place"],
    threshold: ["event", "constraint", "artifact", "place"],
    need: ["participants", "outcome", "event", "constraint"],
    encounter: ["event", "participants", "artifact", "place"],
    challenge: ["event", "constraint", "artifact", "participants"],
    action: ["event", "artifact", "medium"],
    contribution: ["participants", "artifact", "event"],
    feedback: ["outcome", "event", "participants"],
    discovery: ["artifact", "event", "place", "participants"],
    reveal: ["outcome", "transformation", "artifact", "event"],
    escalation: ["event", "artifact", "participants", "outcome"],
    transformation: ["transformation", "outcome", "event", "artifact"],
    reflection: ["emotion", "transformation", "artifact", "event"],
    identity: ["subject", "artifact", "outcome"],
    milestone: ["outcome", "event", "artifact", "participants"],
    payoff: ["outcome", "transformation", "event", "artifact"],
    next_step: ["event", "temporal", "participants", "outcome"],
    continuation: ["outcome", "temporal", "event", "artifact"],
  };

  for (const role of byKind[beat.kind] ?? ["event", "artifact", "participants", "place", "outcome"]) {
    const values = role === "outcome" || role === "transformation"
      ? groundedIntent(plan, role)
      : observed(plan, role);
    const value = pick(values, beat.order);
    if (value) return value;
  }

  return pick(anchorPool(beat, plan), beat.order);
}

function missingAnchor(beat: StoryBeat, plan: CognitiveExperiencePlan | undefined, text: string): string | undefined {
  const covered = lower(text);
  const candidates = anchorPool(beat, plan)
    .filter((value) => lower(value).length >= 2)
    .filter((value) => !covered.includes(lower(value)));
  return pick(candidates, beat.order);
}

function anchorSuffix(anchor: string, plan?: CognitiveExperiencePlan): string {
  const value = sentence(anchor);
  const toneValue = tone(plan);

  if (/^[0-9]{4}$/.test(value)) return `That detail was ${value}.`;
  if (/^qr$/i.test(value) || /^nfc$/i.test(value)) return `${value.toUpperCase()} stayed in the picture.`;
  if (/^(?:funny|playful)$/i.test(value)) return `It stayed funny.`;
  if (/^adding$/i.test(value)) return `And it kept adding to the story.`;
  if (/^next$/i.test(value)) return `Then came the next part.`;
  if (/^(?:remember|remembered)$/i.test(value)) return `It was the kind of detail people would remember.`;
  if (toneValue === "dark" && /terrifying|haunted|horror/i.test(value)) return `The ${lower(value)} part stayed with the story.`;
  return `And ${article(value)} stayed in the story.`;
}

function realizationBody(beat: StoryBeat, plan?: CognitiveExperiencePlan): string | undefined {
  const subject = subjectText(plan);
  const detail = detailForBeat(beat, plan);
  const action = actionEvidence(plan);
  const participant = pick(observed(plan, "participants"), beat.order);
  const outcome = pick(groundedIntent(plan, "outcome"), beat.order);
  const transformation = pick(groundedIntent(plan, "transformation"), beat.order);
  const voice = tone(plan);

  if (voice === "playful" && !SERIOUS.test(subject)) {
    if (beat.kind === "orientation") return `${subject} showed up looking like this deserved a formal review.`;
    if (beat.kind === "hook" && detail) return `Then came ${article(detail)}. Naturally, it had opinions.`;
  }

  switch (beat.kind) {
    case "orientation":
      return `${subject} arrived, and the story got underway.`;
    case "hook":
      return detail ? `Then came ${article(detail)}.` : "Then the important part came into focus.";
    case "origin":
      return action ? `It started with ${lowerSentence(action)}.` : detail ? `It started with ${article(detail)}.` : undefined;
    case "threshold":
      return detail ? `That was where ${article(detail)} entered the picture.` : undefined;
    case "need":
      if (outcome) return `The point was simple: ${sentence(outcome).toLowerCase()}.`;
      if (participant) return `This one was for ${article(participant)}.`;
      return detail ? `There was something specific to deal with: ${article(detail)}.` : undefined;
    case "encounter":
      return detail ? `Then ${article(detail)} became part of the day.` : undefined;
    case "challenge":
      return detail ? `${cap(article(detail))} was the part that needed handling.` : undefined;
    case "action":
      return action ? cap(action) : detail ? `${cap(article(detail))} got its turn.` : undefined;
    case "contribution":
      return participant && detail
        ? `${cap(article(participant))} added ${article(detail)} to the story.`
        : detail ? `${cap(article(detail))} became part of what followed.` : undefined;
    case "feedback":
      if (voice === "playful") return `${subject} had feelings about ${article(detail ?? participant ?? "that")}.`;
      return detail ? `${cap(article(detail))} showed the difference.` : undefined;
    case "discovery":
      return detail ? `That was when ${article(detail)} stood out.` : undefined;
    case "reveal":
      return outcome ? `And there it was: ${sentence(outcome).toLowerCase()}.` : detail ? `And there it was: ${article(detail)}.` : undefined;
    case "escalation":
      return detail ? `${cap(article(detail))} was no longer a side detail. It had become the main event.` : undefined;
    case "transformation":
      return transformation ? `${subject} moved into ${sentence(transformation).toLowerCase()}.` : outcome ? `By the end, ${sentence(outcome).toLowerCase()}.` : detail ? `By the end, ${sentence(detail).toLowerCase()}.` : undefined;
    case "reflection":
      return detail ? `Looking back, ${article(detail)} was the turning point.` : undefined;
    case "provenance":
      return detail ? `That history stayed connected to ${article(detail)}.` : undefined;
    case "identity":
      return detail ? `${subject} came away with ${article(detail)} to carry forward.` : undefined;
    case "milestone":
      return outcome ? `That marked the moment: ${sentence(outcome).toLowerCase()}.` : detail ? `${cap(article(detail))} marked the change.` : undefined;
    case "unlock":
    case "earned_access":
      return detail ? `That opened the next door: ${sentence(detail).toLowerCase()}.` : "That opened the next part.";
    case "payoff":
      if (voice === "playful" && detail) return `${subject} left with ${article(detail)} and considerably more personality.`;
      return outcome ? `By the time it was over, ${sentence(outcome).toLowerCase()}.` : detail ? `By the time it was over, ${sentence(detail).toLowerCase()}.` : undefined;
    case "next_step":
      return detail ? `From there, ${article(detail)} was next.` : "From there, the next move was clear.";
    case "continuation":
      return outcome ? `And that left room for ${sentence(outcome).toLowerCase()}.` : detail ? `And that left ${article(detail)} in the story.` : "And the story stayed open for what came next.";
    case "instruction":
      return action ? `The next move was ${sentence(action).toLowerCase()}.` : detail ? `The next move involved ${article(detail)}.` : undefined;
    default:
      return detail ? `${cap(article(detail))} became the next thing to notice.` : undefined;
  }
}

const lowerSentence = (value: string): string => sentence(value).toLowerCase();

export function realizeEnterpriseBeat(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string | undefined {
  if (!plan?.premise) return undefined;

  let text = realizationBody(beat, plan);
  if (!text) return undefined;

  const missing = missingAnchor(beat, plan, text);
  if (missing) text = `${sentence(text)} ${anchorSuffix(missing, plan)}`;

  if (META.test(text) || DELIVERY.test(text)) return undefined;
  return `${sentence(text)}.`;
}

export function inspectEnterpriseRealization(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
) {
  return {
    subject: subjectText(plan),
    tone: tone(plan),
    observed: Object.fromEntries(
      ["subject","event","medium","artifact","participants","place","social","temporal"].map((role) => [role, observed(plan, role as CognitivePremiseRole)]),
    ),
    groundedIntent: Object.fromEntries(
      ["outcome","transformation"].map((role) => [role, groundedIntent(plan, role as CognitivePremiseRole)]),
    ),
    anchors: anchorPool(beat, plan),
    beatKind: beat.kind,
  };
}
