export type RewardKind = "points" | "credit" | "badge" | "access";

export type RewardCompliance = {
  regulated: boolean;
  minimumAge?: number;
  ageGateRequired: boolean;
  prohibitedRedemptions: string[];
  disclosure: string;
};

export type SponsorRewardProgram = {
  id: string;
  sponsorName: string;
  assetId?: string;
  rewardKind: RewardKind;
  pointsPerCurrencyUnit: number;
  currency?: string;
  scanAttributionWindowHours: number;
  purchaseVerificationRequired: boolean;
  compliance: RewardCompliance;
  enabled: boolean;
};

export type RewardAttribution = {
  id: string;
  programId: string;
  assetId: string;
  scanSessionId?: string;
  userId?: string;
  attributionToken: string;
  createdAt: string;
  expiresAt: string;
};

export type RewardTransaction = {
  id: string;
  programId: string;
  attributionId: string;
  userId?: string;
  points: number;
  purchaseReference: string;
  purchaseAmount?: number;
  currency?: string;
  verified: boolean;
  createdAt: string;
  metadata?: Record<string, unknown>;
};

export type RewardBalance = {
  userId: string;
  programId: string;
  points: number;
  transactions: RewardTransaction[];
};

export type RewardRecommendation = {
  title: string;
  message: string;
  points: number;
  reason: string;
  sponsorName: string;
};
