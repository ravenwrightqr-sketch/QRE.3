/**
 * =====================================================
 * QRE EXPERIENCE TEMPLATE REGISTRY
 * =====================================================
 *
 * Central compiler template lookup.
 *
 * Experience Industry
 *        ↓
 * Industry Template
 *        ↓
 * Blueprint Composer
 *        ↓
 * Flow Builder
 *
 * NO DATABASE
 * NO PRISMA
 * NO EXECUTION
 *
 * Single source of truth for
 * experience generation templates.
 *
 * =====================================================
 */


import type {
  IndustryTemplate,
} from "./templateTypes.js";



/**
 * =====================================================
 * INDUSTRY TEMPLATE IMPORTS
 * =====================================================
 */


import {
  restaurantIndustry,
} from "./industries/restaurant.js";


import {
  hospitalityIndustry,
} from "./industries/hospitality.js";


import {
  personalIndustry,
} from "./industries/personal.js";


import {
  relationshipIndustry,
} from "./industries/relationship.js";


import {
  weddingIndustry,
} from "./industries/wedding.js";


import {
  retailIndustry,
} from "./industries/retail.js";


import {
  concertIndustry,
} from "./industries/concert.js";


import {
  seshIndustry,
} from "./industries/sesh.js";


import {
  cannabisIndustry,
} from "./industries/cannabis.js";


import {
  eventsIndustry,
} from "./industries/events.js";


import {
  petIndustry,
} from "./industries/pet.js";


import {
  serviceIndustry,
} from "./industries/service.js";





/**
 * =====================================================
 * TEMPLATE REGISTRY
 * =====================================================
 *
 * This is the compiler lookup table.
 *
 * Prompt:
 *
 * "Create a dispensary product experience"
 *
 * ↓
 *
 * Intent:
 * cannabis
 *
 * ↓
 *
 * Template:
 * cannabisIndustry
 *
 * ↓
 *
 * Blueprint Composer
 *
 * =====================================================
 */


export const industryTemplates = {


  restaurant:
    restaurantIndustry,


  hospitality:
    hospitalityIndustry,


  airbnb:
    hospitalityIndustry,


  personal:
    personalIndustry,


  relationship:
    relationshipIndustry,


  wedding:
    weddingIndustry,


  pet:
    petIndustry,


  pet_rescue:
    petIndustry,


  retail:
    retailIndustry,


  business:
    retailIndustry,


  service:
    serviceIndustry,


  artist:
    personalIndustry,


  concert:
    concertIndustry,


  event:
    eventsIndustry,


  sesh:
    seshIndustry,


  cannabis:
    cannabisIndustry,


} satisfies Record<
  string,
  IndustryTemplate
>;





/**
 * =====================================================
 * TEMPLATE KEY TYPE
 * =====================================================
 */


export type ExperienceTemplateKey =
  keyof typeof industryTemplates;





/**
 * =====================================================
 * DIRECT EXPORTS
 * =====================================================
 *
 * Compiler modules import from here.
 *
 * Never import industry templates directly.
 *
 * =====================================================
 */


export {

  restaurantIndustry,

  hospitalityIndustry,

  personalIndustry,

  relationshipIndustry,

  weddingIndustry,

  retailIndustry,

  concertIndustry,

  seshIndustry,

  cannabisIndustry,

  eventsIndustry,

  petIndustry,

  serviceIndustry,
  

};