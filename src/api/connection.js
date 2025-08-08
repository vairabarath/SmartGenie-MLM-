import { npByInfura, mlmCrtAddress } from "./config.js";

let browserWallet;
let npByWallet;
let currentAccount = 0;

async function getABI() {
  let response;
  response = await fetch("/src/api/newmlm.json");
  const _abiCode = await response.json();
  return _abiCode;
}

async function initContractInstance(provider) {
  try {
    const abiCode = await getABI();
    let crtInstance;

    if (provider === "infura") {
      crtInstance = new npByInfura.eth.Contract(abiCode, mlmCrtAddress);
    } else if (provider === "wallet") {
      if (!browserWallet) {
        throw new Error("Wallet provider not available");
      }

      if (!npByWallet) {
        npByWallet = new Web3(browserWallet);
      }

      const chainIDStatus = await checkChainId(npByWallet);
      console.log("Chain ID Status:", chainIDStatus);

      if (!chainIDStatus) {
        toastr.error("Inappropriate network! Please switch to OPBNB network!");
        return null;
      }

      crtInstance = new npByWallet.eth.Contract(abiCode, mlmCrtAddress);
    } else {
      throw new Error("Incorrect Provider requested");
    }

    return crtInstance;
  } catch (error) {
    console.error("Error initializing contract:", error);
    toastr.error("Failed to initialize contract");
    return null;
  }
}

async function checkUserInSmartContract(walletAddress) {
  try {
    const mlmWalletInst = await initContractInstance("wallet");
    const userData = await mlmWalletInst.methods
      .users(walletAddress)
      .call({ from: walletAddress });
    const isActive = userData.isExist;
    console.log("User exists:", isActive);

    if (isActive) {
      console.log("User exists in the contract.");
      return true;
    } else {
      console.log("User does not exist.");
      return false;
    }
  } catch (error) {
    toastr.error("Error checking user status");
  }
}

async function checkChainId(web3Instance) {
  try {
    if (!web3Instance) {
      console.error("Web3 instance not provided");
      return false;
    }

    const currentNetwork = Number(await web3Instance.eth.getChainId());
    console.log("Current Network ID:", currentNetwork);

    // Check for both testnet (5611) and mainnet (204)
    return currentNetwork === 204 || currentNetwork === 5611; // To remove the opBNB testnet chain id in production
  } catch (error) {
    console.error("Error checking chain ID:", error);
    toastr.error("Error in accessing chain id information");
    return false;
  }
}

async function walletNetworkConfig() {
  try {
    if (browserWallet == null) {
      toastr.error("No wallet detected!");
      return [false, "No wallet detected!"];
    }
    npByWallet = new Web3(browserWallet);
    const isProperNetwork = await checkChainId(npByWallet);
    if (!isProperNetwork) {
      toastr.error("Inappropriate network! Please switch to OPBNB network.");
      return [false, "Inappropriate network! Please switch to OPBNB network."];
    }
    return [true, "success"];
  } catch (error) {
    toastr.error(`${error.message}`);
    return [false, error.message];
  }
}

const checkBrowserWallet = async () => {
  try {
    if (!browserWallet) {
      toastr.error("No wallet detected!");
      return [false, "No wallet detected!"];
    }
    return [true, null];
  } catch (error) {
    return [false, error.message];
  }
};

async function handleNetworkChange() {
  try {
    await browserWallet.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "5611" }], // 0x204 for opBNB Mainnet // 0x5611 for opBNB Testnet
    });
    return [true, "Switched to the expected network successfully"];
  } catch (error) {
    if (error.code === 4902) {
      toastr.error("Expected Network not found in the wallet");
      return [false, "Expected Network not found in the wallet"];
    } else if (error.code === 4001) {
      toastr.error("Network switch request was rejected");
      return [false, "Network switch request was rejected"];
    } else {
      toastr.error(`Network switch error: ${error.message}`);
      return [false, error.message];
    }
  }
}

const handleAccountsChanged = (accounts) => {
  if (currentAccount !== accounts[0]) {
    alert("Logged in account has been changed !!");
    userLogOut();
  }
  if (accounts.length === 0) {
    alert("No accounts detected!!");
    userLogOut();
  }
  if (currentAccount === 0) {
    console.log("No Registered Accounts !!");
    return;
  }
};

