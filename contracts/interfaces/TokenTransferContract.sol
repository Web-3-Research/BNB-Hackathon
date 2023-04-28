// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./AuthorizationContract.sol";
import "./DepositContract.sol";

contract TokenTransferContract {
    address public owner;
    AuthorizationContract public authorizationContract;
    DepositContract public depositContract;
    event TokensTransferred(address indexed tokenContract, address indexed sender, address indexed recipient, uint256 amount);

    constructor(address _authorizationContract, address _depositContract) {
        owner = msg.sender;
        authorizationContract = AuthorizationContract(_authorizationContract);
        depositContract = DepositContract(_depositContract);
    }

    function transferTokens(address tokenContract, address sender, address recipient, uint256 amount, address followerAccount) external returns (bool) {
        require(tokenContract != address(0), "TokenTransferContract: invalid token address");
        require(sender != address(0), "TokenTransferContract: invalid sender address");
        require(recipient != address(0), "TokenTransferContract: invalid recipient address");
        require(amount > 0, "TokenTransferContract: amount must be greater than zero");
        require(followerAccount != address(0), "TokenTransferContract: Follower account address cannot be null or zero");
        require(authorizationContract.isAuthorized(msg.sender, 1) || depositContract.getDepositorAddress(followerAccount) == msg.sender, "Not authorized");
        require(authorizationContract.isAuthorized(followerAccount, 1), "VM Exception while processing transaction: revert Panic: Arithmetic overflow");
        IERC20 token = IERC20(tokenContract);
        require(token.balanceOf(sender) >= amount, "TokenTransferContract: insufficient balance");

        bool success = token.transferFrom(sender, recipient, amount);
        require(success, "TokenTransferContract: transfer failed");

        emit TokensTransferred(tokenContract, sender, recipient, amount);
        return true;
    }

function getBalance(address account, address tokenContract) external view returns (uint256) {
    require(account != address(0), "TokenTransferContract: invalid account address");
    require(tokenContract != address(0), "TokenTransferContract: invalid token address");

    IERC20 token = IERC20(tokenContract);
    uint256 balance = token.balanceOf(account);
    require(balance >= 0, "TokenTransferContract: unable to retrieve balance");

    return balance;
}


    modifier onlyOwner() {
        require(msg.sender == owner, "TokenTransferContract: Not authorized");
        _;
    }

}