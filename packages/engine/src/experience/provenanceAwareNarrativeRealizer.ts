import type {
  CognitiveExperiencePlan,
  CognitiveEvidence,
  CognitivePremise,
  CognitivePremiseRole,
  CognitivePremiseSlot,
  StoryBeat,
} from "@qre/contracts";
import { realizeGoldNarrativeBeat } from "./goldNarrativeRealizer.js";

/**
 * FINAL LANGUAGE AUTHORITY
 *
 * Observed prompt/context evidence has highest factual authority.
 * Derived evidence may be used only while it remains concrete.
 * Explicit creative_realization evidence may add a rhetorical lens/detail.
 * Cognitive directive action/state fields have zero factual authority.
 */

const INTERNAL_STATE = /\b(?:the situation has not been entered|the subject and situation are established|the situation is static|the current state is established|the subject is observed|the subject and situation are visibly different|the result is available|the current experience has resolved|participants are separate|a shared context exists|identity is implicit|identity is explicit|the journey is beginning|starting point is clear|the new stage is active|information is incomplete|the detail is visible|the detail is visible but disconnected|transaction context exists|engagement has begun|the target is unclear|the target is known but not actionable|guidance is available|an action has occurred|the next decision is informed|the decisive state has not resolved)\b/i;

const COGNITIVE_ONLY = /\b(?:participants?\s+can\s+affect\s+shared\s+state|adapt\s+(?:the|guidance|challenges?|content|the world)|surface\s+(?:relationships?|different content)|protect(?:ing)? private state|gate commercial behavior|new memories can change what later visitors discover|the experience can evolve|the experience becomes richer|the next experiential state|advance the selected cognitive direction|concrete reason to continue|semantic arc|story structure|interaction model|progression model|discovery model|dynamic behavior|future evolution|cognitive|hypothesis|directive|premise)\b/i;

const DELIVERY_FRAME = /\b(?:customer-facing|delivery pipeline|delivery layer|scan pipeline|qr pipeline|nfc pipeline|generated output)\b/i;
const ABSTRACT_ONLY = /\b(?:situation|experience|interaction|process|journey|moment|meaning|progression|model|state|condition|possibility|potential|context|dynamic|behavior|behaviour|development|transformation)\b/i;
const CONCRETE_OPERATION = /\b(?:groom|grooming|bath|bathing|wash|washing|brush|brushing|trim|trimming|dry|drying|pamper|pampering|massage|clean|cleaning|repair|repairing|fix|fixed|build|building|cook|cooking|bake|baking|paint|painting|decorate|decorating|travel|travelling|drive|driving|concert|birthday|wedding|recipe|watch|truck|surfboard|guitar|spa|billionaire|luxury|scavenger|clue|haunted|house|museum|robot|gas station|aliens?)\b/i;

const OBSERVED_SOURCE = new Set([
  "prompt",
  "context",
  "memory",
  "event",
  "location",
  "history",
]);

function clean(value: unknown): string {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim()
    : "";
}

function sentence(value: string): string {
  return clean(value).replace(/[.!?]+$/, "");
}

function unique(values: readonly unknown[]): string[] {
  return [...new Set(values.map(clean).filter(Boolean))];
}

function isCreativeEvidence(evidence: CognitiveEvidence): boolean {
  return evidence.source === "creative_realization";
}

function isSemanticScaffolding(value: string): boolean {
  const text = clean(value);
  if (!text) return true;
  return INTERNAL_STATE.test(text) || COGNITIVE_ONLY.test(text) || DELIVERY_FRAME.test(text);
}

