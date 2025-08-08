import React from 'react';
import { TrendingUp } from 'lucide-react';

interface WalletChartProps {
  selectedPeriod: string;
  setSelectedPeriod: (period: string) => void;
}

const WalletChart: React.FC<WalletChartProps> = ({ selectedPeriod, setSelectedPeriod }) => {
  const periods = ['1D', '1W', '1M', '3M', '1Y'];

  return (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Wallet Performance</h3>
        <div className="flex space-x-2">
          {periods.map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                selectedPeriod === period
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>
      
      <div className="h-64 flex items-center justify-center bg-gray-700/30 rounded-lg">
        <div className="text-center">
          <TrendingUp className="w-12 h-12 text-gray-500 mx-auto mb-2" />
          <p className="text-gray-400">Chart visualization will be displayed here</p>
          <p className="text-sm text-gray-500 mt-1">Selected period: {selectedPeriod}</p>
        </div>
      </div>
    </div>
  );
};

export default WalletChart;
