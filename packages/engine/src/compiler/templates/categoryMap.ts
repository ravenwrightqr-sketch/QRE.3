import type { ExperienceIndustry } from "@qre/contracts";

export const categoryToIndustry = {

  WEED_SHOP: "cannabis",

  AIRBNB: "airbnb",

  PET_RESCUE: "pet",

  SERVICE: "service",

  BUSINESS: "business",

  ARTIST: "artist",

  PERSONAL: "personal",

  MERCHANT: "retail",

  GENERIC: "generic",

} satisfies Record<string, ExperienceIndustry>;