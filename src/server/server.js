import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';
import express from 'express';


let config = Config['localhost'];
let web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
web3.eth.defaultAccount = web3.eth.accounts[0];
let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
let ORACLE_COUNT = 30;
let oracles = [];
let oracleIndexList = [];

flightSuretyApp.events.OracleRequest({ fromBlock: 0  }, function (error, event) {
  if (error) {
    console.log(event);
  } else {

  }
});

const app = express();
app.get('/api', (req, res) => {
    res.send({
      message: 'An API for use with your Dapp!'
    })
})


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
            console.log(`Oracle ${i} Registered at ${accounts[i]} with [${result}] indexes.`);
            oracleIndexList.push(result);
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

/// End Register Oracles on startup
export default app;


