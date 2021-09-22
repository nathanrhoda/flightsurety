import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';
import express from 'express';


let config = Config['localhost'];
let web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
web3.eth.defaultAccount = web3.eth.accounts[0];
let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
let ORACLE_COUNT = 20;
let oracles = [];
let oracleIndexList = [];

let STATUS_CODE_UNKNOWN = 0;
let STATUS_CODE_ON_TIME = 10;
let STATUS_CODE_LATE_AIRLINE = 20;
let STATUS_CODE_LATE_WEATHER = 30;
let STATUS_CODE_LATE_TECHNICAL = 40;
let STATUS_CODE_LATE_OTHER = 50;
const STATUS_CODES  = [
  STATUS_CODE_UNKNOWN,
  STATUS_CODE_ON_TIME,
  STATUS_CODE_LATE_AIRLINE,
  STATUS_CODE_LATE_WEATHER,
  STATUS_CODE_LATE_TECHNICAL,
  STATUS_CODE_LATE_OTHER
];

function generateRandomStatus() {
  return STATUS_CODES[Math.floor(Math.random() * STATUS_CODES.length)];
}

flightSuretyApp.events.OracleRequest({ fromBlock: 0  }, function (error, event) {  
  if (error) {
    console.log(event);
  } else {
    
    // Generate a random status 
    let statusCode = generateRandomStatus();
    let index = event.returnValues.index;
    let airline = event.returnValues.airline;
    let flight = event.returnValues.flight;
    let timestamp = event.returnValues.timestamp;
            
    for(let i=0; i<oracles.length; i++) {
      console.log(`${oracleIndexList[i]} : ${index}`) 
      if(oracleIndexList[i].includes(index)) {
       flightSuretyApp.methods.submitOracleResponse(index, airline, flight, timestamp, statusCode)
         .send({from: oracles[i]}, (error, result) => {
            if(error){
                console.log(error);
            } else {
                console.log(`${JSON.stringify(oracles[i])}: Status Code ${statusCode}`);
            }
         });
      }
    }
   }
});

/// Register 30 Oracles on startup
function getOracles() {
  return new Promise((resolve, reject) => {
    web3.eth.getAccounts().then(accountList => {      
      oracles = accountList.slice(20, 20+ORACLE_COUNT);
    }).catch(err => {
      reject(err);
    }).then(() => {
      resolve(oracles);
    });
  });
}

function initOracles(accounts) {
  return new Promise((resolve, reject) => {
    flightSuretyApp.methods.REGISTRATION_FEE().call().then(fee => {
      for(let i=0; i<ORACLE_COUNT; i++) {
        flightSuretyApp.methods.registerOracle().send({
          "from": accounts[i],
          "value": fee,
          "gas": 5000000,
          "gasPrice": 20000000
        }).then(() => {          
          flightSuretyApp.methods.getMyIndexes().call({
            "from": accounts[i]
          }).then(result => {            
            oracleIndexList.push(result);
            console.log(`Oracle ${i} Registered at ${accounts[i]} with [${result}] indexes.`);
            console.log(`Oracle List: ${oracleIndexList.length}`);
          }).catch(err => {
            reject(err);
          });
        }).catch(err => {
          reject(err);
        });
      };
      resolve(oracleIndexList);
    }).catch(err => {
      reject(err);
    });
  });
}

getOracles().then(accounts => {
  initOracles(accounts)
  .catch(err => {
    console.log(err.message);
  });
});

const app = express();
app.get('/api', (req, res) => {
    res.send({
      message: 'An API for use with your Dapp!'
    })
})

/// End Register Oracles on startup
export default app;


