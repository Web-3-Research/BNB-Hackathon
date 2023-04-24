const AuthorizationContract = artifacts.require("AuthorizationContract");

contract("AuthorizationContract", async (accounts) => {
  let authorizationContract;

  beforeEach(async () => {
    authorizationContract = await AuthorizationContract.new();
  });

  describe("Function: setAuthorizationLevel", async () => {
    it("should set the authorization level for an account", async () => {
      await authorizationContract.setAuthorizationLevel(accounts[1], 1, { from: accounts[0] });
      const result = await authorizationContract.authorizationLevels.call(accounts[1]);
      assert.equal(result.toNumber(), 1, "Authorization level was not set correctly");
    });

    it("should only allow the owner to set the authorization level", async () => {
      try {
        await authorizationContract.setAuthorizationLevel(accounts[1], 1, { from: accounts[1] });
        assert.fail("Expected revert not received");
      } catch (error) {
        const revertFound = error.message.search("revert") >= 0;
        assert(revertFound, `Expected "revert", got ${error} instead`);
      }
    });

    it("should emit an event when the authorization level is set", async () => {
      const result = await authorizationContract.setAuthorizationLevel(accounts[1], 1, { from: accounts[0] });
      assert.equal(result.logs.length, 1, "One event should have been emitted");
      assert.equal(result.logs[0].event, "AuthorizationChanged", "Event should be AuthorizationChanged");
      assert.equal(result.logs[0].args.account, accounts[1], "Event should have the correct account address");
      assert.equal(result.logs[0].args.authorizationLevel, 1, "Event should have the correct authorization level");
    });
  });

  describe("Function: setAccountStatus", async () => {
    it("should set the status of an account", async () => {
      await authorizationContract.setAccountStatus(accounts[1], false, { from: accounts[0] });
      const result = await authorizationContract.accountStatus.call(accounts[1]);
      assert.equal(result, false, "Account status was not set correctly");
    });

    it("should only allow the owner to set the account status", async () => {
      try {
        await authorizationContract.setAccountStatus(accounts[1], false, { from: accounts[1] });
        assert.fail("Expected revert not received");
      } catch (error) {
        const revertFound = error.message.search("revert") >= 0;
        assert(revertFound, `Expected "revert", got ${error} instead`);
      }
    });

    it("should emit an event when the account status is set", async () => {
      const result = await authorizationContract.setAccountStatus(accounts[1], false, { from: accounts[0] });
      assert.equal(result.logs.length, 1, "One event should have been emitted");
      assert.equal(result.logs[0].event, "AccountStatusChanged", "Event should be AccountStatusChanged");
        assert.equal(result.logs[0].args.account, accounts[1], "Event should have the correct account address");
        assert.equal(result.logs[0].args.status, false, "Event should have the correct account status");
    });
    });


    describe("Function: isAuthorized", async () => {
          
      it("should return false if the account's status is inactive", async () => {
        await authorizationContract.setAccountStatus(accounts[1], false, { from: accounts[0] });
        try {
          await authorizationContract.isAuthorized(accounts[1], 1);
          assert.fail("Expected revert not received");
        } catch (error) {
          const revertFound = error.message.search("revert") >= 0;
          assert(revertFound, `Expected "revert", got ${error} instead`);
        }
      });
    
      it("should return true if the account's authorization level is equal to the required authorization level", async () => {
        await authorizationContract.setAccountStatus(accounts[1], true, { from: accounts[0] });
        await authorizationContract.setAuthorizationLevel(accounts[1], 1, { from: accounts[0] });
        const result = await authorizationContract.isAuthorized(accounts[1], 1);
        assert.equal(result, true, "isAuthorized should return true for equal authorization levels");
      });
    
      it("should return true if the account's authorization level is higher than the required authorization level", async () => {
        await authorizationContract.setAuthorizationLevel(accounts[1], 1, { from: accounts[0] });
        await authorizationContract.setAccountStatus(accounts[1], true, { from: accounts[0] });
        const result = await authorizationContract.isAuthorized(accounts[1], 1);
        assert.equal(result, true, "isAuthorized should return true for higher authorization levels");
      });
    
      it("should return false if the account's authorization level is lower than the required authorization level", async () => {
        await authorizationContract.setAuthorizationLevel(accounts[1], 0, { from: accounts[0] });
        await authorizationContract.setAccountStatus(accounts[1], true, { from: accounts[0] });
        const result = await authorizationContract.isAuthorized(accounts[1], 1);
        assert.equal(result, false, "isAuthorized should return false for lower authorization levels");
      });

      it("should revert if the account's status is inactive", async () => {
        await authorizationContract.setAccountStatus(accounts[1], false, { from: accounts[0] });
        try {
          await authorizationContract.isAuthorized(accounts[1], 1);
          assert.fail("Expected revert not received");
        } catch (error) {
          const revertFound = error.message.search("revert") >= 0;
          assert(revertFound, `Expected "revert", got ${error} instead`);
        }
      });
    });
    


});

