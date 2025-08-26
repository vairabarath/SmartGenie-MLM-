import { useState, useEffect } from "react";
import { useWeb3 } from "./useWeb3";

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
    genealogy: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const web3Context = useWeb3();

  const fetchAllData = async () => {
    if (!web3Context?.account) {
      setError("Wallet not connected");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const {
        getPersonalDash,
        getTeamDevDash,
        getLevelDash,
        getIncomeDash,
        getGeneome,
      } = web3Context;

      // Execute all the MLM functions with error handling for each
      const results = await Promise.allSettled([
        safeCall(getPersonalDash),
        safeCall(getTeamDevDash),
        safeCall(getLevelDash),
        safeCall(getIncomeDash),
        safeCall(getGeneome),
      ]);

      const [personalData, teamData, levelData, incomeData, genealogyData] =
        results;

      setData({
        personal: getResult(personalData),
        team: getResult(teamData),
        levels: getResult(levelData)?.lvlData || [],
        income: getResult(incomeData),
        genealogy: getResult(genealogyData),
      });
    } catch (err: any) {
      console.error("Error fetching MLM data:", err);
      setError(err.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to safely call functions
  const safeCall = async (fn: Function) => {
    try {
      return await fn();
    } catch (err) {
      console.error("Error in data fetch:", err);
      return null;
    }
  };

  // Helper to extract result from PromiseSettledResult
  const getResult = (result: PromiseSettledResult<any>) => {
    return result.status === "fulfilled" ? result.value : null;
  };

  useEffect(() => {
    if (web3Context?.account && web3Context?.isConnected) {
      fetchAllData();
    }
  }, [web3Context?.account, web3Context?.isConnected]);

  return {
    data,
    loading,
    error,
    refetch: fetchAllData,
  };
};
