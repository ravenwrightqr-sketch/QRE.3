import type { CognitiveExperiencePlan, StoryBeat } from "@qre/contracts";

const clean = (value: unknown): string => typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
const unique = (values: readonly unknown[]): string[] => [...new Set(values.map(clean).filter(Boolean))];
const sentence = (value: string): string => clean(value).replace(/[.!?]+$/, "");
const cap = (value: string): string => {
  const s = sentence(value);
  return s ? s[0]!.toUpperCase() + s.slice(1) : "";
};

const ABSTRACT = /\b(?:cognitive|compiler|premise|directive|semantic|realization|realizer|experience plan|story structure|interaction model|situation|experience|interaction|process|journey|meaning|progression|model|state|condition|possibility|potential|context|result|outcome|change|transformation|development|behavior|behaviour|reason to continue|new memories can change what later visitors discover)\b/i;
const DELIVERY = /\b(?:receipt|prompt|customer-facing|generated output|client|customer|audience|user|send|sending|share|sharing)\b/i;

function values(plan: CognitiveExperiencePlan | undefined, role: string): string[] {
  return unique(plan?.premise?.slots.filter(slot => slot.role === role).flatMap(slot => slot.values) ?? []);
}

function usable(value: string): boolean {
  const s = sentence(value);
  return Boolean(s) && !ABSTRACT.test(s) && !DELIVERY.test(s);
}

function events(plan?: CognitiveExperiencePlan): string[] {
  return values(plan, "event").filter(usable);
}

function subject(plan?: CognitiveExperiencePlan, beat?: StoryBeat): string {
  return clean(plan?.centralSubject) || clean(plan?.premise?.slots.find(slot => slot.role === "subject")?.values[0]) || clean(beat?.directive?.subject) || "the subject";
}

function normalizeEvent(raw: string, name: string): string {
  let text = sentence(raw)
    .replace(/^\s*(?:show|make|create|tell|write|give|send)\s+/i, "")
    .replace(/^\s*(?:and|then)\s+/i, "");

  const n = name.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");
  text = text
    .replace(new RegExp(`^${n}\\s+arriving$`, "i"), `${name} arrived`)
    .replace(new RegExp(`^${n}\\s+getting\\s+(.+)$`, "i"), `${name} got $1`)
    .replace(new RegExp(`^${n}\\s+looking\\s+(.+)$`, "i"), `${name} looked $1`)
    .replace(new RegExp(`^${n}\\s+being\\s+(.+)$`, "i"), `${name} was $1`)
    .replace(/^getting\s+(.+)$/i, `${name} got $1`)
    .replace(/^looking\s+(.+)$/i, `${name} looked $1`)
    .replace(/^being\s+(.+)$/i, `${name} was $1`);

  return cap(text);
}

function finalState(plan?: CognitiveExperiencePlan): string | undefined {
  const candidates = [...values(plan, "transformation"), ...values(plan, "outcome")].filter(usable);
  return candidates.at(-1);
}

function evidenceIndex(kind: StoryBeat["kind"], order: number, length: number): number {
  if (length <= 1) return 0;
  if (kind === "orientation") return 0;
  if (kind === "payoff") return length - 1;
  if (kind === "transformation") return Math.max(0, length - 2);
  if (kind === "feedback") return Math.min(length - 1, Math.max(1, order));
  if (["action", "origin", "encounter", "hook", "threshold"].includes(kind)) return Math.min(length - 1, length <= 2 ? 0 : order);
  return Math.min(length - 1, order);
}

export function realizeObservedEventBeat(beat: StoryBeat, plan?: CognitiveExperiencePlan): string | undefined {
  const bank = events(plan);
  if (!bank.length) return undefined;
  const name = subject(plan, beat);
  const index = evidenceIndex(beat.kind, beat.order, bank.length);
  const chosen = bank[index] ?? bank[bank.length - 1];
  const normalized = normalizeEvent(chosen, name);

  switch (beat.kind) {
    case "orientation":
    case "action":
    case "encounter":
    case "hook":
    case "origin":
    case "threshold":
    case "challenge":
    case "contribution":
    case "discovery":
    case "reveal":
    case "escalation":
      return normalized;
    case "feedback": {
      const next = bank[Math.min(bank.length - 1, index + 1)] ?? finalState(plan) ?? chosen;
      return `The result was already visible: ${normalizeEvent(next, name).toLowerCase()}.`;
    }
    case "transformation": {
      if (bank.length >= 2) {
        const first = normalizeEvent(bank[Math.max(0, bank.length - 2)], name).toLowerCase();
        const last = normalizeEvent(bank[bank.length - 1], name).toLowerCase();
        const subjectPattern = new RegExp(`^${name.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}\\s+`, "i");
        const joinedLast = last.replace(subjectPattern, "");
        return `By the end, ${sentence(first)} and ${joinedLast}.`;
      }
      const state = finalState(plan) ?? bank[0];
      return state ? `By the end, ${sentence(normalizeEvent(state, name)).toLowerCase()}.` : undefined;
    }
    case "reflection":
      return `Looking back, ${normalized.toLowerCase()}.`;
    case "milestone":
      return `That marked the change: ${normalized.toLowerCase()}.`;
    case "payoff":
      return normalized;
    default:
      return undefined;
  }
}
