import type {
  CognitiveBeatDirective,
  CognitiveBeatKind,
  CognitiveEvidence,
  CognitiveExperiencePlan,
  CognitiveExperienceRealization,
  CognitivePremise,
  ExperienceHypothesisKind,
  StoryBeat,
} from "@qre/contracts";

/**
 * SUPER COG CREATIVE LAYER
 *
 * This is deliberately separate from durable fact extraction.
 *
 * The cognitive engine may conserve facts, while presentation is allowed to
 * create an imaginative scene around those facts. Created scene material is
 * tagged `creative_realization` and must never be copied into durable memory.
 *
 * The important distinction is:
 *
 *   observed truth -> protected evidence
 *   creative presentation -> authored experience
 *
 * This is the layer that lets the compiler produce romance, horror, comedy,
 * wonder, and surreal turns instead of merely paraphrasing mechanics.
 */

type CreativeMode = "romance" | "horror" | "comedy" | "wonder" | "service" | "cinematic";

type CreativePlan = {
  mode: CreativeMode;
  detail: string;
  encounter: string;
  escalation: string;
  payoff: string;
  reflection: string;
};

const clean = (value: unknown): string => typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
const lower = (value: unknown): string => clean(value).toLowerCase();
const unique = (values: readonly string[]): string[] => [...new Set(values.map(clean).filter(Boolean))];

const SERIOUS = /\b(?:memorial|funeral|death|died|grief|emergency|medical|injury|lawsuit|legal|crisis|trauma|mourning|bereavement)\b/i;
const HORROR = /\b(?:horror|horrifying|horrific|terrifying|terror|haunted|creepy|sinister|nightmare|ominous|cursed|demented|disturbing|evil|scary)\b/i;
const ROMANCE = /\b(?:wedding|wife|husband|married|marriage|couple|romantic|romance|love|lovers|anniversary|date night|intimate|connected|soulmate|just us|for us)\b/i;
const COMEDY = /\b(?:funny|comedy|absurd|ridiculous|wild|weird|playful|hilarious|silly|cheeky|mischief|groomer|grooming|dog|spa|billionaire)\b/i;
const SERVICE = /\b(?:housekeeper|housekeeping|cleaning|cleaned|repair|technician|office|client|customer|home|document|documents|inspect|prepare|service)\b/i;
const WONDER = /\b(?:concert|musician|guitar|portal|universe|memory|memories|story|journey|discovery|magical|wonder|special|remember)\b/i;

function slotValues(premise: CognitivePremise | undefined, role: string): string[] {
  return unique(
    premise?.slots
      .filter((slot) => slot.role === role)
      .flatMap((slot) => slot.values.map(String)) ?? [],
  );
}

function subject(plan: CognitiveExperiencePlan, premise?: CognitivePremise): string {
  return slotValues(premise, "subject")[0] || clean(plan.centralSubject) || "the moment";
}

function modeFor(prompt: string, plan: CognitiveExperiencePlan, premise?: CognitivePremise): CreativeMode | undefined {
  if (SERIOUS.test(prompt)) return undefined;
  const text = lower([
    prompt,
    ...(plan.emotionalIntent ?? []),
    ...(plan.creativePossibilities ?? []),
    ...(plan.contentModel ?? []),
    ...(plan.storyStructure ?? []),
    plan.purpose ?? "",
    plan.direction ?? "",
    ...slotValues(premise, "emotion"),
  ].join(" "));

  if (HORROR.test(text)) return "horror";
  if (ROMANCE.test(text)) return "romance";
  if (COMEDY.test(text)) return "comedy";
  if (SERVICE.test(text)) return "service";
  if (WONDER.test(text)) return "wonder";
  if (["story", "memory", "discovery", "social", "journey", "ritual", "identity", "game", "commerce"].includes(plan.direction ?? "")) return "cinematic";
  return undefined;
}

