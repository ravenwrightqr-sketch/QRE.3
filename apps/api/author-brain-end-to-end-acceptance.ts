import { authorBrainUniversal } from "./src/services/authorBrainUniversal.js";

function assert(
  condition: unknown,
  message: string,
): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function numberDiagnostic(
  value: unknown,
  name: string,
): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    throw new Error(
      `END-TO-END FAILURE: diagnostic ${name} was not a finite number.`,
    );
  }

  return value;
}

function booleanDiagnostic(
  value: unknown,
  name: string,
): boolean {
  if (typeof value !== "boolean") {
    throw new Error(
      `END-TO-END FAILURE: diagnostic ${name} was not boolean.`,
    );
  }

  return value;
}

const sourceFacts = [
  "Coco was groomed at Elm Street Grooming.",
  "Coco stole the red bow.",
];

const result =
  await authorBrainUniversal({
    prompt:
      "Coco was groomed at Elm Street Grooming, then stole the red bow. Make the experience sharp and memorable.",
    lens: "comedy",
    subject: "Coco",
    place: "Elm Street Grooming",
    movieMode: true,
    returning: false,
    visitNumber: 1,
    facts: sourceFacts,
    sourceMoments: sourceFacts,
    memoryContext: [],
    trajectory: [],
    creativeLearningContext: [
      "preference:short",
      "accepted:sharp semantic turn",
      "behavior-preference:callback",
    ],
  });

const realityGraphEvents =
  numberDiagnostic(
    result.diagnostics.realityGraphEvents,
    "realityGraphEvents",
  );

const beatCount =
  numberDiagnostic(
    result.diagnostics.beatCount,
    "beatCount",
  );

const endpointExact =
  booleanDiagnostic(
    result.diagnostics.endpointExact,
    "endpointExact",
  );

const complete =
  booleanDiagnostic(
    result.diagnostics.complete,
    "complete",
  );

assert(
  realityGraphEvents >= 2,
  `END-TO-END FAILURE: expected at least 2 reality events, got ${realityGraphEvents}`,
);

assert(
  beatCount >= 2,
  `END-TO-END FAILURE: expected at least 2 beats, got ${beatCount}`,
);

assert(
  result.sequence,
  "END-TO-END FAILURE: Author did not produce a viewer sequence.",
);

assert(
  complete === true,
  "END-TO-END FAILURE: Author sequence was not complete.",
);

assert(
  result.scenes.length ===
    result.sequence.cuts.length,
  `END-TO-END FAILURE: scene count ${result.scenes.length} does not match cut count ${result.sequence.cuts.length}.`,
);

assert(
  endpointExact === true,
  "END-TO-END FAILURE: canonical endpoint was not preserved.",
);

const finalText =
  result.scenes
    .map((scene) => scene.text)
    .join(" ");

const forbiddenConcrete = [
  /\btable\b/i,
  /\bdoor\b/i,
  /\broom\b/i,
  /\bwindow\b/i,
  /\bsmiled\b/i,
  /\blaughed\b/i,
  /\bstared\b/i,
  /\bsat\b/i,
  /\bwalked\b/i,
  /\bsunset\b/i,
  /\bsunlight\b/i,
  /\bshadow\b/i,
  /\btears?\b/i,
];

for (const pattern of forbiddenConcrete) {
  assert(
    !pattern.test(finalText),
    `END-TO-END TRUTH LEAK: unsupported concrete detail reached final output: ${pattern}`,
  );
}

assert(
  /\bCoco\b/i.test(finalText),
  "END-TO-END FAILURE: subject identity disappeared from final authored output.",
);

assert(
  /\bred bow\b/i.test(finalText),
  "END-TO-END FAILURE: source object 'red bow' disappeared from final authored output.",
);

const realizationTexts =
  result.diagnostics.realizationTexts;

const allRealizationText =
  Array.isArray(realizationTexts)
    ? realizationTexts
        .map((value) =>
          String(value ?? ""),
        )
        .join(" ")
    : finalText;

const semanticSignal =
  /\b(?:own(?:s|ed)?|mine|belongs?|control|boss|master|apparently|instead|still|again|now|not|finally|became|changed|different|unexpected|trouble|steal|stolen)\b/i.test(
    allRealizationText,
  );

const hasLiteralFallback =
  sourceFacts.some(
    (fact) =>
      allRealizationText
        .toLowerCase()
        .includes(
          fact
            .replace(
              /[.!?]+$/g,
              "",
            )
            .toLowerCase(),
        ),
  );

assert(
  semanticSignal ||
    hasLiteralFallback,
  "END-TO-END FAILURE: no authored realization or valid source-grounded fallback survived.",
);

console.log(
  "AUTHOR BRAIN END-TO-END ACCEPTANCE: PASS",
);

console.log(
  `RealityEvents=${realityGraphEvents}`,
);

console.log(
  `BeatCount=${beatCount}`,
);

console.log(
  `Cuts=${result.sequence.cuts.length}`,
);

console.log(
  `Scenes=${result.scenes.length}`,
);

console.log(
  `EndpointExact=${endpointExact}`,
);

console.log(
  `RealizationTexts=${JSON.stringify(
    result.diagnostics.realizationTexts,
  )}`,
);