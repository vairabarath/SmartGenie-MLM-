export interface ReferralInfo {
  referrerId: string | number;
  referrerAddress?: string;
  referrerCode?: string;
  timestamp: number;
}

export const extractReferralFromURL = (): ReferralInfo | null => {
  const urlParams = new URLSearchParams(window.location.search);
  const refParam = urlParams.get("ref");
  const referrerCode = urlParams.get("code");

  if (refParam && refParam.trim()) {
    // Check if it's a User ID (number) or wallet address (0x...)
    const isUserId = /^\d+$/.test(refParam.trim());
    const isWalletAddress = /^0x[a-fA-F0-9]{40}$/.test(refParam.trim());

    if (isUserId) {
      // It's a User ID
      return {
        referrerId: parseInt(refParam.trim()),
        referrerCode: referrerCode || undefined,
        timestamp: Date.now(),
      };
    } else if (isWalletAddress) {
      // It's a wallet address
      return {
        referrerId: refParam.trim(), // Store as string for now
        referrerAddress: refParam.trim(),
        referrerCode: referrerCode || undefined,
        timestamp: Date.now(),
      };
    }
  }

  return null;
};

export const storeReferralInfo = (referralInfo: ReferralInfo): void => {
  // Use sessionStorage instead of localStorage - clears when tab is closed
  sessionStorage.setItem("pendingReferral", JSON.stringify(referralInfo));
};

export const getStoredReferralInfo = (): ReferralInfo | null => {
  try {
    // Check sessionStorage first (current session)
    const stored = sessionStorage.getItem("pendingReferral");
    if (stored) {
      const referralInfo: ReferralInfo = JSON.parse(stored);

      // Reduced validity to 2 hours for session-based storage
      const isValid = Date.now() - referralInfo.timestamp < 2 * 60 * 60 * 1000;

      if (isValid) {
        return referralInfo;
      } else {
        // Remove expired referral
        clearStoredReferralInfo();
      }
    }
  } catch (error) {
    console.error("Error parsing stored referral info:", error);
    clearStoredReferralInfo();
  }

  return null;
};

export const clearStoredReferralInfo = (): void => {
  // Clear from both sessionStorage and localStorage for safety
  sessionStorage.removeItem("pendingReferral");
  localStorage.removeItem("pendingReferral");
};

export const generateReferralURL = (
  userId: string | number,
  userCode?: string
): string => {
  const baseURL = window.location.origin;
  const params = new URLSearchParams();
  params.set("ref", userId.toString());

  if (userCode) {
    params.set("code", userCode);
  }

  return `${baseURL}?${params.toString()}`;
};

export const generateReferralURLByAddress = (
  userAddress: string,
  userCode?: string
): string => {
  const baseURL = window.location.origin;
  const params = new URLSearchParams();

  params.set("ref", userAddress);
  if (userCode) {
    params.set("code", userCode);
  }

  return `${baseURL}?${params.toString()}`;
};

export const hasReferralInURL = (): boolean => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.has("ref");
};

export const cleanURLParameters = (): void => {
  if (hasReferralInURL()) {
    const url = new URL(window.location.href);
    url.searchParams.delete("ref");
    url.searchParams.delete("code");
    window.history.replaceState({}, document.title, url.toString());
  }
};

/**
 * Setup referral cleanup - sessionStorage automatically clears on tab close
 * No aggressive cleanup needed, just let sessionStorage handle it naturally
 */
export const setupReferralCleanup = (): void => {
  // SessionStorage naturally persists during page refresh but clears when tab is closed
  // We don't need aggressive cleanup listeners that might interfere with normal usage

  // Only clear referral data after successful registration to prevent reuse
  console.log(
    "Referral cleanup initialized - sessionStorage will auto-clear on tab close"
  );
};
