import type {
  CognitiveIntent,
  CognitiveUnderstanding
} from "../types.js";

const intentSignals: Record<CognitiveIntent, string[]> = {
  remember: [
    "memory","remember","memories","past","history",
    "legacy","childhood","nostalgia","tribute","preserve"
  ],

  celebrate: [
    "birthday","wedding","anniversary","celebrate",
    "celebration","party","milestone","ceremony"
  ],

  connect: [
    "family","friend","friends","relationship",
    "together","share","connection","connect","love"
  ],

  discover: [
    "discover","explore","secret","hidden","unknown",
    "quest","adventure","journey","reveal","uncover"
  ],

  teach: [
    "learn","teach","guide","education","explain",
    "tutorial","lesson","training"
  ],

  sell: [
    "buy","sell","shop","product","customer",
    "brand","business","store","purchase","promotion"
  ],

  serve: [
    "service","appointment","booking","repair",
    "grooming","cleaning","maintenance","inspection"
  ],

  reward: [
    "reward","loyalty","exclusive","unlock",
    "vip","member","bonus","prize","perk"
  ],

  protect: [
    "protect","safety","emergency","secure",
    "security","warning","alert"
  ],

  create: [
    "create","make","build","design","write",
    "story","experience"
  ]
};

const emotionSignals: Record<string, string[]> = {
  nostalgia: [
    "memory","past","childhood","legacy",
    "remember","history","old"
  ],

  wonder: [
    "magic","amazing","universe","dream",
    "discover","secret","mystery","unknown"
  ],

  love: [
    "love","wedding","family","relationship","together"
  ],

  joy: [
    "party","birthday","celebrate","fun","happy"
  ],

  trust: [
    "brand","business","customer","safe","professional"
  ],

  excitement: [
    "vip","exclusive","event","concert",
    "festival","launch"
  ],

  fear: [
    "danger","lost","emergency","dark",
    "warning","threat"
  ]
};

const worldSignals: Record<string, string[]> = {
  memory: [
    "memory","remember","past","history",
    "legacy","childhood","nostalgia"
  ],

  wedding: [
    "wedding","bride","groom","marriage",
    "ceremony","vows","anniversary"
  ],

  relationship: [
    "love","relationship","couple","partner",
    "family","together"
  ],

  commerce: [
    "business","brand","customer","product",
    "store","shop","dispensary","dispensary"
  ],

  discovery: [
    "discover","explore","secret","hidden",
    "mystery","adventure"
  ],

  community: [
    "community","group","members","people",
    "festival","party","event"
  ]
};

function matches(
  text: string,
  signals: string[]
): boolean {
  return signals.some(signal => text.includes(signal));
}

function collect(
  text: string,
  rules: Record<string, string[]>
): string[] {
  return Object.entries(rules)
    .filter(([, signals]) => matches(text, signals))
    .map(([key]) => key);
}

function extractPeople(prompt: string): string[] {
  return [
    ...(prompt.match(
      /\b(?:with|by|from|for)\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)/g
    ) ?? [])
  ].map(value =>
    value
      .replace(/^(with|by|from|for)\s+/i, "")
      .trim()
  );
}

function extractPlaces(prompt: string): string[] {
  return [
    ...(prompt.match(
      /\b(?:in|at|near|inside)\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)/g
    ) ?? [])
  ].map(value =>
    value
      .replace(/^(in|at|near|inside)\s+/i, "")
      .trim()
  );
}

function extractDates(prompt: string): string[] {
  return prompt.match(
    /\b(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\b(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b)/gi
  ) ?? [];
}

function extractTimes(prompt: string): string[] {
  return prompt.match(
    /\b\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/gi
  ) ?? [];
}

function extractObjects(prompt: string): string[] {
  const text = prompt.toLowerCase();

  const vocabulary = [
    "qr",
    "tag",
    "photo",
    "photograph",
    "video",
    "album",
    "ring",
    "house",
    "car",
    "flower",
    "gift",
    "product",
    "key",
    "artifact"
  ];

  return vocabulary.filter(word =>
    text.includes(word)
  );
}

function resolveMemory(text: string) {
  return {
    past: matches(text, [
      "past","history","childhood",
      "memory","remember","old","nostalgia"
    ]),

    present: matches(text, [
      "today","now","current","moment","live"
    ]),

    future: matches(text, [
      "future","goal","dream","wish",
      "plan","vision"
    ]),

    legacy: matches(text, [
      "legacy","tribute","ancestor",
      "inherit","generations"
    ])
  };
}

function resolveAudience(
  text: string
): CognitiveUnderstanding["audience"] {

  const types: string[] = [];

  if (matches(text, [
    "family","wedding","parent",
    "child","anniversary"
  ])) {
    types.push("family");
  }

  if (matches(text, [
    "customer","business","brand",
    "store","restaurant","dispensary"
  ])) {
    types.push("customer");
  }

  if (matches(text, [
    "couple","partner","relationship",
    "wedding"
  ])) {
    types.push("couple");
  }

  if (matches(text, [
    "community","group","members",
    "people","festival"
  ])) {
    types.push("community");
  }

  if (!types.length) {
    types.push("individual");
  }

  const social: "solo" | "shared" | "community" =
    types.includes("community")
      ? "community"
      : types.length > 1
        ? "shared"
        : "solo";

  return {
    types,
    social
  };
}

export function understandPrompt(
  prompt: string
): CognitiveUnderstanding {

  const expression = prompt.trim();

  if (!expression) {
    throw new Error(
      "Cannot understand an empty prompt."
    );
  }

  const text =
    expression.toLowerCase();

  const intent = collect(
    text,
    intentSignals
  ) as CognitiveIntent[];

  const emotions =
    collect(text, emotionSignals);

  const worlds =
    collect(text, worldSignals);

  const memory =
    resolveMemory(text);

  const audience =
    resolveAudience(text);

  return {
    prompt: expression,

    intent,

    people: extractPeople(expression),

    places: extractPlaces(expression),

    objects: extractObjects(expression),

    events: [],

    dates: extractDates(expression),

    times: extractTimes(expression),

    emotions,

    memory,

    audience,

    world: {
      domains: worlds,
      primary:
        worlds[0] ?? "general"
    }
  };
}

