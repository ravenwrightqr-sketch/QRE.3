export type HumanStoryBeat = {
  order: number;
  text: string;
  source: string;
  invented: boolean;
};

const clean = (value: string) => value.replace(/\s+/g, " ").trim();
const lower = (value: string) => clean(value).toLowerCase();

/**
 * Experimental source-first storyteller.
 *
 * The important experiment is architectural: do not manufacture a story
 * from extracted nouns. Preserve the user's actual event clauses first,
 * then add only connective language. This is deliberately independent of
 * the existing premise/super-story realization stack.
 */
function sourceClauses(prompt: string): string[] {
  return clean(prompt)
    .replace(/\s+(?:—|–)\s+/g, ". ")
    .split(
      /(?<=[.!?])\s+|\s*;\s+|\s+(?=(?:then|after that|afterwards|finally|but then|and then)\b)/i,
    )
    .map(clean)
    .filter(Boolean);
}

function narrativePrompt(prompt: string): boolean {
  return (
    /\b(?:walked|went|came|entered|returned|chewed|shook|gave|made|finished|found|lost|ran|laughed|cried|opened|closed|left|arrived|called|started|stopped)\b/i.test(
      prompt,
    ) && !/^(?:make|create|build|turn|write|design|generate)\b/i.test(prompt.trim())
  );
}

function connective(index: number, total: number): string {
  if (index === 1) return "Then ";
  if (index === total - 1) return total > 2 ? "By the end, " : "Then ";
  return "After that, ";
}

function lowercaseLead(value: string): string {
  const text = clean(value);
  return text ? text.charAt(0).toLowerCase() + text.slice(1) : text;
}

function requestShape(prompt: string): string {
  return clean(
    prompt
      .replace(/^make\s+(?:this|that)\s+/i, "")
      .replace(/^make\s+(?:a|an|the)\s+/i, "")
      .replace(/^create\s+(?:a|an|the)\s+/i, "")
      .replace(/^build\s+(?:a|an|the)\s+/i, "")
      .replace(/^turn\s+(?:this|that)\s+/i, "")
      .replace(/^write\s+(?:a|an|the)\s+/i, ""),
  );
}

function nounPhrase(prompt: string): string {
  const text = requestShape(prompt);
  const match = text.match(
    /\b(?:dog groomer|housekeeper|birthday|wedding|concert|product launch|spa|scavenger hunt|family recipe|haunted house|watch|artifact|art portal|launch)\b/i,
  );
  return match?.[0] ?? "the moment";
}

function tone(prompt: string): string | undefined {
  const match = prompt.match(
    /\b(funny|fun|playful|absurd|ridiculous|wild|crazy|terrifying|scary|boring|luxury|romantic|surprising)\b/i,
  );
  return match?.[1]?.toLowerCase();
}

/**
 * A deliberately small experimental generator.
 *
 * Narrative prompts are treated as source material, not as bags of nouns.
 * Request prompts get a minimal causal frame so we can compare this against
 * the existing keyword/realizer pipeline without contaminating it.
 */
export function realizeHumanStory(prompt: string): HumanStoryBeat[] {
  const clauses = sourceClauses(prompt);

  if (clauses.length >= 2 && narrativePrompt(prompt)) {
    return clauses.map((clause, index) => ({
      order: index,
      text:
        index === 0
          ? clause
          : connective(index, clauses.length) + lowercaseLead(clause),
      source: clause,
      invented: false,
    }));
  }

  const subject = nounPhrase(prompt);
  const requestedTone = tone(prompt);
  const base = requestShape(prompt);
  const beats: HumanStoryBeat[] = [
    {
      order: 0,
      text: `It starts with ${base.replace(/[.!?]+$/, "")}.`,
      source: prompt,
      invented: true,
    },
  ];

  if (requestedTone) {
    beats.push({
      order: beats.length,
      text:
        requestedTone === "boring"
          ? `The ${subject.toLowerCase()} needs something to happen before anyone cares.`
          : `The ${subject.toLowerCase()} gets a little ${requestedTone}.`,
      source: requestedTone,
      invented: true,
    });
  }

  beats.push({
    order: beats.length,
    text: `That gives ${subject.toLowerCase()} a reason to keep moving.`,
    source: subject,
    invented: true,
  });

  beats.push({
    order: beats.length,
    text: `And now there is a moment worth carrying forward.`,
    source: "causal-closure",
    invented: true,
  });

  return beats;
}

export function formatHumanStory(prompt: string): string {
  return realizeHumanStory(prompt)
    .map((beat) => `${beat.order + 1}. ${beat.text}`)
    .join("\n");
}
