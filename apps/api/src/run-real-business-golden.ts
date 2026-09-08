import { db } from "@qre/db";
import { createExperience } from "./services/experienceCreationServices.js";
const ASSET_ID = "cmrh02dvy0002f9vkgs67ejgx";
const EMAIL = "owner@qre.com";

async function main() {
  const user = await db.user.findUnique({
    where: { email: EMAIL },
    select: { id: true, email: true },
  });

  if (!user) throw new Error(`User not found: ${EMAIL}`);

  const asset = await db.asset.update({
    where: { id: ASSET_ID },
    data: {
      ownerId: user.id,
      category: "SERVICE",
      displayName: "Elm St Dog Grooming",
      templateData: {
        businessName: "Elm St Dog Grooming",
        businessType: "dog_grooming",
        businessDescription:
          "A dog grooming business that turns ordinary grooming visits into memorable customer experiences.",
        serviceType: "dog_grooming",
        serviceName: "Full Grooming",
        subjectKind: "pet",
        knownCapabilities: [
          "bath",
          "grooming",
          "drying",
          "finishing",
          "bows",
        ],
        contextualSignals: [
          "repeat pets",
          "customer-facing service",
          "pet owner memory",
        ],
      },
    },
  });

  console.log("BUSINESS ASSET READY");
  console.log({
    assetId: asset.id,
    displayName: asset.displayName,
    category: asset.category,
    templateData: asset.templateData,
  });

  const result = await createExperience({
    assetId: asset.id,
    userId: user.id,
    prompt: "Coco went to grooming, got groomed, and came home with bows.",
  });

  console.log("\nEXPERIENCE CREATED");
  console.log("experienceId:", result.experience.id);
  console.log("flowId:", result.flow.id);
  console.log("experience:", JSON.stringify(result.experience, null, 2));
  console.log("\nCOMPILED:");
  console.log(JSON.stringify(result.compiled, null, 2));
}

main()
  .catch((error) => {
    console.error("BUSINESS GOLDEN FAILED");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