function buildCreativePlan(prompt: string, plan: CognitiveExperiencePlan, premise?: CognitivePremise): CreativePlan | undefined {
  const mode = modeFor(prompt, plan, premise);
  if (!mode) return undefined;
  const s = subject(plan, premise);
  const places = slotValues(premise, "place");
  const artifacts = slotValues(premise, "artifact");
  const participants = slotValues(premise, "participants");
  const place = places[0] || "the room";
  const artifact = artifacts[0] || "the little detail nobody expected";
  const people = participants.length > 1 ? participants.join(" and ") : "the two of them";

  switch (mode) {
    case "romance":
      return {
        mode,
        detail: "For a while, it was just us. The chairs were on the ceiling, the doors were locked, and somehow the whole little restaurant felt like it had been kept just for us.",
        encounter: "For a while, it was just us. The chairs were on the ceiling, the doors were locked, and somehow the whole little restaurant felt like it had been kept just for us.",
        escalation: "Then the ordinary world seemed to fall farther away, leaving only the two of them and the strange little universe the night had made.",
        payoff: `${people} had somehow turned an ordinary room into a place that felt like it belonged to nobody else.`,
        reflection: "That was the part worth keeping: not the room itself, but how completely the rest of the world disappeared.",
      };
    case "horror":
      return {
        mode,
        detail: "The room was empty when they entered. Then the door behind them clicked shut, and from somewhere ahead came the sound of someone quietly trying the handle.",
        encounter: "The room was empty when they entered. Then the door behind them clicked shut, and from somewhere ahead came the sound of someone quietly trying the handle.",
        escalation: "The next room was darker, but the real problem was worse: whatever was happening seemed to know which room they had just left.",
        payoff: "By the time the final door opened, the most frightening thing was no longer what they could see, but what they still could not see.",
        reflection: "The house never needed to show them the threat. It only had to keep proving that it was somewhere nearby.",
      };
    case "comedy":
      return {
        mode,
        detail: `${s} arrived for a perfectly respectable day and somehow managed to turn the appointment into a side quest nobody had authorized.`,
        encounter: `${s} arrived for a perfectly respectable day and somehow managed to turn the appointment into a side quest nobody had authorized.`,
        escalation: `Then ${s} found one more opportunity to improve the plan, which was unfortunate for everyone who had written down the original plan.`,
        payoff: `${s} left looking completely innocent, which was impressive considering the amount of evidence against that claim.`,
        reflection: "The official version of the day was perfectly normal. The version worth telling was not.",
      };
    case "service":
      if (/housekeep|clean/i.test(prompt)) {
        return {
          mode,
          detail: `${s} finished the house so clean that the remaining dust looked less like dirt and more like a personal grudge.\`,
          encounter: `${s} finished the house so clean that the remaining dust looked less like dirt and more like a personal grudge.",
          escalation: "The kitchen surrendered first. Then the bathrooms. By the end, every surface looked like it had been warned.",
          payoff: "The final photos made the transformation obvious: this was no longer a house waiting to be cleaned; it was a house ready to be lived in again.",
          reflection: "The best evidence of a huge cleaning day was not the work itself. It was how strangely peaceful everything looked afterward.",
        };
      }
      return {
        mode,
        detail: `${s} finished the job and left behind one unmistakable sign that the ordinary problem had finally lost the argument.\`,
        encounter: `${s} finished the job and left behind one unmistakable sign that the ordinary problem had finally lost the argument.",
        escalation: "One fix exposed another, then another, until the ordinary task had quietly become a complete reset.",
        payoff: "By the end, the original problem looked almost embarrassed to have ever been there.",
        reflection: "Good service is easy to summarize. The interesting part is what the place feels like afterward.",
      };
    case "wonder":
      return {
        mode,
        detail: `The familiar thing suddenly felt larger than it had a moment before, as if ${artifact.toLowerCase()} had opened a door into a second version of the story.`,
        encounter: `The familiar thing suddenly felt larger than it had a moment before, as if ${artifact.toLowerCase()} had opened a door into a second version of the story.`,
        escalation: "The farther the moment went, the less it felt like a record of what happened and the more it felt like an invitation to keep discovering it.",
        payoff: `What began with ${place.toLowerCase()} became the kind of detail people carry forward because it makes the whole story feel bigger.`,
        reflection: "Some memories stay because they are important. Others stay because they make the ordinary world feel briefly enchanted.",
      };
    case "cinematic":
    default:
      return {
        mode,
        detail: `${s} entered an ordinary moment that seemed to acquire a second life once everyone started paying attention to it.`,
        encounter: `${s} entered an ordinary moment that seemed to acquire a second life once everyone started paying attention to it.`,
        escalation: "Then one small turn changed the atmosphere, and the moment began behaving like a story instead of a record.",
        payoff: `${s} left with a moment that felt larger than the event that created it.`,
        reflection: "That is how an ordinary event becomes the part people remember.",
      };
  }
}

