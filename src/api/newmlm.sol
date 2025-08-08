/**
 *Submitted for verification at OpbnbTrace on 2025-07-22
*/

// SPDX-License-Identifier: Unlicensed

pragma solidity 0.8.11;

/** 
*
*   ███╗   ██╗███████╗ ██████╗█████████╗ ███╗   ███████╗ ███████╗ ██████╗ ██╗   ██╗ ██████╗
*   ████╗  ██║██╔════╝██╔════╝╚══██╔═══╝██╚██╗  ██╔═══██╗██╔════╝██╔═══██╗██║   ██║██╔════╝
*   ██╔██╗ ██║█████╗  ██║        ██║   ███████╗ ██║╔███╔╝█████╗  ██║   ██║██║   ██║╚██████╗
*   ██║╚██╗██║██╔══╝  ██║        ██║  ██╔════██╗██║╚██╔╝ ██╔══╝  ██║   ██║██║   ██║ ╚════██╗
*   ██║ ╚████║███████╗ ███████╗  ██║  ██╔╝   ██╗██║  ╚██╗███████╗╚██████╔╝╚██████╔╝███████╔╝
*   ╚═╝  ╚═══╝╚══════╝ ╚══════╝  ╚═╝  ╚═╝    ╚═╝╚═╝   ╚═╝╚══════╝ ╚═════╝  ╚═════╝ ╚══════╝
* @title Nectareous
* @author Nectareous Team
*
* Copyright (c) 2025 NECTAREOUS. All rights reserved.
*
*/

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

// @title Nectareous – Affiliate - style referral & level-up tracking with pull-payments
// @notice This contract is a simple implementation of an affiliate-style referral program
// @dev This is a Community Based Knowledge Sharing Platform
// @dev This contract is for the purpose of awareness about blockchain and cryptocurrency
// @dev This contract is not for investment purpose nor promises to pay ROI
// @dev This contract is not affiliated with any other organization or individual

