import { process } from "zod/v4/core";
import { authorMicroBeats } from "./src/services/microBeatMouth.js";
import type { ExperiencePresenceContext } from "@qre/contracts";

type Case = {
  name: string;
  prompt: string;
  subject?: string;
  facts: string[];
  sourceMoments: string[];
  lens?: string;
  round?: number;
  presence?: ExperiencePresenceContext;
  expectedBeatCount: number;
};

const cases: Case[] = [
  {
    name: "COCO",
    prompt: "Make a living memory story for Coco's dog tag.",
    subject: "Coco",
    facts: ["Coco is a poodle", "hates bows", "loves treats", "scared at first", "happy after"],
    sourceMoments: ["grooming visit", "pink bow"],
    lens: "funny, affectionate, slightly fierce",
    expectedBeatCount: 4,
  },
  {
    name: "COCO-RETURN",
    prompt: "Write Coco's second grooming chapter using what we already know plus today's update.",
    subject: "Coco",
    facts: ["Coco is a poodle", "hates bows", "loves treats", "scared at first"],
    sourceMoments: ["bath was faster today", "pink bow offered again", "Coco walked out proud"],
    lens: "callback comedy",
    round: 2,
    presence: { visitNumber: 2, isReturning: true, summary: ["returning visit"], places: ["groomer"], firstSeenAt: null, lastSeenAt: null },
    expectedBeatCount: 4,
  },
  {
    name: "MARIA",
    prompt: "Make a short new-world receipt for Maria's cleaning visit.",
    facts: ["Maria arrived at 9:04 AM", "bathrooms", "kitchen", "laundry", "finished at 11:47 AM"],
    sourceMoments: ["one cleaning visit"],
    lens: "service receipt with attitude",
    expectedBeatCount: 5,
  },
  {
    name: "HORROR",
    prompt: "Turn an ordinary dinner into a slow, unavoidable horror sequence while everyone keeps calmly talking.",
    facts: ["dinner", "wine", "conversation", "doors slam", "glass breaks", "knives fly past us"],
    sourceMoments: ["everyone continued discussing the day prior"],
    lens: "calm human behavior while reality breaks",
    expectedBeatCount: 5,
  },
  {
    name: "RAVE",
    prompt: "Make this rave attendance feel like a living memory.",
    facts: ["rave", "friends dancing", "bass", "late night", "we stayed"],
    sourceMoments: ["attendance at the event"],
    lens: "specific, kinetic, memorable",
    presence: { visitNumber: 1, isReturning: false, summary: ["presence at rave"], places: ["event venue"], firstSeenAt: null, lastSeenAt: null },
    expectedBeatCount: 5,
  },
];

const moodOnly = /^(?:electric magic|late-night vibes|happy heart|grooming terror|pink bow panic|treats soothe|proud walk|new normal|pure joy|breathtaking bass|magical moment|beautiful moment|unforgettable moment|good vibes|happy ending|so much fun|love wins|dream come true|full of joy|full of magic|pure magic)$/i;
const nounOnly = /^(?:dinner|wine|conversation|rave|bass|bathrooms?|kitchen|laundry|grooming|bow|bows|treats?|fear|joy|magic|vibes?|night|morning|afternoon|evening|house|home|water|glass|knives?|chairs?|mirror|party|friends?|music|salon|poodle|dog|tag)$/i;
const semanticMovement = /\b(?:am|are|be|became|becomes|been|being|breaks?|barks?|backs?|blinks?|caught|changes?|changed|closes?|conquers?|cracks?|dances?|defeats?|disappears?|drinks?|echoes?|enters?|falls?|feels?|flies?|freezes?|gets?|gives?|goes?|grabs?|hates?|has|have|hits?|jumps?|keeps?|knows?|lands?|laughs?|leaves?|likes?|loves?|loses?|looks?|meets?|moves?|opens?|passes?|pours?|pulls?|refuses?|remembers?|returns?|rings?|runs?|sees?|shakes?|shifts?|sits?|slams?|sniffs?|spills?|spots?|stares?|stays?|steals?|stops?|talks?|takes?|turns?|waits?|walks?|wants?|watches?|wags?|wins?|works?|appears?|vanishes?|accepts?|reconsiders?|continues?|ignores?|offers?|starts?|finds?|reveals?|follows?|fades?|rises?|drops?|still|again|back|next|ready|gone|finally|already|proud|quiet|louder|closer|farther|faster|slower|caught|free|safe|stuck|waiting|winning|losing|different|afraid|nervous|calm|suspicious|relieved|late|early|alive|dead)\b/i;

let failures = 0;

for (const test of cases) {
  const started = Date.now();
  console.log("\n" + "=".repeat(100));
  console.log(test.name);
  console.log("PROMPT:", test.prompt);

  try {
    const beats = await authorMicroBeats({
      prompt: test.prompt,
      subject: test.subject,
      facts: test.facts,
      sourceMoments: test.sourceMoments,
      lens: test.lens,
      round: test.round,
      presence: test.presence,
    });

    console.log("TIME:", ((Date.now() - started) / 1000).toFixed(3), "s");
    console.log("BEATS:", beats.length);

    if (beats.length !== test.expectedBeatCount) {
      failures += 1;
      console.error(`FAIL beat count: expected ${test.expectedBeatCount}, got ${beats.length}`);
    }

    beats.forEach((beat, index) => {
      const text = beat.text.trim();
      const count = text.split(/\s+/).filter(Boolean).length;
      console.log(`[${index + 1}] ${beat.kind} · ${text} (${count}w${beat.callback ? ", callback" : ""})`);

      if (count > 7) {
        failures += 1;
        console.error(`FAIL word ceiling: beat ${index + 1} has ${count} words`);
      }
      if (/[|;]/.test(text)) {
        failures += 1;
        console.error(`FAIL chained beat: ${text}`);
      }
      if (moodOnly.test(text)) {
        failures += 1;
        console.error(`FAIL mood-only beat: ${text}`);
      }
      if (nounOnly.test(text)) {
        failures += 1;
        console.error(`FAIL noun-only beat: ${text}`);
      }
      if (count >= 2 && !semanticMovement.test(text) && !/[!?]$/.test(text)) {
        failures += 1;
        console.error(`FAIL weak semantic movement: ${text}`);
      }
    });

    if (beats.length && beats.at(-1)?.kind !== "payoff") {
      failures += 1;
      console.error("FAIL final beat is not payoff");
    }

    if ((test.round ?? 1) > 1 && !beats.some((beat) => beat.callback)) {
      failures += 1;
      console.error("FAIL returning chapter has no callback beat");
    }
  } catch (error) {
    failures += 1;
    console.error("AUTHOR ERROR:", error instanceof Error ? error.message : error);
  }
}

console.log("\n" + "=".repeat(100));
console.log("AUTHOR MOUTH QUALITY SUITE COMPLETE");
console.log("FAILURES:", failures);
if (failures > 0) process.exitCode = 1;
