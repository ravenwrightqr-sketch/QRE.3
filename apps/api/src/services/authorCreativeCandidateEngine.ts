import type { AuthorBrainTruth } from "@qre/contracts";
import { buildMovieCognition } from "./authorMovieCognition.js";
import { buildRealityProvenance } from "./authorRealityProvenance.js";
import { validateAuthorProvenance, type ProvenanceViolation } from "./authorProvenanceGate.js";
import { localModelGenerate } from "./localModelRuntime.js";

type Candidate = { frame: string; operation: string; lines: string[] };
type CandidateValidation = {
  ok: boolean;
  score: number;
  reasons: string[];
  provenance: ProvenanceViolation[];
  metrics: { attention: number; novelty: number; payoff: number; creative: number };
};

const META = /\b(?:as an ai|the audience|the viewer|this means|the strategy|the beat|according to qre|cognitive|the truth is|the meaning|the transformation|the symbol|the tension|the premise|the operation|the trajectory|the movie|interpretation)\b/i;
const STOCK = /\b(?:magical moment|unforgettable experience|incredible journey|newfound confidence|a testament to|making memories|cherished moment|once in a lifetime|heartwarming)\b/i;
const GLUE = /\b(?:therefore|as a result|which means|this is why|in order to|thus|ultimately)\b/i;
const PRONOUN = /\b(?:he|she|him|her|his|hers|they|them|their|theirs)\b/i;
const PLACE = /\b(?:street|office|room|chair|table|bed|floor|counter|dresser|park|restaurant|hotel|house|kitchen|bathroom|store|shop|court|church|school|hospital|lobby|door|window|hallway|garage|yard|living room|bedroom|dining room|desk|countertop|sink|trash|mirror|bar|venue|backyard|front yard|sidewalk|trail|beach)\b/i;
const OBJECT = /\b(?:towel|towels|bow|bows|ball|balls|tennis ball|toy|toys|bone|bones|treat|treats|bowl|bowls|cup|glass|plate|dish|key|keys|phone|camera|mirror|photograph|photo|letter|note|bag|box|gift|shoes|shirt|dress|ring|flowers|candle|candles|menu|carpet|pillow|blanket|soap|brush|comb|leash|collar|receipt|contract|clause|document|paper|tool|engine|wheel|tire|warning light|ribbon|stick|food|book|hat|jacket|coat|umbrella|lamp|wallet|watch)\b/i;
const BODY = /\b(?:tail|tails|legs|leg|ears|ear|paws|paw|eyes|eye|mouth|teeth|face|head|hands|hand|feet|foot|shoulder|hair|skin|body|gaze)\b/i;
const ACTION = /\b(?:came|arrived|left|got|stole|found|sent|ordered|changed|ran|returned|noticed|repaired|disappeared|stayed|moved|laughed|waited|opened|closed|called|signed|checked|cleaned|placed|listed|reviewed|diagnosed|approved|emerged|departed|took|secured|settled|turned|shifted|drew|broke|held|talked|connected|met|served|paid|showed|went|worked|walked|began|started|finished|completed|resumed|cleared|handled|acquired|returned)\b/i;
const CONTRAST = /\b(?:but|yet|still|until|instead|rather|then|suddenly|except|however|despite|temporary|again|already|finally|next|or so)\b/i;

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const words = (value: string): string[] => clean(value).toLowerCase().split(/[^a-z0-9'-]+/).filter(Boolean);
const tokens = (value: string): Set<string> => new Set(words(value).filter((word) => word.length > 2));
const overlap = (a: string, b: string): number => {
  const left = tokens(a); const right = tokens(b);
  if (!left.size || !right.size) return 0;
  let shared = 0;
  for (const token of left) if (right.has(token)) shared += 1;
  return shared / Math.max(left.size, right.size);
};
const metric = (value: number): number => Number(Math.max(0, Math.min(1, value)).toFixed(3));

function lineCount(prompt: string): number {
  const match = clean(prompt).match(/\b(\d{1,2})\s*[- ]?\s*line(?:s)?\b/i);
  const count = match ? Number(match[1]) : 5;
  return Number.isFinite(count) ? Math.max(3, Math.min(8, count)) : 5;
}

function sourceFacts(input: AuthorBrainTruth): string[] {
  return [...new Set([
    ...input.facts,
    ...input.sourceMoments,
    ...(input.trajectory ?? []),
    ...(input.memoryContext ?? []),
    ...(input.presenceSummary ?? []),
  ].map(clean).filter(Boolean))].slice(0, 80);
}

function candidatePacket(input: AuthorBrainTruth) {
  const subject = clean(input.subject) || "the subject";
  const reality = sourceFacts(input);
  const ending = clean(input.prompt.match(/(?:final\s+line|ending|endpoint)\s*:\s*(.+)$/i)?.[1] ?? "");
  const cognition = buildMovieCognition(input, ending);
  const top = cognition.hypotheses.slice(0, 6);
  const protectedMemorial = input.cognitiveContext?.creativeSafety?.class === "memorial";
  const hypotheses = protectedMemorial
    ? cognition.hypotheses.slice(0, 1).map((hypothesis) => ({ ...hypothesis, lens: { ...hypothesis.lens, id: "neutral", pressure: "Honor the supplied memory through grounded continuity without genre transformation." } }))
    : top;
  return { subject, reality, ending, cognition, hypotheses };
}

function buildPrompt(input: AuthorBrainTruth, packet: ReturnType<typeof candidatePacket>): string {
  const candidateBrief = packet.hypotheses.map((hypothesis, index) => ({
    slot: index + 1,
    frame: hypothesis.lens.id,
    operation: hypothesis.operation,
    approvedMeaning: hypothesis.premise,
    tension: hypothesis.tension,
    trajectory: hypothesis.trajectory,
    creativeMoves: hypothesis.lens.moves,
  }));
  return [
    "QRE UNIVERSAL MOUTH · CANDIDATE COMPETITION",
    "Cognition has already selected the factual trajectory and the semantic relationships. Your job is creative realization, not fact extraction.",
    `Return JSON only with exactly ${candidateBrief.length} candidates: {\"candidates\":[{\"frame\":\"...\",\"operation\":\"...\",\"lines\":[\"...\"]}]}.`,
    `Every candidate must contain exactly ${lineCount(input.prompt)} short lines. Keep every non-final line to 7 words or fewer.`,
    "Each candidate must use its assigned frame as an expressive lens. The frame may change rhythm, metaphor, status framing, implication, comedy, tension, and payoff.",
    "A frame NEVER changes reality. Do not invent people, relationships, places, rooms, objects, body details, private facts, dialogue, participants, chronology, or literal events.",
    "Do not merely paraphrase the supplied facts. Transform their presentation so each beat earns the next beat.",
    "Use the supplied trajectory in chronological order.",
    "The final line should be a creative consequence or implication earned by the supplied sequence. Avoid a generic administrative ending unless no stronger grounded realization survives.",
    "Do not put the frame name into the lines unless it naturally belongs there. The viewer should feel the frame, not be told the frame.",
    "Generate genuinely different realizations across candidates. Do not produce the same sequence with cosmetic word changes.",
    "Examples of desired behavior only: heist can make a supplied success feel like a clean getaway; spy can make a supplied progression feel like extraction; courtroom can make a supplied change feel like a verdict; game can make supplied milestones feel like progression; noir can make supplied details feel like evidence. These examples do not authorize literal props or world details.",
    JSON.stringify({
      subject: packet.subject,
      request: input.prompt,
      reality: packet.reality,
      selectedTrajectory: packet.cognition.selected.trajectory,
      candidateBrief,
      subjectModel: input.cognitiveContext?.identityState ?? null,
      goal: input.cognitiveContext?.domain?.mode ?? "experience",
      presentation: "cinematic",
    }),
  ].join("\n");
}

function parseCandidates(raw: string): Candidate[] {
  const text = clean(raw).replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  let parsed: unknown;
  try { parsed = JSON.parse(text); } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return [];
    try { parsed = JSON.parse(match[0]); } catch { return []; }
  }
  if (!parsed || typeof parsed !== "object") return [];
  const candidates = (parsed as Record<string, unknown>).candidates;
  if (!Array.isArray(candidates)) return [];
  return candidates.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const record = item as Record<string, unknown>;
    const frame = clean(record.frame);
    const operation = clean(record.operation);
    const lines = Array.isArray(record.lines) ? record.lines.map(clean).filter(Boolean) : [];
    return frame && operation && lines.length ? [{ frame, operation, lines }] : [];
  });
}

