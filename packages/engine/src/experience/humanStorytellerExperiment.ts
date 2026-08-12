export type HumanStoryBeat = {
  order: number;
  text: string;
  source: string;
  invented: boolean;
};

const clean = (value: string) => value.replace(/\s+/g, " ").trim();
const lower = (value: string) => clean(value).toLowerCase();

function sourceClauses(prompt: string): string[] {
  return clean(prompt)
    .replace(/\s+(?:—|–)\s+/g, ". ")
    .split(/(?<=[.!?])\s+|\s*;\s+|\s+(?=(?:then|after that|afterwards|finally|but then|and then)\b)/i)
    .map(clean)
    .filter(Boolean);
}

function narrativePrompt(prompt: string): boolean {
  return /\b(?:walked|went|came|entered|returned|chewed|shook|gave|made|finished|found|lost|ran|laughed|cried|opened|closed|left|arrived|called|started|stopped|looked|said)\b/i.test(prompt) &&
    !/^(?:make|create|build|turn|write|design|generate)\b/i.test(prompt.trim());
}

function firstSubject(prompt: string): string {
  const text = clean(prompt);
  const named = text.match(/^([A-Z][A-Za-z'’-]*(?:\s+[A-Z][A-Za-z'’-]*){0,2})\s+(?:walked|went|came|entered|returned|finished|gave|looked|said|was|is|has|had)\b/);
  if (named) return named[1];
  const article = text.match(/^(?:a|an|the)\s+([A-Za-z][A-Za-z'’-]*(?:\s+[A-Za-z][A-Za-z'’-]*){0,2})\b/i);
  if (article) return article[1];
  const possessive = text.match(/^my\s+([A-Za-z][A-Za-z'’-]*(?:\s+[A-Za-z][A-Za-z'’-]*){0,2})\b/i);
  return possessive?.[1] ?? "the moment";
}

function connective(index: number, total: number, subject: string): string {
  if (index === 1) return "Then ";
  if (index === total - 1) return total > 2 ? `By the end, ${subject} ` : "Then ";
  return `After that, ${subject} `;
}

function lowercaseLead(value: string): string {
  const text = clean(value);
  return text ? text.charAt(0).toLowerCase() + text.slice(1) : text;
}

function requestShape(prompt: string): string {
  return clean(prompt
    .replace(/^make\s+(?:this|that)\s+/i, "")
    .replace(/^make\s+(?:a|an|the)\s+/i, "")
    .replace(/^create\s+(?:a|an|the)\s+/i, "")
    .replace(/^build\s+(?:a|an|the)\s+/i, "")
    .replace(/^turn\s+(?:this|that)\s+/i, "")
    .replace(/^write\s+(?:a|an|the)\s+/i, ""));
}

function subjectPhrase(prompt: string): string {
  const text = requestShape(prompt);
  const match = text.match(/\b(?:dog groomer|housekeeper|birthday|wedding|concert|product launch|spa|scavenger hunt|family recipe|haunted house|watch|artifact|art portal|launch)\b/i);
  return match?.[0] ?? firstSubject(text);
}

function has(prompt: string, pattern: RegExp): boolean {
  return pattern.test(prompt);
}

function tone(prompt: string): string | undefined {
  return prompt.match(/\b(funny|fun|playful|absurd|ridiculous|wild|crazy|terrifying|scary|boring|luxury|romantic|surprising|remember)\b/i)?.[1]?.toLowerCase();
}

