/**
 * =====================================================
 * QRE EXPERIENCE ENTITY INTELLIGENCE CONTRACT
 * =====================================================
 *
 * Entities are not extracted words.
 *
 * They are world primitives.
 *
 * Human Prompt
 *      ↓
 * Entity Intelligence
 *      ↓
 * Experience World
 *
 * NO DATABASE
 * NO RUNTIME
 *
 * =====================================================
 */


export type ExperienceEntities = {
  /**
   * Human beings
   */
  people:string[];
  /**
   * Physical locations
   */
  places:string[];
  /**
   * Brands, groups, companies
   */
  organizations:string[];
  /**
   * Time anchors
   */
  dates:string[];
  times:string[];

  /**
   * Events and experiences
   */
  events:string[];

  /**
   * Commercial objects
   */
  products:string[];

  /**
   * Digital references
   */
  urls:string[];
  emails:string[];
  phones:string[];

  /**
   * Media primitives
   */
  media:string[];

  /**
   * Search language
   */
  keywords:string[];

  /**
   * =================================================
   * CREATIVE INTELLIGENCE LAYER
   * =================================================
   */
  /**
   * Physical things.
   *
   * Example:
   * sword
   * car
   * house
   * ring
   */
  objects:string[];
  /**
   * Living entities.
   *
   * Example:
   * dog
   * wolf
   * bird
   * tree
   */
  creatures:string[];


  /**
   * Invisible meaning objects.
   *
   * Example:
   * freedom
   * love
   * legacy
   * identity
   */
  concepts:string[];

  symbols:string[];



  worlds:string[];


  archetypes:string[];



};