function worldViolation(line: string, reality: string[]): string | undefined {
  const known = reality.join(" ").toLowerCase();
  for (const [pattern, label] of [[PLACE, "unsupported_place"], [OBJECT, "unsupported_object"], [BODY, "unsupported_body_detail"]] as const) {
    const match = line.match(pattern)?.[0];
    if (match && !known.includes(match.toLowerCase())) return label;
  }
  return undefined;
}

function chronologicalViolation(lines: string[], reality: string[]): string | undefined {
  const ordered = reality.map((fact, index) => ({ fact, index }));
  let last = -1;
  for (const line of lines) {
    const hit = ordered
      .filter((item) => overlap(line, item.fact) >= 0.72)
      .sort((a, b) => b.fact.length - a.fact.length)[0];
    if (!hit) continue;
    if (hit.index < last) return "reordered_supplied_event";
    last = hit.index;
  }
  return undefined;
}

function semanticSignal(lines: string[], hypothesis: ReturnType<typeof buildMovieCognition>["selected"]): number {
  const raw = lines.join(" ");
  const nonliteral = lines.filter((line) => !hypothesis.trajectory.some((fact) => overlap(line, fact) >= 0.82)).length;
  const contrast = lines.filter((line) => CONTRAST.test(line)).length;
  const action = lines.filter((line) => ACTION.test(line)).length;
  const questionPull = lines.slice(0, -1).filter((line) => ACTION.test(line) || CONTRAST.test(line)).length;
  const frameMoves = (hypothesis.lens.moves ?? []).filter((move) => new RegExp(move.replace(/_/g, "\\s*"), "i").test(raw)).length;
  return metric(Math.min(1, nonliteral * 0.11 + contrast * 0.13 + action * 0.08 + questionPull * 0.08 + Math.min(0.35, frameMoves * 0.08)));
}

