import type {
  CognitiveBeatKind,
  CognitiveEvidence,
  CognitiveExperiencePlan,
  CognitiveExperienceRealization,
  CognitivePremise,
  StoryBeat,
} from "@qre/contracts";

/** Presentation-only imagination. Durable memory must never consume this layer. */

type Mode = "romance" | "horror" | "comedy" | "service" | "wonder" | "cinematic";

type Scene = {
  encounter: string;
  escalation: string;
  reflection: string;
  payoff: string;
};

const clean = (value: unknown) => typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
const lower = (value: unknown) => clean(value).toLowerCase();
const SERIOUS = /\b(?:memorial|funeral|death|died|grief|emergency|medical|injury|lawsuit|legal|crisis|trauma|mourning|bereavement)\b/i;

function mode(prompt: string, plan: CognitiveExperiencePlan): Mode | undefined {
  if (SERIOUS.test(prompt)) return undefined;
  const text = lower(`${prompt} ${(plan.emotionalIntent ?? []).join(" ")} ${(plan.creativePossibilities ?? []).join(" ")} ${plan.purpose ?? ""}`);
  if (/\b(?:horror|horrifying|terrifying|haunted|creepy|sinister|nightmare|cursed|scary)\b/.test(text)) return "horror";
  if (/\b(?:wedding|wife|husband|married|romantic|romance|love|couple|anniversary|intimate|connected|just us)\b/.test(text)) return "romance";
  if (/\b(?:funny|comedy|absurd|ridiculous|wild|weird|playful|hilarious|silly|groomer|grooming|dog|spa|billionaire)\b/.test(text)) return "comedy";
  if (/\b(?:housekeeper|housekeeping|cleaning|cleaned|repair|technician|office|client|customer|home|document|inspect|service)\b/.test(text)) return "service";
  if (/\b(?:concert|musician|guitar|portal|universe|memory|memories|magical|wonder|discovery)\b/.test(text)) return "wonder";
  return ["story", "memory", "discovery", "social", "journey", "ritual", "identity", "game", "commerce"].includes(plan.direction ?? "") ? "cinematic" : undefined;
}

function subject(plan: CognitiveExperiencePlan, premise?: CognitivePremise): string {
  const value = premise?.slots.find((slot) => slot.role === "subject")?.values[0];
  return clean(value) || clean(plan.centralSubject) || "the moment";
}

function sceneFor(prompt: string, plan: CognitiveExperiencePlan, premise?: CognitivePremise): Scene | undefined {
  const selected = mode(prompt, plan);
  if (!selected) return undefined;
  const s = subject(plan, premise);

  switch (selected) {
    case "romance":
      return {
        encounter: "For a while, it was just us. The chairs were on the ceiling, the doors were locked, and somehow the whole little restaurant felt like it had been kept just for us.",
        escalation: "Then the ordinary world seemed to fall farther away, leaving only the two of them and the strange little universe the night had made.",
        reflection: "That was the part worth keeping: not the room itself, but how completely the rest of the world disappeared.",
        payoff: "They had somehow turned an ordinary room into a place that felt like it belonged to nobody else.",
      };
    case "horror":
      return {
        encounter: "The room was empty when they entered. Then the door behind them clicked shut, and from somewhere ahead came the sound of someone quietly trying the handle.",
        escalation: "The next room was darker, but the real problem was worse: whatever was happening seemed to know which room they had just left.",
        reflection: "The house never needed to show them the threat. It only had to keep proving that it was somewhere nearby.",
        payoff: "By the time the final door opened, the most frightening thing was no longer what they could see, but what they still could not see.",
      };
    case "comedy":
      return {
        encounter: `${s} arrived for a perfectly respectable day and somehow managed to turn the appointment into a side quest nobody had authorized.`,
        escalation: `Then ${s} found one more opportunity to improve the plan, which was unfortunate for everyone who had written down the original plan.`,
        reflection: "The official version of the day was perfectly normal. The version worth telling was not.",
        payoff: `${s} left looking completely innocent, which was impressive considering the amount of evidence against that claim.`,
      };
    case "service":
      if (/housekeep|clean/i.test(prompt)) {
        return {
          encounter: `${s} finished the house so clean that the remaining dust looked less like dirt and more like a personal grudge.`,
          escalation: "The kitchen surrendered first. Then the bathrooms. By the end, every surface looked like it had been warned.",
          reflection: "The best evidence of a huge cleaning day was not the work itself. It was how strangely peaceful everything looked afterward.",
          payoff: "The final photos made the transformation obvious: this was no longer a house waiting to be cleaned; it was a house ready to be lived in again.",
        };
      }
      return {
        encounter: `${s} finished the job and left behind one unmistakable sign that the ordinary problem had finally lost the argument.`,
        escalation: "One fix exposed another, then another, until the ordinary task had quietly become a complete reset.",
        reflection: "Good service is easy to summarize. The interesting part is what the place feels like afterward.",
        payoff: "By the end, the original problem looked almost embarrassed to have ever been there.",
      };
    case "wonder":
      return {
        encounter: `${s} entered an ordinary moment that suddenly felt larger, as if the familiar world had quietly opened a second door.`,
        escalation: "The farther the moment went, the less it felt like a record of what happened and the more it felt like an invitation to keep discovering it.",
        reflection: "Some memories stay because they are important. Others stay because they make the ordinary world feel briefly enchanted.",
        payoff: `${s} left with a moment that felt bigger than the event that created it.`,
      };
    case "cinematic":
    default:
      return {
        encounter: `${s} entered an ordinary moment that seemed to acquire a second life once everyone started paying attention to it.`,
        escalation: "Then one small turn changed the atmosphere, and the moment began behaving like a story instead of a record.",
        reflection: "That is how an ordinary event becomes the part people remember.",
        payoff: `${s} left with a moment that felt larger than the event that created it.`,
      };
  }
}

function evidence(text: string): CognitiveEvidence {
  return { source: "creative_realization", detail: `created experiential scene: ${text}`, confidence: 0.9 };
}

function sceneForKind(scene: Scene, kind: CognitiveBeatKind): string | undefined {
  if (["encounter", "hook", "reveal", "discovery"].includes(kind)) return scene.encounter;
  if (["escalation", "transformation"].includes(kind)) return scene.escalation;
  if (kind === "reflection") return scene.reflection;
  if (kind === "payoff") return scene.payoff;
  return undefined;
}

export function augmentCreativeRealization(args: {
  prompt: string;
  plan: CognitiveExperiencePlan;
  premise?: CognitivePremise;
  realization: CognitiveExperienceRealization;
}): CognitiveExperienceRealization {
  const scene = sceneFor(args.prompt, args.plan, args.premise);
  if (!scene) return args.realization;
  const directives = args.realization.directives.map((directive) => {
    const text = sceneForKind(scene, directive.kind);
    if (!text) return directive;
    const created = evidence(text);
    return {
      ...directive,
      action: text,
      evidence: [...directive.evidence.filter((item) => item.source !== "creative_realization"), created].slice(0, 8),
      confidence: Math.max(directive.confidence, created.confidence),
    };
  });
  return {
    ...args.realization,
    directives,
    semanticArc: directives.map((directive) => `${directive.intent} → ${directive.stateAfter}`),
  };
}

export function realizeCreativeBeat(args: {
  prompt: string;
  plan: CognitiveExperiencePlan;
  premise?: CognitivePremise;
  beat: StoryBeat;
  baseText: string;
}): string | undefined {
  const scene = sceneFor(args.prompt, args.plan, args.premise);
  if (!scene) return undefined;
  return sceneForKind(scene, args.beat.kind) ?? args.baseText || undefined;
}
