//SPDX-License-Identifier: MIT
pragma solidity  ^0.8.0;

contract SmartGenie {
    
    address public adminWallet;
    address public ursWallet;
    address public splPromoWallet;
 
    struct UserStruct {
        bool isExist;
        uint id;
        uint referrerID;
        address[] referral;
        uint joined;
        mapping(uint => uint) incomeCount;
        uint[] levelEligibility;
    }
    address[2] public promotionWallets;
    uint8[2] public promotionPercantage = [60,40];
    uint256[2]  promotionWalletsAmount;
    
    mapping(uint => uint) public LEVEL_PRICE;
    mapping(address => UserStruct) public users;
    mapping(uint => address) public userList;
    mapping(address => uint256) public totalEarnings;
    mapping(uint256 => mapping(address => uint256)) public levelCounter;
    mapping(uint256 => mapping(address => address)) public levelUpgradePayments;
    mapping(uint256 => mapping(address => bool)) public isLevelUpgradedForAddress;
    mapping(address => mapping(uint => uint256)) public heldPayments;
    
    uint public currUserID = 0;
    uint256 splPromAmt = 0;
    uint256 promAmt = 0;
    uint256 ursAmt = 0;
    // uint256 regFee = 50 ether;
    uint256 regFee = 5 * 10**12;
    uint256 regShare = (regFee*10)/100; // 10% of reg fee
    uint256 promotionShare = (regFee*9)/100; // 9% 0f reg fee
    uint256 splPromoShare = (regFee*1)/100; // 1% 0f reg fee
    
    event regLevelEvent(address indexed _user, address indexed _referrer, uint _time);
    event PaymentHeld(address indexed user, uint level, uint amount);
    event LevelUpgraded(address indexed user, uint newLevel);
    event getMoneyForLevelEvent(address indexed _user, address indexed _referral, uint _level, uint _time);
    event lostMoneyForLevelEvent(address indexed _user, address indexed _referral, uint _level, uint _time);
    
    modifier onlyAdmin {
        require(msg.sender == adminWallet, "Caller is not Admin.");
        _;
    }
    
    constructor(address _prWallet1, address _prWallet2, 
                address _sprWallet, address _ursWallet) {
        // Contract deployer will be the owner wallet 
        adminWallet = msg.sender;
        ursWallet = _ursWallet;
        splPromoWallet = _sprWallet;
        promotionWallets = [_prWallet1, _prWallet2];
        
        // Setting the price for buying each level
        LEVEL_PRICE[1] = (regFee*80)/100;      //40
        LEVEL_PRICE[2] = LEVEL_PRICE[1]*2;     //80
        LEVEL_PRICE[3] = LEVEL_PRICE[2]*2;     //160
        LEVEL_PRICE[4] = LEVEL_PRICE[3]*2;     //320
        LEVEL_PRICE[5] = LEVEL_PRICE[4]*2;     //640
        LEVEL_PRICE[6] = LEVEL_PRICE[5]*2;     //1280
        LEVEL_PRICE[7] = LEVEL_PRICE[6]*2;     //2560
        LEVEL_PRICE[8] = LEVEL_PRICE[7]*2;     //5120
        LEVEL_PRICE[9] = LEVEL_PRICE[8]*2;     //10240
        LEVEL_PRICE[10] = LEVEL_PRICE[9]*2;    //20480
        LEVEL_PRICE[11] = LEVEL_PRICE[10]*2;   //40960
        LEVEL_PRICE[12] = LEVEL_PRICE[11]*2;   //81920


        // Create contract deployer as first user
        currUserID++;
        UserStruct storage userStruct = users[adminWallet];
        userStruct.isExist = true;
        userStruct.id = currUserID;
        userStruct.referrerID = 0;
        userStruct.referral = new address[](0);
        userStruct.joined = block.timestamp;
        userStruct.levelEligibility = new uint[](0);
        
        userList[currUserID] = adminWallet;
    }
    

    function regUser(uint _referrerID) public payable {
        // Caller should not registered already, so his existence in 'users'
        require(!users[msg.sender].isExist, "User exist");
        // Referrer is should not be empty or caller's own id
        require(_referrerID > 0 && _referrerID <= currUserID, "Incorrect referrer Id");
        // Caller must provide first level 'LEVEL_PRICE' for registration
        require(msg.value == regFee, "Incorrect Value");

        currUserID++;
        UserStruct storage userStruct = users[msg.sender];
        userStruct.isExist = true;
        userStruct.id = currUserID;
        userStruct.referrerID = _referrerID;
        userStruct.referral = new address[] (0);
        userStruct.joined = block.timestamp;
        userStruct.levelEligibility = new uint[] (0);
        
        // Add new user to existing userlist
        userList[currUserID] = msg.sender;
        
        // push the caller to referral under referrerid
        users[userList[_referrerID]].referral.push(msg.sender);
        
        // update split wallet balances
        ursAmt += LEVEL_PRICE[1];
        promAmt += promotionShare;
        splPromAmt += splPromoShare;
        
        // update promotion wallet amount of individuals
        promotionWalletsAmount[0] = (promAmt * promotionPercantage[0])/100;
        promotionWalletsAmount[1] = (promAmt * promotionPercantage[1])/100;
        
        uint referrerReferralLength = users[userList[_referrerID]].referral.length;
        if(referrerReferralLength != 1 || _referrerID == 1) {
            payment(1, msg.sender, referrerReferralLength, false);
        } else {
            // users[userList[_referrerID]].levelEligibility.push(1);
            addLevelEligibility(userList[_referrerID], 1);
            address referrer = userList[_referrerID];
            users[referrer].incomeCount[1]++;
        }
    
        (bool status, ) = payable(userList[_referrerID]).call{value: regShare}("");
        require(status, "RegShare transfer failed");
        totalEarnings[userList[_referrerID]] += regShare;
        emit regLevelEvent(msg.sender, userList[_referrerID], block.timestamp);
    }
    

    function payment(uint _reglevel, address _user, uint256 length, bool loop) internal {
        address payer;
        bool isRenewal = false;
        bool isSameLeg = false;
        bool isPayNeed = true;
        uint256 levelEligibility;
        uint256 payLevel = _reglevel;
    
        // Determine payer based on context
        if (length == 2) {
            (payer, isPayNeed, isSameLeg) = levelUpgrade(_reglevel, _user, levelEligibility, isSameLeg, isPayNeed);
            payLevel = _reglevel + 1;
        }
        else if (length >= 20 && length % 20 == 0) {
            payer = splPromoWallet;
        }
        else if (length >= 4 && length % 4 == 0) {
            (payer, isRenewal) = levelRenewal(loop, _user, _reglevel);
        }
        else {
            payer = userList[users[_user].referrerID];
        }
    
        // Fallback to admin if invalid payer
        if (!users[payer].isExist || payer == userList[1]) {
            payer = userList[1];
        }
    
        // Proceed with payment logic
        if (isPayNeed || !users[payer].isExist || payer == userList[1]) {
            (loop, length) = checkLoopRequired(payer, payLevel, length, isRenewal, isSameLeg);
    
            if (loop) {
                // Adjust level for upgrade or renewal case
                if (isPayNeed && !isSameLeg && length == 2) {
                    _reglevel = payLevel;
                }
                if (isPayNeed && !isSameLeg && length == 4 && payLevel > 1) {
                    _reglevel = payLevel;
                }
    
                // Recursive call with updated parameters
                payment(_reglevel, payer, length, true);
            } else {
                // Final fallback to admin if invalid
                if (!users[payer].isExist || payer == userList[1]) {
                    payer = userList[1];
                }
    
                users[payer].incomeCount[payLevel]++;
    
                (bool sent, ) = payable(payer).call{value: LEVEL_PRICE[payLevel]}("");
    
                if (sent) {
                    emit getMoneyForLevelEvent(payer, msg.sender, payLevel, block.timestamp);
                    totalEarnings[payer] += LEVEL_PRICE[payLevel];
                    // users[payer].levelEligibility.push(payLevel);
                    addLevelEligibility(payer, payLevel);
                } else {
                    emit lostMoneyForLevelEvent(payer, msg.sender, payLevel, block.timestamp);
                }
            }
        }
    }

    function levelUpgrade(uint256 _regLevel, address _user, uint256 _levelEligibility, bool isSameLeg, bool isPayNeed ) 
             internal returns (address, bool, bool) {
            uint256 upLevel = _regLevel+1;
            address payer; address referrer;
           // find eligible payer
           if(upLevel <= 2) {
             referrer = userList[users[_user].referrerID]; //7
           } else {referrer = _user;}
            (payer, referrer) = findEligiblePayer(referrer, _regLevel, _levelEligibility);
            
           
            if(!users[payer].isExist || 
                (levelUpgradePayments[upLevel][payer] == address(0) && 
                    isLevelUpgradedForAddress[upLevel][payer] ==  false)) {
                if(!users[payer].isExist) payer = userList[1];
                
                //For payer as user1 anyways payment will proceed, so no need to update incomecount now
                if(payer != userList[1]) {
                    users[payer].incomeCount[upLevel] = users[payer].incomeCount[upLevel]+1;
                    isPayNeed = false;
                }
                
                // for all payers update levelupgrade payments
                levelUpgradePayments[upLevel][payer] = referrer;
                
                // for all payers update levelupgrade payments
                levelCounter[upLevel][payer] = 1;
            } else {
                address existingReferrer = levelUpgradePayments[upLevel][payer];
                if (isLevelUpgradeFromSameLeg(payer, existingReferrer, referrer)) {
                    isSameLeg = true;
                } else {
                    // remove level upgrame variable after level upgrade
                    levelUpgradePayments[upLevel][payer] = address(0);
                    isLevelUpgradedForAddress[upLevel][payer] = true;
                    levelCounter[upLevel][payer] = levelCounter[upLevel][payer] + 1;
                }
            }
         
         // users[referrer].levelEligibility.push(upLevel);
         addLevelEligibility(referrer, upLevel);
         return (payer, isPayNeed, isSameLeg);
    }
    
    function addLevelEligibility(address user, uint level) internal {
        uint[] storage levels = users[user].levelEligibility;

        bool exists = false;
        for (uint i = 0; i < levels.length; i++) {
            if (levels[i] == level) {
                exists = true;
                break;
            }
        }
    
        if (!exists) {
            levels.push(level);
        }
    }

    function findEligiblePayer(address _referrer, uint256 _regLevel, uint256 _levelEligibility) internal returns (address, address){
    address _eligiblePayer;
    address _tempreferrer = _referrer; 
        
    if(users[_referrer].referrerID == 1) {
        _eligiblePayer = userList[users[_referrer].referrerID];
    } else {
        // find eligible payer 
        for(int i=0; i<6; i++) { // Changed from 12 to 6
            if (users[_tempreferrer].levelEligibility.length == 0) {
                _levelEligibility = 0;
            } else {
                    uint256 _lelevel = users[_tempreferrer].levelEligibility.length - 1;
                    _levelEligibility = users[_tempreferrer].levelEligibility[_lelevel];
                } 
            
            address payer1 = userList[users[_tempreferrer].referrerID]; 
            address secReferrer = userList[users[payer1].referrerID]; 
            
            if(_regLevel == 2) {
                secReferrer = userList[users[secReferrer].referrerID]; 
            }
            
            //LE initially 
            if(_levelEligibility < _regLevel+1) { 
                // Check if secReferrer exists, if not or if it's referrerID is 0 or 1
                if(!users[secReferrer].isExist || users[payer1].referrerID == 0 || 
                    users[payer1].referrerID == 1) { 
                        
                    // Check for second upline's upline and if not eligible, assign to id1
                    if(!users[userList[users[payer1].referrerID]].isExist || users[secReferrer].referrerID == 0) { 
                        _eligiblePayer = userList[1];
                    } else {
                        // If second upline's upline has id 2 (not eligible), check higher upline
                        if(users[payer1].referrerID == 2 && _levelEligibility < _regLevel+1) {
                            // Check if id 2's upline exists (id 1)
                            address payer2 = userList[users[payer1].referrerID]; // id 2
                            if(users[payer2].referrerID != 0) {
                                _eligiblePayer = userList[users[payer2].referrerID]; // should be id 1
                            } else {
                                _eligiblePayer = userList[1]; // Fallback to id 1
                            }
                        } else {
                            _eligiblePayer = userList[users[payer1].referrerID];
                        }
                    }
                    break;
                } 
                _tempreferrer = secReferrer; 
                _eligiblePayer = secReferrer; 
                
            } else {
                _eligiblePayer = _tempreferrer; 
                break;
            }
        }
    }
    users[_referrer].incomeCount[_regLevel] = users[_referrer].incomeCount[_regLevel]+1; 
    return (_eligiblePayer, _referrer);
}
    
    function levelRenewal(bool _loop, address _user, uint256 _regLevel)internal returns(address, bool) {
        bool _isRenewal = true;
        address referrer; address payer;
         if(!_loop) {
             referrer = userList[users[_user].referrerID];
         } else { referrer = _user; }
        
        users[referrer].incomeCount[_regLevel] = users[referrer].incomeCount[_regLevel]+1; 
        payer = userList[users[referrer].referrerID]; 
        if(!users[payer].isExist) payer = userList[1];
        
        return (payer, _isRenewal);
    }
    
    function checkLoopRequired(
      address _payer,
      uint256 _regLevel,
      uint256 _length,
      bool isRenewal,
      bool isSameLeg
    ) internal view returns (bool, uint256) {
        bool loop = false;
        uint256 length = _length;
    
        uint256 tempPaymentCount = users[_payer].incomeCount[_regLevel] + 1;
    
        if (_regLevel > 2) return (false, length); // protect against invalid levels
    
        // Level upgrade of different leg (only applies to level 2)
        if (_regLevel == 2 && levelCounter[_regLevel][_payer] == 2) {
            loop = true;
        }
    
        // Every fourth payment at level 1
        else if (
            _regLevel == 1 &&
            tempPaymentCount >= 4 &&
            tempPaymentCount % 4 == 0 &&
            users[_payer].referrerID != 0
        ) {
            if (_length == 3 && tempPaymentCount == 4) {
                length = tempPaymentCount;
            }
            loop = true;
        }
    
        // Only applies to level 2 upgrades
        else if (
            _regLevel == 2 &&
            tempPaymentCount >= 4 &&
            tempPaymentCount % 4 == 0 &&
            _length == 2 &&
            !isSameLeg
        ) {
            if (_payer == userList[1]) {
                loop = false;
            } else {
                loop = true;
                length = 4;
            }
        }
    
        // Second upgrade payment
        else if (
            _regLevel == 2 &&
            tempPaymentCount == 2 &&
            users[_payer].referrerID != 0 &&
            !isRenewal &&
            !isSameLeg
        ) {
            if (!users[_payer].isExist) _payer = userList[1];
            if (_payer != userList[1]) {
                loop = true;
                length = tempPaymentCount;
            }
        }
    
        return (loop, length);
    }

    
    function isLevelUpgradeFromSameLeg(address _payer, address _existingReferrer, address _newReferrer) 
            internal view returns(bool){
        bool isSameLeg = false;
        
        address[] memory payerReferrals = getUserReferrals(_payer);
        address firstLeg = _existingReferrer; 
        address secondLeg = _newReferrer;
        
        address tempReferrer1 = userList[users[firstLeg].referrerID]; 
        for(int i=0; i<2; i++) { 
            bool foundReferrer = false;     
            for (uint j=0; j<payerReferrals.length; j++) {
                if(tempReferrer1 == payerReferrals[j]) {
                    firstLeg = payerReferrals[j];
                    foundReferrer = true;
                    break;
                }
            }
            if(foundReferrer) { break;} 
           tempReferrer1 =  userList[users[tempReferrer1].referrerID];
        }
        
        address tempReferrer2 = userList[users[secondLeg].referrerID]; 
        for(int i=0; i<2; i++) { 
            bool foundReferrer = false;     
            for (uint j=0; j<payerReferrals.length; j++) {
                if(tempReferrer2 == payerReferrals[j]) {
                    secondLeg = payerReferrals[j];
                    foundReferrer = true;
                    break;
                }
            }
            if(foundReferrer) { break;} 
            tempReferrer2 = userList[users[tempReferrer2].referrerID]; 
        }
        
        if(firstLeg == secondLeg) {isSameLeg = true;}
         return  isSameLeg;      
    }
    
    // index 0-1 : promotion wallets, 2 : SplPromotionWallet, 3: URS Wallet
    function updatePromotionWallet(address walletAddr, uint index) onlyAdmin public {
        require(msg.sender == adminWallet, "Invalid caller");
        require(index <= 3, "Invalid Index");
        if(index <=1 ) {
            promotionWallets[index-1] = walletAddr;
        } else if (index == 2) {
            splPromoWallet = walletAddr;
        } else {
            ursWallet = walletAddr; // for index 5
        }
    }
    
    // Withdraw Promotion Value index 0-1 : promotion wallets, 2 : SplPromotionWallet, 3: URS Wallet
    function withdrawPromotion() public returns (bool) {
        bool checkCaller = false;
        uint amount;
        if(msg.sender == splPromoWallet) {
            amount = splPromAmt;
            splPromAmt = 0;
            checkCaller = true;
        } else if(msg.sender == ursWallet) {
            amount = (ursAmt*20)/100;
            ursAmt -= amount;
            checkCaller = true;
        }  else {
            uint callerIndex = 0;
            for (uint i = 0; i < promotionWallets.length; i++) {
                if (promotionWallets[i] == msg.sender) {
                    checkCaller = true;
                    callerIndex = i;
                    break;
                }
            } 
            
            amount = promotionWalletsAmount[callerIndex];
            promotionWalletsAmount[callerIndex] -= amount;
            promAmt = promAmt - amount;
        }
        require(checkCaller == true, "Invalid caller");
        (bool sent, ) = payable(msg.sender).call{value: amount}("");
        require(sent, "Withdrawal failed");
        totalEarnings[msg.sender] -= amount;
        return true;

    }
    
     // Withdraw Promotion Value index 0-1 : promotion wallets, 2 : SplPromotionWallet, 3: URS Wallet
    function checkWithdrawAmount() public view returns (uint) {
        bool checkCaller = false;
        uint amount;
        if(msg.sender == splPromoWallet) {
            amount = splPromAmt;
            checkCaller = true;
        } else if(msg.sender == ursWallet) {
            amount = ursAmt;
            checkCaller = true;
        }  else {
            uint callerIndex = 0;
            for (uint i = 0; i < promotionWallets.length; i++) {
                if (promotionWallets[i] == msg.sender) {
                    checkCaller = true;
                    callerIndex = i;
                    break;
                }
            } 
            amount = promotionWalletsAmount[callerIndex];
        }
        
        require(checkCaller == true, "Invalid caller");
        return amount/1000000;
    }
    
    // Get smartcontract balance
    function getContractBalance() public view returns(uint256) {
        return address(this).balance/1000000;
    }
    
    // Get User Level Eligiblities balance
    function getUserLevelEligibility(address _user) public view returns(uint256[] memory) {
        return users[_user].levelEligibility;
    }
    
     // Get Referral users
    function getUserReferrals(address _user) public view returns(address[] memory) {
        return users[_user].referral;
    }
    
       // Get User Level Eligiblities balance
    function getUserIncomeCount(address _user, uint256 _level) public view returns(uint256) {
        return users[_user].incomeCount[_level];
    }   
}