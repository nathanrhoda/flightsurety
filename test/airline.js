
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
      // console.log(e);
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
   

  it('Only existing airline may register new airline while less than 4 airlines are registered', async () => {

    // ARRANGE
    let airline2 = accounts[2];
    
    // ACT
    try {
        await config.flightSuretyApp.registerAirline(airline2, {from: config.firstAirline});
    }
    catch(e) {

    }
    let result = await config.flightSuretyData.isAirline.call(airline2);       
    
    // ASSERT    
    expect(result).to.be.true;
  });

  it('Registering a fifth airline does not register without 50% consensus ', async () => {
    // ARRANGE
    let airline2 = accounts[3]
    let airline2Name = "Airline 2";

    let airline3 = accounts[4]
    let airline3Name = "Airline 3";

    let airline4 = accounts[5]
    let airline4Name = "Airline 4";

    let airline5 = accounts[6]
    let airline5Name = "Airline 5";
    
    await config.flightSuretyApp.fundAirline({from: config.firstAirline, value: TEN_ETHER, gasPrice: 0})    
    // Airline 2
    await config.flightSuretyApp.registerAirline(airline2Name, airline2, {from: config.firstAirline});
    await config.flightSuretyApp.fundAirline({from: airline2, value: TEN_ETHER, gasPrice: 0})
    // Airline 3
    await config.flightSuretyApp.registerAirline(airline3Name, airline3, {from: config.firstAirline});
    await config.flightSuretyApp.fundAirline({from: airline3, value: TEN_ETHER, gasPrice: 0})
    // Airline 4
    await config.flightSuretyApp.registerAirline(airline4Name, airline4, {from: config.firstAirline});
    await config.flightSuretyApp.fundAirline({from: airline4, value: TEN_ETHER, gasPrice: 0})
    
    //ACT  
    // Airline 5
    await config.flightSuretyApp.registerAirline.call(airline5Name, airline5, {from: config.firstAirline});      

    //ASSERT    
    result = await config.flightSuretyData.getRegisteredAirlines.call();    
    assert.equal(result.length, 4, "Only 4 airlines registered because consensus has not been reached");        
  }); 

  it('Registering a fifth airline successfully when 50% consensus is reached', async () => {
    
    // ARRANGE
    let airline = accounts[7]
    let airlineName = "Airline 7";    

    let approvingAirline1 = accounts[3];
    let approvingAirline2 = accounts[4];
                        
    let result = await config.flightSuretyData.getRegisteredAirlines.call();                 
    console.log("Start Count: " + result.length);        
    
    //ACT
    await config.flightSuretyApp.registerAirline(airlineName, airline, {from: config.firstAirline});
    let consensusResponse = await config.flightSuretyApp.getConsensus.call(airline);
    console.log("Consensus Address: " + consensusResponse[0]);           
    console.log("Consensus Count: " + consensusResponse[1]);           

    await config.flightSuretyApp.registerAirline(airlineName, airline, {from: approvingAirline1});   
    consensusResponse = await config.flightSuretyApp.getConsensus.call(airline);
    console.log("Consensus Address: " + consensusResponse[0]);           
    console.log("Consensus Count: " + consensusResponse[1]);        

    result = await config.flightSuretyData.getRegisteredAirlines.call();                 
    console.log("Airline Count: " + result.length);        
        
    //ASSERT    
    assert.equal(result.length, 5, "Consensus still not reached 5th airline not registered");        
  }); 

  // it('Test to make sure you one address cannot register same airline twice ', async () => {
    
  //   // ARRANGE
  //   let airline = accounts[7]
  //   let airlineName = "Airline 7";    

  //   let approvingAirline1 = accounts[3];
  //   let approvingAirline2 = accounts[4];
                        
  //   let result = await config.flightSuretyData.getRegisteredAirlines.call();                 
  //   console.log("Start Count: " + result.length);        

  //   //ACT
  //   let response = await config.flightSuretyApp.registerAirline.call(airlineName, airline, {from: config.firstAirline});
  //   console.log(response);        

  //   response = await config.flightSuretyApp.registerAirline.call(airlineName, airline, {from: approvingAirline1});    
  //   console.log(response);        

  //   response = await config.flightSuretyApp.registerAirline.call(airlineName, airline, {from: approvingAirline2});
  //   console.log(response);        

  //   result = await config.flightSuretyData.getRegisteredAirlines.call();                 
  //   console.log("Count : " + result.length);
        
  //   //ASSERT    
  //   assert.equal(result.length, 5, "Consensus still not reached 5th airline not registered");        
  // }); 
});
