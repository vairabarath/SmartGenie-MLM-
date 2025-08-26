import React from 'react';
import { Loader2, AlertCircle, DollarSign } from 'lucide-react';
import { useMLMData } from '../../hooks/useMLMData';
import BNBValue from './BNBValue';

const Income: React.FC = () => {
  const { data, loading, error } = useMLMData();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading income data...</p>
        </div>
      </div>
    );
  }

  if (error || !data.income) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <p className="text-gray-400">Error: {error || 'No income data available'}</p>
        </div>
      </div>
    );
  }


  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="bg-slate-700 rounded-xl p-6 shadow-lg">
        <div className="flex items-center space-x-3 mb-6">
          <DollarSign className="text-green-400" size={24} />
          <h3 className="text-xl font-semibold text-white">Income Breakdown</h3>
        </div>
        <div className="space-y-4">
          <div className="bg-slate-800 rounded-lg p-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <span className="text-gray-300">Direct Referral Income:</span>
              <div className="text-left sm:text-right">
                <BNBValue bnbAmount={data.income.dirRefInc} />
              </div>
            </div>
          </div>
          <div className="bg-slate-800 rounded-lg p-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <span className="text-gray-300">Team Development Bonus:</span>
              <div className="text-left sm:text-right">
                <BNBValue bnbAmount={data.income.teamBon} />
              </div>
            </div>
          </div>
          <div className="bg-slate-800 rounded-lg p-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <span className="text-gray-300">Income from ALL Upgrades:</span>
              <div className="text-left sm:text-right">
                <BNBValue bnbAmount={data.income.levelTot} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Income;
