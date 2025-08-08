import React from 'react';
import { usePrice } from '../../hooks/usePrice';

interface BNBValueProps {
  bnbAmount: number;
  showBNB?: boolean;
  showUSD?: boolean;
  bnbClassName?: string;
  usdClassName?: string;
  separator?: string;
  decimals?: number;
  usdDecimals?: number;
}

const BNBValue: React.FC<BNBValueProps> = ({
  bnbAmount,
  showBNB = true,
  showUSD = true,
  bnbClassName = "text-green-400 font-bold",
  usdClassName = "text-gray-400 ml-2",
  separator = " ≈ ",
  decimals = 6,
  usdDecimals = 2
}) => {
  const { bnbToUsd, isLoading } = usePrice();
  
  const usdAmount = bnbAmount * bnbToUsd;
  
  const formatBNB = (amount: number) => {
    return amount.toFixed(decimals);
  };
  
  const formatUSD = (amount: number) => {
    return amount.toFixed(usdDecimals);
  };

  return (
    <span className="inline-flex items-baseline">
      {showBNB && (
        <span className={bnbClassName}>
          {formatBNB(bnbAmount)} BNB
        </span>
      )}
      {showBNB && showUSD && separator}
      {showUSD && (
        <span className={usdClassName}>
          {isLoading ? (
            "Loading..."
          ) : (
            `$${formatUSD(usdAmount)}`
          )}
        </span>
      )}
    </span>
  );
};

export default BNBValue;
