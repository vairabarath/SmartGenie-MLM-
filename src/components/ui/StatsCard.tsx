import React from "react";
import type { LucideIcon } from "lucide-react";
import BNBValue from './BNBValue';

interface StatsCardProps {
  title: string;
  value: string;
  change: string;
  icon: LucideIcon;
  iconColor: string;
  changeColor: string;
  bnbAmount?: number; // Optional BNB amount for automatic USD conversion
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  icon: Icon,
  iconColor,
  changeColor,
  bnbAmount,
}) => {
  return (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`${iconColor}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-gray-400 text-sm">{title}</p>
            {bnbAmount !== undefined ? (
              <div className="text-white text-xl font-semibold">
                <BNBValue 
                  bnbAmount={bnbAmount} 
                  bnbClassName="text-white font-semibold"
                  usdClassName="text-gray-400 text-sm block mt-1"
                  separator=""
                  showBNB={true}
                  showUSD={true}
                  decimals={4}
                />
              </div>
            ) : (
              <p className="text-white text-xl font-semibold">{value}</p>
            )}
          </div>
        </div>
        <div className={`text-sm font-medium ${changeColor}`}>{change}</div>
      </div>
    </div>
  );
};

export default StatsCard;
