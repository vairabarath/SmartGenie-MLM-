import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWeb3 } from "../../hooks/useWeb3";
import { Loader2 } from "lucide-react";
import {
  extractReferralFromURL,
  storeReferralInfo,
  hasReferralInURL,
} from "../../utils/referral";

interface WalletConnectionCheckerProps {
  children: React.ReactNode;
}

const WalletConnectionChecker: React.FC<WalletConnectionCheckerProps> = ({
  children,
}) => {
  const [isChecking, setIsChecking] = useState(true);
  const { setWalletProvider, connectWallet } = useWeb3();
  const navigate = useNavigate();

  useEffect(() => {
    const checkExistingConnection = async () => {
      try {
        // Check for referral parameters in URL first
        if (hasReferralInURL()) {
          const referralInfo = extractReferralFromURL();
          if (referralInfo) {
            console.log("Referral detected:", referralInfo);
            storeReferralInfo(referralInfo);
          }
        }

        const storedWalletRdns = localStorage.getItem("selectedWalletRdns");
        const currentAccount = localStorage.getItem("currentAccount");

        console.log("Checking stored connection:", {
          storedWalletRdns,
          currentAccount,
        });

        // If we have both wallet selection and account stored, try to reconnect
        if (storedWalletRdns && currentAccount) {
          console.log("Found existing wallet connection:", storedWalletRdns);

          // Wait for providers to be announced
          const provider = await waitForWalletProvider(storedWalletRdns);

          if (provider) {
            console.log("Provider found, setting in context");
            setWalletProvider(provider);

            // Try to get current accounts to verify connection
            try {
              await new Promise((resolve) => setTimeout(resolve, 200)); // Prevent race conditions

              const accounts = await provider.request({
                method: "eth_accounts",
              });
              console.log("Current accounts:", accounts);

              if (
                accounts &&
                accounts.length > 0 &&
                accounts[0].toLowerCase() === currentAccount.toLowerCase()
              ) {
                console.log(
                  "Wallet still connected, attempting full connection..."
                );

                // Add another delay before connection attempt
                await new Promise((resolve) => setTimeout(resolve, 300));

                // Try to establish full connection
                const connected = await connectWallet();
                if (connected) {
                  console.log(
                    "Full connection established, redirecting to session"
                  );
                  // Add delay before navigation
                  await new Promise((resolve) => setTimeout(resolve, 1000));
                  navigate("/session");
                  return;
                } else {
                  console.log("Failed to establish full connection");
                }
              } else {
                console.log(
                  "Wallet accounts changed or empty, clearing stored data"
                );
                localStorage.removeItem("currentAccount");
                localStorage.removeItem("selectedWalletRdns");
              }
            } catch (error) {
              console.log(
                "Failed to get accounts, wallet may be disconnected:",
                error
              );
              localStorage.removeItem("currentAccount");
              localStorage.removeItem("selectedWalletRdns");
            }
          } else {
            console.log("Wallet provider not found, clearing stored data");
            localStorage.removeItem("currentAccount");
            localStorage.removeItem("selectedWalletRdns");
          }
        } else {
          console.log("No stored wallet connection found");
        }
      } catch (error) {
        console.error("Error checking existing connection:", error);
      }

      setIsChecking(false);
    };

    // Add a small delay to ensure providers are ready
    const timer = setTimeout(() => {
      checkExistingConnection();
    }, 100);

    return () => clearTimeout(timer);
  }, [navigate, setWalletProvider, connectWallet]);

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

      // Timeout after 3 seconds if provider not found (increased from 2s)
      timeoutId = setTimeout(() => {
        window.removeEventListener("eip6963:announceProvider", handleProvider);
        console.log("Timeout waiting for wallet provider:", rdns);
        resolve(null);
      }, 3000);
    });
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 p-8 w-full max-w-md">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-blue-500/10 p-4 rounded-full">
                <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Checking Connection
            </h1>
            <p className="text-gray-400">
              Verifying existing wallet connection...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default WalletConnectionChecker;
