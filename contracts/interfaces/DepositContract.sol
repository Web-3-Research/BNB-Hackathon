// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./AuthorizationContract.sol";

contract DepositContract is Ownable {
    using SafeMath for uint256;
    mapping(address => FollowerAccount) public followerAccounts;
    event FollowerAccountCreated(address indexed accountAddress);
    event TokensDeposited(address indexed accountAddress, uint256 amount);
    event DepositEvent(address indexed depositor, address indexed tokenContract, uint256 amount);
    AuthorizationContract public authorizationContract;
    uint8 constant USER_AUTHORIZATION = 1;

    struct FollowerTokenBalance {
        bool exists;
        uint256 balance;
    }

struct FollowerAccount {
    bool exists;
    uint256 totalDeposit;
    address depositor; // new member variable
    mapping(address => FollowerTokenBalance) tokenBalances;
    address[] tokenContracts;
}


    // Constructor to set the address of the DepositContract and AuthorizationContract
    constructor(address _authorizationContract) {
        authorizationContract = AuthorizationContract(_authorizationContract);
    }
    
    struct FollowerAccountInfo {
        bool exists;
        uint256 totalDeposit;
        address depositor;
        address[] tokenContracts;
        uint256[] tokenBalances;
    }

function deposit(address accountAddress, address tokenContract, uint256 amount) public {
    require(accountAddress != address(0), "DepositContract: account address cannot be zero");
    
    if (!followerAccounts[accountAddress].exists) {
        followerAccounts[accountAddress].exists = true;
        followerAccounts[accountAddress].totalDeposit = 0;
        followerAccounts[accountAddress].depositor = msg.sender;
        emit FollowerAccountCreated(accountAddress);
    }
    
    require(IERC20(tokenContract).allowance(msg.sender, address(this)) >= amount, "ERC20: insufficient allowance");
    followerAccounts[accountAddress].totalDeposit = followerAccounts[accountAddress].totalDeposit.add(amount);
        if (!followerAccounts[accountAddress].tokenBalances[tokenContract].exists) {
        followerAccounts[accountAddress].tokenBalances[tokenContract].exists = true;
        followerAccounts[accountAddress].tokenContracts.push(tokenContract);
    }
    
    followerAccounts[accountAddress].tokenBalances[tokenContract].balance = followerAccounts[accountAddress].tokenBalances[tokenContract].balance.add(amount);
    
    emit TokensDeposited(accountAddress, amount);
        emit DepositEvent(msg.sender, tokenContract, amount);
}



function updateDeposit(address accountAddress, address _tokenContract, uint256 _amount) public {
    require(followerAccounts[accountAddress].exists, "Follower account does not exist");
    require(followerAccounts[accountAddress].depositor == msg.sender || authorizationContract.isAuthorized(msg.sender, 1),"Only the depositor can update the deposit");

    if (!followerAccounts[accountAddress].tokenBalances[_tokenContract].exists) {
        followerAccounts[accountAddress].tokenBalances[_tokenContract].exists = true;
        followerAccounts[accountAddress].tokenBalances[_tokenContract].balance = 0;
        followerAccounts[accountAddress].tokenContracts.push(_tokenContract);
    }
    followerAccounts[accountAddress].tokenBalances[_tokenContract].balance += _amount;
    followerAccounts[accountAddress].totalDeposit += _amount;
    emit DepositEvent(accountAddress, _tokenContract, _amount);
}

        function getFollowerAccountInfo(address accountAddress) public view returns (FollowerAccountInfo memory) {
            FollowerAccountInfo memory followerAccountInfo;
            followerAccountInfo.exists = followerAccounts[accountAddress].exists;
            followerAccountInfo.totalDeposit = followerAccounts[accountAddress].totalDeposit;
            followerAccountInfo.depositor = accountAddress;
            followerAccountInfo.tokenContracts = followerAccounts[accountAddress].tokenContracts;
            followerAccountInfo.tokenBalances = new uint256[](followerAccountInfo.tokenContracts.length);
            for (uint256 i = 0; i < followerAccountInfo.tokenContracts.length; i++) {
                followerAccountInfo.tokenBalances[i] = followerAccounts[accountAddress].tokenBalances[followerAccountInfo.tokenContracts[i]].balance;
            }
            return followerAccountInfo;
        }
        
    function getDepositorAddress(address accountAddress) public view returns (address) {
        return followerAccounts[accountAddress].depositor;
    }

    function getDeposit(address accountAddress, address tokenContract) public view returns (uint256) {
        uint256 balance = 0;
        for (uint256 i = 0; i < followerAccounts[accountAddress].tokenContracts.length; i++) {
            if (followerAccounts[accountAddress].tokenContracts[i] == tokenContract) {
                balance = followerAccounts[accountAddress].tokenBalances[followerAccounts[accountAddress].tokenContracts[i]].balance;
                break;
            }
        }
        return balance;
    }
        modifier onlyAuthorized(address _depositor) {
    require(msg.sender == _depositor || authorizationContract.isAuthorized(msg.sender, USER_AUTHORIZATION), "Not authorized");
    _;
}
}
