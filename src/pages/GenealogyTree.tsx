// src/pages/GenealogyTree.tsx
import React from 'react';
import { User as UserIcon, Loader2, AlertCircle, GitBranch } from 'lucide-react';
import { useMLMData } from '../hooks/useMLMData';
import ReferralLink from '../components/common/ReferralLink';

const GenealogyTree: React.FC = () => {
  const { data, loading, error } = useMLMData();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading genealogy tree...</p>
        </div>
      </div>
    );
  }

  if (error || !data.genealogy) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <p className="text-gray-400">Error: {error || 'No genealogy data available'}</p>
        </div>
      </div>
    );
  }

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Referral Link Section */}
      <ReferralLink userId={data.genealogy?.id} userAddress={data.genealogy?.address} />
      
      <div className="bg-slate-700 rounded-xl p-8 shadow-lg">
        <div className="flex items-center space-x-3 mb-8">
          <GitBranch className="text-blue-400" size={24} />
          <h2 className="text-white text-xl font-bold">Genealogy Tree (2 Levels)</h2>
        </div>

        <div className="flex flex-col items-center space-y-12">
          {/* You - Root Node */}
          <div className="bg-blue-600 rounded-lg p-4 text-center min-w-[140px]">
            <div className="w-12 h-12 bg-blue-700 rounded-full mx-auto mb-2 flex items-center justify-center">
              <UserIcon className="w-6 h-6 text-white" />
            </div>
            <p className="text-white font-semibold">You</p>
            <p className="text-blue-200 text-sm">ID: {data.genealogy.id}</p>
            <p className="text-blue-200 text-xs font-mono">{formatAddress(data.genealogy.address)}</p>
          </div>

          {/* Direct Referrals - Level 1 */}
          {data.genealogy.referrals && data.genealogy.referrals.length > 0 && (
            <div className="flex flex-wrap justify-center gap-4 max-w-6xl">
              {data.genealogy.referrals.map((member, index) => (
                <div key={index} className="bg-green-600 rounded-lg p-3 text-center min-w-[120px]">
                  <div className="w-10 h-10 bg-green-700 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-white font-semibold text-sm">Direct</p>
                  <p className="text-green-200 text-xs">ID: {member.id}</p>
                  <p className="text-green-200 text-xs font-mono">{formatAddress(member.address)}</p>
                </div>
              ))}
            </div>
          )}

          {/* Indirect Referrals - Level 2 */}
          {data.genealogy.referrals && (
            <div className="flex flex-wrap justify-center gap-3 max-w-6xl">
              {data.genealogy.referrals.map((directMember, directIndex) => 
                directMember.referrals?.map((indirectMember, indirectIndex) => (
                  <div key={`${directIndex}-${indirectIndex}`} className="bg-purple-600 rounded-lg p-2 text-center min-w-[110px]">
                    <div className="w-8 h-8 bg-purple-700 rounded-full mx-auto mb-1 flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-white font-semibold text-xs">Indirect</p>
                    <p className="text-purple-200 text-xs">ID: {indirectMember.id}</p>
                    <p className="text-purple-200 text-xs font-mono">{formatAddress(indirectMember.address)}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Empty state */}
          {(!data.genealogy.referrals || data.genealogy.referrals.length === 0) && (
            <div className="text-center py-8">
              <UserIcon className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No referrals yet</p>
              <p className="text-gray-500 text-sm">Start referring people to build your genealogy tree</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GenealogyTree;
