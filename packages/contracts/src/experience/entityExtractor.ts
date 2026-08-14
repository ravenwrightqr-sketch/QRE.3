export type ExperienceEntities = {

  people: string[];

  places: string[];

  organizations: string[];

  dates: string[];

  times: string[];

  events: string[];

  products: string[];

  /**
   * Universal concrete entities that are not inherently products.
   * This must remain open-world: values are discovered from evidence,
   * not constrained to a finite domain vocabulary.
   */
  objects: string[];

  urls: string[];

  phones: string[];
  media:string[];
  emails: string[];

  keywords: string[];

};