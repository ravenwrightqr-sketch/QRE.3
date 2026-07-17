/**
 * =====================================================
 * QRE CONCERT EXPERIENCE TEMPLATE
 * =====================================================
 *
 * Artist + fan memory engine.
 *
 * Designed for:
 *
 * - Touring artists
 * - Independent musicians
 * - Alternative scenes
 * - Metal
 * - Emo
 * - Goth
 * - Hyperpop
 * - EDM
 * - Creator performances
 *
 *
 * Scan
 * ↓
 * Fan Identity
 * ↓
 * Artist Experience
 * ↓
 * Live Memory
 * ↓
 * Community Loop
 *
 * =====================================================
 */


import type {
 ExperienceIndustry,
 ExperienceGoal,
 ExperienceMomentType,
} from "@qre/contracts";



export const concertIndustry = {


 industry:
   "concert" satisfies ExperienceIndustry,



 title:
   "Concerts & Artist Experiences",



 defaultGoal:
   "memory" satisfies ExperienceGoal,



 preferredDNA:[


   "viral",


   "cinematic",


   "energetic",


   "premium",


   "emotional",


 ],



 recommendedMoments:[


   "welcome",


   "arrival",


   "venue",


   "artist",


   "performance",


   "setlist",


   "soundtrack",


   "friends",


   "photos",


   "video",


   "highlights",


   "replay",


   "share",


   "reward",


   "followup",


 ] satisfies ExperienceMomentType[],



 keywords:[


   "concert",


   "tour",


   "artist",


   "band",


   "dj",


   "live show",


   "festival",


   "merch",


   "fan",


   "vip",


   "backstage",


   "album release",


   "listening party",


   "goth",


   "emo",


   "metal",


   "punk",


   "alternative",


 ],



 experiences:[


   "artist_passport",


   "tour_memory",


   "fan_collectible",


   "digital_merch",


   "vip_access",


   "backstage_story",


   "setlist_archive",


   "fan_wall",


 ],



 recommendedFeatures:[


   "artist profile",


   "exclusive stories",


   "show timeline",


   "fan photos",


   "limited edition drops",


   "digital collectibles",


   "vip unlocks",


   "fan rewards",


   "future show invitations",


 ],



} as const;