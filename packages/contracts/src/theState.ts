export type TheStateIdentity = {
  id: string;
  slug: string;
  label: string;
  category?: string;
};

export type TheStateExperience = {
  id: string;
  title?: string | null;
  createdAt?: string;
  available: boolean;
};

/**
 * Canonical identity/state container beneath experiences.
 *
 * TheState is intentionally domain-neutral. Animals, surfboards,
 * vehicles, properties, businesses, and other physical/digital assets
 * use the same shape. Domain-specific UI modes are experiences over
 * this state; they are not separate engines.
 */
export type TheState = {
  identity: TheStateIdentity;
  activeExperienceId: string | null;
  experiences: TheStateExperience[];
};