contract Nectareous is ReentrancyGuard{

    uint256 immutable REG_FEE = 1e17;
    uint256 immutable INCOME_LIMIT = 10;
    uint256 immutable SECOND_INCOME_LIMIT = 40;
    uint256 constant REG_SHARE_PERC = 14;
    uint256 constant REG_SHARE2_PERC = 4;
    uint256 constant GAS_SHARE_PERC = 9;
    uint256 constant SPL_PR_SHARE_PERC = 1;
    uint256 constant TDB_SHARE_PERC = 36;
    uint8[3] gasPerc = [50,30,20];

    mapping(uint8 => uint256) public LEVEL_PRICE;
    
    address author;
    address urswall;
    address splPrWall;
    address reWall;
    address[3] gasWalls;

    uint32 public currUserID;
    uint32 tcurrUserID;

    uint256 splPromAmt;
    uint256 reAmt;
    uint256 ursAmt;
    uint256 regShare;
    uint256 regShare2;
    uint256 gasShare;
    uint256 splPrShare;
    uint256 tdb;
 
    struct UserStruct {
        uint32 id;
        uint32 referrerID;
        address[] referral;
        uint joined;
        uint8 levelEligibility;
        mapping(uint => uint) incomeCount;
        bool isExist;
    }

    struct TUserStruct {
        uint256 earning;
        uint32 id;
        uint32 referrerID;
        uint32 directReferralCount;
        uint32 indirectReferralCount;
        uint32 indirectReferralLength;
        address[] referral;
        address[] indirectReferral;
        mapping(address => uint256) indirectReferralMap;
        mapping(address => uint256) referralMap;
        bool isExist;
    }

    struct paymentStruct {
        uint32 payerId;
        uint256 amount;
    }

    mapping(address => UserStruct) public users;
    mapping(uint => address) public userList;
    mapping(address => mapping(uint256 => paymentStruct[]))internal payments;
    mapping(uint256 => mapping(address => uint256)) public levelCounter;
    mapping(uint256 => mapping(address => address)) public levelUpgradePayments;
    mapping(uint256 => mapping(address => bool)) internal isLevelUpgradedForAddress;
    mapping(address => TUserStruct) public tusers;

    event regLevelEvent(address indexed _user, address indexed _referrer, uint _time);
    event getMoneyForLevelEvent(address indexed _user, address indexed _referral, uint _level, uint _time);
    uint256[3] gasAmts;

    modifier onlyAuthor {
        require(msg.sender == author, "Caller is not author.");
        _;
    }
    
    constructor(address _prwall1, address _prwall2, 
                address _prwall3, address _sprwall, 
                address _reWall, address _urswall ) {
        author = msg.sender;
        urswall = _urswall;
        splPrWall = _sprwall;
        reWall = _reWall;
        gasWalls = [_prwall1, _prwall2, _prwall3];
        
        regShare = (REG_FEE * REG_SHARE_PERC)/100;
        regShare2 = (REG_FEE * REG_SHARE2_PERC)/100;
        gasShare = (REG_FEE * GAS_SHARE_PERC)/100;
        splPrShare = (REG_FEE * SPL_PR_SHARE_PERC)/100;
        tdb = (REG_FEE * TDB_SHARE_PERC)/100;

        uint256 price = (REG_FEE*36)/100;
        for (uint8 level = 1; level <= 9; level++) {
            LEVEL_PRICE[level] = price;
            price *= 2;
        }

        currUserID++;
        UserStruct storage userStruct = users[author];
        userStruct.isExist = true;
        userStruct.id = currUserID;
        userStruct.referrerID = 0;
        userStruct.referral = new address[](0);
        userStruct.joined = block.timestamp;
        userStruct.levelEligibility = 1; 
        userList[currUserID] = author;

        tcurrUserID++;
        TUserStruct storage userStruct1 = tusers[author];
        userStruct1.earning = 0;
        userStruct1.isExist = true;
        userStruct1.id = tcurrUserID;
        userStruct1.referrerID = 0;
        userStruct1.referral = new address[](0);
        userStruct1.indirectReferral = new address[](0);
        userStruct1.indirectReferralCount = 0;
        userStruct1.indirectReferralLength = 0;
        userStruct1.directReferralCount = 0;
    }
    
    function regUser(uint32 _referrerID) external payable {
        require(!users[msg.sender].isExist, 'User exist');
        require(_referrerID > 0 && _referrerID <= currUserID, 'Incorrect referrer Id');
        require(msg.value == REG_FEE, 'Incorrect Value');

        currUserID++;
        UserStruct storage userStruct = users[msg.sender];
        userStruct.isExist = true;
        userStruct.id = currUserID;
        userStruct.referrerID = _referrerID;
        userStruct.referral = new address[](0);
        userStruct.joined = block.timestamp;
        userStruct.levelEligibility = 1; 
        
        userList[currUserID] = msg.sender;
        
        users[userList[_referrerID]].referral.push(msg.sender);
        
        ursAmt += LEVEL_PRICE[1];
        splPromAmt += splPrShare;
        for (uint8 i = 0; i < 3; i++) {
            gasAmts[i] += (gasShare * gasPerc[i]) / 100;
        }
                
        uint referrerReferralLength = users[userList[_referrerID]].referral.length;
        if(referrerReferralLength != 1 || _referrerID == 1) {
            payment(1, msg.sender, referrerReferralLength, false);
           
        } else {
            address referrer = userList[_referrerID]; //2
            users[referrer].incomeCount[1] = users[referrer].incomeCount[1]+1;
        }
            tregUser(_referrerID);
        bool success;

        (success,) = (address(uint160(userList[_referrerID]))).call{value: regShare}("");

       if(referrerReferralLength <= 3) {
                reAmt += regShare2;
       } else {
            (success,) = (address(uint160(userList[_referrerID]))).call{value: regShare2}("");     
       } 

        require(success, 'Transaction failed!');
        emit regLevelEvent(msg.sender, userList[_referrerID], block.timestamp);
    }
    
    function payment(uint8 _reglevel, address _user, uint256 length, bool loop) internal { //4
        address payer;
        bool isRenewal = false;
        bool isSameLeg = false;
        bool isPayNeed = true;
        uint256 levelEligibility; 
        uint8 payLevel = _reglevel;
        
        if (length == 2) {
          (payer, isPayNeed, isSameLeg) = levelUpgrade (_reglevel, _user, levelEligibility, isSameLeg, isPayNeed);
          payLevel = _reglevel+1;
        } 
        else if (length >= 4 && length % 4 == 0) { 
           (payer, isRenewal) = levelRenewal(loop, _user, _reglevel, levelEligibility);
           payLevel = _reglevel;
        } 
        else {
            payer = userList[users[_user].referrerID];
        } 
        
        if (isPayNeed || !users[payer].isExist || payer == userList[1]) {
            (loop, length) = checkLoopRequired(payer, payLevel, length, isRenewal, isSameLeg);
             if(loop) {  
                 if(isPayNeed && !isSameLeg && length==2) {
                    _reglevel = payLevel;
                }
                 if(isPayNeed && !isSameLeg && length == 4 && payLevel>=1) {
                    _reglevel = payLevel;
                }
               
               payment(_reglevel, payer, length, true); 
            } else {
                if(!users[payer].isExist) payer = userList[1];
                
                if(users[_user].referrerID != 1) {
                    users[payer].incomeCount[payLevel]= users[payer].incomeCount[payLevel]+1; 
                } else {
                    payLevel = 1;
                }                
                (bool success,) = (address(uint160(payer))).call{value: LEVEL_PRICE[payLevel]}("");
                require(success, 'Transaction failed!');

                if (success) {
                    emit getMoneyForLevelEvent(payer, msg.sender, payLevel, block.timestamp);
                }
            }
        }
    }
        
    function levelUpgrade(uint256 _regLevel, address _user, uint256 _levelEligibility, bool isSameLeg, bool isPayNeed ) 
             internal returns (address, bool, bool) {
            uint256 upLevel = _regLevel+1;
            address payer; address referrer;
           if(upLevel <= 2) {
             referrer = userList[users[_user].referrerID];
           } else {referrer = _user;}
            (payer, referrer) = findEligiblePayer(referrer, _regLevel, _levelEligibility);
            
            if(!users[payer].isExist || 
                (levelUpgradePayments[upLevel][payer] == address(0) && 
                    isLevelUpgradedForAddress[upLevel][payer] ==  false)) {
                if(!users[payer].isExist) payer = userList[1];
                
                if(payer != userList[1]) {
                    users[payer].incomeCount[upLevel] = users[payer].incomeCount[upLevel]+1;
                    isPayNeed = false;
                }
                
                levelUpgradePayments[upLevel][payer] = referrer;
                
                levelCounter[upLevel][payer] = 1;
            } else {
                address existingReferrer = levelUpgradePayments[upLevel][payer];
                if (isLevelUpgradeFromSameLeg(payer, existingReferrer, referrer)) {
                    isSameLeg = true;
                } else {
                    levelUpgradePayments[upLevel][payer] = address(0);
                    isLevelUpgradedForAddress[upLevel][payer] = true;
                    levelCounter[upLevel][payer] = levelCounter[upLevel][payer] + 1;
                }
            }
         
         users[referrer].levelEligibility = users[referrer].levelEligibility+1;
         return (payer, isPayNeed, isSameLeg);
    }
    
    function findEligiblePayer(address _referrer, uint256 _regLevel, uint256 _levelEligibility) internal returns (address, address){
           address _eligiblePayer;
            address _tempreferrer = _referrer; 
                
                
                for(int i=0; i<9; i++) { 
                    if(_referrer == userList[1] || users[_referrer].referrerID == 1 || _eligiblePayer == userList[1]) {
                        break;
                    } else {
                        _levelEligibility = users[_tempreferrer].levelEligibility; 
                        
                        address payer1 = userList[users[_tempreferrer].referrerID]; //6
                        address secReferrer = userList[users[payer1].referrerID]; //6

                        for (uint j=1; j< _regLevel; j++) {
                            if(secReferrer == userList[1]) {
                                break;
                            }
                            secReferrer = userList[users[secReferrer].referrerID]; 
                        }

                     if(_levelEligibility < _regLevel+1) { 
                        if(!users[secReferrer].isExist || users[payer1].referrerID == 0 || 
                            users[payer1].referrerID == 1 
                            ) {                                 
                            if(!users[userList[users[payer1].referrerID]].isExist) { 
                                _eligiblePayer = userList[1] ;
                            } else {
                            _eligiblePayer = userList[users[payer1].referrerID];
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

    function findRenewalPayer(address _referrer, uint256 _regLevel, uint256 _levelEligibility) internal returns (address, address){
           address _eligiblePayer;
            address _tempreferrer = _referrer; 
            address secReferrer = _tempreferrer;
                for(int i=0; i<9; i++) { 
                    if(users[_referrer].referrerID == 1 || _eligiblePayer == userList[1]) {
                        break;
                    } else {
                        for (uint j=0; j< _regLevel; j++) {
                            if(_tempreferrer == userList[1]) {
                                break;
                            }
                            secReferrer = userList[users[secReferrer].referrerID]; 
                        }
                        if( secReferrer == userList[1]) {
                            _eligiblePayer = secReferrer;
                            break;
                        } else {
                            _levelEligibility = users[secReferrer].levelEligibility; 

                            if(_levelEligibility < _regLevel) { 
                                if(!users[secReferrer].isExist || users[secReferrer].referrerID == 0 || 
                                    users[secReferrer].referrerID == 1 
                                    ) {                                 
                                    if(!users[userList[users[secReferrer].referrerID]].isExist) { 
                                        _eligiblePayer = userList[1] ;
                                    } else {
                                    _eligiblePayer = userList[users[secReferrer].referrerID];
                                    }
                                    break;
                                } 
                                _tempreferrer = secReferrer; 
                                _eligiblePayer = secReferrer; 
                                
                            } else {
                                _eligiblePayer = secReferrer; 
                                break;
                            }
                                }                        
                    }
                }
            users[_referrer].incomeCount[_regLevel] = users[_referrer].incomeCount[_regLevel]+1; 
            return (_eligiblePayer, _referrer);
    }
    
    function levelRenewal(bool _loop, address _user, uint256 _regLevel, uint256 _levelEligibility)internal returns(address, bool) {
        bool _isRenewal = true;
        address referrer; address payer;
         if(!_loop) {
             referrer = userList[users[_user].referrerID];
         } else { 
            referrer = _user; 
         }
       (payer,) = findRenewalPayer(referrer, _regLevel, _levelEligibility);
        if(!users[payer].isExist) payer = userList[1];
        
        return (payer, _isRenewal);
    }
    
    function checkLoopRequired(address _payer, uint256 _regLevel, uint256 _length, bool isRenewal, bool isSameLeg) 
            internal view returns (bool, uint256) {
        bool loop = false;
        uint256 length = _length;
        
        uint256 tempPaymentCount = users[_payer].incomeCount[_regLevel]+1;
        
        if(levelCounter[_regLevel][_payer] == 2) {
            loop = true;
        }
        
        else if(tempPaymentCount >= 4 &&
          tempPaymentCount % 4 == 0  &&
          users[_payer].referrerID!=0 && _regLevel == 1
        ) {
          if(_length == 3 && tempPaymentCount ==4) {
                length = tempPaymentCount;
          } 
           loop = true;
        }
        
        else if (tempPaymentCount >= 4 &&
            tempPaymentCount % 4 == 0  &&
            _length == 2 && !isSameLeg &&
            _regLevel > 1) {
            if(_payer == userList[1]) {
                loop = false;
            } else {
                length = 4;
                loop = true;
            }
        }
        
         else if(tempPaymentCount == 2 &&
          users[_payer].referrerID!=0 && !isRenewal && !isSameLeg) {
           if(!users[_payer].isExist) _payer = userList[1];
            if(_payer == userList[1]) {
                loop = false;
            } else {
                loop = true;
                length = tempPaymentCount;
            }
        } 
        
        else if(tempPaymentCount == 1 &&
          users[_payer].referrerID==0) {
           if(!users[_payer].isExist) _payer = userList[1];
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
        for(int i=0; i<12; i++) { 
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
        for(int i=0; i<12; i++) { 
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

    function upwall(address wallAddr, uint index) onlyAuthor public {
        require(index <= 4, "Invalid Index");
        if(index == 0  ) { 
            gasWalls[0] = wallAddr;
        } else if(index == 1) { 
            gasWalls[1] = wallAddr;
        }  else if(index == 2) { 
            gasWalls[2] = wallAddr;
        }  else if(index == 3) { 
            splPrWall = wallAddr;
        } else if(index == 4) { 
            reWall = wallAddr;
        } 
    }

    function winwall(uint8 wIndex) nonReentrant public returns (bool)  {
    require(wIndex <= 5, "Invalid Index;");
        uint maxEligibleAmount;
        if (wIndex<=2) {
            bool checkCaller = false;
            uint callerIndex = 0;
            for (uint i = 0; i < gasWalls.length; i++) {
                if (gasWalls[i] == msg.sender) {
                    checkCaller = true;
                    callerIndex = i;
                    break;
                }
            }
            require(checkCaller == true, "Invalid action");
            maxEligibleAmount = gasAmts[callerIndex];
            gasAmts[callerIndex] = 0;
        } else if (wIndex == 3) {
            require(msg.sender == splPrWall, "invalid action");
            maxEligibleAmount = splPromAmt;
            splPromAmt = 0;
        } else if (wIndex == 4) {
            require(msg.sender == reWall, "invalid action");
            maxEligibleAmount = reAmt;
            reAmt = 0;
        } else {
            require(msg.sender == urswall, "invalid action");
            maxEligibleAmount = (ursAmt*10)/100;
            ursAmt -= maxEligibleAmount;
        }
        require(maxEligibleAmount > 0 , "No win");
        (bool success,) = (address(uint160(msg.sender))).call{value: maxEligibleAmount}("");
        require(success, 'Transaction failed!');
        
        return success;
    }
    
    function getUserLevelEligibility(address _user) public view returns(uint256) {
        return users[_user].levelEligibility;
    }
    
    function getUserReferrals(address _user) public view returns(address[] memory) {
        return users[_user].referral;
    }
    
    function getUserIncomeCount(address _user, uint256 _level) public view returns(uint256) {
        return users[_user].incomeCount[_level];
    }

    function verify(uint8 wIndex) public view returns (uint256) {
        require(wIndex <= 4, "Invalid Index;");
        uint maxEligibleAmount;
        if (wIndex<=2) {
            bool checkCaller = false;
            uint callerIndex = 0;
            for (uint i = 0; i < gasWalls.length; i++) {
                if (gasWalls[i] == msg.sender) {
                    checkCaller = true;
                    callerIndex = i;
                    break;
                }
            }
            require(checkCaller == true, "Invalid action");
            maxEligibleAmount = gasAmts[callerIndex];
        } else if (wIndex == 3) {
            require(msg.sender == splPrWall, "invalid action");
            maxEligibleAmount = splPromAmt;
        } else if (wIndex == 4) {
            require(msg.sender == reWall, "invalid actionr");
            maxEligibleAmount = reAmt;
        } else {
            require(msg.sender == urswall, "invalid action");
            maxEligibleAmount = (ursAmt*10)/100;
        }
        return maxEligibleAmount;
    }

      function tregUser(uint32 _referrerID) internal  {

        uint32 activeReferrerId = findActiveReferrer(_referrerID);
        uint256 referalCount = tusers[userList[_referrerID]]
            .directReferralCount +
            tusers[userList[_referrerID]].indirectReferralCount;

        if (
            activeReferrerId == _referrerID ||
            (isUserActive(userList[_referrerID]) &&
                endsWith3or6or9(referalCount + 1) == true)
        ) {
            tusers[userList[_referrerID]].directReferralCount += 1;
        } else if (
            isUserActive(userList[_referrerID]) &&
            ((payments[userList[_referrerID]][1].length >= INCOME_LIMIT &&
                tusers[userList[_referrerID]].directReferralCount < 3) ||
                (payments[userList[_referrerID]][1].length >=
                    SECOND_INCOME_LIMIT &&
                    tusers[userList[_referrerID]].directReferralCount < 5))
        ) {
            tusers[userList[_referrerID]].directReferralCount += 1;
        }

        tcurrUserID++;
        userList[tcurrUserID] = msg.sender;

        TUserStruct storage userStruct1 = tusers[msg.sender];
            userStruct1.earning = 0;
            userStruct1.isExist = true;
            userStruct1.id = tcurrUserID;
            userStruct1.referrerID = activeReferrerId;
            userStruct1.referral = new address[](0);
            userStruct1.indirectReferral = new address[](0);
            userStruct1.indirectReferralCount = 0;
            userStruct1.indirectReferralLength = 0;
            userStruct1.directReferralCount = 0;

            userList[tcurrUserID] = msg.sender;

        if (activeReferrerId == _referrerID) {
            tusers[userList[activeReferrerId]].referral.push(msg.sender);
            tusers[userList[activeReferrerId]].referralMap[msg.sender] = tusers[userList[activeReferrerId]].referral.length;
        } else {
            if (activeReferrerId == 0) {
                activeReferrerId = 1;
            }
            tusers[userList[activeReferrerId]].indirectReferral.push(msg.sender);
            tusers[userList[activeReferrerId]].indirectReferralLength += 1;
            tusers[userList[activeReferrerId]].indirectReferralCount += 1;
            tusers[userList[activeReferrerId]].indirectReferralMap[msg.sender] 
		= tusers[userList[activeReferrerId]].indirectReferralLength;
        }
        tusers[userList[activeReferrerId]].earning += tdb;
        payments[userList[activeReferrerId]][1].push(
            paymentStruct({
                payerId: tusers[msg.sender].id,
                amount: tdb
            })
        );
        (bool success,) = (address(uint160(userList[activeReferrerId]))).call{value: tdb}("");
        require(success, 'Transaction failed!');
        emit regLevelEvent(msg.sender, userList[activeReferrerId], block.timestamp);
    }

    function findFreeReferrer(address _user) internal view returns (address) {
        if (tusers[_user].referral.length <2)  {
            return _user;
        }
        address[] memory referrals = new address[](16);
        referrals[0] = tusers[_user].referral[0];
        referrals[1] = tusers[_user].referral[1];

        address freeReferrer;
        bool noFreeReferrer = true;

        for (uint256 i = 0; i < 16; i++) { 
            
               if (i < 8) {
                    referrals[(i + 1) * 2] = tusers[referrals[i]].referral[0];
                    referrals[(i + 1) * 2 + 1] = tusers[referrals[i]].referral[
                        1
                    ];
               }
        
         else {
                noFreeReferrer = false;
                freeReferrer = referrals[i];
                break;
          }
       }
        require(!noFreeReferrer, "No Free Referrer");
        return freeReferrer;
    }

    function findActiveReferrer(
        uint32 referrerId
    ) internal returns (uint32) {
        require(
            referrerId > 0 && referrerId <= tcurrUserID,
            "Incorrect referrerId"
        );
        if (referrerId == 1) {
            return 1;
        }
        uint32 activeSponsor = 1;

        uint32 tempreferrerId = referrerId;
        bool checkSpon_Spons = false;

        for (uint256 i = 0; i < 40; i++) {
            if (isUserActive(userList[tempreferrerId])) {
                if (
                    (payments[userList[tempreferrerId]][1].length >=
                        INCOME_LIMIT &&
                        tusers[userList[tempreferrerId]].directReferralCount <
                        3) ||
                    (payments[userList[tempreferrerId]][1].length >=
                        SECOND_INCOME_LIMIT &&
                        tusers[userList[tempreferrerId]].directReferralCount < 5)
                ) {
                    tempreferrerId = tusers[userList[tempreferrerId]].referrerID;
                } else if (
                    tempreferrerId != 1 &&
                    endsWith3or6or9(
                        tusers[userList[tempreferrerId]].indirectReferralCount +
                            tusers[userList[tempreferrerId]]
                                .directReferralCount +
                            1
                    ) ==
                    true
                ) {
                    if (checkSpon_Spons == true) {
                        tusers[userList[tempreferrerId]]
                            .indirectReferralCount += 1;
                        tempreferrerId = tusers[userList[tempreferrerId]]
                            .referrerID;
                    } else {
                        tempreferrerId = tusers[userList[tempreferrerId]]
                            .referrerID;
                        checkSpon_Spons = true;
                    }
                } else {
                    activeSponsor = tempreferrerId;
                    break;
                }
            } else {
                tempreferrerId = tusers[userList[tempreferrerId]].referrerID;
            }
        }
        return activeSponsor;
    }

    function isUserActive(address _user)
        internal
        view
        returns (bool)
    {
        if (!tusers[_user].isExist) {
            return false;
        }
        return true;
    }

    function viewUserReferral(address _user)
        public
        view
        returns (address[] memory)
    {
        return tusers[_user].referral;
    }

    function viewUserIndirectReferral(address _user, uint256 index)
        public
        view
        returns (address)
    {
        return tusers[_user].indirectReferral[index];
    }

    function paymentsLength(address _user, uint256 _level) public view returns (uint256) {
        return payments[_user][_level].length;
    }

    function endsWith3or6or9(uint256 num) internal pure returns (bool) {
        uint256 lastDigit = num % 10;
        return lastDigit == 3 || lastDigit == 6 || lastDigit == 9;
    }
}