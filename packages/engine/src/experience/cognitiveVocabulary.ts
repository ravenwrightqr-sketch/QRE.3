/**
 * =============================================================================
 * COGNITIVE EXPERIENCE VOCABULARY
 * =============================================================================
 *
 * GOAL
 * ---
 * Give Super Cog a richer vocabulary for describing how an experience behaves
 * without turning the compiler into a growing catalog of subjects, industries,
 * or genre templates.
 *
 * PURPOSE
 * -------
 * This file is the reusable lexical layer beneath cognitive mechanics. Terms
 * such as anticipation, spectacle, agency, mastery, indulgence, awe, and legacy
 * describe experiential forces. They are not story templates and they do not
 * name domains.
 *
 * DESIGN RULES
 * ------------
 * 1. Vocabulary must describe behavior, affect, relationship, or change.
 * 2. A vocabulary hit is evidence, never permission to invent a fact.
 * 3. Concrete premise evidence remains authoritative over lexical cues.
 * 4. Multiple mechanics may coexist; the compiler composes them downstream.
 * 5. New vocabulary should make new noun combinations more capable, not create
 *    new noun-specific branches.
 */

export type CognitiveVocabularyEntry = {
  mechanic: string;
  patterns: RegExp[];
  score: number;
  evidence: string;
};

/**
 * High-expressiveness experiential vocabulary.
 *
 * These entries intentionally complement the original mechanics rather than
 * replacing them. The existing domain-neutral detectors remain authoritative
 * for established semantics; this layer gives cognition a much larger set of
 * reusable behavioral distinctions.
 */
