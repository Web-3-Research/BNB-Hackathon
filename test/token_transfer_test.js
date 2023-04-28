const TokenTransferContract = artifacts.require("TokenTransferContract");
const AuthorizationContract = artifacts.require("AuthorizationContract");
const MockERC20 = artifacts.require("MockERC20");
const DepositContract = artifacts.require("DepositContract");
const { BN, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');

contract("TokenTransferContract", async (accounts) => {
  let authorizationContract;
  let tokenTransferContract;
  let sender = accounts[0];
  let recipient = accounts[1];
  let unauthorizedFollower = accounts[2];
  let mockERC20;
  let depositContract;
  
  const toDecimal = (value, decimals) => new BN(value).mul(new BN(10).pow(new BN(decimals)));

  beforeEach(async () => {
    authorizationContract = await AuthorizationContract.new();
    depositContract = await DepositContract.new(authorizationContract.address);
    mockERC20 = await MockERC20.new("Test Token", "TTT", 18, toDecimal(1500, 18));
    await authorizationContract.setAccountStatus(sender, true);
    await authorizationContract.setAuthorizationLevel(sender, 1);
    await authorizationContract.setAccountStatus(recipient, true);
    tokenTransferContract = await TokenTransferContract.new(authorizationContract.address, depositContract.address);
    await mockERC20.approve(tokenTransferContract.address, toDecimal(1000, 18));
    await mockERC20.approve(depositContract.address, toDecimal(1000, 18));
  });


  it("should transfer tokens from sender to recipient", async () => {
    // Deposit some tokens to create the follower account
    await depositContract.deposit(sender, mockERC20.address, 100, { from: sender });
    const senderBalanceBefore = await mockERC20.balanceOf(sender);
    const recipientBalanceBefore = await mockERC20.balanceOf(recipient);
    console.log("Sender balance before: " + senderBalanceBefore.toString());
    console.log("Recipient balance before: " + recipientBalanceBefore.toString());
  
    await tokenTransferContract.transferTokens(mockERC20.address, sender, recipient, 100, sender);
    const recipientBalanceAfter = await mockERC20.balanceOf(recipient);
    console.log("Recipient balance after: " + recipientBalanceAfter.toString());
    const checkBal = tokenTransferContract.getBalance(sender, mockERC20.address);
    console.log("Check", checkBal.toString());
    // Assert that the recipient's balance has increased by 1000
    assert.equal(await tokenTransferContract.getBalance(recipient, mockERC20.address), 100, "recipient balance should be 500");
  });
  

  it("should fail if follower account is not authorized", async () => {
    await authorizationContract.setAuthorizationLevel(unauthorizedFollower, 0); // Set the follower account as unauthorized
    await authorizationContract.setAccountStatus(unauthorizedFollower, true);
    await authorizationContract.setAccountStatus(sender, true);
    await authorizationContract.setAuthorizationLevel(sender, 1);
    await depositContract.deposit(sender, mockERC20.address, 100, { from: sender });
    const senderBalanceBefore = await mockERC20.balanceOf(sender);
    const recipientBalanceBefore = await mockERC20.balanceOf(recipient);
    console.log("Sender balance before: " + senderBalanceBefore.toString());
    console.log("Recipient balance before: " + recipientBalanceBefore.toString());

    // Wrap the transferTokens call in a try-catch block
    try {
      await tokenTransferContract.transferTokens(mockERC20.address, sender, recipient, 100, unauthorizedFollower);
    } catch (error) {
      assert.include(error.message, "Panic: Arithmetic overflow");
    }
    
  
    const senderBalanceAfter = await mockERC20.balanceOf(sender);
    console.log("Sender balance----------------- after: " + senderBalanceAfter.toString());
    const recipientBalanceAfter = await mockERC20.balanceOf(recipient);
    console.log("Recipient balance after: " + recipientBalanceAfter.toString());
    assert.equal(senderBalanceBefore.toString(), senderBalanceAfter.toString(), "Sender balance should not change");
    assert.equal(recipientBalanceBefore.toString(), recipientBalanceAfter.toString(), "Recipient balance should not change");
  });
  it("should fail if follower account address is null or zero", async () => {
    const followerAccount = "0x0000000000000000000000000000000000000000"; // set followerAccount to null or zero
    try {
      // Deposit some tokens to create the follower account
      await depositContract.deposit(sender, mockERC20.address, 100, { from: sender });
      // user transfers 100 tokens to recipient
      await tokenTransferContract.transferTokens(mockERC20.address, sender, recipient, 100, followerAccount);
      assert.fail();
    } catch (error) {
      assert.equal(error.reason, "TokenTransferContract: Follower account address cannot be null or zero"); // check for the correct error message
    }
});

  it("should fail if transfer amount is zero", async () => {
    const senderBalanceBefore = await mockERC20.balanceOf(sender);
    const recipientBalanceBefore = await mockERC20.balanceOf(recipient);

    await expectRevert(
        tokenTransferContract.transferTokens(
            mockERC20.address,
            sender,
            recipient,
            0, // set transfer amount to zero
            sender,
            { from: sender }
        ),
        "TokenTransferContract: amount must be greater than zero"
    );

    const senderBalanceAfter = await mockERC20.balanceOf(sender);
    const recipientBalanceAfter = await mockERC20.balanceOf(recipient);
    assert.equal(senderBalanceBefore.toString(), senderBalanceAfter.toString(), "Sender balance should not change");
    assert.equal(recipientBalanceBefore.toString(), recipientBalanceAfter.toString(), "Recipient balance should not change");
});




it("should fail if sender is not authorized to transfer tokens", async () => {
    const isAuthorized = await authorizationContract.isAuthorized(sender, 1);
  
    // Revoke authorization of sender
    await authorizationContract.setAuthorizationLevel(sender, 0);
  
    const senderBalanceBefore = await mockERC20.balanceOf(sender);
    const recipientBalanceBefore = await mockERC20.balanceOf(recipient);
  
    // Attempt to transfer tokens
    await expectRevert(
      tokenTransferContract.transferTokens(
        mockERC20.address,
        sender,
        recipient,
        100,
        sender,
        { from: sender }
      ),
      "Not authorized"
    );
  
    const senderBalanceAfter = await mockERC20.balanceOf(sender);
    const recipientBalanceAfter = await mockERC20.balanceOf(recipient);
    assert.equal(
      senderBalanceBefore.toString(),
      senderBalanceAfter.toString(),
      "Sender balance should not change"
    );
    assert.equal(
      recipientBalanceBefore.toString(),
      recipientBalanceAfter.toString(),
      "Recipient balance should not change"
    );
  
    // Restore authorization of sender
    await authorizationContract.setAuthorizationLevel(sender, 1);
  });
  

it("should fail if sender has insufficient balance", async () => {
    const senderBalanceBefore = await mockERC20.balanceOf(sender);
    const recipientBalanceBefore = await mockERC20.balanceOf(recipient);
  
    await expectRevert(
        tokenTransferContract.transferTokens(
          mockERC20.address,
          sender,
          recipient,
          senderBalanceBefore.add(web3.utils.toBN(1)),
          sender,
          { from: sender }
        ),
        "TokenTransferContract: insufficient balance"
      );
      
  
    const senderBalanceAfter = await mockERC20.balanceOf(sender);
    const recipientBalanceAfter = await mockERC20.balanceOf(recipient);
    assert.equal(senderBalanceBefore.toString(), senderBalanceAfter.toString(), "Sender balance should not change");
    assert.equal(recipientBalanceBefore.toString(), recipientBalanceAfter.toString(), "Recipient balance should not change");
  });
  

    it("should fail if sender is not authorized to transfer tokens", async () => {
        const isAuthorized = await authorizationContract.isAuthorized(sender, 1);
        console.log("auth: ", isAuthorized);
      
        // Revoke authorization of sender
        await authorizationContract.setAuthorizationLevel(sender, 0);
        const senderBalanceBefore = await mockERC20.balanceOf(sender);
        const recipientBalanceBefore = await mockERC20.balanceOf(recipient);
      
        try {
          await tokenTransferContract.transferTokens(mockERC20.address, sender, recipient, 100, sender, { from: sender });
          assert.fail();
        } catch (error) {
          assert.equal(error.reason, "Not authorized");
        }
      
        const senderBalanceAfter = await mockERC20.balanceOf(sender);
        const recipientBalanceAfter = await mockERC20.balanceOf(recipient);
        assert.equal(senderBalanceBefore.toString(), senderBalanceAfter.toString(), "Sender balance should not change");
        assert.equal(recipientBalanceBefore.toString(), recipientBalanceAfter.toString(), "Recipient balance should not change");
        // Restore authorization of sender
        await authorizationContract.setAuthorizationLevel(sender, 1);
      });
      it("should fail if token address is invalid", async () => {
        const invalidTokenAddress = "0x0000000000000000000000000000000000000000"; // set invalid token address
      
        const senderBalanceBefore = await mockERC20.balanceOf(sender);
        const recipientBalanceBefore = await mockERC20.balanceOf(recipient);
      
        await expectRevert(
          tokenTransferContract.transferTokens(
            invalidTokenAddress,
            sender,
            recipient,
            100,
            sender,
            { from: sender }
          ),
          "TokenTransferContract: invalid token address"
        );
      
        const senderBalanceAfter = await mockERC20.balanceOf(sender);
        const recipientBalanceAfter = await mockERC20.balanceOf(recipient);
        assert.equal(
          senderBalanceBefore.toString(),
          senderBalanceAfter.toString(),
          "Sender balance should not change"
        );
        assert.equal(
          recipientBalanceBefore.toString(),
          recipientBalanceAfter.toString(),
          "Recipient balance should not change"
        );
      });

      it("should revert if called with an invalid token address", async () => {
        const invalidTokenAddress = "0x0000000000000000000000000000000000000000"; // set invalidTokenAddress to an invalid address
    
        await expectRevert(
            tokenTransferContract.getBalance(sender, invalidTokenAddress),
            "TokenTransferContract: invalid token address"
        );
    });
  });