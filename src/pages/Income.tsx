import React from 'react';
import { Loader2, AlertCircle, DollarSign } from 'lucide-react';
import { useMLMData } from '../hooks/useMLMData';
import BNBValue from '../components/ui/BNBValue';

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
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-slate-700 rounded-xl p-6 shadow-lg">
        <div className="flex items-center space-x-3 mb-6">
          <DollarSign className="text-green-400" size={24} />
          <h3 className="text-xl font-semibold text-white">Income Breakdown</h3>
        </div>
        <div className="space-y-4">
          <div className="bg-slate-800 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Direct Referral Income:</span>
              <div className="text-right">
                <BNBValue bnbAmount={data.income.dirRefInc} />
              </div>
            </div>
          </div>
          <div className="bg-slate-800 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Team Bonus:</span>
              <div className="text-right">
                <BNBValue bnbAmount={data.income.teamBon} />
              </div>
            </div>
          </div>
          <div className="bg-slate-800 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Income from ALL levels:</span>
              <div className="text-right">
                <BNBValue bnbAmount={data.income.levelTot} />
              </div>
            </div>
          </div>
          <div className="bg-slate-800 rounded-lg p-4 border-t-2 border-green-400">
            <div className="flex justify-between items-center">
              <span className="text-white font-semibold">Total Earnings:</span>
              <div className="text-right">
                <BNBValue 
                  bnbAmount={data.income.totalInc} 
                  bnbClassName="text-green-400 font-bold text-lg"
                />
              </div>
            </div>
            <p className="text-gray-400 text-sm mt-1">{data.income.dirRefInc.toFixed(6)} + {data.income.teamBon.toFixed(6)} + {data.income.levelTot.toFixed(6)} = {data.income.totalInc.toFixed(6)} BNB</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Income;
