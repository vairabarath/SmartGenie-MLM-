import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWeb3 } from "../../hooks/useWeb3";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { Wallet, UserPlus, LogIn, Loader2 } from "lucide-react";

const Session: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [currentNetwork, setCurrentNetwork] = useState<string>("Unknown");
  const [networkId, setNetworkId] = useState<number>(0);
  const {
    account,
    connectWallet,
    checkUserRegistration,
    loginUser,
    contract,
    walletProvider,
    setWalletProvider,
    OPBNB_MAINNET_CHAIN_ID,
    OPBNB_MAINNET_NAME,
  } = useWeb3();
  const navigate = useNavigate();

  useEffect(() => {
    if (walletProvider && !account) {
      initializeConnection();
    } else if (account) {
      setWalletAddress(account);
      checkNetwork();
    }

    const storedAccount = localStorage.getItem("currentAccount");
    const storedWalletRdns = localStorage.getItem("selectedWalletRdns");

    if (storedAccount && storedWalletRdns && !walletProvider) {
      restoreWalletConnection(storedWalletRdns);
    }
  }, [walletProvider, account, contract]);

  useEffect(() => {
    if (account) {
      setWalletAddress(account);
      checkNetwork();
    }
  }, [account]);

  const checkNetwork = async () => {
    // FIXED: Use walletProvider instead of window.ethereum for multi-wallet support
    if (walletProvider) {
      try {
        const chainId = await walletProvider.request({
          method: "eth_chainId",
        });
        const chainIdDecimal = parseInt(chainId, 16);
        setNetworkId(chainIdDecimal);

        const networkNames = {
          1: "Ethereum Mainnet",
          56: "BSC Mainnet",
          204: OPBNB_MAINNET_NAME,
        };

        setCurrentNetwork(
          networkNames[chainIdDecimal as keyof typeof networkNames] ||
            `Unknown (${chainIdDecimal})`
        );

        if (chainIdDecimal !== OPBNB_MAINNET_CHAIN_ID) {
          console.warn("⚠️ Not on opBNB network. Current:", chainIdDecimal);
          toast.warning(`Please switch to ${OPBNB_MAINNET_NAME}`);
        }
      } catch (error) {
        console.error("Failed to check network:", error);
      }
    } else if (typeof window.ethereum !== "undefined") {
      // Fallback to window.ethereum for backwards compatibility
      try {
        const chainId = await window.ethereum.request({
          method: "eth_chainId",
        });
        const chainIdDecimal = parseInt(chainId, 16);
        setNetworkId(chainIdDecimal);

        const networkNames = {
          1: "Ethereum Mainnet",
          56: "BSC Mainnet",
          204: OPBNB_MAINNET_NAME,
        };

        setCurrentNetwork(
          networkNames[chainIdDecimal as keyof typeof networkNames] ||
            `Unknown (${chainIdDecimal})`
        );

        if (chainIdDecimal !== OPBNB_MAINNET_CHAIN_ID) {
          console.warn("⚠️ Not on opBNB network. Current:", chainIdDecimal);
          toast.warning(`Please switch to ${OPBNB_MAINNET_NAME}`);
        }
      } catch (error) {
        console.error("Failed to check network:", error);
      }
    }
  };

  const initializeConnection = async () => {
    try {
      const connected = await connectWallet();
      if (connected && account) {
        setWalletAddress(account);
      }
    } catch (error) {
      console.error("Failed to initialize connection:", error);
      toast.error("Failed to connect wallet");
    }
  };

  const handleLogin = async () => {
    if (!account) {
      toast.error("Wallet not connected");
      return;
    }
    setIsLoading(true);
    try {
      const result = await Swal.fire({
        title: "Confirm Login",
        html: `Do you want to login with:<br><strong>${account}</strong>`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Login",
        cancelButtonText: "Cancel",
        reverseButtons: true,
        background: "#1f2937",
        color: "#ffffff",
        confirmButtonColor: "#3b82f6",
        cancelButtonColor: "#6b7280",
      });
      if (result.isConfirmed) {
        const isRegistered = await checkUserRegistration(account);
        if (isRegistered) {
          const loginSuccess = await loginUser();
          if (loginSuccess) {
            navigate("/dashboard");
          } else {
            toast.error("Login failed");
          }
        } else {
          toast.error("User not registered. Please register first.");
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!account) {
      toast.error("Wallet not connected");
      return;
    }
    try {
      const isRegistered = await checkUserRegistration(account);
      if (isRegistered) {
        toast.info("Already a registered user");
        return;
      }
      navigate("/register");
    } catch (error) {
      console.error("Registration check error:", error);
      toast.error("Failed to check registration status");
    }
  };

  const restoreWalletConnection = async (rdns: string) => {
    try {
      const provider = await waitForWalletProvider(rdns);
      if (provider) {
        setWalletProvider(provider);
        console.log("Wallet provider restored for session");
      }
    } catch (error) {
      console.error("Failed to restore wallet connection:", error);
    }
  };

  const waitForWalletProvider = (rdns: string): Promise<any> => {
    return new Promise((resolve) => {
      let timeoutId: NodeJS.Timeout;
      const handleProvider = (event: any) => {
        const { info, provider } = event.detail;
        if (info.rdns === rdns) {
          clearTimeout(timeoutId);
          window.removeEventListener(
            "eip6963:announceProvider",
            handleProvider
          );
          resolve(provider);
        }
      };
      window.addEventListener("eip6963:announceProvider", handleProvider);
      window.dispatchEvent(new Event("eip6963:requestProvider"));
      timeoutId = setTimeout(() => {
        window.removeEventListener("eip6963:announceProvider", handleProvider);
        resolve(null);
      }, 2000);
    });
  };

  const formatAddress = (address: string) => {
    if (!address) return "";
    return `${address.substring(0, 6)}...${address.substring(
      address.length - 4
    )}`;
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 p-6 sm:p-8 w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-500/10 p-3 sm:p-4 rounded-full">
              <Wallet className="w-12 h-12 sm:w-16 sm:h-16 text-blue-500" />
            </div>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">
            {walletAddress ? "Wallet Detected!" : "Connecting..."}
          </h1>
          {walletAddress && (
            <div className="bg-gray-700/50 rounded-lg p-3 mb-4">
              <p className="text-sm text-gray-300 mb-1">Connected Wallet:</p>
              <p className="text-white font-mono text-xs sm:text-sm break-all">
                {formatAddress(walletAddress)}
              </p>
            </div>
          )}
          <p className="text-sm sm:text-base text-gray-400">
            {walletAddress
              ? "Choose an option to continue"
              : "Please wait while we connect your wallet..."}
          </p>
        </div>
        {walletAddress ? (
          <div className="space-y-4">
            <button
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <LogIn className="w-5 h-5 mr-2" />
              )}
              Login
            </button>
            <button
              onClick={handleRegister}
              disabled={isLoading}
              className="w-full flex items-center justify-center py-3 px-6 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl border border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Register
            </button>

            {/* Network Status and Switch Buttons */}
            {networkId !== 0 && (
              <div className="bg-gray-700/50 rounded-lg p-3 mb-2">
                <p className="text-sm text-gray-300 mb-1">Current Network:</p>
                <p
                  className={`text-sm font-mono ${
                    networkId === OPBNB_MAINNET_CHAIN_ID
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {currentNetwork}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Connecting to wallet...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Session;
