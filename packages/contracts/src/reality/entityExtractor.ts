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
   * Open-world: values are discovered from evidence, never from a finite vocabulary.
   */
  objects: string[];

  /** Persistent groups or sets discovered from evidence. */
  collections: string[];

  /** Non-physical ideas/concepts that may be referenced by an experience. */
  concepts: string[];

  /** Evidence-backed entities that do not yet have a more specific kind. */
  other: string[];

  urls: string[];
  phones: string[];
  media: string[];
  emails: string[];
  keywords: string[];
};