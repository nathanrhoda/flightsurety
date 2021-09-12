var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');

contract('Passenger Tests', async (accounts) => {
    before('setup contract', async () => {
        config = await Test.Config(accounts);
        await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
      });

      it(`(passenger) selects flight number & departure`, function() {
        assert.equal(true, false);
      });

      it(`(passenger) may pay up to 1 ether for purchasing flight insurance`, function() {
        assert.equal(true, false);
      });

      it(`(passenger) if flight is delayed due to airline fault, passenger receives 1.5X the amount they paid`, function() {
        assert.equal(true, false);
      });

      it(`(passenger) can withdraw any funds owed to them as a result of receiving credit for insurance payout`, function() {
        assert.equal(true, false);
      });

      it(`(passenger) insurance payouts are not sent directly yo passengers wallet`, function(){
        assert.equal(true, false);
      });
});