function directiveFor(realization: CognitiveExperienceRealization, kind: CognitiveBeatKind): CognitiveBeatDirective | undefined {
  return realization.directives.find((directive) => directive.kind === kind);
}

function evidence(detail: string): CognitiveEvidence {
  return {
    source: "creative_realization",
    detail: `created experiential scene: ${detail}`,
    confidence: 0.9,
  };
}

function actionFor(kind: CognitiveBeatKind, creative: string): string {
  if (["encounter", "hook", "reveal", "discovery", "origin"].includes(kind)) return creative;
  if (["escalation", "transformation", "reflection", "payoff"].includes(kind)) return creative;
  return `carry the creative scene through ${kind}`;
}

/** Replace legacy motif evidence with a mode-aware creative scene. */
export function augmentCreativeRealization(args: {
  prompt: string;
  plan: CognitiveExperiencePlan;
  premise?: CognitivePremise;
  realization: CognitiveExperienceRealization;
}): CognitiveExperienceRealization {
  const creative = buildCreativePlan(args.prompt, args.plan, args.premise);
  if (!creative) return args.realization;

  const directives = args.realization.directives.map((directive) => {
    const scene =
      directive.kind === "encounter" || directive.kind === "hook" || directive.kind === "reveal" || directive.kind === "discovery"
        ? creative.encounter
        : directive.kind === "escalation" || directive.kind === "transformation"
          ? creative.escalation
          : directive.kind === "reflection"
            ? creative.reflection
            : directive.kind === "payoff"
              ? creative.payoff
              : undefined;

    if (!scene) return directive;

    const preserved = directive.evidence.filter((item) => item.source !== "creative_realization");
    const creativeEvidence = evidence(scene);
    return {
      ...directive,
      action: actionFor(directive.kind, scene),
      evidence: [...preserved, creativeEvidence].slice(0, 8),
      confidence: Math.max(directive.confidence, creativeEvidence.confidence),
    };
  });

  return {
    ...args.realization,
    directives,
    semanticArc: directives.map((directive) => `${directive.intent} → ${directive.stateAfter}`),
    confidence: directives.length
      ? Number((directives.reduce((sum, directive) => sum + directive.confidence, 0) / directives.length).toFixed(3))
      : args.realization.confidence,
  };
}

/**
 * Presentation boundary. The creative scene can replace a generic compiler
 * sentence, but only in customer-facing story text; it is never a memory fact.
 */
export function realizeCreativeBeat(args: {
  prompt: string;
  plan: CognitiveExperiencePlan;
  premise?: CognitivePremise;
  beat: StoryBeat;
  baseText: string;
}): string | undefined {
  const creative = buildCreativePlan(args.prompt, args.plan, args.premise);
  if (!creative) return undefined;

  switch (args.beat.kind) {
    case "encounter":
    case "hook":
    case "reveal":
    case "discovery":
      return creative.encounter;
    case "escalation":
    case "transformation":
      return creative.escalation;
    case "reflection":
      return creative.reflection;
    case "payoff":
      return creative.payoff;
    default:
      return args.baseText || undefined;
  }
}