const handleChainChanged = async (chainId) => {
  const currentChainId = parseInt(chainId, 16);
  if (currentChainId !== 204 && currentChainId !== 5611) {
    // Remove opBNB Testnet id in production
    const networkMessage =
      "Inappropriate Network \n \n \n Switch back to opBNB to stay Logged in ?";
    const networkChangeRequest = confirm(networkMessage);
    if (!networkChangeRequest) {
      userLogOut();
      return;
    } else {
      const [networkStatus, netMsg] = await handleNetworkChange();
      if (networkStatus) {
        alert("Switched to opBNB successfully!");
      } else {
        console.log("Unable to switch", netMsg);
        userLogOut();
        return;
      }
    }
  }
};

const initiateWalletEvents = async () => {
  const [walletAvailable, errorMessage] = await checkBrowserWallet();
  if (!walletAvailable) {
    console.log("Error Occured: ", errorMessage);
    return;
  }

  browserWallet.on("accountsChanged", handleAccountsChanged);
  browserWallet.on("chainChanged", handleChainChanged);
};

async function extractReferralId() {
  try {
    const [netStatus, statusMsg] = await walletNetworkConfig();
    console.log("Reason", statusMsg);
    if (!netStatus) {
      return false;
    }
    const accounts = await browserWallet.request({
      method: "eth_requestAccounts",
    });
    document.getElementById("walletAddress").textContent = accounts[0];
    const mlmWalletInst = await initContractInstance("wallet");

    const urlInput = document.getElementById("referralUrl");
    if (!urlInput || !urlInput.value) return null;

    const url = urlInput.value.trim();
    const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`);

    const refParam = urlObj.searchParams.get("ref");
    if (refParam) {
      const cleanRef = refParam.replace(/[^a-zA-Z0-9_-]/g, "");
      document.getElementById("referrerId").textContent = cleanRef;
      const refrAddress = await mlmWalletInst.methods
        .userList(cleanRef)
        .call({ from: accounts[0] });
      document.getElementById("referrerWallet").textContent = refrAddress;
      return cleanRef || null;
    }

    const pathParts = urlObj.pathname.split("/");
    const refIndex = pathParts.findIndex((part) =>
      ["ref", "referral", "r"].includes(part)
    );
    if (refIndex !== -1 && pathParts[refIndex + 1]) {
      const cleanRef = pathParts[refIndex + 1].replace(/[^a-zA-Z0-9_-]/g, "");
      document.getElementById("referrerId").textContent = cleanRef;
      const refrAddress = await mlmWalletInst.methods
        .userList(cleanRef)
        .call({ from: accounts[0] });
      document.getElementById("referrerWallet").textContent = refrAddress;
      return cleanRef || null;
    }

    return null;
  } catch (error) {
    console.error("Error extracting referral ID:", error);
    return null;
  }
}

async function logIN() {
  const walletDetails = document.getElementById("walletDetails");
  const loginButton = document.getElementById("userloginbtn");
  const registerBtn = document.getElementById("userregisterbtn");
  const ProgressBar = document.getElementById("bar-progress");
  try {
    const [netStatus, statusMsg] = await walletNetworkConfig();
    console.log("Reason", statusMsg);
    if (!netStatus) {
      return false;
    }
    walletDetails.innerHTML = "Trying to Connect";
    loginButton.classList.add("d-none");
    registerBtn.classList.add("d-none");
    ProgressBar.classList.remove("d-none");
    const accounts = await browserWallet.request({
      method: "eth_requestAccounts",
    });
    const loginMessage = "Do you want to login to DeGuess with " + accounts[0];
    const loginRequest = await Swal.fire({
      title: "Confirmation",
      text: loginMessage,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Okay",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    }).then((result) => result.isConfirmed);
    let userRegistrationStatus;
    if (accounts.length >= 1 && loginRequest) {
      userRegistrationStatus = await checkUserInSmartContract(accounts[0]);
    } else {
      toastr.error("Login Failed");
      walletDetails.innerHTML = "No Wallet Detected !";
      loginButton.classList.remove("d-none");
      registerBtn.classList.remove("d-none");
      ProgressBar.classList.add("d-none");
      return false;
    }

    if (userRegistrationStatus) {
      currentAccount = accounts[0];
      // console.log(typeof(currentAccount));
      // showSuccess(`Logged in using address: ${currentAccount}`);
      localStorage.setItem("currentAccount", currentAccount);
      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 500);
      return true;
    } else {
      toastr.error("Not a Registered User");
      walletDetails.innerHTML = "No Wallet Detected !";
      loginButton.classList.remove("d-none");
      registerBtn.classList.remove("d-none");
      ProgressBar.classList.add("d-none");
      return false;
    }
  } catch (error) {
    walletDetails.innerHTML = "No Wallet Detected !";
    loginButton.classList.remove("d-none");
    registerBtn.classList.remove("d-none");
    ProgressBar.classList.add("d-none");
    if (
      error.message.includes("User denied transaction signature") ||
      error.code == 4001
    ) {
      toastr.error("User denied transaction signature.");
    } else if (
      error.message.includes("Internal JSON-RPC error") ||
      error.code == -32603
    ) {
      toastr.error(
        "Please Increase Gas fee! Also Check gas, network settings!"
      );
    } else if (error.message.includes("revert")) {
      toastr.error("Transaction reverted. Contract conditions failed.");
    } else {
      toastr.error("Error occured while login");
    }
  }
}

async function toRegisterPage() {
  const accounts = await browserWallet.request({
    method: "eth_requestAccounts",
  });
  let userRegistrationStatus;
  if (accounts.length >= 1) {
    userRegistrationStatus = await checkUserInSmartContract(accounts[0]);
  }
  if (userRegistrationStatus) {
    toastr.info("Already a registered user");
    return null;
  }

  setTimeout(() => {
    window.location.href = "register.html";
  }, 500);
}

async function registerOnchain() {
  try {
    // Check network connection
    const [netStatus, statusMsg] = await walletNetworkConfig();
    if (!netStatus) {
      toastr.error(`Network error: ${statusMsg}`);
      return false;
    }

    // Request accounts
    const accounts = await browserWallet.request({
      method: "eth_requestAccounts",
    });
    if (!accounts.length) {
      toastr.error("No accounts available");
      return false;
    }

    // Confirm registration
    const isConfirmed = await Swal.fire({
      title: "Confirm Registration",
      html: `Register with address:<br><strong>${accounts[0]}</strong>`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Register",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });

    if (!isConfirmed.isConfirmed) {
      toastr.info("Registration cancelled");
      return false;
    }

    // Execute registration
    const [success, message] = await createUser(accounts[0]);

    if (success) {
      toastr.success("Registration successful!");
      currentAccount = accounts[0];
      localStorage.setItem("currentAccount", currentAccount);
      setTimeout(() => {
        window.location.href = "/dashboard.html";
      }, 500);

      // return true;
    } else {
      toastr.error(`Registration failed: ${message}`);
      // return false;
    }
  } catch (error) {
    console.error("Registration error:", error);
    toastr.error(`Error: ${error.message || "Unknown error occurred"}`);
    return false;
  }
}

async function createUser(walletAddress) {
  try {
    const mlmWalletInst = await initContractInstance("wallet");
    const refr_id = document.getElementById("referrerId").textContent;

    if (refr_id <= 0 || refr_id === "Not specified" || refr_id === "-") {
      toastr.error("Invalid Referrer ID");
      return [false, "Invalid Referrer ID"];
    }

    // const registrationFeeWei = npByWallet.utils.toWei('50', 'ether'); // To be included in production
    const registrationFeeWei = "5000000000000"; // To remove in production

    // Get current gas price and add buffer
    const gasPrice = await npByWallet.eth.getGasPrice();
    const bufferedGasPrice = Math.floor(Number(gasPrice) * 1.2); // 20% buffer

    // Estimate gas with correct value
    const estimatedGas = await mlmWalletInst.methods
      .regUser(refr_id)
      .estimateGas({
        from: walletAddress,
        value: registrationFeeWei,
      });

    // Send transaction with proper value and gas settings
    const status = await mlmWalletInst.methods
      .regUser(refr_id)
      .send({
        from: walletAddress,
        value: registrationFeeWei,
        gas: estimatedGas,
        gasPrice: bufferedGasPrice,
      })
      .on("transactionHash", function (hash) {
        // showAlert("Transaction yet to be confirmed. Don't refresh the page.", "info")
      })
      // .on('confirmation', function (confirmationNumber, receipt) {  })
      .on("receipt", function (receipt) {
        if (receipt.status) {
          const events = receipt.events;
          if (events && events.regLevelEvent) {
            const { _user, _referrer, _time } =
              events.regLevelEvent.returnValues;
            return [true, "Registration successful"];
          } else {
            return [false, "No Registration Event Emitted"];
          }
        }
      })
      .on("error", function (error) {
        if (error.code === 4001) {
          toastr.error("User rejected the transaction");
        } else {
          toastr.error(error.message);
        }
        return [false, error.message];
      });
  } catch (error) {
    console.error("Registration error:", error);

    if (error.code === 4001) {
      return [false, "User denied transaction signature"];
    }
    if (error.message?.includes("revert")) {
      // Parse revert reason if available
      const revertReason =
        error.message.match(/reason string: '(.+?)'/)?.[1] ||
        error.data?.message?.match(/reverted: (.+)/)?.[1] ||
        "Contract reverted transaction";
      return [false, revertReason];
    }
    if (error.code === -32603) {
      return [false, "Internal RPC error - check gas settings"];
    }
    return [false, error.message || "Unknown error occurred"];
  }
}

function userLogOut() {
  // Clear session and local storage
  localStorage.clear();
  // Reset account and address variables
  currentAccount = 0;
  // Redirect to session page
  toastr.error("Logged Out. Redirecting to Log in Page...");
  window.location.href = "/multi_wallet.html";
}

function IsLoggedIn() {
  const getCurrentAccount = localStorage.getItem("currentAccount");
  if (currentAccount !== "") {
    currentAccount = getCurrentAccount;
    return true;
  }
  toastr.error("Cannot store account");
  return false;
}

toastr.options = {
  closeButton: true,
  progressBar: true,
  positionClass: "toast-top-right",
  showDuration: "300",
  hideDuration: "5000",
  timeOut: "5000",
  extendedTimeOut: "5000",
};

//toastr.success(data); toastr.error(data);

function waitForWallet(timeout = 3000) {
  return new Promise((resolve, reject) => {
    let elapsedTime = 0;
    const checkInterval = 100;

    const interval = setInterval(() => {
      if (window.selectedWallet) {
        clearInterval(interval);
        resolve(window.selectedWallet);
      }
      elapsedTime += checkInterval;
      if (elapsedTime >= timeout) {
        clearInterval(interval);
        reject(new Error("Timeout waiting for wallet provider"));
      }
    }, checkInterval);
  });
}

async function getGeneome() {
  try {
    const contract = await initContractInstance("wallet");
    if (!contract) throw new Error("Contract initialization failed");

    const userData = await contract.methods.users(currentAccount).call();

    if (!userData.isExist) {
      return { address: currentAccount, id: 0, referrals: [] };
    }
    const referralTree = {
      address: currentAccount,
      id: Number(userData.id),
      referrals: [],
    };
    const level1Referrals = userData.referral || [];
    const level1Promises = level1Referrals.map(async (addr) => {
      try {
        const data = await contract.methods.users(addr).call();
        if (!data.isExist) return null;

        const level2Promises = data.referral.map(async (childAddr) => {
          try {
            const childData = await contract.methods.users(childAddr).call();
            if (!childData.isExist) return null;
            return { address: childAddr, id: Number(childData.id) };
          } catch (err) {
            console.warn(
              "Failed to fetch level 2 user:",
              childAddr,
              err.message
            );
            return null;
          }
        });

        const level2Nodes = (await Promise.all(level2Promises)).filter(Boolean);

        return { address: addr, id: Number(data.id), referrals: level2Nodes };
      } catch (err) {
        console.warn("Failed to fetch level 1 user:", addr, err.message);
        return null;
      }
    });

    referralTree.referrals = (await Promise.all(level1Promises)).filter(
      Boolean
    );

    return referralTree;
  } catch (error) {
    console.error("Error fetching referral tree:", error);
    return { address: currentAccount, id: 0, referrals: [] };
  }
}

async function getLevelIncomeTotal() {
  const [dirRefIncData, teamBonusData, levelTotalData] = await Promise.all([
    getDirectRefIncome(),
    getTeamBonus(),
    getLevelDash(),
  ]);
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
}

async function getTeamBonus() {
  try {
    const contract = await initContractInstance("wallet");
    if (!contract) {
      throw new Error("Contract initialization failed");
    }
    const tUserData = await contract.methods.tusers(currentAccount).call();
    const tmBonus = web3.utils.fromWei(tUserData.earning, "ether");
    return { teamBonus: tmBonus };
  } catch (error) {
    console.error("Error fetching user data:", error);
  }
}

async function getDirectRefIncome() {
  try {
    const contract = await initContractInstance("wallet");
    if (!contract) {
      throw new Error("Contract initialization failed");
    }
    const tUserData = await contract.methods.tusers(currentAccount).call();
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
    console.error("Error fetching user data:", error);
  }
}

async function getLevelDash() {
  try {
    const contract = await initContractInstance("wallet");
    if (!contract) {
      throw new Error("Contract initialization failed");
    }
    const userData = await contract.methods.users(currentAccount).call();

    if (Number(userData.levelEligibility) > 1) {
    }
    const levelData = [];
    let stat = "";
    let calcIncome = 0;
    let levelIncTotal = 0;

    for (i = 1; i <= 9; i++) {
      if (i <= Number(userData.levelEligibility)) {
        stat = "active";
        const levelPrice = await contract.methods.LEVEL_PRICE(i).call();
        calcIncome = web3.utils
          .toBN(userData.incomeCount[i])
          .mul(web3.utils.toBN(levelPrice));
        levelIncTotal = levelIncTotal.add(calcIncome);
        calcIncome = web3.utils.fromWei(calcIncome, "ether");
      } else {
        stat = "inactive";
        calcIncome = 0;
      }
      levelData.push({ level: i, levelStat: stat, levelIncome: calcIncome });
    }
    const totalInWei = web3.utils.fromWei(levelIncTotal, "ether");

    return { lvlData: levelData, lvlTotal: totalInWei };
  } catch (error) {
    console.error("Error fetching user data:", error);
  }
}

async function getTeamDevDash() {
  try {
    const contract = await initContractInstance("wallet");
    if (!contract) {
      throw new Error("Contract initialization failed");
    }
    const tUserData = await contract.methods.tusers(currentAccount).call();

    const directReferralCount = Number(tUserData.directReferralCount);
    const indirectReferralCount = Number(tUserData.indirectReferralCount);
    const referralTotal = directReferralCount + indirectReferralCount;
    return {
      dRefCnt: directReferralCount,
      indRefCnt: indirectReferralCount,
      refTotal: referralTotal,
    };
  } catch (error) {
    console.error("Error fetching user data:", error);
  }
}

async function getPersonalDash() {
  try {
    const contract = await initContractInstance("wallet");
    if (!contract) {
      throw new Error("Contract initialization failed");
    }

    const userData = await contract.methods.users(currentAccount).call();
    return {
      userId: Number(userData.id),
      refId: Number(userData.referrerID),
      doj: unixToIndianDate(userData.joined),
    };
  } catch (error) {
    console.error("Error fetching user data:", error);
  }
}

async function getLevelStatus(contract, userAddress) {
  try {
    const eligibility = await contract.methods
      .getUserLevelEligibility(userAddress)
      .call();
    return eligibility.map((level) => Number(level));
  } catch (error) {
    console.error("Error fetching level eligibility:", error);
    return [];
  }
}

async function unixToIndianDate(unixTimestamp) {
  const date = new Date(unixTimestamp * 1000);

  const options = {
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
}

document.addEventListener("DOMContentLoaded", async () => {
  // console.log("Ensuring wallet connection...");
  // window.dispatchEvent(new Event('eip6963:requestProvider'));

  try {
    browserWallet = await waitForWallet();
    console.log("Restored browserWallet:", browserWallet);
    await initiateWalletEvents();
  } catch (error) {
    console.error(error.message);
  }

  if (localStorage.getItem("walletReconnected") === "true") {
    console.log("Wallet reconnected successfully.");
    localStorage.removeItem("walletReconnected");
  }

  if (!IsLoggedIn()) {
    toastr.error("User is not logged in.");
    return;
  }

  const pageHandlers = {
    Session: async () => {
      document.getElementById("userloginbtn").addEventListener("click", logIN);
      document
        .getElementById("userregisterbtn")
        .addEventListener("click", toRegisterPage);
    },

    Dashboard: async () => {
      await displayDashboard();
      document
        .getElementById("logoutBtn")
        .addEventListener("click", userLogOut);
    },

    Register: async () => {
      document.getElementById("walletAddress").textContent =
        "0X00000000000000000000000000000";
      document
        .getElementById("checkReferralBtn")
        .addEventListener("click", extractReferralId);
      document
        .getElementById("registerOnChainBtn")
        .addEventListener("click", registerOnchain);
    },
  };

  const currentTitle = document.title;
  if (pageHandlers[currentTitle]) {
    await pageHandlers[currentTitle]();
  }
});
