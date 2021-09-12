
var FlightSuretyApp = artifacts.require("FlightSuretyApp");
var FlightSuretyData = artifacts.require("FlightSuretyData");
var BigNumber = require('bignumber.js');

var Config = async function(accounts) {
    
    // These test addresses are useful when you need to add
    // multiple users in test scripts
    let testAddresses = [
        "0xa1EBb01DB8027764714deDd8b6594c6Dc7D54b89",
        "0x054f4FEc10BF67ebb5E56a147f0B8A8ad7233a88",
        "0xC80a5f6A8EB30d4d14665b9490A4D3E66fFA22E8",
        "0xfA03958Fa58691A2DB5BC62F680121bB125D5499",
        "0xa23eAEf02F9E0338EEcDa8Fdd0A73aDD781b2A86",
        "0x6b85cc8f612d5457d49775439335f83e12b8cfde",
        "0xcbd22ff1ded1423fbc24a7af2148745878800024",
        "0xc257274276a4e539741ca11b590b9447b26a8051",
        "0x2f2899d6d35b1a48a4fbdc93a37a72f264a9fca7"
    ];


    let owner = accounts[0];
    let firstAirline = accounts[1];
    let airlineName = "Ground Floor Airlines";

    let flightSuretyData = await FlightSuretyData.new(airlineName, firstAirline);
    let flightSuretyApp = await FlightSuretyApp.new(flightSuretyData.address);    

    return {
        owner: owner,
        firstAirline: firstAirline,
        weiMultiple: (new BigNumber(10)).pow(18),
        testAddresses: testAddresses,
        flightSuretyData: flightSuretyData,
        flightSuretyApp: flightSuretyApp
    }
}

module.exports = {
    Config: Config
};