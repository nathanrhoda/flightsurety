var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');

contract('Flight Tests', async (accounts) => {
    before('setup contract', async () => {
        config = await Test.Config(accounts);
        await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
      });

      it(`(flight) selects flight number & departure`, function() {
        
      });

      it(`(flight) passenger may pay up to 1 ether for purchasing insurance`, function() {
        assert.equal(true, false);
      });

      it(`(flight) if flight is delayed due to airline fault, passenger receives 1.5X the amount they paid`, function() {
        assert.equal(true, false);
      });

      it(`(flight) can withdraw any funds owed to them as a result of receiving credit for insurance payout`, function() {
        assert.equal(true, false);
      });

      it(`(flight) insurance payouts are not sent directly to passengers wallet`, function(){
        assert.equal(true, false);
      });
});
