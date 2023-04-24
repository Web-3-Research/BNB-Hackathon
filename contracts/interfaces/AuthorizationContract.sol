// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract AuthorizationContract {
    mapping (address => uint8) public authorizationLevels;
    mapping (address => bool) public accountStatus;
    uint8 public constant NO_AUTHORIZATION = 0;
    uint8 public constant USER_AUTHORIZATION = 1;
    uint8 public constant REBALANCE_AUTHORIZATION = 2;
    event AuthorizationChanged(address indexed account, uint8 authorizationLevel);
    event AccountStatusChanged(address indexed account, bool status);

    address public owner;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    function setAuthorizationLevel(address account, uint8 authorizationLevel) external onlyOwner {
        authorizationLevels[account] = authorizationLevel;
        emit AuthorizationChanged(account, authorizationLevel);
    }
    function isActive(address account) external view returns (bool) {
        return accountStatus[account];
    }

    function setAccountStatus(address account, bool status) external onlyOwner {
        accountStatus[account] = status;
        emit AccountStatusChanged(account, status);
    }

    function isAuthorized(address account, uint8 requiredAuthorizationLevel) external view returns (bool) {
        require(accountStatus[account], "Account is inactive");
        return authorizationLevels[account] >= requiredAuthorizationLevel;
    }

    function getAccountStatus(address account) public view returns (bool) {
        return accountStatus[account];
    }

    function getAuthorizationLevel(address account) public view returns (uint8) {
        return authorizationLevels[account];
    }
    function approveTokenTransfer(address tokenAddress, address spender, uint256 amount) external returns (bool) {
        require(tokenAddress != address(0), "TokenTransferContract: invalid token address");
        require(spender != address(0), "TokenTransferContract: invalid spender address");
        require(amount > 0, "TokenTransferContract: amount must be greater than zero");
        IERC20 tokenContract = IERC20(tokenAddress);
        uint256 allowance = tokenContract.allowance(msg.sender, spender);
        if (allowance < amount) {
            uint256 increaseAmount = amount - allowance;
            tokenContract.approve(spender, allowance + increaseAmount);
        }
        return true;
    }

}