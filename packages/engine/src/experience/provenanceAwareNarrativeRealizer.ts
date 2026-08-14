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
 * Cognitive directive state fields have zero factual authority.
 *
 * A directive action may survive only as presentation language when it is
 * concrete enough to describe an actual operation; it is never promoted into
 * the premise as an observed fact.
 */

const INTERNAL_STATE = /\b(?:the situation has not been entered|the subject and situation are established|the situation is static|the current state is established|the subject is observed|the subject and situation are visibly different|the result is available|the current experience has resolved|participants are separate|a shared context exists|identity is implicit|identity is explicit|the journey is beginning|starting point is clear|the new stage is active|information is incomplete|the detail is visible|the detail is visible but disconnected|transaction context exists|engagement has begun|the target is unclear|the target is known but not actionable|guidance is available|an action has occurred|the next decision is informed|the decisive state has not resolved)\b/i;

const COGNITIVE_ONLY = /\b(?:participants?\s+can\s+affect\s+shared\s+state|adapt\s+(?:the|guidance|challenges?|content|the world)|surface\s+(?:relationships?|different content)|protect(?:ing)? private state|gate commercial behavior|new memories can change what later visitors discover|the experience can evolve|the experience becomes richer|the next experiential state|advance the selected cognitive direction|concrete reason to continue|semantic arc|story structure|interaction model|progression model|discovery model|dynamic behavior|future evolution|cognitive|hypothesis|directive|premise)\b/i;

const DELIVERY_FRAME = /\b(?:customer-facing|delivery pipeline|delivery layer|scan pipeline|qr pipeline|nfc pipeline|generated output)\b/i;
const ABSTRACT_ONLY = /\b(?:situation|experience|interaction|process|journey|moment|meaning|progression|model|state|condition|possibility|potential|context|dynamic|behavior|behaviour|development|transformation)\b/i;
const PRESENTABLE_ACTION = /\b(?:arriv|enter|walk|go|went|come|came|leave|left|return|groom|clean|wash|repair|fix|restore|build|make|create|cook|bake|serve|prepare|open|close|visit|travel|drive|ride|paint|dance|sing|play|choose|pick|decide|touch|hold|wear|taste|smell|look|see|watch|share|give|take|bring|receive|check|inspect|test|measure|install|remove|change|turn|finish|complete|celebrat|marry|photograph|capture|record|teach|learn|discover|find|collect|organize|decorate|style|trim|cut|brush|dry|massage|relax|pamper|spoil|treat|notice|recognize|remember|preserve|document|follow|add|continue)\w*\b/i;

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
  if (role !== "outcome" && role !== "transformation" && ABSTRACT_ONLY.test(text)) return false;
  if (/^(?:the|a|an)\s+(?:result|outcome|change|meaning|experience|situation|journey|interaction)$/i.test(text)) return false;
  return text.split(/\s+/).some((word) => word.replace(/[^a-z0-9'’-]/gi, "").length > 2);
}

function slotAuthority(slot: CognitivePremiseSlot): number {
  // Observed evidence must outrank creative evidence even when a slot contains
  // both. Creative material is never allowed to upgrade a factual claim.
  if (slot.evidence.some((evidence) => OBSERVED_SOURCE.has(evidence.source))) return 3;
  if (slot.evidence.some(isCreativeEvidence)) return 2;
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
      if (slot.role === "affordance") return authority >= 1;
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

function observedPresentationEvidence(plan: CognitiveExperiencePlan): string[] {
  if (!plan.premise) return [];

  return unique(
    plan.premise.slots
      .filter((slot) =>
        slot.evidence.some((evidence) => OBSERVED_SOURCE.has(evidence.source)) ||
        slot.status === "derived",
      )
      .flatMap((slot) => slot.values.map((value) => ({ value, role: slot.role })))
      .filter(({ value, role }) => concreteEnough(value, role))
      .map(({ value }) => value),
  );
}

function directiveAction(beat: StoryBeat): string | undefined {
  const action = sentence(beat.directive?.action ?? "");
  if (!action || isSemanticScaffolding(action)) return undefined;
  if (!PRESENTABLE_ACTION.test(action)) return undefined;
  return action;
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

function sanitizeBeat(beat: StoryBeat, plan: CognitiveExperiencePlan): StoryBeat {
  const observed = observedPresentationEvidence(plan);
  const entities = unique([
    ...(beat.entities ?? []),
    ...observed,
  ].filter((value) => concreteEnough(value)));

  return {
    ...beat,
    entities,
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

  const operation = observedPresentationEvidence(plan).find((value) => PRESENTABLE_ACTION.test(value));
  if (!operation) return text;

  return `By the end, ${sentence(operation).toLowerCase()} had changed the picture.`;
}

function ensureDirectiveAction(text: string, beat: StoryBeat): string {
  const action = directiveAction(beat);
  if (!action) return text;
  if (text.toLowerCase().includes(action.toLowerCase())) return text;

  // This preserves concrete semantic action as presentation language without
  // treating the directive as an observed world fact.
  if (beat.kind === "instruction" || beat.kind === "next_step") {
    return `${sentence(text)}. The next move was to ${action.toLowerCase()}.`;
  }

  if (beat.kind === "reflection") {
    return `${sentence(text)}. The story carried forward the instruction to ${action.toLowerCase()}.`;
  }

  return `${sentence(text)}. The action was to ${action.toLowerCase()}.`;
}

function ensureCreativeDetailOnce(text: string, beat: StoryBeat, detail: string | undefined): string {
  if (!detail || beat.kind !== "payoff") return text;
  const base = sentence(text);
  if (base.toLowerCase().includes(detail.toLowerCase())) return `${base}.`;
  return `${base}. That was the detail that stayed: ${sentence(detail).toLowerCase()}.`;
}

export function realizeProvenanceAwareBeat(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string | undefined {
  if (!plan?.premise) return undefined;

  const safePlan = sanitizePlan(plan);
  const safeBeat = sanitizeBeat(beat, safePlan);
  const base = realizeGoldNarrativeBeat(safeBeat, safePlan);
  if (!base) return undefined;

  const transformed = ensureConcreteTransformation(base, beat, safePlan);
  const withAction = ensureDirectiveAction(transformed, beat);
  const creative = creativeDetails(beat)[0];
  return ensureCreativeDetailOnce(withAction, beat, creative);
}

export function realizeProvenanceAwareBeats(
  beats: StoryBeat[],
  plan?: CognitiveExperiencePlan,
): StoryBeat[] {
  if (!plan?.premise) return beats;

  const rendered = beats.map((beat) => ({
    ...beat,
    text: realizeProvenanceAwareBeat(beat, plan) ?? beat.text,
  }));

  // Final lexical conservation pass. Any observed/derived concrete evidence
  // that still disappeared from presentation is attached once, near the end,
  // instead of being repeated across every beat.
  const storyText = rendered.map((beat) => beat.text).join(" ").toLowerCase();
  const missing = observedPresentationEvidence(plan)
    .filter((value) => !storyText.includes(value.toLowerCase()))
    .slice(0, 6);

  if (!missing.length) return rendered;

  const payoffIndex = Math.max(0, rendered.findIndex((beat) => beat.kind === "payoff"));
  const index = payoffIndex >= 0 ? payoffIndex : rendered.length - 1;
  const beat = rendered[index];
  const conserved = missing.join(", ");

  rendered[index] = {
    ...beat,
    text: `${sentence(beat.text)}. The details that stayed were ${conserved}.`,
  };

  return rendered;
}
