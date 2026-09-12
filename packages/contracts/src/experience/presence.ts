export type ExperiencePresencePoint = {
  sessionId?: string | null;
  timestamp: string;
  lat?: number | null;
  lng?: number | null;
  accuracy?: number | null;
  label?: string | null;
  city?: string | null;
  region?: string | null;
  country?: string | null;
};

export type ExperiencePresenceSession = {
  sessionId: string;
  assetId?: string;
  userId?: string | null;
  status?: string;
  enteredAt?: string | null;
  exitedAt?: string | null;
  durationMs?: number | null;
  visitNumber?: number;
  isReturning?: boolean;
};

export type ExperiencePresenceContext = {
  currentSession?: ExperiencePresenceSession | null;
  sessions?: ExperiencePresenceSession[];
  points?: ExperiencePresencePoint[];
  places?: string[];
  visitNumber?: number;
  isReturning?: boolean;
  firstSeenAt?: string | null;
  lastSeenAt?: string | null;
  summary?: string[];
};
