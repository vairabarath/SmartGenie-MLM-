import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWeb3 } from "../../hooks/useWeb3";
import { toast } from "react-toastify";
import { Wallet, CheckCircle, AlertCircle, UserCheck } from "lucide-react";
import {
  getStoredReferralInfo,
  cleanURLParameters,
} from "../../utils/referral";

interface WalletInfo {
  name: string;
  icon: string;
  rdns: string;
  uuid: string;
  provider: any;
}

const walletLogos: { [key: string]: string } = {
  MetaMask:
    "https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg",
  "Trust Wallet": "https://avatars.githubusercontent.com/u/32179889?s=200&v=4",
  WalletConnect: "https://walletconnect.com/walletconnect-logo.svg",
  "Coinbase Wallet": "https://www.coinbase.com/img/favicon.ico",
  "OKX Wallet":
    "https://static.okx.com/cdn/assets/imgs/MjAyMTA3/B194D5CFC9C5B77B7E5FBD5F2F0F56FC.png",
  "SafePal Wallet":
    "https://s2.coinmarketcap.com/static/img/coins/200x200/8119.png",
  SafePal: "https://s2.coinmarketcap.com/static/img/coins/200x200/8119.png",
};

const MultiWallet: React.FC = () => {
  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<WalletInfo | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const { setWalletProvider } = useWeb3();
  const navigate = useNavigate();

  // Get referral info
  const referralInfo = getStoredReferralInfo();

  useEffect(() => {
    // Clean URL parameters after loading
    cleanURLParameters();
  }, []);

  useEffect(() => {
    const detectWallets = () => {
      const detectedWallets: WalletInfo[] = [];

      // Listen for EIP-6963 provider announcements
      const handleProvider = (event: any) => {
        const { info, provider } = event.detail;

        // Avoid duplicates
        if (!detectedWallets.find((w) => w.uuid === info.uuid)) {
          detectedWallets.push({
            name: info.name,
            icon: walletLogos[info.name] || "/default-wallet-icon.svg",
            rdns: info.rdns,
            uuid: info.uuid,
            provider,
          });
          setWallets([...detectedWallets]);

          console.log("Current wallets list:", [...detectedWallets]);
        }
      };

      window.addEventListener("eip6963:announceProvider", handleProvider);

      // Request providers to announce themselves
      window.dispatchEvent(new Event("eip6963:requestProvider"));

      // Cleanup
      return () => {
        window.removeEventListener("eip6963:announceProvider", handleProvider);
      };
    };

    detectWallets();
  }, []);

  const handleWalletSelect = (wallet: WalletInfo) => {
    setSelectedWallet(wallet);
  };

  const handleConnect = async () => {
    if (!selectedWallet) {
      toast.error("Please select a wallet first");
      return;
    }

    if (isConnecting) {
      toast.warning("Connection already in progress, please wait...");
      return;
    }

    // Check if it's a supported wallet (MetaMask, Trust Wallet, or SafePal)
    const isMetaMask = selectedWallet.name.toLowerCase().includes("metamask");
    const isTrustWallet = selectedWallet.name.toLowerCase().includes("trust");
    const isSafePal = selectedWallet.name.toLowerCase().includes("safepal");

    if (!isMetaMask && !isTrustWallet && !isSafePal) {
      toast.error(
        "Only MetaMask, Trust Wallet, and SafePal are supported currently"
      );
      return;
    }

    setIsConnecting(true);

    try {
      // Add a small delay to prevent race conditions
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Set the wallet provider in context
      setWalletProvider(selectedWallet.provider);

      // Store wallet selection
      localStorage.setItem("selectedWalletRdns", selectedWallet.rdns);

      // Check if wallet is already connected first
      let accounts;
      try {
        accounts = await selectedWallet.provider.request({
          method: "eth_accounts",
        });
      } catch (error) {
        console.log("No existing accounts, will request access");
        accounts = [];
      }

      // If not connected, request access
      if (!accounts || accounts.length === 0) {
        accounts = await selectedWallet.provider.request({
          method: "eth_requestAccounts",
        });
      }

      if (accounts && accounts.length > 0) {
        // Store the account for future restoration
        localStorage.setItem("currentAccount", accounts[0]);
        toast.success(`Connected to ${selectedWallet.name}`);
        // Add small delay before navigation
        await new Promise((resolve) => setTimeout(resolve, 500));
        navigate("/session");
      } else {
        toast.error("No accounts found");
      }
    } catch (error: any) {
      console.error("Connection failed:", error);

      // Handle specific error codes
      if (error.code === 4001) {
        toast.error("User rejected the connection request");
      } else if (error.code === -32002) {
        toast.error(
          "Please check your wallet - there may be a pending request"
        );
      } else if (error.message?.includes("Already processing")) {
        toast.error(
          "Wallet is processing another request. Please wait and try again."
        );
      } else {
        toast.error("Failed to connect wallet. Please try again.");
      }

      // Clean up on error
      localStorage.removeItem("selectedWalletRdns");
      localStorage.removeItem("currentAccount");
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 p-6 sm:p-8 w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex justify-center mb-4">
            <Wallet className="w-12 h-12 sm:w-16 sm:h-16 text-blue-500" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">
            Connect Your Wallet
          </h1>
          <p className="text-sm sm:text-base text-gray-400">
            Choose a wallet to connect to SmartGenie
          </p>
        </div>

        {/* Referral Information */}
        {referralInfo && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="flex items-center mb-2">
              <UserCheck className="w-5 h-5 text-green-400 mr-2" />
              <h3 className="text-green-400 font-semibold">
                Referral Detected
              </h3>
            </div>
            <p className="text-sm text-gray-300">
              You're joining through a referral link!
            </p>
            <p className="text-xs text-green-400 font-mono mt-1">
              Referrer:{" "}
              {referralInfo.referrerAddress
                ? `${referralInfo.referrerAddress.substring(
                    0,
                    6
                  )}...${referralInfo.referrerAddress.substring(
                    referralInfo.referrerAddress.length - 4
                  )}`
                : `ID: ${referralInfo.referrerId}`}
            </p>
            {referralInfo.referrerCode && (
              <p className="text-xs text-gray-400">
                Code: {referralInfo.referrerCode}
              </p>
            )}
          </div>
        )}

        {wallets.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">
              No wallets detected in your browser
            </p>
            <p className="text-sm text-gray-500">
              Please install a Web3 wallet like MetaMask, Trust Wallet, or
              SafePal to continue
            </p>
          </div>
        ) : (
          <div className="space-y-3 mb-6">
            {wallets.map((wallet) => (
              <div
                key={wallet.uuid}
                onClick={() => handleWalletSelect(wallet)}
                className={`flex items-center p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                  selectedWallet?.uuid === wallet.uuid
                    ? "border-blue-500 bg-blue-500/10 shadow-lg"
                    : "border-gray-600 bg-gray-700/50 hover:border-gray-500 hover:bg-gray-700"
                }`}
              >
                <img
                  src={wallet.icon}
                  alt={wallet.name}
                  className="w-10 h-10 rounded-full mr-4"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "/default-wallet-icon.svg";
                  }}
                />
                <div className="flex-1">
                  <h3 className="text-white font-medium">{wallet.name}</h3>
                  <p className="text-gray-400 text-sm">
                    {wallet.name === "MetaMask"
                      ? "Recommended"
                      : wallet.name.toLowerCase().includes("trust")
                      ? "Supported"
                      : wallet.name.toLowerCase().includes("safepal")
                      ? "Supported"
                      : "Available"}
                  </p>
                </div>
                {selectedWallet?.uuid === wallet.uuid && (
                  <CheckCircle className="w-5 h-5 text-blue-500" />
                )}
              </div>
            ))}
          </div>
        )}

        <button
          onClick={handleConnect}
          disabled={!selectedWallet || isConnecting || wallets.length === 0}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
            selectedWallet && !isConnecting && wallets.length > 0
              ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl"
              : "bg-gray-600 text-gray-400 cursor-not-allowed"
          }`}
        >
          {isConnecting ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Connecting...
            </div>
          ) : (
            "Connect Wallet"
          )}
        </button>

        {selectedWallet && (
          <div className="mt-4 p-3 bg-gray-700/50 rounded-lg">
            <p className="text-sm text-gray-300">
              <span className="font-medium">Selected:</span>{" "}
              {selectedWallet.name}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiWallet;
