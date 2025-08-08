import { useState, useEffect } from 'react';
import { useWeb3 } from './useWeb3';

interface UserData {
  userId: number;
  referrerId: number;
  joinDate: string;
  directReferralCount: number;
  indirectReferralCount: number;
  totalReferralCount: number;
  totalEarnings: string;
  directReferralIncome: string;
  teamBonus: string;
  levelTotal: string;
  levelEligibility: number;
}

export const useBlockchainData = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { contract, account, web3 } = useWeb3();

  const formatDateFromUnix = (unixTimestamp: number): string => {
    const date = new Date(unixTimestamp * 1000);
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'Asia/Kolkata'
    }).format(date);
  };

  const fetchUserData = async () => {
    if (!contract || !account || !web3) {
      setError('Wallet not connected');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch basic user data
      const basicUserData = await contract.methods.users(account).call();
      const teamUserData = await contract.methods.tusers(account).call();

      if (!basicUserData.isExist) {
        setError('User not registered');
        return;
      }

      // Calculate direct referral income
      const directReferralCount = Number(teamUserData.directReferralCount);
      let incomeRate = 0;
      if (directReferralCount >= 1 && directReferralCount <= 3) {
        incomeRate = 0.014;
      } else if (directReferralCount > 3) {
        incomeRate = 0.018;
      }
      const directReferralIncome = directReferralCount * incomeRate;

      // Get team bonus
      const teamBonus = web3.utils.fromWei(teamUserData.earning, 'ether');

      // Calculate level income
      const levelEligibility = Number(basicUserData.levelEligibility);
      let levelTotal = BigInt(0);

      for (let i = 1; i <= Math.min(levelEligibility, 9); i++) {
        try {
          const levelPrice = await contract.methods.LEVEL_PRICE(i).call();
          const incomeCount = await contract.methods.getUserIncomeCount(account, i).call();
          const levelIncome = BigInt(incomeCount) * BigInt(levelPrice);
          levelTotal = levelTotal + levelIncome;
        } catch (err) {
          console.warn(`Error fetching level ${i} data:`, err);
        }
      }

      const levelTotalEth = web3.utils.fromWei(levelTotal.toString(), 'ether');
      const totalEarnings = parseFloat(directReferralIncome.toString()) + 
                           parseFloat(teamBonus) + 
                           parseFloat(levelTotalEth);

      const userData: UserData = {
        userId: Number(basicUserData.id),
        referrerId: Number(basicUserData.referrerID),
        joinDate: formatDateFromUnix(Number(basicUserData.joined)),
        directReferralCount: Number(teamUserData.directReferralCount),
        indirectReferralCount: Number(teamUserData.indirectReferralCount),
        totalReferralCount: Number(teamUserData.directReferralCount) + Number(teamUserData.indirectReferralCount),
        totalEarnings: totalEarnings.toFixed(6),
        directReferralIncome: directReferralIncome.toFixed(6),
        teamBonus: parseFloat(teamBonus).toFixed(6),
        levelTotal: parseFloat(levelTotalEth).toFixed(6),
        levelEligibility: levelEligibility
      };

      setUserData(userData);
    } catch (err: any) {
      console.error('Error fetching user data:', err);
      setError(err.message || 'Failed to fetch user data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (contract && account) {
      fetchUserData();
    }
  }, [contract, account]);

  return {
    userData,
    loading,
    error,
    refetch: fetchUserData
  };
};
