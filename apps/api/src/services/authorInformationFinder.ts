/*
 * QRE UNIVERSAL INFORMATION FINDER
 *
 * ROLE: help a person or business supply reality without forcing a form.
 * It discovers the next highest-value missing detail from the current input.
 * It does not author the experience and does not invent facts.
 */
import { localModelGenerate } from "./localModelRuntime.js";

export type InformationFinderQuestion = {
  question: string;
  kind: "identity" | "event" | "distinctive-detail" | "change" | "place" | "time" | "relationship" | "business-context";
  why: string;
};

export type InformationFinderResult = {
  questions: InformationFinderQuestion[];
  model: string;
  modelCalls: number;
};

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const parseJson = (text: string): Record<string, unknown> | undefined => {
  const cleaned = clean(text).replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try {
    const value = JSON.parse(cleaned);
    return value && typeof value === "object" ? value as Record<string, unknown> : undefined;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start < 0 || end <= start) return undefined;
    try {
      const value = JSON.parse(cleaned.slice(start, end + 1));
      return value && typeof value === "object" ? value as Record<string, unknown> : undefined;
    } catch {
      return undefined;
    }
  }
};

function fallbackQuestions(prompt: string, business: boolean): InformationFinderQuestion[] {
  const text = clean(prompt).toLowerCase();
  const questions: InformationFinderQuestion[] = [];
  if (!text || !/\b(?:who|what|this is|about)\b/i.test(text)) {
    questions.push({ question: "Who or what is this about?", kind: "identity", why: "The subject gives the experience an identity." });
  }
  if (!/\b(?:happened|did|went|came|arrived|left|made|got|had|saw|met|cleaned|bought|sold|visited|played|worked|loved|kept)\b/i.test(text)) {
    questions.push({ question: "What happened?", kind: "event", why: "An actual event gives Author something to move, not just describe." });
  }
  questions.push({ question: business ? "What happened that a customer would remember?" : "What detail would you still remember later?", kind: "distinctive-detail", why: "Distinctive supplied details give Author material to connect." });
  return questions.slice(0, 3);
}

export async function findNextInformation(input: {
  prompt: string;
  subject?: string;
  accountType?: "consumer" | "business";
  knownQuestions?: string[];
}): Promise<InformationFinderResult> {
  const prompt = clean(input.prompt);
  const subject = clean(input.subject);
  const business = input.accountType === "business";
  try {
    const result = await localModelGenerate([
      {
        role: "system",
        content: [
          "You are QRE's UNIVERSAL INFORMATION FINDER, not an author.",
          "Your job is to help a person or business add real information that makes a later QRE experience richer.",
          "Ask for facts, details, changes, relationships, places, times, or distinctive moments that can actually be known by the user.",
          "Never ask leading questions that assume an event happened. Never invent context. Never push the user into a domain-specific story template.",
          "For sparse input, prefer one easy concrete question at a time. For richer input, ask only for the single highest-value missing detail.",
          business ? "This is a business account, but the questions remain universal: focus on what customers actually experienced, what happened, what changed, or what makes this particular business reality distinctive." : "This is a consumer account: focus on the person, thing, place, event, relationship, or memory actually being supplied.",
          "Do not ask about creative style, lens, movie structure, cinematic language, or what the user wants the audience to feel. Author handles that later.",
          "Return JSON only: {questions:[{question,kind,why}]} with 1-3 questions.",
        ].join("\n"),
      },
      {
        role: "user",
        content: JSON.stringify({ prompt, subject, accountType: input.accountType ?? "consumer", knownQuestions: (input.knownQuestions ?? []).slice(-10) }),
      },
    ], "json", { numPredict: 700, temperature: 0.35 });

    const parsed = parseJson(result.text);
    const raw = Array.isArray(parsed?.questions) ? parsed.questions : [];
    const questions = raw.map((value): InformationFinderQuestion | undefined => {
      if (!value || typeof value !== "object") return undefined;
      const row = value as Record<string, unknown>;
      const question = clean(row.question);
      if (!question || question.length > 140) return undefined;
      const kind = ["identity", "event", "distinctive-detail", "change", "place", "time", "relationship", "business-context"].includes(clean(row.kind))
        ? clean(row.kind) as InformationFinderQuestion["kind"]
        : "distinctive-detail";
      return { question, kind, why: clean(row.why) || "This can add useful supplied reality." };
    }).filter((value): value is InformationFinderQuestion => Boolean(value)).slice(0, 3);

    return {
      questions: questions.length ? questions : fallbackQuestions(prompt, business),
      model: result.model,
      modelCalls: 1,
    };
  } catch {
    return { questions: fallbackQuestions(prompt, business), model: "fallback", modelCalls: 0 };
  }
}
