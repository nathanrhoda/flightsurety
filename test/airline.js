
var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');

contract('Flight Surety Tests', async (accounts) => {

  var config;
  before('setup contract', async () => {
    config = await Test.Config(accounts);
    await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
  });

  it('first airline is registered when contract is deployed', async () => {
        
    // ACT
    let result = await config.flightSuretyData.isAirline.call(config.firstAirline);

    // ASSERT    
    expect(result).to.be.true;
  
  });

  it('(airline) cannot register an Airline using registerAirline() if it is not funded', async () => {
    
    // ARRANGE
    let newAirline = accounts[2];

    // ACT
    try {
        let res = await config.flightSuretyApp.registerAirline.call(newAirline, {from: config.firstAirline});        
        console.log("ONE: " + JSON.stringify(res));
    }
    catch(e) {
        console.log("ERROR Exception: " + e);
    }
     let result = await config.flightSuretyData.isAirline.call(newAirline);     
    console.log(result);
    // ASSERT
    assert.equal(result, false, "Airline should not be able to register another airline if it hasn't provided funding");

  });  

//   it('(airline) can only participate in contract after submitting 10 ether', async () => {
//     ARRANGE
//     const fundValue = web3.utils.toWei('10', "ether")
//     let existingAirline = config.firstAirline;
//     let newAirline = accounts[2];
    
//     ACT
//     await config.flightSuretyData.fund({from: existingAirline, value: fundValue});
//     try {
//         await config.flightSuretyApp.registerAirline(newAirline, {from: existingAirline});
//     }
//     catch(e) {
//         console.log("ERROR: " + e);
//     }
    
//     let result = await config.flightSuretyData.isAirline.call(newAirline);
    
//     ASSERT
//     expect(result).to.be.true;
//   });

//   it('Only existing airline may register new airline while less than 4 airlines are registered', async () => {

//     // ARRANGE
//     let airline2 = accounts[2];
    
//     // ACT
//     try {
//         await config.flightSuretyApp.registerAirline(airline2, {from: config.firstAirline});
//     }
//     catch(e) {

//     }
//     let result = await config.flightSuretyData.isAirline.call(airline2);       
    
//     // ASSERT    
//     expect(result).to.be.true;
//   });

//   it('Registering a fifth airline requires multiparty consensus of 50% of registered airlines ', async () => {

//     // ARRANGE

//     //ACT

//     //ASSERT
//     expect(false).to.be.true;
//   }); 
});
