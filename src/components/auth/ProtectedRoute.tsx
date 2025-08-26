import React from 'react';
import { Navigate } from 'react-router-dom';
import { useWeb3 } from '../../hooks/useWeb3';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isConnected, account } = useWeb3();

  if (!isConnected || !account) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
