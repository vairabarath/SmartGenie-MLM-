// src/pages/LevelStatus.tsx
import React from 'react';
import { Loader2, AlertCircle, TrendingUp } from 'lucide-react';
import { useMLMData } from '../hooks/useMLMData';
import BNBValue from '../components/ui/BNBValue';

const LevelStatus: React.FC = () => {
  const { data, loading, error } = useMLMData();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading level data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <p className="text-gray-400">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="bg-slate-700 rounded-xl p-6 shadow-lg">
        <div className="flex items-center space-x-3 mb-6">
          <TrendingUp className="text-green-400" size={24} />
          <h2 className="text-white text-xl font-bold">Upgrade Status & Income</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {data.levels.map((level) => (
            <div key={level.level} className="bg-slate-800 rounded-lg p-4 hover:bg-slate-750 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-semibold">Level {level.level}</h3>
                <div className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${
                  level.levelStat === 'active'
                    ? 'bg-green-500 text-white'
                    : 'bg-red-500 text-white'
                }`}>
                  {level.levelStat === 'active' ? 'Active' : 'Inactive'}
                </div>
              </div>

              <div className="mb-1">
                <BNBValue 
                  bnbAmount={typeof level.levelIncome === 'number' ? level.levelIncome : 0}
                  bnbClassName="text-green-400 text-base sm:text-lg font-bold"
                  usdClassName="text-gray-400 text-xs sm:text-sm block"
                />
              </div>
              <div className="text-gray-400 text-xs sm:text-sm">
                Income from this upgrade
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LevelStatus;
