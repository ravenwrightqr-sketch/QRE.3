import fs from "node:fs";

const path = "apps/api/src/services/authorBrainCanonical.ts";
const source = fs.readFileSync(path, "utf8");

if (source.includes("AUTHOR_CREATIVE_REPAIR_PASS")) {
  console.log("AUTHOR_CREATIVE_REPAIR_PASS: already installed");
  process.exit(0);
}

const pattern = /(\s*parsed\s*=\s*parseMouthCandidateBatch\(\s*generated\.text,\s*\);\s*)/;

if (!pattern.test(source)) {
  throw new Error("Could not find canonical Mouth parse seam.");
}

const replacement = `$1

    /*
     * AUTHOR_CREATIVE_REPAIR_PASS
     *
     * A model response may be structurally valid but omit one or more
     * requested beats. Missing creative material must not immediately
     * become deterministic source-text recovery.
     *
     * Re-enter the SAME Mouth with only the missing beats and ask for
     * implication-first realization before completion/recovery.
     */
    if (parsed) {
      const expectedOrders = beats.map((beat) => beat.order);
      const presentOrders = new Set(
        parsed.variantsByBeat.map((item) => item.order),
      );
      const missingOrders = expectedOrders.filter(
        (order) => !presentOrders.has(order),
      );

      if (missingOrders.length) {
        const missingBeats = beats.filter((beat) =>
          missingOrders.includes(beat.order),
        );

        const repairMessages = buildMouthCandidateMessages({
          envelope,
          beats: missingBeats,
          lens,
          domainContext: input.domainContext,
          worldSimulation:
            cognition.experienceState?.worldSimulation,
          mindState: cognition.mindState,
        });

        const repairSystem = clean(
          repairMessages[0]?.content ?? "",
        );

        const repairUser = repairMessages[1]?.content ?? "";

        const repair = await localModelGenerate(
          [
            {
              role: "system" as const,
              content: [
                repairSystem,
                "AUTHOR_CREATIVE_REPAIR_PASS: realize ONLY the missing beat orders.",
                "Do not repeat lines from other beats.",
                "Find the strongest supplied relationship in each missing beat.",
                "Prefer an earned second reading over literal restatement.",
                "Use implication, contrast, juxtaposition, restraint, irony, status, callback, or selective attention when earned.",
                "Let the viewer complete the unstated connection.",
                "Do not directly name the conclusion when the supplied relationship can imply it.",
                "Never invent a concrete fact, event, entity, object, place, action, chronology, reaction, sensory detail, dialogue, or outcome.",
              ].join(" "),
            },
            {
              role: "user" as const,
              content: repairUser,
            },
          ],
          "json",
          {
            numPredict: Number(
              process.env.QRE_AUTHOR_REPAIR_NUM_PREDICT ||
              process.env.QRE_AUTHOR_NUM_PREDICT ||
              512,
            ),
            temperature: Number(
              process.env.QRE_AUTHOR_REPAIR_TEMPERATURE || 0.82,
            ),
            jsonSchema: {
              type: "object",
              properties: {
                variantsByBeat: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      order: { type: "integer" },
                      variants: {
                        type: "array",
                        items: { type: "string" },
                        minItems: 3,
                        maxItems: 3,
                      },
                    },
                    required: ["order", "variants"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["variantsByBeat"],
              additionalProperties: false,
            },
          },
        );

        modelCalls += 1;
        modelName = repair.model || modelName;

        const repairedParsed =
          parseMouthCandidateBatch(repair.text);

        if (repairedParsed) {
          const merged = new Map(
            parsed.variantsByBeat.map((item) => [
              item.order,
              item.variants,
            ]),
          );

          for (const item of repairedParsed.variantsByBeat) {
            if (missingOrders.includes(item.order)) {
              merged.set(item.order, item.variants);
            }
          }

          parsed = {
            variantsByBeat: [...merged.entries()]
              .sort(([a], [b]) => a - b)
              .map(([order, variants]) => ({
                order,
                variants,
              })),
          };
        }
      }
    }`;

fs.writeFileSync(
  path,
  source.replace(pattern, replacement),
  "utf8",
);

console.log("AUTHOR_CREATIVE_REPAIR_PASS: INSTALLED");
