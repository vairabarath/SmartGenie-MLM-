// src/types/index.ts
export type UserStats = {
  userId: string;
  directReferrerId: string;
  dateOfJoining: string;
  directReferralCount: number;
  indirectReferralCount: number;
  totalReferralCount: number;
  directReferralIncome: number;
  teamBonus: number;
  incomeFromAllLevels: number;
  totalEarnings: number;
  // BNB to USD conversion rate
  bnbToUsd: number;
};

export type Level = {
  level: number;
  status: 'Active' | 'Inactive';
  income: number; // in BNB
  incomeInUsd: number;
};

export type Member = {
  regId: string;
  walletAddress?: string;
  joinDate?: string;
  referredBy?: string;
  type: 'direct' | 'indirect';
};

export type MenuItemType = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
};
