
var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');

contract('Airline Tests', async (accounts) => {

  const TEN_ETHER = web3.utils.toWei("10", "ether");

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

  it('(airline) airline cannot participate in contract when it is not funded', async () => {        
    let isRegistered = false;

    try {      
      isRegistered = await config.flightSuretyApp.registerAirline("Cebu Pacific Air", accounts[2], {from: config.firstAirline});      
    }
    catch(e) {
      console.log(e);
    }                    
    assert.equal(isRegistered, false, "Airline should not be registered");
  });

  it('(airline) can only participate in contract after submitting 10 ether', async () => {
    
    // ACT
    await config.flightSuretyApp.fundAirline({from: config.firstAirline, value: TEN_ETHER, gasPrice: 0})

    try {
      await config.flightSuretyApp.registerAirline("Cebu Pacific Air", accounts[2], {from: config.firstAirline});
    }
    catch(e) {
       console.log(e);
    }
    
    let isFunded = await config.flightSuretyData.isAirlineFunded.call(config.firstAirline); 
    let isRegistered = await config.flightSuretyData.isAirline.call(accounts[2]); 

    // ASSERT
    assert.equal(isFunded, true, "Airline should be funded");
    assert.equal(isRegistered, true, "Airline should be registered");
  });
   

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