export const COGNITIVE_VOCABULARY: readonly CognitiveVocabularyEntry[] = [
  {
    mechanic: "anticipation",
    patterns: [
      /\banticipat(?:e|es|ed|ing|ion)\b/,
      /\bcan(?:not|'t)? wait\b/,
      /\bcount(?:down|ing)\b/,
      /\bbuild(?:ing)? toward\b/,
      /\blooking forward to\b/,
    ],
    score: 0.9,
    evidence: "the experience builds expectation before the next state arrives",
  },
  {
    mechanic: "suspense",
    patterns: [
      /\bsuspens(?:e|eful)\b/,
      /\bwhat happens next\b/,
      /\bwill it\b/,
      /\bnot sure what\b/,
      /\bkeeps? .* guessing\b/,
    ],
    score: 0.92,
    evidence: "uncertainty is sustained so the next state remains compelling",
  },
  {
    mechanic: "surprise",
    patterns: [
      /\bsurpris(?:e|es|ed|ing)\b/,
      /\bunexpected\b/,
      /\bplot twist\b/,
      /\bshock(?:s|ed|ing)?\b/,
      /\bsuddenly\b/,
    ],
    score: 0.9,
    evidence: "the experience is designed to break the participant's expectation",
  },
  {
    mechanic: "agency",
    patterns: [
      /\bchoose|chooses|chose|choice|choices\b/,
      /\bdecide|decides|decided|decision\b/,
      /\bcontrol\b/,
      /\bmy call\b/,
      /\btheir move\b/,
    ],
    score: 0.92,
    evidence: "participant choice materially determines what happens next",
  },
  {
    mechanic: "mastery",
    patterns: [
      /\bmaster(?:y|ed|ing)?\b/,
      /\bskill|skills|skilled\b/,
      /\bget better\b/,
      /\blevel up\b/,
      /\bpractice\b/,
      /\bexpert\b/,
    ],
    score: 0.9,
    evidence: "progress is expressed through increasing capability or competence",
  },
  {
    mechanic: "novelty",
    patterns: [
      /\bnovel(?:ty)?\b/,
      /\bbrand[- ]new\b/,
      /\bnever seen before\b/,
      /\bfirst[- ]ever\b/,
      /\bfresh\b/,
      /\bnew twist\b/,
    ],
    score: 0.88,
    evidence: "newness itself is part of the experience value",
  },
  {
    mechanic: "spectacle",
    patterns: [
      /\bspectacle\b/,
      /\bspectacular\b/,
      /\bshowstopper\b/,
      /\bgrand finale\b/,
      /\bjaw[- ]dropping\b/,
      /\bshowcase\b/,
    ],
    score: 0.94,
    evidence: "the experience should become visibly or socially impressive",
  },
  {
    mechanic: "indulgence",
    patterns: [
      /\bindulg(?:e|es|ed|ent|ence|ing)\b/,
      /\bspoiled\b/,
      /\bextravagant\b/,
      /\blavish\b/,
      /\bdecadent\b/,
      /\bno expense spared\b/,
    ],
    score: 0.94,
    evidence: "the experience deliberately exceeds ordinary proportionality",
  },
  {
    mechanic: "delight",
    patterns: [
      /\bdelight(?:ed|ful|ing)?\b/,
      /\bjoy(?:ful)?\b/,
      /\bthrill(?:ed|ing)?\b/,
      /\bpleas(?:e|ed|ure|ing)\b/,
      /\blove every second\b/,
    ],
    score: 0.9,
    evidence: "the experience is optimized for active pleasure rather than mere utility",
  },
  {
    mechanic: "euphoria",
    patterns: [
      /\beuphor(?:ia|ic)\b/,
      /\becstatic\b/,
      /\bbliss(?:ful)?\b/,
      /\bhigh point\b/,
      /\bover the moon\b/,
    ],
    score: 0.95,
    evidence: "the intended payoff reaches unusually intense positive affect",
  },
  {
    mechanic: "celebration",
    patterns: [
      /\bcelebrat(?:e|es|ed|ing|ion)\b/,
      /\bparty\b/,
      /\btoast\b/,
      /\bfestiv(?:e|ity)\b/,
      /\bcommemorat(?:e|es|ed|ing|ion)\b/,
    ],
    score: 0.86,
    evidence: "the experience converts an event or achievement into shared celebration",
  },
  {
    mechanic: "prestige",
    patterns: [
      /\bprestige\b/,
      /\bexclusive\b/,
      /\belite\b/,
      /\bVIP\b/i,
      /\bhigh[- ]status\b/,
      /\bfirst class\b/,
    ],
    score: 0.88,
    evidence: "access or experience carries deliberate distinction and status",
  },
  {
    mechanic: "ritual",
    patterns: [
      /\britual\b/,
      /\bceremony\b/,
      /\btradition\b/,
      /\btraditions\b/,
      /\bceremonial\b/,
      /\bannual\b/,
    ],
    score: 0.86,
    evidence: "repetition or ceremony gives the experience recognizable structure",
  },
  {
    mechanic: "authorship",
    patterns: [
      /\bauthor(?:s|ship)?\b/,
      /\bcreate(?:s|d|ing)? their own\b/,
      /\bwrite(?:s|d|ing)? their own\b/,
      /\bmake(?:s|d|ing)? their own\b/,
      /\bshape(?:s|d|ing)?\b/,
    ],
    score: 0.9,
    evidence: "participants become creators of part of the evolving experience",
  },
  {
    mechanic: "reciprocity",
    patterns: [
      /\breciproc(?:ity|al)\b/,
      /\bgive and take\b/,
      /\bgive back\b/,
      /\bin return\b/,
      /\bresponds? to\b/,
    ],
    score: 0.84,
    evidence: "one action creates a meaningful response or exchange",
  },
  {
    mechanic: "resonance",
    patterns: [
     /\bresonan(?:ce|t)\b|\bresonat(?:e|es|ed|ing)\b/,
      /\bmeaningful connection\b/,
      /\bsticks with you\b/,
      /\bhits home\b/,
      /\bdeeply personal\b/,
    ],
    score: 0.86,
    evidence: "the experience is intended to reverberate beyond the immediate moment",
  },
  {
    mechanic: "intimacy",
    patterns: [
      /\bintim(?:acy|ate)\b/,
      /\bpersonal moment\b/,
      /\bone[- ]on[- ]one\b/,
      /\bprivate\b/,
      /\bclose[- ]knit\b/,
    ],
    score: 0.82,
    evidence: "the experience gains force from closeness or personal attention",
  },
  {
    mechanic: "catharsis",
    patterns: [
      /\bcathars(?:is|tic)\b/,
      /\blet it out\b/,
      /\bfinally release\b/,
      /\brelease the tension\b/,
      /\btearjerker\b/,
    ],
    score: 0.92,
    evidence: "accumulated tension is intended to resolve in a release",
  },
  {
    mechanic: "relief",
    patterns: [
      /\brelief\b/,
      /\brelieved\b/,
      /\bweight off\b/,
      /\bfinally safe\b/,
      /\bbreath(?:e|es|ed|ing) again\b/,
    ],
    score: 0.84,
    evidence: "the experience creates a meaningful drop from pressure into release",
  },
  {
    mechanic: "reversal",
    patterns: [
      /\breversal\b/,
      /\bturn(?:s|ed|ing)? the tables\b/,
      /\bopposite of what\b/,
      /\bnot what it seemed\b/,
      /\bplot twist\b/,
      /\bflips? the script\b/,
    ],
    score: 0.94,
    evidence: "the experience deliberately changes the interpretation or direction of events",
  },
  {
    mechanic: "momentum",
    patterns: [
      /\bmomentum\b/,
      /\bkeeps? going\b/,
      /\bkeeps? building\b/,
      /\bone thing leads to another\b/,
      /\bcan'?t stop\b/,
    ],
    score: 0.88,
    evidence: "each state creates pressure or energy for the next state",
  },
  {
    mechanic: "scarcity",
    patterns: [
      /\bscar(?:ce|city)\b/,
      /\blimited\b/,
      /\bonly \d+\b/,
      /\bone[- ]time\b/,
      /\brare\b/,
      /\bhard to get\b/,
    ],
    score: 0.86,
    evidence: "limited availability increases urgency or perceived value",
  },
  {
    mechanic: "curation",
    patterns: [
      /\bcurat(?:e|ed|es|ing|ion)\b/,
      /\bhand[- ]picked\b/,
      /\bselected just for\b/,
      /\btailored\b/,
      /\bpersonalized\b/,
    ],
    score: 0.9,
    evidence: "selection itself becomes part of the experience rather than a hidden implementation detail",
  },
  {
    mechanic: "embodiment",
    patterns: [
      /\bembod(?:y|ied|iment|ies|ying)\b/,
      /\bphysical\b/,
      /\btouch\b/,
      /\bwalk through\b/,
      /\bhold\b/,
      /\bwear\b/,
    ],
    score: 0.82,
    evidence: "the experience is grounded in physical participation or presence",
  },
  {
    mechanic: "immersion",
    patterns: [
      /\bimmers(?:e|es|ed|ive|ion)\b/,
      /\blost in\b/,
      /\bfully inside\b/,
      /\bsurround(?:s|ed|ing)?\b/,
      /\btransport(?:s|ed|ing)?\b/,
    ],
    score: 0.88,
    evidence: "the experience should absorb attention rather than merely deliver information",
  },
  {
    mechanic: "ownership",
    patterns: [
      /\bown(?:s|ed|ing|ership)?\b/,
      /\bmine\b/,
      /\bpersonal artifact\b/,
      /\bkeep forever\b/,
      /\bbelongs to\b/,
    ],
    score: 0.84,
    evidence: "the participant gains a durable sense of possession or authorship",
  },
  {
    mechanic: "consequence",
    patterns: [
      /\bconsequence(?:s)?\b/,
      /\bmatters what you do\b/,
      /\bhas an effect\b/,
      /\bchanges the outcome\b/,
      /\bwhat happens depends on\b/,
    ],
    score: 0.94,
    evidence: "actions have persistent consequences in the experience state",
  },
  {
    mechanic: "recognition",
    patterns: [
      /\brecogniz(?:e|es|ed|ing|ition)\b/,
      /\bseen\b/,
      /\bremembered by\b/,
      /\bgets credit\b/,
      /\bspotlight\b/,
    ],
    score: 0.86,
    evidence: "the experience makes a participant, contribution, or achievement visible",
  },
  {
    mechanic: "legacy",
    patterns: [
      /\blegacy\b/,
      /\blives on\b/,
      /\bpassed down\b/,
      /\bfor generations\b/,
      /\bremembered for years\b/,
    ],
    score: 0.9,
    evidence: "the experience is designed to persist beyond the immediate interaction",
  },
  {
    mechanic: "wonder",
    patterns: [
      /\bwonder(?:ed|ful|ing)?\b/,
      /\bmagical\b/,
      /\bmarvel\b/,
      /\bmesmeriz(?:e|ing)\b/,
      /\bspellbind(?:s|ing)?\b/,
    ],
    score: 0.9,
    evidence: "the experience invites sustained curiosity and astonishment",
  },
  {
    mechanic: "awe",
    patterns: [
      /\bawe(?:some|struck)?\b/,
      /\bmajestic\b/,
      /\bepic\b/,
      /\bmonumental\b/,
      /\boverwhelming\b/,
    ],
    score: 0.9,
    evidence: "scale or intensity is intended to exceed ordinary expectations",
  },
] as const;
