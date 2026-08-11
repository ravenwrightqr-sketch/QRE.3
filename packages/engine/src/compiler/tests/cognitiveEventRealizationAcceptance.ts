import { compileCognitiveExperience } from "../../experience/cognitiveExperienceCompiler.js";
import { isGenericCompilerProse } from "../../experience/premiseRealizer.js";

const OBSERVABLE = /\b(?:arrives?|enters?|crosses?|encounters?|notices?|finds?|sees?|discovers?|handles?|touches?|uses?|opens?|closes?|moves?|returns?|adds?|shares?|gives?|brings?|takes?|shows?|records?|writes?|reads?|follows?|chooses?|responds?|inspects?|cleans?|washes?|grooms?|serves?|plays?|collects?|keeps?|preserves?|reaches?|earns?|claims?|owns?|changes?|reveals?|places?|leaves?|picks?|carries?|visits?|meets?|watches?|hears?|smells?|tastes?|looks?|holds?|builds?|repairs?|restores?|prepares?|delivers?|documents?|photographs?|saves?|stores?|remembers?|recognizes?|compares?|connects?|continues?)\b/i;
const TRANSITION = /\b(?:changes?|changed|becomes?|became|different|result|consequence|because|after|now|then|next|remains?|contains?|available|visible|unresolved|hidden|unknown|another|again|further|more|larger|bigger)\b/i;

const probes = [
  {
    name: "service evidence survives",
    prompt: "A housekeeper documents a client's home after a huge cleaning day.",
    evidence: "cleaning",
  },
  {
    name: "shared memory becomes an event",
    prompt: "Create a funny birthday memory that family members can keep adding to.",
    evidence: "birthday",
  },
  {
    name: "escalation becomes observable",
    prompt: "Create an absurd luxury spa experience for a billionaire.",
    mechanic: "escalation",
  },
  {
    name: "suspense remains experiential",
    prompt: "Make a genuinely terrifying haunted-house experience.",
    mechanic: "suspense",
  },
  {
    name: "artifact memory stays concrete",
    prompt: "Turn this concert QR into something people will remember.",
    mechanic: "memory",
  },
];

for (const probe of probes) {
  const result = compileCognitiveExperience(probe.prompt);
  const beats = result.story.beats;
  const text = beats.map((beat) => beat.text).join(" ");

  if (!beats.length) throw new Error(`${probe.name}: no beats were realized`);
  if (isGenericCompilerProse(text)) throw new Error(`${probe.name}: generic compiler prose survived`);
  if (!beats.some((beat) => OBSERVABLE.test(beat.text) || TRANSITION.test(beat.text))) {
    throw new Error(`${probe.name}: no observable event survived realization`);
  }

  if (probe.evidence && !text.toLowerCase().includes(probe.evidence.toLowerCase())) {
    throw new Error(`${probe.name}: prompt evidence '${probe.evidence}' disappeared`);
  }

  if (probe.mechanic === "escalation") {
    const escalation = beats.find((beat) => beat.kind === "escalation");
    if (!escalation || !/\b(?:another|again|further|more|larger|bigger|adds?|changes?|exceed|beyond)\b/i.test(escalation.text)) {
      throw new Error(`${probe.name}: escalation did not become an observable change`);
    }
  }

  if (probe.mechanic === "memory") {
    const memoryBeat = beats.find((beat) => /origin|reflection|encounter/.test(beat.kind));
    if (!memoryBeat || !OBSERVABLE.test(memoryBeat.text)) {
      throw new Error(`${probe.name}: memory did not become an observable event`);
    }
  }

  if (probe.mechanic === "suspense") {
    const suspenseText = beats.map((beat) => beat.text).join(" ");
    if (!/\b(?:hidden|unknown|unresolved|danger|threat|uncertain|unseen|mysterious|reveals?|finds?|discovers?)\b/i.test(suspenseText)) {
      throw new Error(`${probe.name}: suspense lost its observable uncertainty/threat evidence`);
    }
  }
}

console.log("✓ observable cognitive event realization acceptance passed");
