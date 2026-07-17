import type {
  IndustryTemplate,
} from "../templateTypes.js";


/**
 * =====================================================
 * QRE RESTAURANT INDUSTRY TEMPLATE
 * =====================================================
 *
 * Turns a restaurant QR/NFC scan into a
 * customer relationship engine.
 *
 * Scan
 * ↓
 * Welcome
 * ↓
 * Brand Story
 * ↓
 * Menu Experience
 * ↓
 * Order / Offer
 * ↓
 * Loyalty
 * ↓
 * Return Visit
 *
 * Covers:
 *
 * - Restaurants
 * - Cafes
 * - Bars
 * - Food trucks
 * - Breweries
 * - Chefs
 *
 * =====================================================
 */


export const restaurantIndustry = {


  industry:
    "restaurant",



  defaultGoal:
    "loyalty",



  preferredDNA:[


    "friendly",


    "premium",


    "viral",


    "trustworthy",


  ],



  recommendedMoments:[


    "welcome",


    "story",


    "menu",


    "product",


    "offer",


    "reward",


    "review",


    "social",


    "followup",


  ],



  keywords:[


    "restaurant",


    "food",


    "chef",


    "menu",


    "cafe",


    "bar",


    "brewery",


    "coffee",


    "dinner",


    "lunch",


    "reservation",


    "special",


    "dessert",


  ],



  experiences:[


    "digital_menu",


    "chef_story",


    "loyalty_program",


    "customer_rewards",


    "table_experience",


    "special_offers",


  ],



} satisfies IndustryTemplate;