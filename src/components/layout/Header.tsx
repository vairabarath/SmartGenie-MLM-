// src/components/layout/Header.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Settings, User as UserIcon, LogOut, Wallet, Copy, TrendingUp, RefreshCw, Menu } from 'lucide-react';
import { useWeb3 } from '../../hooks/useWeb3';
import { usePrice } from '../../hooks/usePrice';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import mlmLogo from '../../assets/mlmLogo.jpeg';

interface HeaderProps {
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { account, logout } = useWeb3();
  const { bnbToUsd, isLoading: priceLoading, refreshPrice } = usePrice();
  const navigate = useNavigate();

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const copyAddress = async () => {
    if (account) {
      await navigator.clipboard.writeText(account);
      toast.success('Address copied to clipboard!');
    }
  };

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: 'Confirm Logout',
      text: 'Are you sure you want to logout?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Logout',
      cancelButtonText: 'Cancel',
      background: '#1f2937',
      color: '#ffffff',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280'
    });

    if (result.isConfirmed) {
      logout();
      toast.success('Logged out successfully');
      navigate('/');
    }
  };

  return (
    <div className="bg-gray-800 border-b border-gray-700 px-3 sm:px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Mobile hamburger menu */}
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <img src={mlmLogo} alt="logo" className='w-8 h-8' />
          {/* <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
            <Crown className="w-5 h-5" />
          </div> */}
          <div className="hidden sm:block">
            <h1 className="text-lg sm:text-xl font-bold">Nectareous Dashboard</h1>
            <p className="text-gray-400 text-sm hidden md:block">Welcome to your Dashboard!</p>
          </div>
          <div className="sm:hidden">
            <h1 className="text-sm font-bold">Nectareous Dashboard</h1>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* BNB Price Indicator */}
          <div className="hidden sm:flex items-center space-x-2 bg-gray-700/50 rounded-lg px-3 py-2">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-sm font-semibold text-green-400">
              {priceLoading ? 'Loading...' : `$${bnbToUsd.toFixed(2)}`}
            </span>
            <span className="text-xs text-gray-400">BNB</span>
            <button
              onClick={refreshPrice}
              className="text-gray-400 hover:text-white transition-colors"
              title="Refresh price"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>
          
          {/* Mobile BNB Price - Compact */}
          <div className="sm:hidden flex items-center space-x-1 bg-gray-700/50 rounded-lg px-2 py-1">
            <TrendingUp className="w-3 h-3 text-green-400" />
            <span className="text-xs font-semibold text-green-400">
              {priceLoading ? '...' : `$${bnbToUsd.toFixed(0)}`}
            </span>
          </div>
          
          {/* Wallet Info */}
          {account && (
            <div className="hidden md:flex items-center space-x-2 bg-gray-700/50 rounded-lg px-3 py-2">
              <Wallet className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-mono text-gray-300">{formatAddress(account)}</span>
              <button
                onClick={copyAddress}
                className="text-gray-400 hover:text-white transition-colors"
                title="Copy address"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          )}
          
          {/* Mobile Wallet Icon */}
          {account && (
            <div className="md:hidden">
              <button
                onClick={copyAddress}
                className="p-2 text-blue-400 hover:text-white transition-colors"
                title={`Copy ${formatAddress(account)}`}
              >
                <Wallet className="w-4 h-4" />
              </button>
            </div>
          )}
          
          <div className="hidden sm:block">
            <Bell className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer transition-colors" />
          </div>
          <div className="hidden sm:block">
            <Settings className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer transition-colors" />
          </div>
          
          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
            >
              <UserIcon className="w-5 h-5" />
            </button>
            
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
                <div className="py-2">
                  <div className="px-4 py-2 border-b border-gray-700">
                    <p className="text-sm text-gray-300">Connected Wallet</p>
                    <p className="text-xs font-mono text-gray-400">{formatAddress(account || '')}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-4 py-2 text-sm text-red-400 hover:bg-gray-700 transition-colors"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
