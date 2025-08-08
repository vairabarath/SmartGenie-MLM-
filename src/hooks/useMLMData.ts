import { useState, useEffect } from 'react';
import { useWeb3 } from './useWeb3';

interface PersonalData {
  userId: number;
  refId: number;
  doj: string;
}

interface TeamData {
  dRefCnt: number;
  indRefCnt: number;
  refTotal: number;
}

interface LevelData {
  level: number;
  levelStat: string;
  levelIncome: number;
}

interface IncomeData {
  dirRefInc: number;
  teamBon: number;
  levelTot: number;
  totalInc: number;
}

interface GenealogyNode {
  address: string;
  id: number;
  referrals?: GenealogyNode[];
}

interface MLMData {
  personal: PersonalData | null;
  team: TeamData | null;
  levels: LevelData[];
  income: IncomeData | null;
  genealogy: GenealogyNode | null;
}

export const useMLMData = () => {
  const [data, setData] = useState<MLMData>({
    personal: null,
    team: null,
    levels: [],
    income: null,
    genealogy: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const web3Context = useWeb3();
  
  const fetchAllData = async () => {
    if (!web3Context?.account) {
      setError('Wallet not connected');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { getPersonalDash, getTeamDevDash, getLevelDash, getIncomeDash, getGeneome } = web3Context;

      // Execute all the MLM functions in parallel
      const [personalData, teamData, levelData, incomeData, genealogyData] = await Promise.allSettled([
        getPersonalDash(),
        getTeamDevDash(),
        getLevelDash(),
        getIncomeDash(),
        getGeneome()
      ]);

      setData({
        personal: personalData.status === 'fulfilled' ? personalData.value : null,
        team: teamData.status === 'fulfilled' ? teamData.value : null,
        levels: levelData.status === 'fulfilled' ? levelData.value?.lvlData || [] : [],
        income: incomeData.status === 'fulfilled' ? incomeData.value : null,
        genealogy: genealogyData.status === 'fulfilled' ? genealogyData.value : null
      });

      // Log any rejected promises
      [personalData, teamData, levelData, incomeData, genealogyData].forEach((result, index) => {
        if (result.status === 'rejected') {
          console.warn(`Data fetch ${index} failed:`, result.reason);
        }
      });

    } catch (err: any) {
      console.error('Error fetching MLM data:', err);
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (web3Context?.account && web3Context?.isConnected) {
      // Fetch data when wallet is connected and ready
      const timer = setTimeout(() => {
        fetchAllData();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [web3Context?.account, web3Context?.isConnected]);

  return {
    data,
    loading,
    error,
    refetch: fetchAllData
  };
};
