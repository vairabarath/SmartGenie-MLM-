import React, { useState } from "react";
import { Link, Copy, Check } from "lucide-react";
import { generateReferralURL } from "../../utils/referral";
import { toast } from "react-toastify";

interface ReferralLinkProps {
  userId?: number; // Changed to only accept numbers
  userAddress?: string;
  userCode?: string;
}

const ReferralLink: React.FC<ReferralLinkProps> = ({
  userId,
  userAddress,
  userCode,
}) => {
  const [copied, setCopied] = useState(false);

  const referralUrl =
    userId !== undefined ? generateReferralURL(userId, userCode) : null;

  const copyToClipboard = async () => {
    if (!referralUrl) return;
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      toast.success("Referral link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  if (!userAddress && !userId) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Link className="w-5 h-5 mr-2 text-gray-400" />
          Your Referral Link
        </h3>
        <div className="text-center py-4">
          <p className="text-gray-400">Loading referral link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center text-white">
        <Link className="w-5 h-5 mr-2 text-blue-400" />
        Your Referral Link
      </h3>

      <div className="space-y-4">
        {/* URL Display */}
        <div className="flex items-center space-x-3">
          <div className="flex-1 bg-gray-700 rounded-lg p-3 font-mono text-sm text-white break-all">
            {referralUrl || "Generating your referral link..."}
          </div>
          {referralUrl && (
            <button
              onClick={copyToClipboard}
              className={`px-4 py-3 rounded-lg flex items-center space-x-2 ${
                copied
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* How it works section */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <p className="text-sm text-blue-400 font-medium mb-2">
            How it works:
          </p>
          <ul className="text-xs text-gray-300 space-y-1">
            <li>• Share your unique referral link</li>
            <li>• Earn rewards when people join using your link</li>
            <li>• Track your referrals in your genealogy tree</li>
          </ul>
        </div>

        {/* User info - always show if available */}
        <div className="bg-gray-700/50 rounded-lg p-3">
          {typeof userId === "number" && (
            <p className="text-xs text-gray-400">
              <span className="font-medium">Your Referral ID:</span> {userId}
            </p>
          )}
          {userAddress && (
            <p className="text-xs text-gray-400 mt-1">
              <span className="font-medium">Wallet:</span>{" "}
              {userAddress.substring(0, 6)}...
              {userAddress.substring(userAddress.length - 4)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReferralLink;
