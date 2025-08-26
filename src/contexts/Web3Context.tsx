import React, {
  createContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import Web3 from "web3";
import { BN } from "bn.js";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

// Import blockchain configuration and ABI
import contractABI from "../api/newmlm.json";

// MLM Data Interfaces
interface PersonalData {
  userId: number;
  refId: number;
  doj: string;
}

interface TeamData {
  dRefCnt: number;
  indRefCnt: number;
  refTotal: number;
}

interface LevelData {
  level: number;
  levelStat: string;
  levelIncome: number;
}

interface IncomeData {
  dirRefInc: number;
  teamBon: number;
  levelTot: number;
  totalInc: number;
}

interface GenealogyNode {
  address: string;
  id: number;
  referrals?: GenealogyNode[];
}

interface Web3ContextType {
  web3: Web3 | null;
  account: string | null;
  isConnected: boolean;
  contract: any;
  OPBNB_MAINNET_CHAIN_ID: number;
  OPBNB_MAINNET_HEX: string;
  OPBNB_MAINNET_NAME: string;
  connectWallet: () => Promise<boolean>;
  checkUserRegistration: (address: string) => Promise<boolean>;
  registerUser: (referralId: string) => Promise<boolean>;
  loginUser: () => Promise<boolean>;
  logout: () => void;
  walletProvider: any;
  setWalletProvider: (provider: any) => void;
  // MLM specific functions
  getPersonalDash: () => Promise<PersonalData | null>;
  getTeamDevDash: () => Promise<TeamData | null>;
  getLevelDash: () => Promise<{
    lvlData: LevelData[];
    lvlTotal: number;
  } | null>;
  getIncomeDash: () => Promise<IncomeData | null>;
  getGeneome: () => Promise<GenealogyNode | null>;
  getTeamBonus: () => Promise<{ teamBonus: number } | null>;
  getDirectRefIncome: () => Promise<{
    dirRefCnt: number;
    dirRefCalc: string;
    dirRefIncome: number;
  } | null>;
  extractReferralId: (url: string) => Promise<string | null>;
  unixToIndianDate: (timestamp: number | string | bigint) => string;
}

interface Web3ProviderProps {
  children: ReactNode;
}

export const Web3Context = createContext<Web3ContextType | null>(null);

const CONTRACT_ADDRESS = "0x6b9c86c809321ba5e4ef4d96f793e45f34828e62";
const OPBNB_MAINNET_CHAIN_ID = 204;
const OPBNB_MAINNET_HEX = "0xCC";
const OPBNB_MAINNET_NAME = "opBNB Mainnet";

export const Web3Provider: React.FC<Web3ProviderProps> = ({ children }) => {
  const [web3, setWeb3] = useState<Web3 | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [contract, setContract] = useState<any>(null);
  const [walletProvider, setWalletProvider] = useState<any>(null);

  useEffect(() => {
    const initializeFromStorage = async () => {
      // Check if user was previously logged in
      const savedAccount = localStorage.getItem("currentAccount");
      const savedWalletRdns = localStorage.getItem("selectedWalletRdns");

      if (savedAccount && savedWalletRdns) {
        setAccount(savedAccount);

        // Try to restore the wallet provider
        try {
          const provider = await waitForWalletProvider(savedWalletRdns);
          if (provider) {
            setWalletProvider(provider);
            // The wallet provider will be set, and then initializeWeb3 will be called via useEffect
          } else {
            console.warn("Web3Context: Could not restore wallet provider");
          }
        } catch (error) {
          console.error("Web3Context: Error restoring wallet provider:", error);
        }
      }
    };

    initializeFromStorage();
  }, []);

  // Add useEffect to initialize Web3 when walletProvider is set
  useEffect(() => {
    if (walletProvider && account) {
      initializeWeb3();
      setupWalletListeners(); // Set up listeners when provider is available
    }
  }, [walletProvider, account]);

  // Clean up old listeners when wallet provider changes
  useEffect(() => {
    return () => {
      if (walletProvider) {
        try {
          walletProvider.removeAllListeners?.("accountsChanged");
          walletProvider.removeAllListeners?.("chainChanged");
        } catch (error) {
          console.log("Error removing listeners:", error);
        }
      }
    };
  }, [walletProvider]);

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

      // Listen for provider announcements
      window.addEventListener("eip6963:announceProvider", handleProvider);

      // Request providers to announce themselves
      window.dispatchEvent(new Event("eip6963:requestProvider"));

      // Timeout after 3 seconds if provider not found
      timeoutId = setTimeout(() => {
        window.removeEventListener("eip6963:announceProvider", handleProvider);
        console.log("Timeout waiting for wallet provider:", rdns);
        resolve(null);
      }, 3000);
    });
  };

  const setupWalletListeners = () => {
    // FIXED: Use walletProvider instead of window.ethereum for multi-wallet support
    if (walletProvider) {
      // Remove existing listeners first to avoid duplicates
      try {
        walletProvider.removeAllListeners?.("accountsChanged");
        walletProvider.removeAllListeners?.("chainChanged");
      } catch (error) {
        console.log("No existing listeners to remove");
      }

      // Add new listeners
      walletProvider.on("accountsChanged", handleAccountsChanged);
      walletProvider.on("chainChanged", handleChainChanged);
    }
  };

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      logout();
    } else if (account && accounts[0] !== account) {
      Swal.fire({
        title: "Account Changed",
        text: "You have switched to a different account. Please login again.",
        icon: "warning",
      }).then(() => {
        logout();
      });
    }
  };

  const handleChainChanged = async (chainId: string) => {
    const currentChainId = parseInt(chainId, 16);
    if (currentChainId !== OPBNB_MAINNET_CHAIN_ID) {
      const result = await Swal.fire({
        title: "Wrong Network",
        text: "Please switch to opBNB network to continue",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Switch Network",
        cancelButtonText: "Logout",
      });

      if (result.isConfirmed) {
        await switchToOpBNB();
      } else {
        logout();
      }
    }
  };

  const switchToOpBNB = async () => {
    try {
      // FIXED: Use walletProvider instead of window.ethereum
      const provider = walletProvider || window.ethereum;
      if (!provider) {
        toast.error("No wallet provider available");
        return false;
      }

      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0xCC" }], // 204 in hex for opBNB mainnet
      });
      return true;
    } catch (error: any) {
      if (error.code === 4902) {
        try {
          const provider = walletProvider || window.ethereum;
          await provider.request({
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
                rpcUrls: ["https://opbnb-mainnet-rpc.bnbchain.org"],
                blockExplorerUrls: ["https://opbnbscan.com"],
              },
            ],
          });
          return true;
        } catch (addError) {
          toast.error("Failed to add opBNB Mainnet");
          return false;
        }
      } else {
        toast.error("Failed to switch network");
        return false;
      }
    }
  };

  const checkNetworkAndInitialize = async (provider: any) => {
    try {
      const web3Instance = new Web3(provider);
      const chainId = await web3Instance.eth.getChainId();

      if (Number(chainId) !== OPBNB_MAINNET_CHAIN_ID) {
        toast.error("Please switch to opBNB network");
        return false;
      }

      setWeb3(web3Instance);

      // Initialize contract with better error handling
      try {
        const contractInstance = new web3Instance.eth.Contract(
          contractABI as any,
          CONTRACT_ADDRESS
        );

        // Test the contract with a simple call
        const code = await web3Instance.eth.getCode(CONTRACT_ADDRESS);
        if (code === "0x") {
          console.error("No contract found at address:", CONTRACT_ADDRESS);
          toast.error("Contract not found at specified address");
          return false;
        }

        // Try a simple contract call to verify ABI compatibility
        try {
          await contractInstance.methods.currUserID().call();
          console.log("✅ Contract ABI verification successful");
        } catch (abiError) {
          console.warn(
            "⚠️ Contract ABI verification failed, but continuing:",
            abiError
          );
          // Continue anyway - the contract exists, might be ABI version issue
        }

        setContract(contractInstance);
        return true;
      } catch (contractError) {
        console.error("Contract initialization failed:", contractError);
        toast.error("Failed to initialize contract");
        return false;
      }
    } catch (error) {
      console.error("Network check failed:", error);
      toast.error("Failed to connect to network");
      return false;
    }
  };

  const initializeWeb3 = async () => {
    console.log("Initializing Web3 with walletProvider:", walletProvider);
    if (walletProvider) {
      const success = await checkNetworkAndInitialize(walletProvider);
      if (success) {
        setIsConnected(true);
      } else {
        console.error("Web3 initialization failed");
      }
    } else {
      console.warn("No wallet provider available for initialization");
    }
  };

  const connectWallet = async (): Promise<boolean> => {
    try {
      if (!walletProvider) {
        toast.error("No wallet provider selected");
        return false;
      }

      // First check if already connected
      let accounts;
      try {
        accounts = await walletProvider.request({ method: "eth_accounts" });
      } catch (error) {
        console.log("No existing accounts, will request access");
        accounts = [];
      }

      // If not connected, request access
      if (!accounts || accounts.length === 0) {
        accounts = await walletProvider.request({
          method: "eth_requestAccounts",
        });
      }

      if (accounts.length > 0) {
        setAccount(accounts[0]);
        console.log("Account set:", accounts[0]);

        const networkOk = await checkNetworkAndInitialize(walletProvider);
        if (!networkOk) {
          console.log("Network check failed, but proceeding with connection");
          // Still set as connected even if network is wrong - user can switch later
        }

        setIsConnected(true);
        localStorage.setItem("currentAccount", accounts[0]);
        console.log("Wallet connected successfully");
        return true;
      }
      return false;
    } catch (error: any) {
      console.error("Wallet connection failed:", error);

      // Handle specific error codes
      if (error.code === 4001) {
        console.log("User rejected the connection request");
      } else if (error.code === -32002) {
        console.log("Already processing request");
      } else {
        toast.error("Failed to connect wallet");
      }
      return false;
    }
  };

  const checkUserRegistration = async (address: string): Promise<boolean> => {
    try {
      if (!contract) {
        console.error("Contract not initialized");
        return false;
      }

      if (!address) {
        console.error("No address provided");
        return false;
      }

      const userData = await contract.methods.users(address).call();
      console.log("User data:", userData);



      const isRegistered = userData && userData.isExist === true;
      console.log(`User ${address} registration status:`, isRegistered);

      return isRegistered;
    } catch (error) {
      console.error("Error checking user registration:", error);
      if (
        error instanceof Error &&
        error.message.includes("execution reverted")
      ) {
        return false;
      }
      // For other errors (network issues, etc.), throw to let caller handle
      throw error;
    }
  };

  const registerUser = async (referralId: string): Promise<boolean> => {
    try {
      if (!contract || !account || !web3) {
        toast.error("Wallet not connected");
        return false;
      }

      if (!referralId || referralId === "Not specified") {
        toast.error("Invalid referral ID");
        return false;
      }



      const registrationFeeWei = await contract.methods.REG_FEE().call();

      const gasPrice = await web3.eth.getGasPrice();
      const bufferedGasPrice = Math.floor(Number(gasPrice) * 1.2);

      const estimatedGas = await contract.methods
        .regUser(referralId)
        .estimateGas({
          from: account,
          value: registrationFeeWei,
        });

      await contract.methods.regUser(referralId).send({
        from: account,
        value: registrationFeeWei,
        gas: estimatedGas,
        gasPrice: bufferedGasPrice,
      });

      return true;
    } catch (error: any) {
      console.error("Registration error:", error);
      if (error.code === 4001) {
        toast.error("User denied transaction");
      } else {
        toast.error("Registration failed");
      }
      return false;
    }
  };

  const loginUser = async (): Promise<boolean> => {
    try {
      if (!account) return false;

      const isRegistered = await checkUserRegistration(account);
      if (isRegistered) {
        setIsConnected(true);
        localStorage.setItem("currentAccount", account);
        return true;
      } else {
        toast.error("User not registered");
        return false;
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Login failed");
      return false;
    }
  };

  const logout = async () => {
    if (walletProvider) {
      try {
        // Modern, EIP-2255 approach to revoking permissions
        await walletProvider.request({
          method: "wallet_revokePermissions",
          params: [{ eth_accounts: {} }],
        });

        // older wallets
        if (typeof walletProvider.disconnect === "function") {
          await walletProvider.disconnect();
        }
      } catch (error) {
        console.error("Error during wallet disconnection/revocation:", error);
      }
    }

    // Clear all application state
    setWeb3(null);
    setAccount(null);
    setIsConnected(false);
    setContract(null);
    setWalletProvider(null); // Also clear the provider
    localStorage.removeItem("currentAccount");
    localStorage.removeItem("selectedWalletRdns");
  };

  // MLM Functions migrated from connection.js
  const getPersonalDash = async (): Promise<PersonalData | null> => {
    try {
      if (!contract || !account) return null;

      const userData = await contract.methods.users(account).call();

      const timestamp = Number(userData.joined);
      return {
        userId: Number(userData.id),
        refId: Number(userData.referrerID),
        doj: unixToIndianDate(timestamp),
      };
    } catch (error) {
      console.error("Error fetching personal data:", error);
      return null;
    }
  };

  const getTeamDevDash = async (): Promise<TeamData | null> => {
    try {
      if (!contract || !account) return null;

      const tUserData = await contract.methods.tusers(account).call();
      const directReferralCount = Number(tUserData.directReferralCount);
      const indirectReferralCount = Number(tUserData.indirectReferralCount);
      const referralTotal = directReferralCount + indirectReferralCount;

      return {
        dRefCnt: directReferralCount,
        indRefCnt: indirectReferralCount,
        refTotal: referralTotal,
      };
    } catch (error) {
      console.error("Error fetching team data:", error);
      return null;
    }
  };

  const getLevelDash = async (): Promise<{
    lvlData: LevelData[];
    lvlTotal: number;
  } | null> => {
    try {
      if (!contract || !account || !web3) return null;

      const userData = await contract.methods.users(account).call();
      const levelData: LevelData[] = [];
      let levelIncTotal = new BN("0");

      for (let i = 1; i <= 9; i++) {
        let stat = "";
        let calcIncome = 0;

        if (i <= Number(userData.levelEligibility)) {
          stat = "active";
          const levelPrice = await contract.methods.LEVEL_PRICE(i).call();
          const incomeCount = await contract.methods
            .getUserIncomeCount(account, i)
            .call();
          const income = new BN(incomeCount).mul(new BN(levelPrice));
          levelIncTotal = levelIncTotal.add(income);
          calcIncome = Number(web3.utils.fromWei(income.toString(), "ether"));
        } else {
          stat = "inactive";
          calcIncome = 0;
        }

        levelData.push({ level: i, levelStat: stat, levelIncome: calcIncome });
      }

      const totalInWei = Number(
        web3.utils.fromWei(levelIncTotal.toString(), "ether")
      );
      return { lvlData: levelData, lvlTotal: totalInWei };
    } catch (error) {
      console.error("Error fetching level data:", error);
      return null;
    }
  };

  const getTeamBonus = async (): Promise<{ teamBonus: number } | null> => {
    try {
      if (!contract || !account || !web3) return null;

      const tUserData = await contract.methods.tusers(account).call();
      const tmBonus = Number(web3.utils.fromWei(tUserData.earning, "ether"));
      return { teamBonus: tmBonus };
    } catch (error) {
      console.error("Error fetching team bonus:", error);
      return null;
    }
  };

  const getDirectRefIncome = async (): Promise<{
    dirRefCnt: number;
    dirRefCalc: string;
    dirRefIncome: number;
  } | null> => {
    try {
      if (!contract || !account) return null;

      const tUserData = await contract.methods.tusers(account).call();
      let incomeRate = 0;
      const directReferralCount = Number(tUserData.directReferralCount);

      if (directReferralCount >= 1 && directReferralCount <= 3) {
        incomeRate = 0.014;
      } else if (directReferralCount > 3) {
        incomeRate = 0.018;
      } else {
        return { dirRefCnt: 0, dirRefCalc: "0 X 0.014 = 0", dirRefIncome: 0 };
      }

      const rawRefIncome = directReferralCount * incomeRate;
      const directReferralIncome = parseFloat(rawRefIncome.toFixed(5));

      return {
        dirRefCnt: directReferralCount,
        dirRefCalc: `${directReferralCount} X ${incomeRate} = ${directReferralIncome}`,
        dirRefIncome: directReferralIncome,
      };
    } catch (error) {
      console.error("Error fetching direct ref income:", error);
      return null;
    }
  };

  const getIncomeDash = async (): Promise<IncomeData | null> => {
    try {
      const [dirRefIncData, teamBonusData, levelTotalData] = await Promise.all([
        getDirectRefIncome(),
        getTeamBonus(),
        getLevelDash(),
      ]);

      if (!dirRefIncData || !teamBonusData || !levelTotalData) return null;

      const totEarns =
        dirRefIncData.dirRefIncome +
        teamBonusData.teamBonus +
        levelTotalData.lvlTotal;

      return {
        dirRefInc: dirRefIncData.dirRefIncome,
        teamBon: teamBonusData.teamBonus,
        levelTot: levelTotalData.lvlTotal,
        totalInc: totEarns,
      };
    } catch (error) {
      console.error("Error fetching income data:", error);
      return null;
    }
  };

  const getGeneome = async (): Promise<GenealogyNode | null> => {
    try {
      if (!contract || !account) return null;

      const userData = await contract.methods.users(account).call();

      if (!userData.isExist) {
        return { address: account, id: 0, referrals: [] };
      }

      const referralTree: GenealogyNode = {
        address: account,
        id: Number(userData.id),
        referrals: [],
      };

      // Get referrals using getUserReferrals method instead of userData.referral
      let level1Referrals: string[] = [];
      try {
        level1Referrals = await contract.methods
          .getUserReferrals(account)
          .call();
      } catch (err) {
        console.warn("getUserReferrals failed, trying viewUserReferral", err);
        try {
          level1Referrals = await contract.methods
            .viewUserReferral(account)
            .call();
        } catch (err2) {
          console.warn("viewUserReferral also failed", err2);
          level1Referrals = [];
        }
      }

      const level1Promises = level1Referrals.map(async (addr: string) => {
        try {
          const data = await contract.methods.users(addr).call();
          if (!data.isExist) return null;

          // Get level 2 referrals for this user
          let level2Referrals: string[] = [];
          try {
            level2Referrals = await contract.methods
              .getUserReferrals(addr)
              .call();
          } catch (err) {
            try {
              level2Referrals = await contract.methods
                .viewUserReferral(addr)
                .call();
            } catch (err2) {
              level2Referrals = [];
            }
          }

          const level2Promises = level2Referrals.map(
            async (childAddr: string) => {
              try {
                const childData = await contract.methods
                  .users(childAddr)
                  .call();
                if (!childData.isExist) return null;
                return { address: childAddr, id: Number(childData.id) };
              } catch (err) {
                console.warn("Failed to fetch level 2 user:", childAddr, err);
                return null;
              }
            }
          );

          const level2Nodes = (await Promise.all(level2Promises)).filter(
            Boolean
          ) as GenealogyNode[];
          return { address: addr, id: Number(data.id), referrals: level2Nodes };
        } catch (err) {
          console.warn("Failed to fetch level 1 user:", addr, err);
          return null;
        }
      });

      referralTree.referrals = (await Promise.all(level1Promises)).filter(
        Boolean
      ) as GenealogyNode[];
      return referralTree;
    } catch (error) {
      console.error("Error fetching genealogy:", error);
      return { address: account || "", id: 0, referrals: [] };
    }
  };

  const extractReferralId = async (url: string): Promise<string | null> => {
    try {
      if (!contract || !account || !url) return null;

      const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`);

      // Check URL params first
      const refParam = urlObj.searchParams.get("ref");
      if (refParam) {
        const cleanRef = refParam.replace(/[^a-zA-Z0-9_-]/g, "");
        try {
          await contract.methods.userList(cleanRef).call({ from: account });
          return cleanRef;
        } catch (err) {
          console.error("Invalid referral ID:", cleanRef);
          return null;
        }
      }

      // Check path segments
      const pathParts = urlObj.pathname.split("/");
      const refIndex = pathParts.findIndex((part) =>
        ["ref", "referral", "r"].includes(part)
      );
      if (refIndex !== -1 && pathParts[refIndex + 1]) {
        const cleanRef = pathParts[refIndex + 1].replace(/[^a-zA-Z0-9_-]/g, "");
        try {
          await contract.methods.userList(cleanRef).call({ from: account });
          return cleanRef;
        } catch (err) {
          console.error("Invalid referral ID:", cleanRef);
          return null;
        }
      }

      return null;
    } catch (error) {
      console.error("Error extracting referral ID:", error);
      return null;
    }
  };

  const unixToIndianDate = (
    unixTimestamp: number | string | bigint
  ): string => {
    // Handle different types of input (number, string, or bigint)
    const timestamp =
      typeof unixTimestamp === "bigint"
        ? Number(unixTimestamp)
        : typeof unixTimestamp === "string"
        ? parseInt(unixTimestamp, 10)
        : unixTimestamp;

    // Ensure we have a valid number
    if (isNaN(timestamp)) {
      console.error("Invalid timestamp:", unixTimestamp);
      return "Invalid date";
    }

    const date = new Date(timestamp * 1000);

    const options: Intl.DateTimeFormatOptions = {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    };

    return new Intl.DateTimeFormat("en-IN", options).format(date);
  };

  const value: Web3ContextType = {
    web3,
    account,
    isConnected,
    contract,
    OPBNB_MAINNET_CHAIN_ID,
    OPBNB_MAINNET_HEX,
    OPBNB_MAINNET_NAME,
    connectWallet,
    checkUserRegistration,
    registerUser,
    loginUser,
    logout,
    walletProvider,
    setWalletProvider,
    // MLM functions
    getPersonalDash,
    getTeamDevDash,
    getLevelDash,
    getIncomeDash,
    getGeneome,
    getTeamBonus,
    getDirectRefIncome,
    extractReferralId,
    unixToIndianDate,
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
};
