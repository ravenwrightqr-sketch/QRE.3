import type { ExperienceModule } from "../types.js";

export const commerceModule: ExperienceModule = {
  id: "commerce",

  name: "Commerce",

  description: "Purchases, bookings and payments.",

  category: "commerce",

  moments: [
    "product",
    "payment",
    "booking",
  ],

  features: [
    "checkout",
    "stripe",
    "inventory",
    "offers",
  ],

  dna: [
    "premium",
  ],

  payload: {},
};