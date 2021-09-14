var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');

contract('Flight Tests', async (accounts) => {
    before('setup contract', async () => {
        config = await Test.Config(accounts);
        await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
      });

      let TEN_ETHER = web3.utils.toWei("10", "ether");
      let VALID_INSURANCE_AMOUNT = web3.utils.toWei("0.9", "ether");
      let INVALID_INSURANCE_AMOUNT = web3.utils.toWei("2", "ether");
      let INSURANCE_MULTIPLIER = 1.5;

      let airline1 = accounts[3];
      let airline1Name = "BAA";

      let airline2 = accounts[4];
      let airline2Name = "Mango";

      let airline3 = accounts[5];
      let airline3Name = "Emirates";
      
      let timestamp = Math.floor(Date.now() / 1000);

      var flight1 = {
        airline: airline1,
        number: "SAA 001",
        departureTime: timestamp
      };

      var flight2 = {
        airline: airline2,
        number: "MNG 001",
        departureTime: timestamp
      }

      var flight3 = {
        airline: airline3,
        number: "EMR 001",
        departureTime: timestamp
      }

      it(`(flight) can register flight`, async () => {      
        // ARRANGE
        await config.flightSuretyApp.fundAirline({from: config.firstAirline, value: TEN_ETHER, gasPrice: 0})

        await config.flightSuretyApp.registerAirline(airline1Name, airline1, {from: config.firstAirline});
        await config.flightSuretyApp.fundAirline({from: airline1, value: TEN_ETHER, gasPrice: 0})

        await config.flightSuretyApp.registerAirline(airline2Name, airline2, {from: config.firstAirline});
        await config.flightSuretyApp.fundAirline({from: airline2, value: TEN_ETHER, gasPrice: 0})

        await config.flightSuretyApp.registerAirline(airline3Name, airline3, {from: config.firstAirline});
        await config.flightSuretyApp.fundAirline({from: airline3, value: TEN_ETHER, gasPrice: 0})

        await config.flightSuretyApp.registerFlight(flight1.number, flight1.departureTime, {from: flight1.airline});
        await config.flightSuretyApp.registerFlight(flight2.number, flight2.departureTime, {from: flight2.airline});
        await config.flightSuretyApp.registerFlight(flight3.number, flight3.departureTime, {from: flight3.airline});

        // ACT
        let response = await config.flightSuretyData.getFlights.call();

        // ASSERT
        assert.equal(response.length, 3, "All flights were not registered")
      });

      it(`(passenger) passenger may not buy insurance if more than 1 ether is supplied`,  async () => {        
        // ARRANGE 
        let flightKey = await config.flightSuretyApp.getFlightKey.call(flight1.airline, flight1.number, flight1.departureTime);

        // ACT
        try {
          await config.flightSuretyApp.buyInsurance(flight1.airline, flight1.number, flight1.departureTime, {from: accounts[9], value: INVALID_INSURANCE_AMOUNT})                    
        } catch {          
          console.log("Invalid amount supplied for insurance");
        }

        // ASSERT
        let response = await config.flightSuretyData.getInsurance.call(flightKey, {from: accounts[9], value: INVALID_INSURANCE_AMOUNT});             
        
        assert.equal(response[0], false, "Should not have insurance for this flight");
      });

      it(`(passenger) may buy insurance for up to 1 ether`,  async () => {
        // ACT
        await config.flightSuretyApp.buyInsurance(flight2.airline, flight2.number, flight2.departureTime, {from: accounts[8], value: VALID_INSURANCE_AMOUNT})
        let flightKey = await config.flightSuretyApp.getFlightKey.call(flight2.airline, flight2.number, flight2.departureTime);

        // ASSERT
        let response = await config.flightSuretyData.getInsurance.call(flightKey, {from: accounts[8]});        
        assert.equal(response[0], true, "Should have insurance for this flight");
      });
            

      it(`(passenger) if flight is delayed due to airline fault, passenger receives 1.5X the amount they paid`, async () => {
        // Create flight 
        // Buy Insurance 
        // Simulate airline fault (set flight status = STATUS_CODE_LATE_AIRLINE / 20)                
        // credit passenger account with 1.5 the amount they paid
        // Check to make sure credit amount equals 1.5 * amount already added
      });

       it(`(passenger) can withdraw any funds owed to them as a result of receiving credit for insurance payout`, async () => {
        // Using above flight and passenger        
        // Check Balance
        // Withdraw credit
        // Check credit balance to make sure it is zero
       });

      it(`(passenger) cannot withdraw same amount twice`, async () => {
        // Using above flight and passenger     
        // Try and withdraw same amount again
        // Should throw an error catch and log
        // Check bool to make sure error was thrown
      });

      it(`(passenger) cannot withdraw if no credit exists`, async () => {
        // Create flight 
        // Identify Passenger
        // Try and withdraw credit
        // Should get a no credit exists error
        // Check bool to make sure error was thrown
      });
});
