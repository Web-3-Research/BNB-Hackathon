const DepositContract = artifacts.require("DepositContract");
const AuthorizationContract = artifacts.require("AuthorizationContract");
const TokenTransferContract = artifacts.require("TokenTransferContract");
const LeaderInstructionContract = artifacts.require("LeaderInstructionContract");
const WithdrawalContract = artifacts.require("WithdrawalContract");

module.exports = async function(deployer, network, accounts) {
  const _sushiSwapRouterAddress = ("0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f");
  
  // Deploy the AuthorizationContract
  await deployer.deploy(AuthorizationContract);
  const authorizationContract = await AuthorizationContract.deployed();
  console.log("AuthorizationContract deployed at", authorizationContract.address);

  // Deploy the DepositContract and pass in the address of the AuthorizationContract
  await deployer.deploy(DepositContract, authorizationContract.address);
  console.log("DepositContract deployed at", DepositContract.address);

  // Deploy the TokenTransferContract and pass the needed arguments
  await deployer.deploy(TokenTransferContract, authorizationContract.address, DepositContract.address);
  const tokenTransferContract = await TokenTransferContract.deployed();
  console.log("TokenTransferContract deployed at", tokenTransferContract.address);

  // Deploy the LeaderInstructionContract
  await deployer.deploy(LeaderInstructionContract);
  console.log("LeaderInstructionContract deployed at", LeaderInstructionContract.address);
  
  // deploy the withdrawal contract
  await deployer.deploy(WithdrawalContract, DepositContract.address, authorizationContract.address, tokenTransferContract.address);
  console.log("WithdrawalContract deployed at", WithdrawalContract.address);

};