function concreteEnough(value: string, role?: CognitivePremiseRole): boolean {
  const text = clean(value);
  if (!text || isSemanticScaffolding(text)) return false;
  if (role !== "outcome" && role !== "transformation" && ABSTRACT_ONLY.test(text) && !CONCRETE_OPERATION.test(text)) return false;
  if (/^(?:the|a|an)\s+(?:result|outcome|change|meaning|experience|situation|journey|interaction)$/i.test(text)) return false;
  return text.split(/\s+/).some((word) => word.replace(/[^a-z0-9'’-]/gi, "").length > 2);
}

function slotAuthority(slot: CognitivePremiseSlot): number {
  if (slot.evidence.some((evidence) => isCreativeEvidence(evidence))) return 2;
  if (slot.evidence.some((evidence) => OBSERVED_SOURCE.has(evidence.source))) return 3;
  if (slot.status === "derived") return 1;
  return 0;
}

function sanitizePremise(premise: CognitivePremise | undefined): CognitivePremise | undefined {
  if (!premise) return undefined;

  const slots = premise.slots.map((slot) => {
    const authority = slotAuthority(slot);
    const values = slot.values.filter((value) => {
      if (!concreteEnough(value, slot.role)) return false;
      if (slot.role === "emotion") return false;
      if (slot.role === "affordance") {
        return authority >= 1 && CONCRETE_OPERATION.test(value);
      }
      return authority >= 1;
    });

    return values.length ? { ...slot, values } : undefined;
  }).filter(Boolean) as CognitivePremiseSlot[];

  return { ...premise, slots };
}

function creativeDetails(beat: StoryBeat): string[] {
  return unique(
    (beat.directive?.evidence ?? [])
      .filter(isCreativeEvidence)
      .map((evidence) => {
        const text = sentence(evidence.detail);
        const separator = text.lastIndexOf(": ");
        return separator >= 0 ? text.slice(separator + 2) : text;
      })
      .filter((value) => concreteEnough(value)),
  );
}

function concreteOperations(plan: CognitiveExperiencePlan | undefined): string[] {
  if (!plan?.premise) return [];
  return unique(
    plan.premise.slots
      .filter((slot) => slot.role === "event" || slot.role === "affordance")
      .flatMap((slot) => slot.values),
  ).filter((value) => concreteEnough(value) && CONCRETE_OPERATION.test(value));
}

function sanitizeDirective(beat: StoryBeat): StoryBeat["directive"] {
  if (!beat.directive) return undefined;
  return {
    ...beat.directive,
    action: "",
    stateBefore: "",
    stateAfter: "",
    relationalFocus: [],
  };
}

function sanitizePlan(plan: CognitiveExperiencePlan): CognitiveExperiencePlan {
  const premise = sanitizePremise(plan.premise);
  const centralSubject =
    premise?.slots.find((slot) => slot.role === "subject")?.values[0]
    ?? clean(plan.centralSubject);

  return {
    ...plan,
    centralSubject,
    premise,
    realization: plan.realization
      ? {
          ...plan.realization,
          directives: plan.realization.directives.map((directive) => ({
            ...directive,
            action: "",
            stateBefore: "",
            stateAfter: "",
            relationalFocus: [],
          })),
        }
      : plan.realization,
  };
}

function sanitizeBeat(beat: StoryBeat): StoryBeat {
  return {
    ...beat,
    entities: unique((beat.entities ?? []).filter((value) => concreteEnough(value))),
    directive: sanitizeDirective(beat),
  };
}

function ensureConcreteTransformation(
  text: string,
  beat: StoryBeat,
  plan: CognitiveExperiencePlan,
): string {
  if (beat.kind !== "transformation") return text;

  const lowerText = text.toLowerCase();
  if (/\b(?:change|changed|different|groom|bath|wash|clean|repair|fix|pamper|fresh|relax|transform)\b/i.test(lowerText)) {
    return text;
  }

  const operation = concreteOperations(plan)[0];
  if (!operation) return text;

  return `By the end, ${sentence(operation).toLowerCase()} had changed the picture.`;
}

function ensureCreativeDetail(text: string, beat: StoryBeat, detail: string | undefined): string {
  if (!detail) return text;
  const base = sentence(text);
  if (base.toLowerCase().includes(detail.toLowerCase())) return `${base}.`;

  switch (beat.kind) {
    case "hook":
    case "encounter":
    case "discovery":
    case "reveal":
      return `${base}. And then ${sentence(detail).toLowerCase()}.`;
    case "escalation":
      return `${base}. By then, ${sentence(detail).toLowerCase()}.`;
    case "payoff":
      return `${base}. That was the detail that stayed: ${sentence(detail).toLowerCase()}.`;
    default:
      return `${base}. One detail made it more interesting: ${sentence(detail).toLowerCase()}.`;
  }
}

export function realizeProvenanceAwareBeat(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string | undefined {
  if (!plan?.premise) return undefined;

  const safePlan = sanitizePlan(plan);
  const safeBeat = sanitizeBeat(beat);
  const base = realizeGoldNarrativeBeat(safeBeat, safePlan);
  if (!base) return undefined;

  const transformed = ensureConcreteTransformation(base, beat, safePlan);
  const creative = creativeDetails(beat)[0];
  return ensureCreativeDetail(transformed, beat, creative);
}
