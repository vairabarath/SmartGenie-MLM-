import { useContext } from 'react';
import { PriceContext } from '../contexts/PriceContext';

export const usePrice = () => {
  const context = useContext(PriceContext);
  if (!context) {
    throw new Error('usePrice must be used within a PriceProvider');
  }
  return context;
};