function validateCandidate(candidate: Candidate, input: AuthorBrainTruth, packet: ReturnType<typeof candidatePacket>, hypothesis: ReturnType<typeof candidatePacket>["hypotheses"][number]): CandidateValidation {
  const reasons: string[] = [];
  const expectedLines = lineCount(input.prompt);
  if (candidate.lines.length !== expectedLines) reasons.push("wrong_line_count");
  candidate.lines.forEach((line, index) => {
    if (!line) reasons.push(`line_${index + 1}:empty`);
    if (index < candidate.lines.length - 1 && words(line).length > 7) reasons.push(`line_${index + 1}:wrong_length`);
    if (META.test(line)) reasons.push(`line_${index + 1}:meta_language`);
    if (STOCK.test(line)) reasons.push(`line_${index + 1}:stock_sentiment`);
    if (GLUE.test(line)) reasons.push(`line_${index + 1}:explanatory_glue`);
    if (PRONOUN.test(line)) reasons.push(`line_${index + 1}:unsupported_identity_reference`);
    const world = worldViolation(line, packet.reality);
    if (world) reasons.push(`line_${index + 1}:${world}`);
  });
  const chronology = chronologicalViolation(candidate.lines, packet.reality);
  if (chronology) reasons.push(chronology);
  const provenanceFacts = packet.reality.map((text) => ({ text, provenance: buildRealityProvenance(text, "memory", { subject: packet.subject }) }));
  const provenance = validateAuthorProvenance(candidate.lines, provenanceFacts);
  for (const violation of provenance) reasons.push(`line_${violation.line}:provenance_${violation.reason}`);
  if (new Set(candidate.lines.map((line) => line.toLowerCase())).size !== candidate.lines.length) reasons.push("duplicate_lines");

  const semantic = semanticSignal(candidate.lines, hypothesis);
  const novelty = metric(candidate.lines.reduce((sum, line, index) => sum + (index ? 1 - overlap(line, candidate.lines[index - 1]!) : 0.65), 0) / Math.max(1, candidate.lines.length));
  const payoff = metric(0.45 + (candidate.lines.at(-1) && !hypothesis.trajectory.some((fact) => overlap(candidate.lines.at(-1)!, fact) >= 0.82) ? 0.3 : 0) + (CONTRAST.test(candidate.lines.at(-1) ?? "") ? 0.2 : 0));
  const attention = metric(novelty * 0.45 + semantic * 0.35 + payoff * 0.2);
  const creative = metric(Math.min(1, semantic * 0.6 + hypothesis.lens.fit * 0.4));
  const score = metric(attention * 0.32 + payoff * 0.22 + semantic * 0.23 + creative * 0.13 + novelty * 0.1);
  if (score < 0.68) reasons.push(`creative_below_floor:${score}`);
  return { ok: reasons.length === 0, score, reasons, provenance, metrics: { attention, novelty, payoff, creative } };
}

export async function generateCreativeCandidates(input: AuthorBrainTruth): Promise<{
  candidates: Array<Candidate & { validation: CandidateValidation }>;
  winner?: Candidate & { validation: CandidateValidation };
  model: string;
  modelCalls: number;
  recoveryRequired: boolean;
}> {
  const packet = candidatePacket(input);
  const model = await localModelGenerate([{ role: "user", content: buildPrompt(input, packet) }], "json", {
    numPredict: 1800,
    temperature: packet.cognition.selected.lens.id === "neutral" ? 0.38 : 0.72,
  });
  const rawCandidates = parseCandidates(model.text);
  const evaluated = rawCandidates.flatMap((candidate) => {
    const hypothesis = packet.hypotheses.find((item) => item.lens.id === candidate.frame) ?? packet.cognition.selected;
    const validation = validateCandidate(candidate, input, packet, hypothesis);
    return [{ ...candidate, validation }];
  });
  const valid = evaluated.filter((candidate) => candidate.validation.ok).sort((a, b) => b.validation.score - a.validation.score);
  return {
    candidates: evaluated,
    winner: valid[0],
    model: model.model,
    modelCalls: 1,
    recoveryRequired: valid.length === 0,
  };
}
