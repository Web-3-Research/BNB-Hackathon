const { expect } = require('chai');
const truffleAssert = require('truffle-assertions');

const DepositContract = artifacts.require("DepositContract");
const AuthorizationContract = artifacts.require("AuthorizationContract");
const MockERC20 = artifacts.require("MockERC20");
const { BN } = require('@openzeppelin/test-helpers');

contract("DepositContract", async (accounts) => {
  let depositor = accounts[0];
  let recipient = accounts[1];
  let depositContract;
  let authorizationContract;
  let mockERC20;
  
  const toDecimal = (value, decimals) => new BN(value).mul(new BN(10).pow(new BN(decimals)));

  beforeEach(async () => {
    authorizationContract = await AuthorizationContract.new();
    depositContract = await DepositContract.new(authorizationContract.address, { from: depositor });
    mockERC20 = await MockERC20.new("Test Token", "TTT", 18, toDecimal(1100, 18));
    await authorizationContract.setAccountStatus(depositor, true);
    await authorizationContract.setAuthorizationLevel(depositor, 1);
    await authorizationContract.setAccountStatus(recipient, true);
    await mockERC20.approve(depositContract.address, toDecimal(1000, 18));
    await authorizationContract.setAccountStatus(accounts[2], true);

  });



it("should not allow updateDeposit from non-authorized account", async () => {
  // Arrange
  const depositAmount = toDecimal(100, 18);
  await depositContract.deposit(recipient, mockERC20.address, depositAmount, { from: depositor });
  const newAmount = toDecimal(50, 18);
  await authorizationContract.setAccountStatus(accounts[2], true);

  // Act & Assert
  await truffleAssert.reverts(
    depositContract.updateDeposit(recipient, mockERC20.address, newAmount, { from: accounts[2] }),
    "Only the depositor can update the deposit"
  );
});
it("should increase the total deposit and token balance after updateDeposit", async () => {
    // Arrange
    const depositAmount = toDecimal(100, 18);
    await depositContract.deposit(recipient, mockERC20.address, depositAmount, { from: depositor });
    const newAmount = toDecimal(50, 18);

    // Act
    await depositContract.updateDeposit(recipient, mockERC20.address, newAmount, { from: depositor });

    // Assert
    const followerAccountInfo = await depositContract.getFollowerAccountInfo(recipient);
    expect(followerAccountInfo.totalDeposit).to.be.bignumber.equal(depositAmount.add(newAmount));
    expect(followerAccountInfo.tokenBalances[0]).to.be.bignumber.equal(depositAmount.add(newAmount));
});

  describe("Function: deposit", async () => {

    it("should emit a deposit event", async () => {
      // Arrange
      const depositAmount = toDecimal(100, 18);
      
      // Act
      const result = await depositContract.deposit(recipient, mockERC20.address, depositAmount, { from: depositor });
      
      // Assert
      truffleAssert.eventEmitted(result, 'DepositEvent', (ev) => {
        return ev.depositor === depositor && ev.tokenContract === mockERC20.address && ev.amount.eq(depositAmount);
      });

    });
      
    it("should deposit the correct amount of tokens into the follower account", async () => {
      // Arrange
      const depositAmount = toDecimal(100, 18);
    
      // Act
      await depositContract.deposit(recipient, mockERC20.address, depositAmount, { from: depositor });
    
      // Assert
      const followerAccountInfo = await depositContract.getFollowerAccountInfo(recipient);
      expect(followerAccountInfo.totalDeposit).to.be.bignumber.equal(depositAmount);
      expect(followerAccountInfo.tokenBalances[0]).to.be.bignumber.equal(depositAmount);
    });
    
    it("should not allow deposit from non-authorized account", async () => {
      // Arrange
      const depositAmount = toDecimal(100, 18);
      await authorizationContract.setAccountStatus(recipient, false);
      await authorizationContract.setAuthorizationLevel(recipient, 0);
      
      // Act & Assert
      await truffleAssert.reverts(
      depositContract.deposit(depositor, mockERC20.address, depositAmount, { from: recipient }),
      "revert ERC20: insufficient allowance"
      );
      });
      
      it("should not allow deposit of tokens that haven't been approved", async () => {
      // Arrange
      const depositAmount = toDecimal(100, 18);
      await mockERC20.approve(depositContract.address, 0);
      
      // Act & Assert
      await truffleAssert.reverts(
      depositContract.deposit(recipient, mockERC20.address, depositAmount, { from: depositor }),
      "revert ERC20: insufficient allowance"
      );
      });

      it("should not allow deposit if the token contract is not a valid ERC20 contract", async () => {
        // Arrange
        const depositAmount = toDecimal(100, 18);
        const invalidTokenContract = "0x0000000000000000000000000000000000000000";
        
        // Act & Assert
        await truffleAssert.reverts(
          depositContract.deposit(recipient, invalidTokenContract, depositAmount, { from: depositor }),
          "revert"
        );
      });

      it("should allow multiple deposits from the same depositor to the same follower account", async () => {
        // Arrange
        const depositAmount1 = toDecimal(100, 18);
        const depositAmount2 = toDecimal(50, 18);
        
        // Act
        await depositContract.deposit(recipient, mockERC20.address, depositAmount1, { from: depositor });
        await depositContract.deposit(recipient, mockERC20.address, depositAmount2, { from: depositor });
        
        // Assert
        const followerAccountInfo = await depositContract.getFollowerAccountInfo(recipient);
        expect(followerAccountInfo.totalDeposit).to.be.bignumber.equal(depositAmount1.add(depositAmount2));
        expect(followerAccountInfo.tokenBalances[0]).to.be.bignumber.equal(depositAmount1.add(depositAmount2));
      });
      });

      it("should update deposit successfully", async () => {
        // Arrange
        const depositAmount = toDecimal(100, 18);
        await depositContract.deposit(recipient, mockERC20.address, depositAmount, { from: depositor });
        const newAmount = toDecimal(50, 18);
    
        // Act
        await depositContract.updateDeposit(recipient, mockERC20.address, newAmount, { from: depositor });
    
        // Assert
        const followerAccountInfo = await depositContract.getFollowerAccountInfo(recipient);
        expect(followerAccountInfo.totalDeposit).to.be.bignumber.equal(depositAmount.add(newAmount));
        expect(followerAccountInfo.tokenBalances[0]).to.be.bignumber.equal(depositAmount.add(newAmount));
      });
    
      // it("should retrieve the correct follower account information", async () => {
      //   // Arrange
      //   const depositAmount = toDecimal(100, 18);
      //   await depositContract.deposit(recipient, mockERC20.address, depositAmount, { from: depositor });
    
      //   // Act
      //   const followerAccountInfo = await depositContract.getFollowerAccountInfo(recipient);
    
      //   // Assert
      //   expect(followerAccountInfo.exists).to.be.true;
      //   expect(followerAccountInfo.totalDeposit).to.be.bignumber.equal(depositAmount);
      //   expect(followerAccountInfo.depositor).to.equal(depositor);
      //   expect(followerAccountInfo.tokenBalances[0]).to.be.bignumber.equal(depositAmount);
      //   expect(followerAccountInfo.tokenContracts[0]).to.equal(mockERC20.address);
      // });
    


      });