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
 * The customer-language layer may use:
 *   1. observed prompt/context evidence;
 *   2. derived concrete evidence when it is still concrete;
 *   3. explicitly tagged creative realization as a rhetorical lens/detail.
 *
 * It may NEVER use cognitive directive state/action as factual evidence.
 * Directive stateBefore/stateAfter are semantic scaffolding, not world facts.
 */

const INTERNAL_STATE = /\b(?:the situation has not been entered|the subject and situation are established|the situation is static|the current state is established|the subject is observed|the subject and situation are visibly different|the result is available|the current experience has resolved|participants are separate|a shared context exists|identity is implicit|identity is explicit|the journey is beginning|starting point is clear|the new stage is active|information is incomplete|the detail is visible|the detail is visible but disconnected|transaction context exists|engagement has begun|the target is unclear|the target is known but not actionable|guidance is available|an action has occurred|the next decision is informed|the decisive state has not resolved)\b/i;

const COGNITIVE_ONLY = /\b(?:participants?\s+can\s+affect\s+shared\s+state|adapt\s+(?:the|guidance|challenges?|content|the world)|surface\s+(?:relationships?|different content)|protect(?:ing)? private state|gate commercial behavior|new memories can change what later visitors discover|the experience can evolve|the experience becomes richer|the next experiential state|advance the selected cognitive direction|concrete reason to continue|semantic arc|story structure|interaction model|progression model|discovery model|dynamic behavior|future evolution|cognitive|hypothesis|directive|premise)\b/i;

const DELIVERY_FRAME = /\b(?:customer-facing|delivery pipeline|delivery layer|scan pipeline|qr pipeline|nfc pipeline|generated output)\b/i;
const ABSTRACT_ONLY = /\b(?:situation|experience|interaction|process|journey|moment|meaning|progression|model|state|condition|possibility|potential|context|dynamic|behavior|behaviour|development|transformation)\b/i;

const CREATIVE_SOURCE = (evidence: CognitiveEvidence): boolean =>
  evidence.source === "creative_realization";

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

function isSemanticScaffolding(value: string): boolean {
  const text = clean(value);
  if (!text) return true;
  return INTERNAL_STATE.test(text) || COGNITIVE_ONLY.test(text) || DELIVERY_FRAME.test(text);
}

function concreteEnough(value: string, role?: CognitivePremiseRole): boolean {
  const text = clean(value);
  if (!text || isSemanticScaffolding(text)) return false;
  if (role !== "outcome" && role !== "transformation" && ABSTRACT_ONLY.test(text)) return false;
  if (/^(?:the|a|an)\s+(?:result|outcome|change|meaning|experience|situation|journey|interaction)$/i.test(text)) return false;
  return text.split(/\s+/).some((word) => word.replace(/[^a-z0-9'’-]/gi, "").length > 2);
}

function slotAuthority(slot: CognitivePremiseSlot): number {
  const sources = slot.evidence.map((evidence) => evidence.source);

  if (sources.some((source) => OBSERVED_SOURCE.has(source))) return 3;
  if (sources.some((source) => CREATIVE_SOURCE({ source: source as CognitiveEvidence["source"], detail: "", confidence: 1 }))) return 2;
  if (slot.status === "derived") return 1;
  return 0;
}

function sanitizePremise(premise: CognitivePremise | undefined): CognitivePremise | undefined {
  if (!premise) return undefined;

  const slots = premise.slots.map((slot) => {
    const authority = slotAuthority(slot);
    const values = slot.values.filter((value) => {
      if (!concreteEnough(value, slot.role)) return false;
      if (slot.role === "affordance" || slot.role === "emotion") return authority >= 3;
      return authority >= 1;
    });

    return values.length ? { ...slot, values } : undefined;
  }).filter(Boolean) as CognitivePremiseSlot[];

  return {
    ...premise,
    slots,
  };
}

function creativeDetails(beat: StoryBeat): string[] {
  return unique(
    (beat.directive?.evidence ?? [])
      .filter(CREATIVE_SOURCE)
      .map((evidence) => {
        const text = sentence(evidence.detail);
        const separator = text.lastIndexOf(": ");
        return separator >= 0 ? text.slice(separator + 2) : text;
      })
      .filter((value) => concreteEnough(value)),
  );
}

function sanitizeDirective(beat: StoryBeat): StoryBeat["directive"] {
  if (!beat.directive) return undefined;

  // Directive action/state fields are semantic instructions, not observations.
  // Keep the directive attached for provenance/debugging, but remove its
  // authority as a customer-language evidence source.
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
  const centralSubject = premise?.slots.find((slot) => slot.role === "subject")?.values[0]
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

function ensureCreativeDetail(text: string, beat: StoryBeat, detail: string | undefined): string {
  if (!detail) return text;
  const base = sentence(text);
  if (base.toLowerCase().includes(detail.toLowerCase())) return base + ".";

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
  const text = realizeGoldNarrativeBeat(safeBeat, safePlan);
  if (!text) return undefined;

  const creative = creativeDetails(beat)[0];
  return ensureCreativeDetail(text, beat, creative);
}
