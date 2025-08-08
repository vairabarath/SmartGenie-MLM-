import React, { useState } from 'react';
import { Link, Copy, Check, Share2 } from 'lucide-react';
import { generateReferralURL } from '../../utils/referral';
import { toast } from 'react-toastify';

interface ReferralLinkProps {
  userId?: string | number;
  userAddress?: string;
  userCode?: string;
}

const ReferralLink: React.FC<ReferralLinkProps> = ({ userId, userAddress, userCode }) => {
  const [copied, setCopied] = useState(false);
  
  const referralUrl = userId ? generateReferralURL(userId, userCode) : '';
  
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Referral link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
      toast.error('Failed to copy referral link');
    }
  };

  const shareReferralLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join SmartGenie MLM',
          text: 'Join me on SmartGenie and start earning cryptocurrency through our MLM platform!',
          url: referralUrl,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback to copying
      copyToClipboard(referralUrl);
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
        <div className="flex items-center space-x-3">
          <div className="flex-1 bg-gray-700 rounded-lg p-3 font-mono text-sm text-white break-all">
            {referralUrl}
          </div>
          <button
            onClick={() => copyToClipboard(referralUrl)}
            className={`px-4 py-3 rounded-lg flex items-center space-x-2 transition-all duration-200 ${
              copied
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
            title="Copy to clipboard"
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
          <button
            onClick={shareReferralLink}
            className="bg-purple-600 hover:bg-purple-700 px-4 py-3 rounded-lg flex items-center space-x-2 transition-all duration-200"
            title="Share link"
          >
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </button>
        </div>
        
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <p className="text-sm text-blue-400 font-medium mb-2">How it works:</p>
          <ul className="text-xs text-gray-300 space-y-1">
            <li>• Share this link with friends and family</li>
            <li>• When they register using your link, they become your referral</li>
            <li>• You earn commissions from their activities</li>
            <li>• Build your network and increase your earnings</li>
          </ul>
        </div>
        
        {(userId || userAddress) && (
          <div className="bg-gray-700/50 rounded-lg p-3">
            {userId && (
              <p className="text-xs text-gray-400">
                <span className="font-medium">Your User ID:</span> {userId}
              </p>
            )}
            {userAddress && (
              <p className="text-xs text-gray-400 mt-1">
                <span className="font-medium">Your Address:</span> {userAddress.substring(0, 8)}...{userAddress.substring(userAddress.length - 8)}
              </p>
            )}
            {userCode && (
              <p className="text-xs text-gray-400 mt-1">
                <span className="font-medium">Your Code:</span> {userCode}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReferralLink;
