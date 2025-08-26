import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWeb3 } from "../../hooks/useWeb3";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import {
  UserPlus,
  ExternalLink,
  Wallet,
  Check,
  X,
  Loader2,
} from "lucide-react";
import {
  getStoredReferralInfo,
  clearStoredReferralInfo,
} from "../../utils/referral";

const Register: React.FC = () => {
  const [referralUrl, setReferralUrl] = useState("");
  const [referralId, setReferralId] = useState("Not specified");
  const [referrerWallet, setReferrerWallet] = useState("Not specified");
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const { account, contract, registerUser } = useWeb3();
  const navigate = useNavigate();

  useEffect(() => {
    if (!account) {
      toast.error("Wallet not connected");
      navigate("/");
      return;
    }

    // Check for stored referral information
    const storedReferral = getStoredReferralInfo();
    if (storedReferral) {
      console.log("Found stored referral:", storedReferral);

      // Auto-fill the referral URL field
      const baseURL = window.location.origin;
      let autoFilledURL = `${baseURL}/?ref=${storedReferral.referrerId}`;
      if (storedReferral.referrerCode) {
        autoFilledURL += `&code=${storedReferral.referrerCode}`;
      }
      setReferralUrl(autoFilledURL);

      // Process the referral information
      handleStoredReferralInfo(storedReferral);
    }
  }, [account, navigate]);

  const formatAddress = (address: string) => {
    if (!address || address === "Not specified") return address;
    return `${address.substring(0, 6)}...${address.substring(
      address.length - 4
    )}`;
  };

  const handleStoredReferralInfo = async (referralInfo: any) => {
    if (!contract || !account) {
      console.warn("Contract or account not available for referral processing");
      return;
    }

    try {
      // Check if we have a User ID (preferred) or address (fallback)
      if (
        typeof referralInfo.referrerId === "number" ||
        /^\d+$/.test(referralInfo.referrerId)
      ) {
        // User ID for the contract
        const userId = referralInfo.referrerId.toString();

        // Validate User ID exists by getting the address
        const referrerAddress = await contract.methods
          .userList(userId)
          .call({ from: account });

        if (
          referrerAddress &&
          referrerAddress !== "0x0000000000000000000000000000000000000000"
        ) {
          setReferralId(userId);
          setReferrerWallet(referrerAddress);

          toast.success("Referral information detected and verified!", {
            autoClose: 3000,
          });
        } else {
          toast.warning("Invalid referral User ID detected");
        }
      } else if (referralInfo.referrerAddress) {
        // Legacy: It's a wallet address - we need to find the User ID
        // This is more complex and less reliable
        toast.warning(
          "Referral link uses old format. Please ask your referrer for a new link."
        );

        // For now, store the address but warn user
        setReferrerWallet(referralInfo.referrerAddress);
        setReferralId("Legacy Address Format");
      } else {
        toast.error("Invalid referral information format");
      }
    } catch (error) {
      console.error("Error processing referral info:", error);
      toast.error("Could not verify referral information");
    }
  };

  const handleReferralCheck = async () => {
    if (!referralUrl.trim()) {
      toast.error("Please enter a referral URL");
      return;
    }

    if (!contract || !account) {
      toast.error("Contract or account not initialized");
      return;
    }

    setIsLoading(true);

    try {
      let extractedId = null;

      // Try to parse the URL
      const url = referralUrl.trim();
      const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`);

      // Check for 'ref' parameter in query string
      const refParam = urlObj.searchParams.get("ref");
      if (refParam) {
        extractedId = refParam.replace(/[^a-zA-Z0-9_-]/g, "");
      } else {
        // Check path for referral ID
        const pathParts = urlObj.pathname.split("/");
        const refIndex = pathParts.findIndex((part) =>
          ["ref", "referral", "r"].includes(part)
        );
        if (refIndex !== -1 && pathParts[refIndex + 1]) {
          extractedId = pathParts[refIndex + 1].replace(/[^a-zA-Z0-9_-]/g, "");
        }
      }

      if (extractedId && extractedId !== "0") {
        setReferralId(extractedId);

        // Get referrer wallet address from contract
        try {
          const referrerAddress = await contract.methods
            .userList(extractedId)
            .call({ from: account });
          setReferrerWallet(referrerAddress);
          toast.success("Valid referral found!");
        } catch (error) {
          console.error("Error fetching referrer:", error);
          toast.error("Invalid referral ID or referrer not found");
          setReferralId("Not specified");
          setReferrerWallet("Not specified");
        }
      } else {
        toast.error("No valid referral ID found in URL");
        setReferralId("Not specified");
        setReferrerWallet("Not specified");
      }
    } catch (error: any) {
      console.error("Error parsing referral URL:", error);
      toast.error("Invalid URL format");
      setReferralId("Not specified");
      setReferrerWallet("Not specified");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (referralId === "Not specified" || referralId === "0") {
      toast.error("Please provide a valid referral ID");
      return;
    }

    if (!account) {
      toast.error("Wallet not connected");
      return;
    }

    const result = await Swal.fire({
      title: "Confirm Registration",
      html: `
        <div class="text-left">
          <p><strong>Wallet:</strong> ${formatAddress(account)}</p>
          <p><strong>Referrer ID:</strong> ${referralId}</p>
          <p><strong>Registration Fee:</strong> 0.1 BNB</p>
        </div>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Register",
      cancelButtonText: "Cancel",
      reverseButtons: true,
      background: "#1f2937",
      color: "#ffffff",
      confirmButtonColor: "#3b82f6",
      cancelButtonColor: "#6b7280",
    });

    if (!result.isConfirmed) {
      return;
    }

    setIsRegistering(true);

    try {
      const success = await registerUser(referralId);

      if (success) {
        // Clear stored referral info after successful registration
        clearStoredReferralInfo();

        await Swal.fire({
          title: "Registration Successful!",
          text: "You have been successfully registered. Redirecting to dashboard...",
          icon: "success",
          timer: 3000,
          timerProgressBar: true,
          background: "#1f2937",
          color: "#ffffff",
          confirmButtonColor: "#10b981",
        });

        navigate("/dashboard");
      } else {
        toast.error("Registration failed");
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      toast.error(`Registration failed: ${error.message || "Unknown error"}`);
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-gray-800 rounded-xl shadow-2xl border mt-8 sm:mt-16 lg:mt-28 border-gray-700 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 sm:p-6 text-center">
            <div className="flex justify-center mb-4">
              <UserPlus className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
              User Registration
            </h2>
            <div className="bg-white/10 rounded-lg p-3">
              <p className="text-xs sm:text-sm text-white/80 mb-1">
                Your Wallet Address:
              </p>
              <p className="text-white font-mono text-xs sm:text-sm break-all">
                {account || "Not connected"}
              </p>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {/* Referral URL Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Referral URL
                {referralUrl && getStoredReferralInfo() && (
                  <span className="ml-2 text-xs text-green-400">
                    (Auto-filled)
                  </span>
                )}
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={referralUrl}
                  onChange={(e) => setReferralUrl(e.target.value)}
                  placeholder="Enter referral URL or it will be auto-filled if detected"
                  className={`flex-1 px-4 py-3 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
                    referralUrl && getStoredReferralInfo()
                      ? "bg-green-900/20 border-green-500/50"
                      : "bg-gray-700 border-gray-600"
                  }`}
                />
                <button
                  onClick={handleReferralCheck}
                  disabled={isLoading}
                  className="px-4 sm:px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px]"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4 sm:mr-2" />
                      <span className="hidden sm:inline">
                        {referralUrl && getStoredReferralInfo()
                          ? "Recheck"
                          : "Check"}
                      </span>
                      <span className="sm:hidden">
                        {referralUrl && getStoredReferralInfo()
                          ? "Re"
                          : "Check"}
                      </span>
                    </>
                  )}
                </button>
              </div>
              {referralUrl && getStoredReferralInfo() && (
                <p className="text-xs text-green-400 mt-2">
                  ✓ This URL was automatically filled from your referral link
                </p>
              )}
            </div>

            {/* Referral Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-700/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-300">Referrer ID:</span>
                  {referralId !== "Not specified" ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : (
                    <X className="w-5 h-5 text-red-500" />
                  )}
                </div>
                <p className="text-white font-medium">{referralId}</p>
              </div>

              <div className="bg-gray-700/50 rounded-lg p-4">
                <p className="text-gray-300 mb-2">Referrer Wallet:</p>
                <p className="text-white font-mono text-sm">
                  {formatAddress(referrerWallet)}
                </p>
              </div>
            </div>

            {/* Registration Fee */}
            <div className="bg-gray-700/30 rounded-lg p-4 mb-6">
              <div className="flex items-center mb-3">
                <Wallet className="w-5 h-5 text-blue-500 mr-2" />
                <span className="text-gray-300">Registration Fee:</span>
                <span className="text-white font-bold ml-2">0.1 BNB</span>
              </div>
            </div>

            {/* Register Button */}
            <button
              onClick={handleRegister}
              disabled={isRegistering || referralId === "Not specified"}
              className={`w-full py-4 px-6 rounded-lg font-medium transition-all duration-200 flex items-center justify-center ${
                referralId !== "Not specified" && !isRegistering
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl"
                  : "bg-gray-600 text-gray-400 cursor-not-allowed"
              }`}
            >
              {isRegistering ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Registering...
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5 mr-2" />
                  Register OnChain
                </>
              )}
            </button>

            {referralId === "Not specified" && (
              <p className="text-center text-red-400 text-sm mt-2">
                Please provide a valid referral URL to continue
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