function inventedFrame(prompt: string): string[] {
  const subject = subjectPhrase(prompt).toLowerCase();
  const requestedTone = tone(prompt);
  const lines: string[] = [];

  if (has(prompt, /\b(?:birthday|family|memory|keep adding|add to)\b/i)) {
    lines.push(`It starts with ${subject} and one detail worth keeping.`);
    lines.push("Then someone adds to it, and suddenly the story has another piece.");
    lines.push("Someone else tops that, because apparently one version was not enough.");
    lines.push("By the end, the memory belongs to everyone who added something to it.");
    return lines;
  }

  if (has(prompt, /\b(?:housekeeper|cleaning|cleaned|cleaning day)\b/i)) {
    lines.push(`The ${subject} starts with a house that has clearly seen a day.`);
    lines.push("Room by room, the mess gives up its argument.");
    lines.push("Then the last surface gets finished, and the whole place finally feels reset.");
    lines.push("The job is done, the difference is obvious, and the housekeeper can finally walk out of the day.");
    return lines;
  }

  if (has(prompt, /\b(?:concert|remember|artifact|art portal)\b/i)) {
    lines.push(`The ${subject} starts as something people notice.`);
    lines.push("Then one detail gives them a reason to lean in instead of simply passing by.");
    lines.push("The moment becomes something they can actually take part in.");
    lines.push("That is the part they remember when the rest of the night is already gone.");
    return lines;
  }

  if (has(prompt, /\b(?:product launch|launch)\b/i) && has(prompt, /\b(?:fun|funny|playful|boring)\b/i)) {
    lines.push("The launch starts exactly where boring launches usually start: everyone knows what is about to happen.");
    lines.push("Then something breaks the expected rhythm, and people finally look up.");
    lines.push("The product gets a moment to be experienced instead of announced.");
    lines.push("By the end, the launch feels less like a presentation and more like something people were actually part of.");
    return lines;
  }

  if (has(prompt, /\b(?:groomer|grooming|dog|poodle)\b/i)) {
    lines.push(`The ${subject} starts with a little attitude.`);
    lines.push("Then the first thing happens that makes the situation harder to take seriously.");
    lines.push("A small turn changes the mood, and the whole thing starts getting better.");
    lines.push("By the end, nobody is quite as mad as they were when they walked in.");
    return lines;
  }

  if (requestedTone === "terrifying" || requestedTone === "scary") {
    lines.push(`The ${subject} starts out safe enough.`);
    lines.push("Then one detail stops making sense.");
    lines.push("The next thing makes it impossible to ignore.");
    lines.push("By the end, getting out is the only thing that matters.");
    return lines;
  }

  if (requestedTone === "absurd" || requestedTone === "ridiculous" || requestedTone === "wild") {
    lines.push(`The ${subject} starts normally enough.`);
    lines.push("Then someone takes it one step too far.");
    lines.push("Instead of stopping, the moment doubles down.");
    lines.push("By the end, the original plan is still technically alive, but nobody is pretending it is normal anymore.");
    return lines;
  }

  if (requestedTone === "funny" || requestedTone === "fun" || requestedTone === "playful") {
    lines.push(`The ${subject} starts normally enough.`);
    lines.push("Then something goes slightly off-script.");
    lines.push("That turns into the part people actually want to keep talking about.");
    lines.push("By the end, the thing that was supposed to be ordinary has a story attached to it.");
    return lines;
  }

  if (requestedTone === "remember") {
    lines.push(`The ${subject} starts with one concrete detail.`);
    lines.push("That detail gives the moment somewhere to go.");
    lines.push("A second detail makes it stick.");
    lines.push("By the end, it is no longer just something that happened; it is the part people can retell.");
    return lines;
  }

  return [
    `The ${subject} starts with what the prompt gives us.`,
    "Then something changes the situation.",
    "That change creates the next moment.",
    "By the end, the result feels earned by what happened before it.",
  ];
}

/**
 * Experimental source-first realization.
 *
 * Narrative prompts are treated as source material. We preserve their events
 * and only supply connective tissue. Request prompts get a causal frame whose
 * vocabulary is driven by the requested mechanics rather than noun repetition.
 */
export function realizeHumanStory(prompt: string): HumanStoryBeat[] {
  const clauses = sourceClauses(prompt);
  const subject = firstSubject(prompt);

  if (clauses.length >= 2 && narrativePrompt(prompt)) {
    return clauses.map((clause, index) => ({
      order: index,
      text: index === 0 ? clause : `${connective(index, clauses.length, subject)}${lowercaseLead(clause)}`,
      source: clause,
      invented: false,
    }));
  }

  return inventedFrame(prompt).map((text, index) => ({
    order: index,
    text,
    source: index === 0 ? prompt : "causal-invention",
    invented: index > 0,
  }));
}

export function formatHumanStory(prompt: string): string {
  return realizeHumanStory(prompt)
    .map((beat) => `${beat.order + 1}. ${beat.text}`)
    .join("\n");
}
