/**
 * =====================================================
 * QRE BOOKING GOAL
 * =====================================================
 *
 * Universal appointment / reservation goal.
 *
 * Used by:
 *
 * salons
 * barbers
 * hotels
 * Airbnb
 * services
 * restaurants
 * events
 * appointments
 *
 * Purpose:
 *
 * Move a visitor from interest
 * into a scheduled action.
 *
 * NO DATABASE
 * NO EXECUTION
 *
 * =====================================================
 */

import type {
  ExperienceGoal,
  ExperienceMomentType,
} from "@qre/contracts";


export const bookingGoal = {

  goal:
    "booking" satisfies ExperienceGoal,


  purpose:
    "Convert visitor intent into a confirmed reservation or appointment.",



  preferredMoments: [

    "welcome",

    "introduction",

    "education",

    "offer",

    "booking",

    "payment",

    "followup",

  ] satisfies ExperienceMomentType[],



  recommendedDNA: [

    "professional",

    "friendly",

    "premium",

  ],



  recommendedFeatures: [

    "availability",

    "calendar",

    "appointment request",

    "confirmation",

    "reminders",

    "contact",

  ],



  analytics: [

    "booking_started",

    "booking_completed",

    "appointment_confirmed",

    "drop_off_rate",

    "return_customer",

  ],

} as const;