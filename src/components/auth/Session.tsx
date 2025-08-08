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
    web3,
    walletProvider,
    setWalletProvider,
  } = useWeb3();
  const navigate = useNavigate();

  useEffect(() => {
    console.log("WalletProvider:", walletProvider, "Account:", account);
    if (walletProvider && !account) {
      initializeConnection();
    } else if (account) {
      setWalletAddress(account);
      checkNetwork();
      // Only fetch user list if contract is initialized
      if (contract) {
        fetchUserList();
      }
    }

    const storedAccount = localStorage.getItem("currentAccount");
    const storedWalletRdns = localStorage.getItem("selectedWalletRdns");

    if (storedAccount && storedWalletRdns && !walletProvider) {
      console.log("Attempting to restore wallet connection for session page");
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
    if (typeof window.ethereum !== "undefined") {
      try {
        const chainId = await window.ethereum.request({
          method: "eth_chainId",
        });
        const chainIdDecimal = parseInt(chainId, 16);
        setNetworkId(chainIdDecimal);

        const networkNames = {
          1: "Ethereum Mainnet",
          5: "Goerli Testnet",
          56: "BSC Mainnet",
          97: "BSC Testnet",
          204: "opBNB Mainnet",
          5611: "opBNB Testnet",
        };

        setCurrentNetwork(
          networkNames[chainIdDecimal as keyof typeof networkNames] ||
            `Unknown (${chainIdDecimal})`
        );

        if (![204, 5611].includes(chainIdDecimal)) {
          console.warn("⚠️ Not on opBNB network. Current:", chainIdDecimal);
          toast.warning(
            "Please switch to opBNB network for full functionality"
          );
        }
      } catch (error) {
        console.error("Failed to check network:", error);
      }
    }
  };

  const fetchUserList = async () => {
    try {
      if (!contract || !web3) {
        console.error("Contract or Web3 not initialized");
        // Don't show toast error immediately - wait for initialization
        return;
      }

      // First, verify contract exists
      const contractCode = await web3.eth.getCode(contract.options.address);
      if (contractCode === "0x") {
        console.error(
          "No contract found at address:",
          contract.options.address
        );
        toast.error("Contract not found at specified address");
        return;
      }

      console.log("✅ Contract exists, fetching user list...");

      // Get current user ID with proper error handling
      let currUserID;
      try {
        currUserID = await contract.methods.currUserID().call();
        console.log("Current User ID:", currUserID.toString());
      } catch (error) {
        console.error("Failed to get currUserID:", error);
        toast.error("Failed to query contract - check network connection");
        return;
      }

      const userIDNumber = Number(currUserID.toString());
      if (userIDNumber <= 1) {
        console.log("No users registered yet or only owner exists");
        return;
      }

      const entries = [];
      for (let i = 1; i <= userIDNumber; i++) {
        try {
          const userAddress = await contract.methods.userList(i).call();
          if (
            userAddress &&
            userAddress !== "0x0000000000000000000000000000000000000000"
          ) {
            entries.push({ id: i, address: userAddress });
          }
        } catch (err) {
          console.warn(
            `Failed to fetch userList for ID ${i}:`,
            err instanceof Error ? err.message : String(err)
          );
          // Continue with next ID instead of breaking
        }
      }

      console.log("User List:", entries);

      // Log user list for debugging purposes
      if (entries.length > 0) {
        console.log(
          `✅ Successfully fetched ${entries.length} users from userList`
        );
      } else {
        console.log("ℹ️ No valid users found in userList");
      }
    } catch (error) {
      console.error("Error fetching userList:", error);
      toast.error(
        `Failed to fetch user list: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  };

  const initializeConnection = async () => {
    try {
      const connected = await connectWallet();
      if (connected && account) {
        setWalletAddress(account);
        fetchUserList();
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
        fetchUserList();
        const isRegistered = await checkUserRegistration(account);
        if (isRegistered) {
          const loginSuccess = await loginUser();
          if (loginSuccess) {
            toast.success("Login successful!");
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
        fetchUserList();
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
      <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-500/10 p-4 rounded-full">
              <Wallet className="w-16 h-16 text-blue-500" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            {walletAddress ? "Wallet Detected!" : "Connecting..."}
          </h1>
          {walletAddress && (
            <div className="bg-gray-700/50 rounded-lg p-3 mb-4">
              <p className="text-sm text-gray-300 mb-1">Connected Wallet:</p>
              <p className="text-white font-mono text-sm">
                {formatAddress(walletAddress)}
              </p>
            </div>
          )}
          <p className="text-gray-400">
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
                    [204, 5611].includes(networkId)
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {currentNetwork}
                </p>
              </div>
            )}

            {/* Network Switch Buttons - only show if not on opBNB */}
            {![204, 5611].includes(networkId) && (
              <div className="space-y-2">
                <button
                  onClick={async () => {
                    try {
                      await window.ethereum.request({
                        method: "wallet_switchEthereumChain",
                        params: [{ chainId: "0x15EB" }], // 5611 in hex for opBNB testnet
                      });
                      toast.success("Switched to opBNB testnet");
                      checkNetwork();
                    } catch (error: any) {
                      if (error.code === 4902) {
                        // Network not added, try to add it
                        try {
                          await window.ethereum.request({
                            method: "wallet_addEthereumChain",
                            params: [
                              {
                                chainId: "0x15EB",
                                chainName: "opBNB Testnet",
                                nativeCurrency: {
                                  name: "BNB",
                                  symbol: "BNB",
                                  decimals: 18,
                                },
                                rpcUrls: [
                                  "https://opbnb-testnet-rpc.bnbchain.org",
                                ],
                                blockExplorerUrls: ["https://opbnbscan.com"],
                              },
                            ],
                          });
                          toast.success("opBNB Testnet added and switched");
                          checkNetwork();
                        } catch (addError) {
                          toast.error("Failed to add opBNB testnet");
                        }
                      } else {
                        toast.error("Failed to switch network");
                      }
                    }
                  }}
                  className="w-full flex items-center justify-center py-2 px-4 bg-orange-600 hover:bg-orange-700 text-white text-sm rounded-lg transition-all duration-200"
                >
                  🌐 Switch to opBNB Testnet
                </button>

                <button
                  onClick={async () => {
                    try {
                      await window.ethereum.request({
                        method: "wallet_switchEthereumChain",
                        params: [{ chainId: "0xCC" }], // 204 in hex for opBNB mainnet
                      });
                      toast.success("Switched to opBNB mainnet");
                      checkNetwork();
                    } catch (error: any) {
                      if (error.code === 4902) {
                        // Network not added, try to add it
                        try {
                          await window.ethereum.request({
                            method: "wallet_addEthereumChain",
                            params: [
                              {
                                chainId: "0xCC",
                                chainName: "opBNB Mainnet",
                                nativeCurrency: {
                                  name: "BNB",
                                  symbol: "BNB",
                                  decimals: 18,
                                },
                                rpcUrls: [
                                  "https://opbnb-mainnet-rpc.bnbchain.org",
                                ],
                                blockExplorerUrls: ["https://opbnbscan.com"],
                              },
                            ],
                          });
                          toast.success("opBNB Mainnet added and switched");
                          checkNetwork();
                        } catch (addError) {
                          toast.error("Failed to add opBNB mainnet");
                        }
                      } else {
                        toast.error("Failed to switch network");
                      }
                    }
                  }}
                  className="w-full flex items-center justify-center py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-all duration-200"
                >
                  🌐 Switch to opBNB Mainnet
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Connecting to wallet...</p>
          </div>
        )}
        {/* {walletAddress && (
          <div className="mt-6 p-3 bg-gray-700/30 rounded-lg">
            <div className="flex items-center text-sm text-gray-300">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Wallet connected successfully
            </div>
          </div>
        )} */}

        {/* Contract Status Indicator */}
        {/* {walletAddress && (
          <div className="mt-6 p-3 bg-gray-700/30 rounded-lg">
            <div className="flex items-center text-sm text-gray-300">
              {contract ? (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Smart contract connected
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                  Contract initializing...
                </>
              )}
            </div>
          </div>
        )} */}
      </div>
    </div>
  );
};

export default Session;
